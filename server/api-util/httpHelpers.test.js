const { httpFileUrlToStream } = require('./httpHelpers');
const https = require('node:https');

jest.mock('node:https');

describe('httpFileUrlToStream', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve with a stream if the request is successful (status code 200)', async () => {
    const mockStream = { on: jest.fn((event, handler) => handler()), statusCode: 200 }; // Mock readable stream
    https.get.mockImplementation((url, callback) => {
      callback({ statusCode: 200, ...mockStream });
      return { on: jest.fn() }; // Mock returned 'req' object from https.get
    });

    const result = await httpFileUrlToStream('https://example.com/image.jpg');
    expect(result).toEqual(mockStream);
  });

  it('should reject with an error if the status code is not 200', async () => {
    const mockStream = { on: jest.fn((event, handler) => handler()) };
    https.get.mockImplementation((url, callback) => {
      callback({ statusCode: 404, ...mockStream });
      return { on: jest.fn() };
    });

    await expect(httpFileUrlToStream('https://example.com/image.jpg')).rejects.toThrow(
      'Failed to get image. Status code: 404'
    );
  });

  it('should reject if there is a network error', async () => {
    const error = new Error('Network error');
    https.get.mockImplementation(() => ({
      on: jest.fn((event, handler) => {
        if (event === 'error') handler(error);
      }),
    }));

    await expect(httpFileUrlToStream('https://example.com/image.jpg')).rejects.toThrow(
      'Network error'
    );
  });
});
