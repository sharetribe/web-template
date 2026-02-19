import Decimal from 'decimal.js';
import { types as sdkTypes } from './sdkLoader';
import {
  MIN_SAFE_INTEGER,
  MAX_SAFE_INTEGER,
  isSafeNumber,
  convertDecimalToString,
  convertMoneyToNumber,
  convertToDecimal,
  convertUnitToSubUnit,
  ensureSeparator,
  truncateToSubUnitPrecision,
  formatMoney,
} from './currency';

const { Money } = sdkTypes;

describe('currency utils', () => {
  describe('isSafeNumber()', () => {
    it('only accepts Decimal instances', () => {
      expect(() => isSafeNumber(-1)).toThrow('Value must be a Decimal');
      expect(() => isSafeNumber(0)).toThrow('Value must be a Decimal');
      expect(() => isSafeNumber(1)).toThrow('Value must be a Decimal');
      expect(() => isSafeNumber(MIN_SAFE_INTEGER)).toThrow('Value must be a Decimal');
      expect(() => isSafeNumber(MAX_SAFE_INTEGER)).toThrow('Value must be a Decimal');
      expect(() => isSafeNumber('abc')).toThrow('Value must be a Decimal');
      expect(() => isSafeNumber('123')).toThrow('Value must be a Decimal');
    });
    it('handles number bounds properly', () => {
      expect(isSafeNumber(new Decimal(NaN))).toBe(false);
      expect(isSafeNumber(new Decimal(-Infinity))).toBe(false);
      expect(isSafeNumber(new Decimal(MIN_SAFE_INTEGER).minus(1))).toBe(false);
      expect(isSafeNumber(new Decimal(MIN_SAFE_INTEGER))).toBe(true);
      expect(isSafeNumber(new Decimal(0))).toBe(true);
      expect(isSafeNumber(new Decimal(MAX_SAFE_INTEGER))).toBe(true);
      expect(isSafeNumber(new Decimal(MAX_SAFE_INTEGER).plus(1))).toBe(false);
      expect(isSafeNumber(new Decimal(Infinity))).toBe(false);
    });
  });

  describe('ensureSeparator(str)', () => {
    it('changes commas in string to dots ', () => {
      expect(ensureSeparator('0')).toEqual('0');
      expect(ensureSeparator('0.0')).toEqual('0.0');
      expect(ensureSeparator('0.')).toEqual('0.');
      expect(ensureSeparator('0,')).toEqual('0.');
      expect(ensureSeparator('0,0')).toEqual('0.0');
      expect(ensureSeparator('0,1234')).toEqual('0.1234');
      expect(ensureSeparator('asdf')).toEqual('asdf');
    });

    it('changes dots in string to commas ', () => {
      expect(ensureSeparator('0', true)).toEqual('0');
      expect(ensureSeparator('0.0', true)).toEqual('0,0');
      expect(ensureSeparator('0.', true)).toEqual('0,');
      expect(ensureSeparator('0,', true)).toEqual('0,');
      expect(ensureSeparator('0,0', true)).toEqual('0,0');
      expect(ensureSeparator('0,1234', true)).toEqual('0,1234');
      expect(ensureSeparator('asdf', true)).toEqual('asdf');
    });

    it('Throws exceptions if parameter is not a string', () => {
      expect(() => ensureSeparator(0)).toThrow('Parameter must be a string');
      expect(() => ensureSeparator(true)).toThrow('Parameter must be a string');
      expect(() => ensureSeparator([])).toThrow('Parameter must be a string');
      expect(() => ensureSeparator({})).toThrow('Parameter must be a string');
      expect(() => ensureSeparator(0, true)).toThrow('Parameter must be a string');
      expect(() => ensureSeparator(true, true)).toThrow('Parameter must be a string');
      expect(() => ensureSeparator([], true)).toThrow('Parameter must be a string');
      expect(() => ensureSeparator({}, true)).toThrow('Parameter must be a string');
    });
  });

  describe('convertToDecimal(valueStr)', () => {
    it('converts numbers in string format to Decimal', () => {
      expect(convertToDecimal('0')).toEqual(new Decimal('0'));
      expect(convertToDecimal('-0')).toEqual(new Decimal('-0'));
      expect(convertToDecimal('1.23')).toEqual(new Decimal('1.23'));
      expect(convertToDecimal('999999999.99999999')).toEqual(new Decimal('999999999.99999999'));
      expect(convertToDecimal('-999999999.99999999')).toEqual(new Decimal('-999999999.99999999'));
    });

    it('Throws exceptions if string formatted parameter can not be converted to Decimal', () => {
      expect(() => convertToDecimal('asdf')).toThrow('[DecimalError] Invalid argument: asdf');
      expect(() => convertToDecimal('123asdf')).toThrow(
        '[DecimalError] Invalid argument: 123asdf'
      );
    });

    it('Throws exceptions if parameter is not a string', () => {
      expect(() => convertToDecimal(true)).toThrow('Parameter must be a string');
      expect(() => convertToDecimal([])).toThrow('Parameter must be a string');
      expect(() => convertToDecimal(undefined)).toThrow('Parameter must be a string');
      expect(() => convertToDecimal(null)).toThrow('Parameter must be a string');
    });
  });

  describe('convertDecimalToString(<Decimal>)', () => {
    it('converts Decimals to string', () => {
      expect(convertDecimalToString(new Decimal('0'))).toEqual('0');
      expect(convertDecimalToString(new Decimal('-0'))).toEqual('0');
      expect(convertDecimalToString(new Decimal('1.23'))).toEqual('1.23');
      expect(convertDecimalToString(new Decimal('999999999.99999999'))).toEqual(
        '999999999.99999999'
      );
      expect(convertDecimalToString(new Decimal('-999999999.99999999'))).toEqual(
        '-999999999.99999999'
      );
    });

    it('converts numbers in string format to string', () => {
      expect(convertDecimalToString('0')).toEqual('0');
      expect(convertDecimalToString('-0')).toEqual('0');
      expect(convertDecimalToString('1.23')).toEqual('1.23');
      expect(convertDecimalToString('999999999.99999999')).toEqual('999999999.99999999');
      expect(convertDecimalToString('-999999999.99999999')).toEqual('-999999999.99999999');
    });

    it('Throws exceptions if string formatted parameter is not a number', () => {
      expect(() => convertDecimalToString('asdf')).toThrow(
        '[DecimalError] Invalid argument: asdf'
      );
      expect(() => convertDecimalToString('123asdf')).toThrow(
        '[DecimalError] Invalid argument: 123asdf'
      );
    });
  });

  describe('truncateToSubUnitPrecision(valueStr, subUnitDivisor)', () => {
    const subUnitDivisor = 100;
    it('Values with no truncation needed', () => {
      expect(truncateToSubUnitPrecision('0', subUnitDivisor)).toEqual('0');
      expect(truncateToSubUnitPrecision('1', subUnitDivisor)).toEqual('1');
      expect(truncateToSubUnitPrecision('10', subUnitDivisor)).toEqual('10');
      expect(truncateToSubUnitPrecision('10000', subUnitDivisor)).toEqual('10000');
      expect(truncateToSubUnitPrecision('10000.00', subUnitDivisor)).toEqual('10000.00');
      expect(truncateToSubUnitPrecision('99.9', subUnitDivisor)).toEqual('99.9');
      expect(truncateToSubUnitPrecision('99.99', subUnitDivisor)).toEqual('99.99');
    });

    it('truncate excess amount of decimal values', () => {
      expect(truncateToSubUnitPrecision('99.999999', subUnitDivisor)).toEqual('99.99');
      expect(truncateToSubUnitPrecision('1.111', subUnitDivisor)).toEqual('1.11');
      expect(truncateToSubUnitPrecision('1.110000', subUnitDivisor)).toEqual('1.11');
    });

    it('negative values to throw errors', () => {
      expect(() => truncateToSubUnitPrecision('-0', subUnitDivisor)).toThrow(
        'Parameter (-0) must be a positive number'
      );
      expect(() => truncateToSubUnitPrecision('-1', subUnitDivisor)).toThrow(
        'Parameter (-1) must be a positive number'
      );
      expect(() => truncateToSubUnitPrecision('-10000', subUnitDivisor)).toThrow(
        'Parameter (-10000) must be a positive number'
      );
      expect(() => truncateToSubUnitPrecision('-99.99', subUnitDivisor)).toThrow(
        'Parameter (-99.99) must be a positive number'
      );
      expect(() => truncateToSubUnitPrecision('-99.99999', subUnitDivisor)).toThrow(
        'Parameter (-99.99999) must be a positive number'
      );
      expect(() => truncateToSubUnitPrecision('-1.111', subUnitDivisor)).toThrow(
        'Parameter (-1.111) must be a positive number'
      );
    });

    it('text input to throw errors', () => {
      expect(() => truncateToSubUnitPrecision('asdf', subUnitDivisor)).toThrow();
      expect(() => truncateToSubUnitPrecision('100asdf', subUnitDivisor)).toThrow();
      expect(() => truncateToSubUnitPrecision('asdf100', subUnitDivisor)).toThrow();
      expect(() => truncateToSubUnitPrecision('@', subUnitDivisor)).toThrow();
    });

    it('wrong subUnitDivisor type to throw errors', () => {
      expect(() => truncateToSubUnitPrecision('asdf', '')).toThrow();
      expect(() => truncateToSubUnitPrecision('100asdf', 'asdf')).toThrow();
      expect(() => truncateToSubUnitPrecision('asdf100', [])).toThrow();
      expect(() => truncateToSubUnitPrecision('@', {})).toThrow();
    });
  });

  describe('convertUnitToSubUnit(value, subUnitDivisor)', () => {
    const subUnitDivisor = 100;
    it('numbers as value', () => {
      expect(convertUnitToSubUnit(0, subUnitDivisor)).toEqual(0);
      expect(convertUnitToSubUnit(10, subUnitDivisor)).toEqual(1000);
      expect(convertUnitToSubUnit(1, subUnitDivisor)).toEqual(100);
    });

    it('strings as value', () => {
      expect(convertUnitToSubUnit('0', subUnitDivisor)).toEqual(0);
      expect(convertUnitToSubUnit('10', subUnitDivisor)).toEqual(1000);
      expect(convertUnitToSubUnit('1', subUnitDivisor)).toEqual(100);
      expect(convertUnitToSubUnit('0.10', subUnitDivisor)).toEqual(10);
      expect(convertUnitToSubUnit('10,99', subUnitDivisor)).toEqual(1099);
    });

    it('wrong type', () => {
      expect(() => convertUnitToSubUnit({}, subUnitDivisor)).toThrow(
        'Value must be either number or string'
      );
      expect(() => convertUnitToSubUnit([], subUnitDivisor)).toThrow(
        'Value must be either number or string'
      );
      expect(() => convertUnitToSubUnit(null, subUnitDivisor)).toThrow(
        'Value must be either number or string'
      );
    });

    it('wrong subUnitDivisor', () => {
      expect(() => convertUnitToSubUnit(1, 'asdf')).toThrow();
    });
  });

  describe('convertMoneyToNumber(value)', () => {
    it('Money as value', () => {
      expect(convertMoneyToNumber(new Money(10, 'USD'))).toEqual(0.1);
      expect(convertMoneyToNumber(new Money(1000, 'USD'))).toEqual(10);
      expect(convertMoneyToNumber(new Money(9900, 'USD'))).toEqual(99);
      expect(convertMoneyToNumber(new Money(10099, 'USD'))).toEqual(100.99);

      expect(convertMoneyToNumber(new Money(1, 'JPY'))).toEqual(1);
      expect(convertMoneyToNumber(new Money(100, 'JPY'))).toEqual(100);
      expect(convertMoneyToNumber(new Money(1234, 'JPY'))).toEqual(1234);

      expect(convertMoneyToNumber(new Money(1, 'VND'))).toEqual(1);
      expect(convertMoneyToNumber(new Money(100000, 'VND'))).toEqual(100000);
      expect(convertMoneyToNumber(new Money(500, 'VND'))).toEqual(500);
    });

    it('Wrong type of a parameter', () => {
      expect(() => convertMoneyToNumber(10)).toThrow('Value must be a Money type');
      expect(() => convertMoneyToNumber('10')).toThrow('Value must be a Money type');
      expect(() => convertMoneyToNumber(true)).toThrow('Value must be a Money type');
      expect(() => convertMoneyToNumber({})).toThrow('Value must be a Money type');
      expect(() => convertMoneyToNumber(new Money('asdf', 'USD'))).toThrow(
        '[DecimalError] Invalid argument'
      );
    });
  });

  describe('formatMoney', () => {
    it('complains about incorrect value type', () => {
      const intl = null;
      const value = null;
      expect(() => formatMoney(intl, value)).toThrow('Value must be a Money type');
    });

    // No test for that actual formatting for now. It depends on the
    // locale, and it doesn't really make sense to test the fake intl
    // implementation in the tests.
  });
});
