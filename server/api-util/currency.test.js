const Decimal = require('decimal.js');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;
const { convertDecimalJSToNumber, getAmountAsDecimalJS } = require('./currency');

describe('currency utils', () => {
  describe('convertDecimalJSToNumber(value, subUnitDivisor)', () => {
    const subUnitDivisor = 100;
    it('Decimals as value', () => {
      expect(convertDecimalJSToNumber(new Decimal(0), subUnitDivisor)).toEqual(0);
      expect(convertDecimalJSToNumber(new Decimal(10), subUnitDivisor)).toEqual(10);
    });

    it('Too big Decimals', () => {
      const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -1 * (2 ** 53 - 1);
      const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 2 ** 53 - 1;
      expect(() =>
        convertDecimalJSToNumber(new Decimal(MIN_SAFE_INTEGER - 1), subUnitDivisor)
      ).toThrow('Cannot represent Decimal.js value -9007199254740992 safely as a number');
      expect(() =>
        convertDecimalJSToNumber(new Decimal(MAX_SAFE_INTEGER + 1), subUnitDivisor)
      ).toThrow('Cannot represent Decimal.js value 9007199254740992 safely as a number');
    });

    it('wrong type', () => {
      expect(() => convertDecimalJSToNumber(0, subUnitDivisor)).toThrow(
        'Value must be a Decimal'
      );
      expect(() => convertDecimalJSToNumber(10, subUnitDivisor)).toThrow(
        'Value must be a Decimal'
      );
      expect(() => convertDecimalJSToNumber({}, subUnitDivisor)).toThrow(
        'Value must be a Decimal'
      );
      expect(() => convertDecimalJSToNumber([], subUnitDivisor)).toThrow(
        'Value must be a Decimal'
      );
      expect(() => convertDecimalJSToNumber(null, subUnitDivisor)).toThrow(
        'Value must be a Decimal'
      );
    });
  });

  describe('convertMoneyToNumber(value)', () => {
    it('Money as value', () => {
      expect(getAmountAsDecimalJS(new Money(10, 'USD'))).toEqual(new Decimal(10));
      expect(getAmountAsDecimalJS(new Money(1000, 'USD'))).toEqual(new Decimal(1000));
      expect(getAmountAsDecimalJS(new Money(9900, 'USD'))).toEqual(new Decimal(9900));
      expect(getAmountAsDecimalJS(new Money(10099, 'USD'))).toEqual(new Decimal(10099));
    });

    it('Wrong type of a parameter', () => {
      expect(() => getAmountAsDecimalJS(10)).toThrow('Value must be a Money type');
      expect(() => getAmountAsDecimalJS('10')).toThrow('Value must be a Money type');
      expect(() => getAmountAsDecimalJS(true)).toThrow('Value must be a Money type');
      expect(() => getAmountAsDecimalJS({})).toThrow('Value must be a Money type');
      expect(() => getAmountAsDecimalJS(new Money('asdf', 'USD'))).toThrow(
        '[DecimalError] Invalid argument'
      );
    });
  });
});
