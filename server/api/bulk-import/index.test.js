'use strict';

jest.mock('./importWorker', () => ({
  processImportJob: jest.fn(() => Promise.resolve()),
}));

jest.mock('./zipExtractor', () => ({
  extractZip: jest.fn(),
}));

const { processImportJob } = require('./importWorker');
const { extractZip } = require('./zipExtractor');
const { createJob } = require('./jobStore');
const router = require('./index');

const ORIGINAL_ENV = process.env;

const validCsvBuffer = Buffer.from(
  [
    'title,description,price,currency,image_front,image_back,image_horizontal,image_details',
    '"Vintage Dress","A great dress","450.00","MXN","front.jpg","back.jpg","horizontal.jpg","details.jpg"',
  ].join('\n')
);

const defaultImageMap = new Map([
  ['front.jpg', Buffer.from('front')],
  ['back.jpg', Buffer.from('back')],
  ['horizontal.jpg', Buffer.from('horizontal')],
  ['details.jpg', Buffer.from('details')],
]);

function getRouteStack(path, method) {
  const layer = router.stack.find(
    item => item.route?.path === path && item.route.methods?.[method]
  );
  return layer.route.stack.map(item => item.handle);
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

describe('bulk import router', () => {
  const [startAuthMiddleware, , startHandler] = getRouteStack('/start', 'post');
  const [statusAuthMiddleware, statusHandler] = getRouteStack('/status/:jobId', 'get');
  const [templateHandler] = getRouteStack('/template', 'get');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      BULK_IMPORT_API_KEY: 'test-import-key',
      BULK_IMPORT_DEFAULT_AUTHOR_ID: 'default-author-id',
    };
    // Default: successful extraction
    extractZip.mockReturnValue({ csvBuffer: validCsvBuffer, imageMap: defaultImageMap });
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('starts a valid import job', () => {
    const req = { file: { buffer: Buffer.from('fake-zip') } };
    const res = createMockRes();

    startHandler(req, res);

    expect(res.statusCode).toBe(202);
    expect(res.body.jobId).toBeDefined();
    expect(res.body.total).toBe(1);
    expect(processImportJob).toHaveBeenCalledTimes(1);
  });

  it('returns 401 for missing api key', () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = jest.fn();

    statusAuthMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/X-Import-Key/);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when zip file is missing', () => {
    const req = { file: null };
    const res = createMockRes();

    startHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/No ZIP file uploaded/);
  });

  it('returns 400 when zipExtractor throws (e.g. corrupt archive or no CSV)', () => {
    extractZip.mockImplementation(() => {
      throw new Error('ZIP contains no .csv file.');
    });

    const req = { file: { buffer: Buffer.from('bad-zip') } };
    const res = createMockRes();

    startHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/ZIP contains no .csv file/);
  });

  it.each(['image_front', 'image_back', 'image_horizontal'])(
    'returns 400 when CSV references a %s filename not present in imageMap',
    missingSlot => {
      const slotFile = `${missingSlot.replace('image_', '')}.jpg`;
      const partialMap = new Map(defaultImageMap);
      partialMap.delete(slotFile);
      extractZip.mockReturnValue({ csvBuffer: validCsvBuffer, imageMap: partialMap });

      const req = { file: { buffer: Buffer.from('zip') } };
      const res = createMockRes();

      startHandler(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`(${missingSlot}) not found in uploaded files`),
        ])
      );
    }
  );

  it('returns 503 when default author is required but missing from config', () => {
    delete process.env.BULK_IMPORT_DEFAULT_AUTHOR_ID;
    // CSV has no author_id column, so it will try to use the default
    extractZip.mockReturnValue({ csvBuffer: validCsvBuffer, imageMap: defaultImageMap });

    const req = { file: { buffer: Buffer.from('zip') } };
    const res = createMockRes();

    startHandler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.error).toMatch(/BULK_IMPORT_DEFAULT_AUTHOR_ID/);
  });

  it('returns 404 for unknown job status', () => {
    const req = { params: { jobId: 'unknown-job' } };
    const res = createMockRes();

    statusHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Job not found/);
  });

  it('returns job status for an existing job', () => {
    const job = createJob(2);
    const req = { params: { jobId: job.id } };
    const res = createMockRes();

    statusHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(job.id);
    expect(res.body.total).toBe(2);
    expect(res.body.status).toBe('processing');
  });

  it('downloads the csv template without authentication', () => {
    const req = {};
    const res = createMockRes();

    templateHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/csv');
    expect(res.body).toContain('image_front,image_back,image_horizontal,image_details');
    expect(res.body).toContain('vestido01_horizontal.jpg');
  });

  describe('csv template fields', () => {
    let templateBody;

    beforeEach(() => {
      const req = {};
      const res = createMockRes();
      templateHandler(req, res);
      templateBody = res.body;
    });

    it('template includes pd_originalPrice header', () => {
      expect(templateBody).toContain('pd_originalPrice');
    });

    it('template includes pd_genero header', () => {
      expect(templateBody).toContain('pd_genero');
    });

    it('template includes pd_estado header', () => {
      expect(templateBody).toContain('pd_estado');
    });

    it('template includes pd_estilo header', () => {
      expect(templateBody).toContain('pd_estilo');
    });

    it('template includes pd_categoryLevel3 header', () => {
      expect(templateBody).toContain('pd_categoryLevel3');
    });

  });
});
