'use strict';

// Mock the Integration SDK before requiring the module
jest.mock('../../services/integrationSdk', () => ({
  getIntegrationSdk: jest.fn(),
}));

const { getIntegrationSdk } = require('../../services/integrationSdk');
const { createJob, getJob } = require('./jobStore');
const { processImportJob } = require('./importWorker');

// Suppress console.error/log during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
  console.log.mockRestore();
});

function createMockSdk() {
  return {
    images: {
      upload: jest.fn().mockResolvedValue({
        data: { data: { id: { uuid: 'img-uuid-123' } } },
      }),
    },
    listings: {
      create: jest.fn().mockResolvedValue({
        data: { data: { id: { uuid: 'listing-uuid-456' } } },
      }),
      close: jest.fn().mockResolvedValue({}),
    },
    stock: {
      compareAndSet: jest.fn().mockResolvedValue({}),
    },
  };
}

function makeRow(overrides = {}) {
  return {
    rowNum: 2,
    title: 'Test Dress',
    description: 'A nice dress',
    price: 250,
    currency: 'MXN',
    authorId: '',
    publish: true,
    stock: 1,
    shippingEnabled: true,
    pickupEnabled: false,
    locationAddress: '',
    lat: null,
    lng: null,
    imageSlots: {},
    publicData: { color: 'blue' },
    ...overrides,
  };
}

