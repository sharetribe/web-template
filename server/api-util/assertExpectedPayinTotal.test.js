const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

const { PAYIN_TOTAL_CHANGED, assertExpectedPayinTotal } = require('./assertExpectedPayinTotal');

describe('assertExpectedPayinTotal()', () => {
  const lineItems = [
    {
      code: 'line-item/item',
      unitPrice: new Money(10000, 'USD'),
      quantity: 1,
      includeFor: ['customer', 'provider'],
    },
  ];

  it('is a no-op when expected total is omitted', () => {
    expect(() => assertExpectedPayinTotal(lineItems, null)).not.toThrow();
    expect(() => assertExpectedPayinTotal(lineItems, undefined)).not.toThrow();
  });

  it('accepts a matching expected total', () => {
    expect(() =>
      assertExpectedPayinTotal(lineItems, { amount: 10000, currency: 'USD' })
    ).not.toThrow();
  });

  it('rejects an incomplete expected total', () => {
    expect(() => assertExpectedPayinTotal(lineItems, {})).toThrow(PAYIN_TOTAL_CHANGED);
  });

  it('rejects amount mismatch', () => {
    try {
      assertExpectedPayinTotal(lineItems, { amount: 9000, currency: 'USD' });
      throw new Error('expected assert to throw');
    } catch (e) {
      expect(e.message).toBe(PAYIN_TOTAL_CHANGED);
      expect(e.status).toBe(409);
      expect(e.statusText).toBe(PAYIN_TOTAL_CHANGED);
    }
  });

  it('rejects currency mismatch', () => {
    expect(() => assertExpectedPayinTotal(lineItems, { amount: 10000, currency: 'EUR' })).toThrow(
      PAYIN_TOTAL_CHANGED
    );
  });
});
