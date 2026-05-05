'use strict';

const { parse } = require('csv-parse/sync');

const REQUIRED_COLUMNS = ['title', 'price', 'description'];
const IMAGE_COLUMNS = ['image_front', 'image_back', 'image_horizontal', 'image_details'];
const REQUIRED_IMAGE_COLUMNS = ['image_front', 'image_back', 'image_horizontal'];
const MAX_ROWS = 100;
const RESERVED_PD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Parse a CSV buffer and return structured rows.
 * Throws on parse errors.
 */
function parseCsv(buffer) {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  return records;
}

/**
 * Validate parsed CSV rows against required columns and image references.
 * Returns { valid: boolean, rows: Array, errors: Array<string> }
 */
function validateRows(rows, imageMap) {
  const errors = [];

  if (rows.length === 0) {
    errors.push('CSV file is empty.');
    return { valid: false, rows: [], errors };
  }

  if (rows.length > MAX_ROWS) {
    errors.push(`CSV has ${rows.length} rows. Maximum is ${MAX_ROWS}.`);
    return { valid: false, rows: [], errors };
  }

  // Check required columns exist in first row keys
  const columns = Object.keys(rows[0]);
  for (const col of REQUIRED_COLUMNS) {
    if (!columns.includes(col)) {
      errors.push(`Missing required column: "${col}".`);
    }
  }
  if (errors.length > 0) {
    return { valid: false, rows: [], errors };
  }

  // Validate each row
  const processedRows = rows.map((row, i) => {
    const rowNum = i + 2; // 1-indexed + header row
    const rowErrors = [];

    // Required fields
    if (!row.title || row.title.trim() === '') {
      rowErrors.push(`Row ${rowNum}: "title" is empty.`);
    }
    if (!row.description || row.description.trim() === '') {
      rowErrors.push(`Row ${rowNum}: "description" is empty.`);
    }

    // Price validation
    const price = parseFloat(row.price);
    if (isNaN(price) || price <= 0) {
      rowErrors.push(`Row ${rowNum}: "price" must be a positive number, got "${row.price}".`);
    }

    // Required image columns
    for (const col of REQUIRED_IMAGE_COLUMNS) {
      const filename = row[col];
      if (!filename || filename.trim() === '') {
        rowErrors.push(`Row ${rowNum}: "${col}" is required.`);
      }
    }

    // Image filename validation
    const imageSlots = {};
    for (const col of IMAGE_COLUMNS) {
      const filename = row[col];
      if (filename && filename.trim() !== '') {
        const trimmed = filename.trim();
        if (!imageMap.has(trimmed)) {
          rowErrors.push(`Row ${rowNum}: Image "${trimmed}" (${col}) not found in uploaded files.`);
        }
        const slotKey = col.replace('image_', ''); // image_front -> front
        imageSlots[slotKey] = trimmed;
      }
    }

    // Extract publicData from pd_* columns. Use a null-prototype object and
    // reject reserved keys to prevent prototype pollution from CSV headers.
    const publicData = Object.create(null);
    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith('pd_') && value && value.trim() !== '') {
        const pdKey = key.slice(3); // pd_color -> color
        if (RESERVED_PD_KEYS.has(pdKey)) {
          rowErrors.push(
            `Row ${rowNum}: publicData column "${key}" uses a reserved key and was skipped.`
          );
          continue;
        }
        // Pipe-separated values become arrays (multi-enum)
        if (value.includes('|')) {
          publicData[pdKey] = value.split('|').map(v => v.trim());
        } else {
          publicData[pdKey] = value.trim();
        }
      }
    }

    // Geolocation
    const lat = row.location_lat ? parseFloat(row.location_lat) : null;
    const lng = row.location_lng ? parseFloat(row.location_lng) : null;
    if ((lat !== null && isNaN(lat)) || (lng !== null && isNaN(lng))) {
      rowErrors.push(`Row ${rowNum}: Invalid geolocation values.`);
    }

    // Stock — explicit validation: empty defaults to 1, otherwise must be a non-negative integer.
    const rawStock = row.stock == null ? '' : String(row.stock).trim();
    let stock = 1;
    if (rawStock !== '') {
      const parsedStock = Number(rawStock);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        rowErrors.push(
          `Row ${rowNum}: "stock" must be a non-negative integer, got "${row.stock}".`
        );
      } else {
        stock = parsedStock;
      }
    }

    errors.push(...rowErrors);

    return {
      rowNum,
      title: (row.title || '').trim(),
      description: (row.description || '').trim(),
      price: isNaN(price) ? 0 : price,
      currency: (row.currency || 'MXN').trim().toUpperCase(),
      authorId: (row.author_id || '').trim(),
      publish: (row.publish || 'yes').trim().toLowerCase() !== 'no',
      stock,
      shippingEnabled: (row.shipping_enabled || 'true').trim().toLowerCase() !== 'false',
      pickupEnabled: (row.pickup_enabled || 'false').trim().toLowerCase() === 'true',
      locationAddress: (row.location_address || '').trim(),
      lat,
      lng,
      imageSlots,
      publicData,
    };
  });

  return {
    valid: errors.length === 0,
    rows: processedRows,
    errors,
  };
}

module.exports = { parseCsv, validateRows };
