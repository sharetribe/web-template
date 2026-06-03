'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { getIntegrationSdk } = require('../../services/integrationSdk');
const { types } = require('sharetribe-flex-integration-sdk');
const { updateJob } = require('./jobStore');

const { UUID, Money, LatLng } = types;

const DELAY_BETWEEN_ROWS_MS = 500;
const MAX_JOB_ERRORS = 200;

const SLOT_ORDER = ['front', 'back', 'horizontal', 'details'];

const MAX_SDK_ERRORS_KEPT = 5;

/**
 * Serialize an SDK / generic Error into a JSON-safe shape that preserves
 * Sharetribe SDK validation detail (`err.data.errors`) when present.
 */
function serializeSdkError(err) {
  if (!err) return { message: 'Unknown error' };
  const out = {
    message: err.message || 'Unknown error',
  };
  if (err.status) out.status = err.status;
  const sdkErrors = err.data && Array.isArray(err.data.errors) ? err.data.errors : null;
  if (sdkErrors && sdkErrors.length > 0) {
    out.sdkErrors = sdkErrors.slice(0, MAX_SDK_ERRORS_KEPT).map(e => ({
      status: e.status,
      code: e.code,
      title: e.title,
      source: e.source,
    }));
    if (sdkErrors.length > MAX_SDK_ERRORS_KEPT) {
      out.sdkErrorsTruncated = sdkErrors.length - MAX_SDK_ERRORS_KEPT;
    }
  }
  return out;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload a single image buffer to Sharetribe via Integration SDK.
 * Returns the image UUID string.
 *
 * The SDK's MultipartRequest interceptor calls fd.append(key, value) without
 * content-type options. Passing a raw Buffer causes form-data to use
 * Content-Type: application/octet-stream (→ API returns 500). Passing a file
 * path string makes the SDK call fs.createReadStream(), from which form-data
 * can both stat() the real file for Content-Length and infer the MIME type
 * from the extension. The temp file is deleted immediately after upload.
 */
async function uploadImage(sdk, imageBuffer, filename) {
  const ext = path.extname(filename) || '.jpg';
  const tmpFile = path.join(os.tmpdir(), `av-bulk-${process.pid}-${Date.now()}${ext}`);
  fs.writeFileSync(tmpFile, imageBuffer);
  try {
    const res = await sdk.images.upload({ image: tmpFile });
    return res.data.data.id.uuid;
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch (_) {}
  }
}

/**
 * Process a single CSV row: upload images, create listing, set stock, publish.
 */
async function processRow(sdk, row, imageMap, config) {
  const imageSlotMapping = {};
  const imageUuids = [];

  // Upload images in slot order
  for (const slotKey of SLOT_ORDER) {
    const filename = row.imageSlots[slotKey];
    if (filename && imageMap.has(filename)) {
      const buffer = imageMap.get(filename);
      const uuid = await uploadImage(sdk, buffer, filename);
      imageSlotMapping[slotKey] = uuid;
      imageUuids.push(new UUID(uuid));
    }
  }

  // Build publicData
  const publicData = {
    listingType: config.listingType,
    transactionProcessAlias: config.transactionAlias,
    unitType: config.unitType,
    shippingEnabled: row.shippingEnabled,
    pickupEnabled: row.pickupEnabled,
    ...row.publicData,
  };

  // originalPrice must be stored as { amount (subunits), currency } to match
  // the Money format expected by OrderPanel and EditListingPricingAndStockPanel.
  if (publicData.originalPrice != null && publicData.originalPrice !== '') {
    const rawVal = parseFloat(publicData.originalPrice);
    if (!isNaN(rawVal) && rawVal > 0) {
      publicData.originalPrice = {
        amount: Math.round(rawVal * 100),
        currency: row.currency,
      };
    } else {
      delete publicData.originalPrice;
    }
  } else {
    delete publicData.originalPrice;
  }

  if (Object.keys(imageSlotMapping).length > 0) {
    publicData.imageSlots = imageSlotMapping;
  }

  if (row.locationAddress) {
    publicData.location = { address: row.locationAddress };
  }

  // Build listing params
  const authorId = row.authorId || config.defaultAuthorId;
  if (!authorId) {
    throw new Error('No author_id in CSV row and BULK_IMPORT_DEFAULT_AUTHOR_ID not set.');
  }

  const priceAmount = Math.round(row.price * 100);

  const listingParams = {
    authorId: new UUID(authorId),
    state: 'published',
    title: row.title,
    description: row.description,
    price: new Money(priceAmount, row.currency),
    publicData,
    images: imageUuids,
  };

  if (row.lat !== null && row.lng !== null) {
    listingParams.geolocation = new LatLng(row.lat, row.lng);
  }

  // Create listing via Integration API.
  // The Integration API only supports 'published' (or 'closed') on create —
  // 'draft' is a Marketplace API concept for user-initiated flows.
  const createRes = await sdk.listings.create(listingParams, {
    expand: true,
    include: ['author', 'images'],
  });

  const listingId = createRes.data.data.id.uuid;

  // Set stock
  if (row.stock > 0) {
    await sdk.stock.compareAndSet({
      listingId: new UUID(listingId),
      oldTotal: null,
      newTotal: row.stock,
    });
  }

  // Close if publish:no — listing was created published, so close it back down.
  if (!row.publish) {
    await sdk.listings.close({ id: new UUID(listingId) }, { expand: true });
  }

  return listingId;
}

/**
 * Process all rows of an import job asynchronously.
 * Updates job state after each row.
 */
async function processImportJob(jobId, rows, imageMap) {
  const sdk = getIntegrationSdk();

  const config = {
    defaultAuthorId: process.env.BULK_IMPORT_DEFAULT_AUTHOR_ID,
    listingType: process.env.BULK_IMPORT_LISTING_TYPE || 'product-selling',
    transactionAlias: process.env.BULK_IMPORT_TRANSACTION_ALIAS || 'default-purchase/release-1',
    unitType: process.env.BULK_IMPORT_UNIT_TYPE || 'item',
  };

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const listingId = await processRow(sdk, row, imageMap, config);
      succeeded += 1;

      const job = updateJob(jobId, { processed: i + 1, succeeded });
      job.results.push({
        row: row.rowNum,
        title: row.title,
        listingId,
        status: row.publish ? 'published' : 'closed',
      });
    } catch (err) {
      failed += 1;

      const job = updateJob(jobId, { processed: i + 1, failed });
      const serialized = serializeSdkError(err);
      if (job.errors.length < MAX_JOB_ERRORS) {
        job.errors.push({
          row: row.rowNum,
          title: row.title,
          error: serialized.message,
          ...(serialized.status ? { status: serialized.status } : {}),
          ...(serialized.sdkErrors ? { sdkErrors: serialized.sdkErrors } : {}),
          ...(serialized.sdkErrorsTruncated
            ? { sdkErrorsTruncated: serialized.sdkErrorsTruncated }
            : {}),
        });
      } else {
        updateJob(jobId, { errorsWereCapped: true });
      }

      console.error(
        `[bulk-import] Row ${row.rowNum} ("${row.title}") failed:`,
        JSON.stringify(serialized, null, 2)
      );
    }

    // Rate limiting delay between rows
    if (i < rows.length - 1) {
      await delay(DELAY_BETWEEN_ROWS_MS);
    }
  }

  updateJob(jobId, { status: 'completed' });

  console.log(`[bulk-import] Job ${jobId} completed: ${succeeded} succeeded, ${failed} failed`);
}

module.exports = { processImportJob, serializeSdkError };
