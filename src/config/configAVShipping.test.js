const {
  getPackageSizeForCategory,
  getShippingPrice,
  isEspecialSize,
  getAvailableDeliveryTypes,
  defaultPackageSize,
} = require('./configAVShipping');

describe('configAVShipping helpers', () => {
  const cfg = require('./configAVShipping');
  let original;

  beforeEach(() => {
    original = JSON.parse(JSON.stringify(cfg.priceGrid));
  });

  afterEach(() => {
    Object.assign(cfg.priceGrid, original);
  });

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

  test('getAvailableDeliveryTypes uses postal code range to detect CDMX (01000-16999)', () => {
    cfg.priceGrid.M.cdmxLocal = 9900;
    const cdmxByPostal = cfg.getAvailableDeliveryTypes('M', { postalCode: '14000' }); // Tlalpan, CDMX
    const nonCdmxByPostal = cfg.getAvailableDeliveryTypes('M', { postalCode: '44100' }); // Guadalajara
    expect(cdmxByPostal).toContain('cdmxLocal');
    expect(nonCdmxByPostal).not.toContain('cdmxLocal');
  });
});

describe('getPackageSizeForCategory mapping (real Console category ids)', () => {
  test('ropa sub-category exceptions; rest default to M', () => {
    expect(getPackageSizeForCategory('ropa', 'ropa-sacos-chamarras')).toBe('L');
    expect(getPackageSizeForCategory('ropa', 'ropa-lenceria')).toBe('S');
    expect(getPackageSizeForCategory('ropa', 'ropa-de-bano')).toBe('S');
    expect(getPackageSizeForCategory('ropa', 'ropa-tops')).toBe('M');
    expect(getPackageSizeForCategory('ropa', 'ropa-jeans')).toBe('M');
  });

  test('resolves most-specific first, falling back up the levels', () => {
    // level3 unmapped → falls back to the level2 exception
    expect(
      getPackageSizeForCategory(
        'ropa',
        'ropa-sacos-chamarras',
        'ropa-sacos-chamarras-chamarras-de-piel'
      )
    ).toBe('L');
    // accesorios mapped at the family (level1) → applies to all descendants
    expect(
      getPackageSizeForCategory('accesorios', 'accesorios-joyerias', 'accesorios-joyerias-collares')
    ).toBe('S');
  });

  test('bolsas: small vs large vs mid-default', () => {
    expect(getPackageSizeForCategory('bolsas', 'bolsas-clutch')).toBe('S');
    expect(getPackageSizeForCategory('bolsas', 'bolsas-carteras')).toBe('S');
    expect(getPackageSizeForCategory('bolsas', 'bolsas-totes')).toBe('L');
    expect(getPackageSizeForCategory('bolsas', 'bolsas-mochilas_deporte')).toBe('L');
    expect(getPackageSizeForCategory('bolsas', 'bolsas-mano')).toBe('M');
    expect(getPackageSizeForCategory('bolsas', 'bolsas-cruzadas')).toBe('M');
  });

  test('zapatos: sneakers/boots L, flats/heels default M', () => {
    expect(getPackageSizeForCategory('zapatos', 'zapatos-tenis_deportivos')).toBe('L');
    expect(getPackageSizeForCategory('zapatos', 'zapatos-botas')).toBe('L');
    expect(getPackageSizeForCategory('zapatos', 'zapatos-botin')).toBe('L');
    expect(getPackageSizeForCategory('zapatos', 'zapatos-tacones')).toBe('M');
    expect(getPackageSizeForCategory('zapatos', 'zapatos-zapatillas_flats')).toBe('M');
  });

  test('accesorios family → S; home-antiques family → especial', () => {
    expect(getPackageSizeForCategory('accesorios', 'accesorios-lentes')).toBe('S');
    expect(getPackageSizeForCategory('home-antiques', 'home-antiques-antiguedades')).toBe(
      'especial'
    );
  });

  test('unknown/empty inputs fall back to default', () => {
    expect(getPackageSizeForCategory('does-not-exist')).toBe('M');
    expect(getPackageSizeForCategory()).toBe('M');
    expect(getPackageSizeForCategory(undefined, null)).toBe('M');
  });
});

describe('resolvePackageSize(publicData)', () => {
  const { resolvePackageSize } = require('./configAVShipping');

  test('prefers an explicit avPackageSize', () => {
    expect(resolvePackageSize({ avPackageSize: 'L', categoryLevel1: 'ropa' })).toBe('L');
  });

  test('falls back to the category mapping when avPackageSize is absent', () => {
    expect(
      resolvePackageSize({ categoryLevel1: 'ropa', categoryLevel2: 'ropa-sacos-chamarras' })
    ).toBe('L');
    expect(resolvePackageSize({ categoryLevel1: 'accesorios' })).toBe('S');
  });

  test('falls back to the default size for unmapped/empty publicData', () => {
    expect(
      resolvePackageSize({ categoryLevel1: 'bolsas', categoryLevel2: 'bolsas-formales' })
    ).toBe('M');
    expect(resolvePackageSize({})).toBe('M');
    expect(resolvePackageSize()).toBe('M');
  });
});
