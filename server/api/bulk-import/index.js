'use strict';

const express = require('express');
const multer = require('multer');
const { parseCsv, validateRows } = require('./csvParser');
const { processImportJob, serializeSdkError } = require('./importWorker');
const { createJob, getJob, updateJob, hasActiveJob } = require('./jobStore');
const { extractZip } = require('./zipExtractor');

const router = express.Router();

// Multer config: memory storage, single ZIP file up to 200MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB — entire ZIP
    files: 1,
  },
});

const uploadSingle = upload.single('zipFile');

// Auth middleware
function authMiddleware(req, res, next) {
  const apiKey = process.env.BULK_IMPORT_API_KEY;
  if (!apiKey) {
    return res
      .status(503)
      .json({ error: 'Bulk import is not configured (missing BULK_IMPORT_API_KEY).' });
  }
  const provided = req.headers['x-import-key'];
  if (provided !== apiKey) {
    return res.status(401).json({ error: 'Invalid or missing X-Import-Key header.' });
  }
  next();
}

// POST /api/bulk-import/start
router.post('/start', authMiddleware, uploadSingle, (req, res) => {
  try {
    // Validate ZIP file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP file uploaded. Use field name "zipFile".' });
    }

    // Extract and validate ZIP contents
    let csvBuffer, imageMap;
    try {
      ({ csvBuffer, imageMap } = extractZip(req.file.buffer));
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // Parse CSV
    let rows;
    try {
      rows = parseCsv(csvBuffer);
    } catch (err) {
      return res.status(400).json({ error: `CSV parse error: ${err.message}` });
    }

    // Validate rows against imageMap
    const validation = validateRows(rows, imageMap);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'CSV validation failed.',
        details: validation.errors,
      });
    }

    const requiresDefaultAuthor = validation.rows.some(row => !row.authorId);
    if (requiresDefaultAuthor && !process.env.BULK_IMPORT_DEFAULT_AUTHOR_ID) {
      return res.status(503).json({
        error: 'Bulk import is not configured (missing BULK_IMPORT_DEFAULT_AUTHOR_ID).',
      });
    }

    // Prevent concurrent imports
    if (hasActiveJob()) {
      return res.status(409).json({ error: 'An import is already in progress. Wait for it to complete before starting a new one.' });
    }

    // Create job and start processing
    const job = createJob(validation.rows.length);

    // Start async processing (do not await)
    processImportJob(job.id, validation.rows, imageMap).catch(err => {
      const serialized = serializeSdkError(err);
      console.error(`[bulk-import] Job ${job.id} crashed:`, serialized);
      updateJob(job.id, { status: 'failed', error: serialized });
    });

    res.status(202).json({
      jobId: job.id,
      total: validation.rows.length,
      message: 'Import started. Poll /api/bulk-import/status/:jobId for progress.',
    });
  } catch (err) {
    console.error('[bulk-import] Start error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/bulk-import/status/:jobId
router.get('/status/:jobId', authMiddleware, (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found. It may have expired (1hr TTL).' });
  }

  res.json({
    id: job.id,
    status: job.status,
    total: job.total,
    processed: job.processed,
    succeeded: job.succeeded,
    failed: job.failed,
    errors: job.errors,
    results: job.results,
    error: job.error || null,
  });
});

// GET /api/bulk-import/template — no auth required, publicly downloadable
router.get('/template', (req, res) => {
  const headers = [
    'title',
    'description',
    'price',
    'currency',
    'author_id',
    'publish',
    'stock',
    'shipping_enabled',
    'pickup_enabled',
    'location_address',
    'location_lat',
    'location_lng',
    'image_front',
    'image_back',
    'image_horizontal',
    'image_details',
    'pd_categoryLevel1',
    'pd_categoryLevel2',
    'pd_categoryLevel3',
    'pd_color',
    'pd_all_sizes',
    'pd_brand',
    'pd_genero',
    'pd_estado',
    'pd_estilo',
    'pd_originalPrice',
  ];

  const exampleRow = [
    'Vestido Vintage Años 80',
    'Hermoso vestido vintage en excelente estado',
    '450.00',
    'MXN',
    '',
    'yes',
    '1',
    'true',
    'false',
    'Ciudad de México, México',
    '19.4326',
    '-99.1332',
    'vestido01_front.jpg',
    'vestido01_back.jpg',
    'vestido01_horizontal.jpg',
    'vestido01_details.jpg',
    'ropa',
    'ropa-vestidos',
    '',
    'rosa',
    's|m',
    'vintage',
    'mujer',
    'como-nuevo',
    'vintage',
    '600.00',
  ];

  const csv = headers.join(',') + '\n' + exampleRow.map(v => JSON.stringify(v)).join(',') + '\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bulk-import-template.csv"');
  res.send(csv);
});

module.exports = router;
