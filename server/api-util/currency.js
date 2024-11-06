const Decimal = require('decimal.js');
const has = require('lodash/has');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

/** Helper functions for handling currency */

// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER
// https://stackoverflow.com/questions/26380364/why-is-number-max-safe-integer-9-007-199-254-740-991-and-not-9-007-199-254-740-9
const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -1 * (2 ** 53 - 1);
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 2 ** 53 - 1;

const isSafeNumber = decimalValue => {
  if (!(decimalValue instanceof Decimal)) {
    throw new Error('Value must be a Decimal');
  }
  return decimalValue.gte(MIN_SAFE_INTEGER) && decimalValue.lte(MAX_SAFE_INTEGER);
};

// See: https://en.wikipedia.org/wiki/ISO_4217
// See: https://stripe.com/docs/currencies
const subUnitDivisors = {
  AUD: 100, // Australian dollar
  BGN: 100, // Bulgarian lev
  CAD: 100, // Canadian dollar
  CHF: 100, // Swiss franc
  CZK: 100, // Czech koruna
  DKK: 100, // Danish krone
  EUR: 100, // Euro
  GBP: 100, // British pound
  HKD: 100, // Hong Kong dollar
  INR: 100, // Indian rupee
  JPY: 1, // Japanese yen
  MXN: 100, // Mexican peso
  NOK: 100, // Norwegian krone
  NZD: 100, // New Zealand dollar
  PLN: 100, // Polish złoty
  RON: 100, // Romanian leu
  SEK: 100, // Swedish krona
  SGD: 100, // Singapore dollar
  USD: 100, // United States dollar
};

// Get the minor unit divisor for the given currency
exports.unitDivisor = currency => {
  if (!has(subUnitDivisors, currency)) {
    throw new Error(
      `No minor unit divisor defined for currency: ${currency} in /server/api-util/currency.js`
    );
  }
  return subUnitDivisors[currency];
};

// Divisor can be positive value given as Decimal, Number, or String
const convertDivisorToDecimal = divisor => {
  try {
    const divisorAsDecimal = new Decimal(divisor);
    if (divisorAsDecimal.isNegative()) {
      throw new Error(`Parameter (${divisor}) must be a positive number.`);
    }
    return divisorAsDecimal;
  } catch (e) {
    throw new Error(`Parameter (${divisor}) must present a number.`, e);
  }
};

// Check if the value is a number
const isNumber = value => {
  return typeof value === 'number' && !isNaN(value);
};

// Detect if the given value is a goog.math.Long object
// See: https://google.github.io/closure-library/api/goog.math.Long.html
const isGoogleMathLong = value => {
  return typeof value === 'object' && isNumber(value.low_) && isNumber(value.high_);
};

/**
 * Gets subunit amount from Money object and returns it as Decimal.
 *
 * @param {Money} value
 *
 * @return {Number} converted value
 */
exports.getAmountAsDecimalJS = value => {
  if (!(value instanceof Money)) {
    throw new Error('Value must be a Money type');
  }
  let amount;

  if (isGoogleMathLong(value.amount)) {
    // TODO: temporarily also handle goog.math.Long values created by
    // the Transit tooling in the Sharetribe JS SDK. This should be
    // removed when the value.amount will be a proper Decimal type.

    // eslint-disable-next-line no-console
    console.warn('goog.math.Long value in money amount:', value.amount, value.amount.toString());

    amount = new Decimal(value.amount.toString());
  } else {
    amount = new Decimal(value.amount);
  }

  if (!isSafeNumber(amount)) {
    throw new Error(
      `Cannot represent money minor unit value ${amount.toString()} safely as a number`
    );
  }

  return amount;
};

/**
 * Converts value from DecimalJS to plain JS Number.
 * This also checks that Decimal.js value (for Money/amount)
 * is not too big or small for JavaScript to handle.
 *
 * @param {Decimal} value
 *
 * @return {Number} converted value
 */
exports.convertDecimalJSToNumber = decimalValue => {
  if (!isSafeNumber(decimalValue)) {
    throw new Error(
      `Cannot represent Decimal.js value ${decimalValue.toString()} safely as a number`
    );
  }

  return decimalValue.toNumber();
};