describe('processImportJob', () => {
  beforeEach(() => {
    process.env.BULK_IMPORT_DEFAULT_AUTHOR_ID = 'author-uuid-789';
    process.env.BULK_IMPORT_LISTING_TYPE = 'product-selling';
    process.env.BULK_IMPORT_TRANSACTION_ALIAS = 'default-purchase/release-1';
    process.env.BULK_IMPORT_UNIT_TYPE = 'item';
  });

  afterEach(() => {
    delete process.env.BULK_IMPORT_DEFAULT_AUTHOR_ID;
    delete process.env.BULK_IMPORT_LISTING_TYPE;
    delete process.env.BULK_IMPORT_TRANSACTION_ALIAS;
    delete process.env.BULK_IMPORT_UNIT_TYPE;
  });

  it('processes a single row successfully', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    const rows = [makeRow()];
    const imageMap = new Map();

    await processImportJob(job.id, rows, imageMap);

    const finalJob = getJob(job.id);
    expect(finalJob.status).toBe('completed');
    expect(finalJob.processed).toBe(1);
    expect(finalJob.succeeded).toBe(1);
    expect(finalJob.failed).toBe(0);
    expect(finalJob.results).toHaveLength(1);
    expect(finalJob.results[0].listingId).toBe('listing-uuid-456');
    expect(finalJob.results[0].status).toBe('published');
  });

  it('creates listing with correct params', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    const rows = [makeRow({ price: 100, currency: 'USD' })];

    await processImportJob(job.id, rows, new Map());

    const createCall = mockSdk.listings.create.mock.calls[0];
    const params = createCall[0];

    expect(params.title).toBe('Test Dress');
    expect(params.description).toBe('A nice dress');
    // Price 100 * 100 = 10000 subunits
    expect(params.price.amount).toBe(10000);
    expect(params.price.currency).toBe('USD');
    expect(params.authorId.uuid).toBe('author-uuid-789');
    expect(params.publicData.listingType).toBe('product-selling');
    expect(params.publicData.transactionProcessAlias).toBe('default-purchase/release-1');
    expect(params.publicData.unitType).toBe('item');
    expect(params.publicData.color).toBe('blue');
  });

  it('uploads images and maps to imageSlots', async () => {
    const mockSdk = createMockSdk();
    let imageCallCount = 0;
    mockSdk.images.upload.mockImplementation(() => {
      imageCallCount += 1;
      return Promise.resolve({
        data: { data: { id: { uuid: `img-uuid-${imageCallCount}` } } },
      });
    });
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    const rows = [makeRow({ imageSlots: { front: 'a.jpg', back: 'b.jpg' } })];
    const imageMap = new Map();
    imageMap.set('a.jpg', Buffer.from('img-a'));
    imageMap.set('b.jpg', Buffer.from('img-b'));

    await processImportJob(job.id, rows, imageMap);

    expect(mockSdk.images.upload).toHaveBeenCalledTimes(2);
    const createParams = mockSdk.listings.create.mock.calls[0][0];
    expect(createParams.publicData.imageSlots).toEqual({
      front: 'img-uuid-1',
      back: 'img-uuid-2',
    });
    expect(createParams.images).toHaveLength(2);
  });

  it('sets stock via compareAndSet', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    const rows = [makeRow({ stock: 5 })];

    await processImportJob(job.id, rows, new Map());

    expect(mockSdk.stock.compareAndSet).toHaveBeenCalledTimes(1);
    const stockCall = mockSdk.stock.compareAndSet.mock.calls[0][0];
    expect(stockCall.newTotal).toBe(5);
    expect(stockCall.oldTotal).toBeNull();
  });

  it('does not call listings.close when publish is true', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    await processImportJob(job.id, [makeRow({ publish: true })], new Map());

    expect(mockSdk.listings.close).not.toHaveBeenCalled();
  });

  it('calls listings.close when publish is false', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    await processImportJob(job.id, [makeRow({ publish: false })], new Map());

    expect(mockSdk.listings.close).toHaveBeenCalledTimes(1);

    const finalJob = getJob(job.id);
    expect(finalJob.results[0].status).toBe('closed');
  });

  it('includes geolocation when lat/lng provided', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    await processImportJob(job.id, [makeRow({ lat: 19.43, lng: -99.13 })], new Map());

    const params = mockSdk.listings.create.mock.calls[0][0];
    expect(params.geolocation.lat).toBe(19.43);
    expect(params.geolocation.lng).toBe(-99.13);
  });

  it('omits geolocation when lat/lng are null', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    await processImportJob(job.id, [makeRow()], new Map());

    const params = mockSdk.listings.create.mock.calls[0][0];
    expect(params.geolocation).toBeUndefined();
  });

  it('uses row authorId over default when provided', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    await processImportJob(job.id, [makeRow({ authorId: 'custom-author' })], new Map());

    const params = mockSdk.listings.create.mock.calls[0][0];
    expect(params.authorId.uuid).toBe('custom-author');
  });

  it('handles row failure without aborting batch', async () => {
    const mockSdk = createMockSdk();
    let callCount = 0;
    mockSdk.listings.create.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.reject(new Error('API error'));
      }
      return Promise.resolve({
        data: { data: { id: { uuid: 'listing-2' } } },
      });
    });
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(2);
    const rows = [makeRow({ rowNum: 2 }), makeRow({ rowNum: 3, title: 'Second' })];

    await processImportJob(job.id, rows, new Map());

    const finalJob = getJob(job.id);
    expect(finalJob.status).toBe('completed');
    expect(finalJob.succeeded).toBe(1);
    expect(finalJob.failed).toBe(1);
    expect(finalJob.errors).toHaveLength(1);
    expect(finalJob.errors[0].row).toBe(2);
    expect(finalJob.errors[0].error).toBe('API error');
    expect(finalJob.results).toHaveLength(1);
    expect(finalJob.results[0].row).toBe(3);
  });

  it('fails row when no author_id and no default', async () => {
    delete process.env.BULK_IMPORT_DEFAULT_AUTHOR_ID;
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    await processImportJob(job.id, [makeRow()], new Map());

    const finalJob = getJob(job.id);
    expect(finalJob.failed).toBe(1);
    expect(finalJob.errors[0].error).toMatch(/BULK_IMPORT_DEFAULT_AUTHOR_ID/);
  });

  it('includes location in publicData when address provided', async () => {
    const mockSdk = createMockSdk();
    getIntegrationSdk.mockReturnValue(mockSdk);

    const job = createJob(1);
    await processImportJob(
      job.id,
      [makeRow({ locationAddress: 'CDMX, México' })],
      new Map()
    );

    const params = mockSdk.listings.create.mock.calls[0][0];
    expect(params.publicData.location).toEqual({ address: 'CDMX, México' });
  });
});
