const {
  getPackageSizeForCategory,
  getShippingPrice,
  isEspecialSize,
  getAvailableDeliveryTypes,
  defaultPackageSize,
} = require('./configAVShipping');

describe('configAVShipping helpers', () => {
  test('getPackageSizeForCategory falls back to default for unknown category', () => {
    expect(getPackageSizeForCategory('does-not-exist')).toBe(defaultPackageSize);
    expect(defaultPackageSize).toBe('M');
  });

  test('isEspecialSize is true only for especial', () => {
    expect(isEspecialSize('especial')).toBe(true);
    expect(isEspecialSize('M')).toBe(false);
  });

  test('getShippingPrice returns null for especial and unknown', () => {
    expect(getShippingPrice('especial', 'nacionalEstandar')).toBeNull();
    expect(getShippingPrice('M', 'no-such-type')).toBeNull();
    expect(getShippingPrice('Z', 'nacionalEstandar')).toBeNull();
  });

  test('getAvailableDeliveryTypes hides cdmxLocal for non-CDMX destinations', () => {
    const cfg = require('./configAVShipping');
    cfg.priceGrid.M.cdmxLocal = 9900;
    cfg.priceGrid.M.nacionalEstandar = 12900;
    const cdmx = cfg.getAvailableDeliveryTypes('M', { state: 'Ciudad de México' });
    const other = cfg.getAvailableDeliveryTypes('M', { state: 'Jalisco' });
    expect(cdmx).toContain('cdmxLocal');
    expect(other).not.toContain('cdmxLocal');
    expect(other).toContain('nacionalEstandar');
  });

  test('getAvailableDeliveryTypes returns [] for especial', () => {
    expect(getAvailableDeliveryTypes('especial', { state: 'Ciudad de México' })).toEqual([]);
  });
});
