'use strict';

const path = require('path');
const AdmZip = require('adm-zip');

const MAX_ENTRIES = 401; // 1 CSV + 400 images
const MAX_CSV_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB per image
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024; // 100 MB total after decompression
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const getEntrySize = entry => entry?.header?.size || 0;

const isAllowedImageBuffer = (buf, ext) => {
  if (!buf || buf.length < 4) return false;

  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;
  const isWebp =
    buf.length >= 12 &&
    buf.slice(0, 4).toString('ascii') === 'RIFF' &&
    buf.slice(8, 12).toString('ascii') === 'WEBP';

  if (ext === '.jpg' || ext === '.jpeg') return isJpeg;
  if (ext === '.png') return isPng;
  if (ext === '.webp') return isWebp;
  return false;
};

const formatBytes = bytes => `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;

/**
 * Validate and extract a ZIP buffer containing one CSV file and image files.
 *
 * @param {Buffer} buffer - Raw ZIP file bytes from multer memoryStorage
 * @returns {{ csvBuffer: Buffer, imageMap: Map<string, Buffer> }}
 * @throws {Error} with a descriptive message on any validation failure
 */
function extractZip(buffer) {
  // Rule 1: Valid ZIP format
  let zip;
  try {
    zip = new AdmZip(buffer);
  } catch (err) {
    throw new Error('Invalid ZIP file: could not parse archive. Ensure the file is a valid .zip.');
  }

  const entries = zip.getEntries();

  // Rule 5: Entry count limit (checked before iteration to fail fast)
  if (entries.length > MAX_ENTRIES) {
    throw new Error(
      `ZIP contains ${entries.length} entries. Maximum allowed is ${MAX_ENTRIES} (1 CSV + 400 images).`
    );
  }

  const csvEntries = [];
  const imageEntries = [];
  let totalUncompressedBytes = 0;

  for (const entry of entries) {
    const name = entry.entryName;

    // Skip directory entries
    if (entry.isDirectory) continue;

    // Skip macOS metadata entries created by Finder's "Compress" feature
    if (name.startsWith('__MACOSX/') || path.basename(name).startsWith('._')) continue;

    // Rule 2: Path traversal — per-segment check (allows "v1..2.jpg", blocks "../etc/passwd")
    const normalized = name.replace(/\\/g, '/');
    if (normalized.split('/').some(seg => seg === '..')) {
      throw new Error(
        `ZIP entry "${name}" contains a path traversal sequence (..). Repackage the ZIP without such entries.`
      );
    }

    const base = path.basename(normalized);
    const ext = path.extname(base).toLowerCase();
    const entrySize = getEntrySize(entry);

    totalUncompressedBytes += entrySize;
    if (totalUncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
      throw new Error(
        `ZIP uncompressed size exceeds ${formatBytes(MAX_UNCOMPRESSED_BYTES)}. ` +
          `Reduce the number or size of files and upload again.`
      );
    }

    if (ext === '.csv') {
      if (entrySize > MAX_CSV_BYTES) {
        throw new Error(
          `CSV file "${base}" is ${formatBytes(
            entrySize
          )}. Maximum allowed CSV size is ${formatBytes(MAX_CSV_BYTES)}.`
        );
      }
      csvEntries.push({ entry, base });
    } else {
      if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
        throw new Error(
          `ZIP entry "${name}" has unsupported file type "${ext || 'none'}". ` +
            `Images must be .jpg, .jpeg, .png, or .webp.`
        );
      }
      if (entrySize > MAX_IMAGE_BYTES) {
        throw new Error(
          `Image "${base}" is ${formatBytes(
            entrySize
          )}. Maximum allowed image size is ${formatBytes(MAX_IMAGE_BYTES)}.`
        );
      }
      imageEntries.push({ entry, base, ext });
    }
  }

  // Rule 3: Exactly one CSV file
  if (csvEntries.length === 0) {
    throw new Error(
      'ZIP contains no .csv file. Include exactly one CSV file (e.g. listings.csv) at any level inside the archive.'
    );
  }
  if (csvEntries.length > 1) {
    const names = csvEntries.map(e => e.entry.entryName).join(', ');
    throw new Error(
      `ZIP contains ${csvEntries.length} .csv files (${names}). Include exactly one CSV file.`
    );
  }

  // Rule 4: Duplicate image basenames across directories
  const seenBasenames = new Map(); // basename -> first full entry name
  for (const { entry, base } of imageEntries) {
    if (seenBasenames.has(base)) {
      throw new Error(
        `ZIP contains duplicate image filename "${base}" (found at "${seenBasenames.get(
          base
        )}" and "${entry.entryName}"). ` +
          `All image filenames must be unique regardless of directory.`
      );
    }
    seenBasenames.set(base, entry.entryName);
  }

  // Extract CSV buffer
  let csvBuffer;
  try {
    csvBuffer = csvEntries[0].entry.getData();
  } catch (err) {
    throw new Error(`Failed to read CSV file from ZIP: ${err.message}`);
  }
  if (!csvBuffer || csvBuffer.length === 0) {
    throw new Error('The CSV file inside the ZIP is empty.');
  }
  if (csvBuffer.length > MAX_CSV_BYTES) {
    throw new Error(
      `CSV file "${csvEntries[0].base}" expands to ${formatBytes(
        csvBuffer.length
      )}. Maximum allowed CSV size is ${formatBytes(MAX_CSV_BYTES)}.`
    );
  }

  // Build imageMap: basename → Buffer
  // path.basename() ensures "photos/dress_front.jpg" maps to key "dress_front.jpg",
  // matching how the CSV image_* columns reference images (filename only, no path).
  const imageMap = new Map();
  for (const { entry, base, ext } of imageEntries) {
    let buf;
    try {
      buf = entry.getData();
    } catch (err) {
      throw new Error(`Failed to read image "${base}" from ZIP: ${err.message}`);
    }
    if (buf.length > MAX_IMAGE_BYTES) {
      throw new Error(
        `Image "${base}" expands to ${formatBytes(
          buf.length
        )}. Maximum allowed image size is ${formatBytes(MAX_IMAGE_BYTES)}.`
      );
    }
    if (!isAllowedImageBuffer(buf, ext)) {
      throw new Error(
        `Image "${base}" does not match its file extension or is not a supported image type. ` +
          `Use .jpg, .jpeg, .png, or .webp files.`
      );
    }
    imageMap.set(base, buf);
  }

  return { csvBuffer, imageMap };
}

module.exports = {
  extractZip,
  MAX_CSV_BYTES,
  MAX_IMAGE_BYTES,
  MAX_UNCOMPRESSED_BYTES,
  ALLOWED_IMAGE_EXTENSIONS,
};
