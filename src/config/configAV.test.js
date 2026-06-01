import {
  canShowOriginalPrice,
  defaultCountry,
  getStoreTypeTags,
  sellerUserTypes,
  storeSellerUserType,
  storeTypeFieldKey,
} from './configAV';

const userWith = userType => ({
  attributes: { profile: { publicData: { userType } } },
});

describe('configAV', () => {
  it('defaults country to MX', () => {
    expect(defaultCountry).toBe('MX');
  });

  it('lists vendedor user types', () => {
    expect(sellerUserTypes).toEqual(['vendedor', 'vendedor-stock']);
  });

  describe('getStoreTypeTags', () => {
    const storeAuthor = (tipoTienda, userType = 'vendedor-tienda') => ({
      attributes: { profile: { publicData: { userType, tipoTienda } } },
    });
    const config = {
      user: {
        userFields: [
          {
            key: 'tipoTienda',
            schemaType: 'multi-enum',
            enumOptions: [
              { option: 'trending', label: 'Trending' },
              { option: 'holiday', label: 'Holiday' },
            ],
          },
        ],
      },
    };

    it('exposes the store seller userType', () => {
      expect(storeSellerUserType).toBe('vendedor-tienda');
    });

    it('exposes the store type field key', () => {
      expect(storeTypeFieldKey).toBe('tipoTienda');
    });

    it('returns tags when called without a config argument', () => {
      expect(getStoreTypeTags(storeAuthor(['x']))).toEqual([{ key: 'x', label: 'x' }]);
    });

    it('maps tipoTienda values to configured labels', () => {
      expect(getStoreTypeTags(storeAuthor(['trending', 'holiday']), config)).toEqual([
        { key: 'trending', label: 'Trending' },
        { key: 'holiday', label: 'Holiday' },
      ]);
    });

    it('normalizes a single string value to one tag', () => {
      expect(getStoreTypeTags(storeAuthor('trending'), config)).toEqual([
        { key: 'trending', label: 'Trending' },
      ]);
    });

    it('falls back to the raw value when the field is not configured', () => {
      expect(getStoreTypeTags(storeAuthor(['x']), { user: { userFields: [] } })).toEqual([
        { key: 'x', label: 'x' },
      ]);
    });

    it('returns [] for non-store user types', () => {
      expect(getStoreTypeTags(storeAuthor(['trending'], 'comprador'), config)).toEqual([]);
    });

    it('returns [] when there is no tipoTienda or no author', () => {
      expect(getStoreTypeTags(storeAuthor(undefined), config)).toEqual([]);
      expect(getStoreTypeTags(null, config)).toEqual([]);
    });
  });

  describe('canShowOriginalPrice', () => {
    it('returns true for vendedor', () => {
      expect(canShowOriginalPrice(userWith('vendedor'))).toBe(true);
    });
    it('returns true for vendedor-stock', () => {
      expect(canShowOriginalPrice(userWith('vendedor-stock'))).toBe(true);
    });
    it('returns false for other user types', () => {
      expect(canShowOriginalPrice(userWith('comprador'))).toBe(false);
    });
    it('returns false when currentUser is null or has no userType', () => {
      expect(canShowOriginalPrice(null)).toBe(false);
      expect(canShowOriginalPrice({})).toBe(false);
      expect(canShowOriginalPrice(userWith(undefined))).toBe(false);
    });
  });
});
