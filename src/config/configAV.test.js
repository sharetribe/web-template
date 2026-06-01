import { canShowOriginalPrice, defaultCountry, sellerUserTypes } from './configAV';

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
