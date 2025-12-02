// Set TTL environment variable for tests
process.env.TTL = '10';
// Mock devLogger to prevent issues during testing
jest.mock('../log.js', () => ({
  devLogger: jest.fn(),
}));

const { getSDKProxy } = require('./sdkCacheProxy');

const noop = () => {};

// Note: these tests assume that only sdk.assetByVersion and sdk.assetsByAlias are fully configured to be cached.
describe('getSDKProxy', () => {
  it('does not use cache for the uncacheable endpoint sdk.listings.show', async () => {
    // Mock sdk setup instead of the actual instance returned by the sdkUtils.getSdk(req, res);
    const sharetribeSDK = { listings: { show: noop } };
    const mockShow = jest
      .fn(() => Promise.resolve({ status: 200, data: { foo: 'bar' } }))
      .mockImplementationOnce(() => Promise.resolve({ status: 200, data: { foo: 'bar1' } }))
      .mockImplementationOnce(() => Promise.resolve({ status: 200, data: { foo: 'bar2' } }));
    sharetribeSDK.listings.show = mockShow;

    const sdkProxy = getSDKProxy(sharetribeSDK);

    // Call show endpoint twice
    const call1 = await sdkProxy.listings.show({ id: '123' });
    const call2 = await sdkProxy.listings.show({ id: '123' });

    // Should call the actual endpoint twice since caching is disabled
    expect(mockShow).toHaveBeenCalledTimes(2);
    expect(mockShow).toHaveBeenCalledWith({ id: '123' });
    expect(call1?.data?.foo).toBe('bar1');
    expect(call2?.data?.foo).toBe('bar2');
  });

  it('uses cache for the cacheable endpoint sdk.assetsByAlias', async () => {
    // Mock sdk setup instead of the actual instance returned by the sdkUtils.getSdk(req, res);
    const fakeSDK = { assetsByAlias: noop };
    const mockAssetsByAlias = jest
      .fn(() => Promise.resolve({ status: 200, data: { foo: 'bar' } }))
      .mockImplementationOnce(() => Promise.resolve({ status: 200, data: { foo: 'bar1' } }))
      .mockImplementationOnce(() => Promise.resolve({ status: 200, data: { foo: 'bar2' } }));
    fakeSDK.assetsByAlias = mockAssetsByAlias;

    const sdkProxy = getSDKProxy(fakeSDK);

    // Call assetByAlias endpoint twice
    const call1 = await sdkProxy.assetsByAlias({
      paths: ['content/pages/landing-page.json'],
      alias: 'latest',
    });
    const call2 = await sdkProxy.assetsByAlias({
      paths: ['content/pages/landing-page.json'],
      alias: 'latest',
    });

    // Should call the actual endpoint once since caching is enabled
    expect(mockAssetsByAlias).toHaveBeenCalledTimes(1);
    expect(mockAssetsByAlias).toHaveBeenCalledWith({
      paths: ['content/pages/landing-page.json'],
      alias: 'latest',
    });
    expect(call1?.data?.foo).toBe('bar1');
    expect(call2?.data?.foo).toBe('bar1');
  });

  it('uses cache for the cacheable endpoint sdk.assetByVersion', async () => {
    const fakeSDK = { assetByVersion: noop };
    const mockAssetByVersion = jest
      .fn(() => Promise.resolve({ status: 200, data: { foo: 'bar' } }))
      .mockImplementationOnce(() => Promise.resolve({ status: 200, data: { foo: 'bar1' } }))
      .mockImplementationOnce(() => Promise.resolve({ status: 200, data: { foo: 'bar2' } }));
    fakeSDK.assetByVersion = mockAssetByVersion;

    const sdkProxy = getSDKProxy(fakeSDK);

    // Call assetByVersion endpoint twice
    const call1 = await sdkProxy.assetByVersion({
      path: 'content/pages/landing-page.json',
      version: '<version-uuid>',
    });
    const call2 = await sdkProxy.assetByVersion({
      path: 'content/pages/landing-page.json',
      version: '<version-uuid>',
    });

    // Should call the actual endpoint once since caching is enabled
    expect(mockAssetByVersion).toHaveBeenCalledTimes(1);
    expect(mockAssetByVersion).toHaveBeenCalledWith({
      path: 'content/pages/landing-page.json',
      version: '<version-uuid>',
    });
    expect(call1?.data?.foo).toBe('bar1');
    expect(call2?.data?.foo).toBe('bar1');
  });
});
