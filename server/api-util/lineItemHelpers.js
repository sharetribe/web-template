const Decimal = require('decimal.js');
const moment = require('moment-timezone/builds/moment-timezone-with-data-10-year-range.min');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

const { getAmountAsDecimalJS, convertDecimalJSToNumber } = require('./currency');
const { nightsBetween, daysBetween } = require('./dates');
const LINE_ITEM_NIGHT = 'line-item/night';
const LINE_ITEM_DAY = 'line-item/day';

/** Helper functions for constructing line items*/

const isNumber = value => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Calculates shipping fee based on saved public data fields and quantity.
 * The total will be `shippingPriceInSubunitsOneItem + (shippingPriceInSubunitsAdditionalItems * (quantity - 1))`.
 * E.g. 4 items ordered with shipping fees €10 for first item and €5 for additional items:
 * €10 + (3 * €5) => €25
 *
 * @param {Money} shippingPriceInSubunitsOneItem
 * @param {Money} shippingPriceInSubunitsAdditionalItems
 * @param {string} currency code
 * @param {int} quantity
 *
 * @returns {Money} lineTotal
 */
exports.calculateShippingFee = (
  shippingPriceInSubunitsOneItem,
  shippingPriceInSubunitsAdditionalItems,
  currency,
  quantity
) => {
  if (
    isNumber(shippingPriceInSubunitsOneItem) &&
    shippingPriceInSubunitsOneItem >= 0 &&
    currency &&
    quantity === 1
  ) {
    return new Money(shippingPriceInSubunitsOneItem, currency);
  } else if (
    isNumber(shippingPriceInSubunitsOneItem) &&
    isNumber(shippingPriceInSubunitsAdditionalItems) &&
    shippingPriceInSubunitsOneItem >= 0 &&
    shippingPriceInSubunitsAdditionalItems >= 0 &&
    currency &&
    quantity > 1
  ) {
    const oneItemFee = getAmountAsDecimalJS(new Money(shippingPriceInSubunitsOneItem, currency));
    const additionalItemsFee = getAmountAsDecimalJS(
      new Money(shippingPriceInSubunitsAdditionalItems, currency)
    );
    const additionalItemsTotal = additionalItemsFee.times(quantity - 1);
    const numericShippingFee = convertDecimalJSToNumber(oneItemFee.plus(additionalItemsTotal));
    return new Money(numericShippingFee, currency);
  } else if (
    currency &&
    quantity > 1 &&
    (!isNumber(shippingPriceInSubunitsOneItem) || !isNumber(shippingPriceInSubunitsAdditionalItems))
  ) {
    // If both shippingPriceInSubunitsOneItem and shippingPriceInSubunitsAdditionalItems are NOT set,
    // when quantity is greater than 1, there's an error somewhere in the code
    throw new Error('Shipping fee is not set correctly for multiple items');
  }
  return null;
};

/**
 * Calculates lineTotal for lineItem based on quantity.
 * The total will be `unitPrice * quantity`.
 *
 * @param {Money} unitPrice
 * @param {int} quantity
 *
 * @returns {Money} lineTotal
 */
exports.calculateTotalPriceFromQuantity = (unitPrice, unitCount) => {
  const amountFromUnitPrice = getAmountAsDecimalJS(unitPrice);

  // NOTE: We round the total price to the nearest integer.
  //       Payment processors don't support fractional subunits.
  const totalPrice = amountFromUnitPrice.times(unitCount).toNearest(1, Decimal.ROUND_HALF_UP);
  // Get total price as Number (and validate that the conversion is safe)
  const numericTotalPrice = convertDecimalJSToNumber(totalPrice);

  return new Money(numericTotalPrice, unitPrice.currency);
};

/**
 * Calculates lineTotal for lineItem based on percentage.
 * The total will be `unitPrice * (percentage / 100)`.
 *
 * @param {Money} unitPrice
 * @param {int} percentage
 *
 * @returns {Money} lineTotal
 */
exports.calculateTotalPriceFromPercentage = (unitPrice, percentage) => {
  const amountFromUnitPrice = getAmountAsDecimalJS(unitPrice);

  // NOTE: We round the total price to the nearest integer.
  //       Payment processors don't support fractional subunits.
  const totalPrice = amountFromUnitPrice
    .times(percentage)
    .dividedBy(100)
    .toNearest(1, Decimal.ROUND_HALF_UP);

  // Get total price as Number (and validate that the conversion is safe)
  const numericTotalPrice = convertDecimalJSToNumber(totalPrice);

  return new Money(numericTotalPrice, unitPrice.currency);
};

/**
 * Calculates lineTotal for lineItem based on seats and units.
 * The total will be `unitPrice * units * seats`.
 *
 * @param {Money} unitPrice
 * @param {int} unitCount
 * @param {int} seats
 *
 * @returns {Money} lineTotal
 */
exports.calculateTotalPriceFromSeats = (unitPrice, unitCount, seats) => {
  if (seats < 0) {
    throw new Error(`Value of seats can't be negative`);
  }

  const amountFromUnitPrice = getAmountAsDecimalJS(unitPrice);

  // NOTE: We round the total price to the nearest integer.
  //       Payment processors don't support fractional subunits.
  const totalPrice = amountFromUnitPrice
    .times(unitCount)
    .times(seats)
    .toNearest(1, Decimal.ROUND_HALF_UP);

  // Get total price as Number (and validate that the conversion is safe)
  const numericTotalPrice = convertDecimalJSToNumber(totalPrice);

  return new Money(numericTotalPrice, unitPrice.currency);
};

/**
 * Calculates the quantity based on the booking start and end dates depending on booking type.
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} type
 *
 * @returns {number} quantity
 */
exports.calculateQuantityFromDates = (startDate, endDate, type) => {
  if (type === LINE_ITEM_NIGHT) {
    return nightsBetween(startDate, endDate);
  } else if (type === LINE_ITEM_DAY) {
    return daysBetween(startDate, endDate);
  }
  throw new Error(`Can't calculate quantity from dates to unit type: ${type}`);
};

/**
 * Calculate the quantity of hours between start and end dates.
 * If the length of the timeslot is something else than hour (e.g. 30 minutes)
 * you can change parameter 'hours' to 'minutes' and use that to calculate the
 * quantity of timeslots.
 *
 * See moment documentation about diff:
 * https://momentjs.com/docs/#/displaying/difference/
 *
 * @param {Date} startDate
 * @param {Date} endDate
 *
 * @returns {int} quantity of hours between start and end
 *
 */
exports.calculateQuantityFromHours = (startDate, endDate) => {
  // Note: the last parameter (true) ensures that floats are returned.
  return moment(endDate).diff(moment(startDate), 'hours', true);
};

/**
 *
 *  `lineTotal` is calculated by the following rules:
 * - If `quantity` is provided, the line total will be `unitPrice * quantity`.
 * - If `percentage` is provided, the line total will be `unitPrice * (percentage / 100)`.
 * - If `seats` and `units` are provided the line item will contain `quantity` as a product of `seats` and `units` and the line total will be `unitPrice * units * seats`.
 *
 * @param {Object} lineItem
 * @return {Money} lineTotal
 *
 */
exports.calculateLineTotal = lineItem => {
  const { code, unitPrice, quantity, percentage, seats, units } = lineItem;

  if (quantity) {
    return this.calculateTotalPriceFromQuantity(unitPrice, quantity);
  } else if (percentage != null) {
    return this.calculateTotalPriceFromPercentage(unitPrice, percentage);
  } else if (seats && units) {
    return this.calculateTotalPriceFromSeats(unitPrice, units, seats);
  } else {
    throw new Error(
      `Can't calculate the lineTotal of lineItem: ${code}. Make sure the lineItem has quantity, percentage or both seats and units`
    );
  }
};

/**
 * Calculates the total sum of lineTotals for given lineItems
 *
 * @param {Array} lineItems
 * @retuns {Money} total sum
 */
exports.calculateTotalFromLineItems = lineItems => {
  const totalPrice = lineItems.reduce((sum, lineItem) => {
    const lineTotal = this.calculateLineTotal(lineItem);
    return getAmountAsDecimalJS(lineTotal).add(sum);
  }, 0);

  // Get total price as Number (and validate that the conversion is safe)
  const numericTotalPrice = convertDecimalJSToNumber(totalPrice);
  const unitPrice = lineItems[0].unitPrice;

  return new Money(numericTotalPrice, unitPrice.currency);
};

/**
 * Calculates the total sum of lineTotals for given lineItems where `includeFor` includes `provider`
 * @param {*} lineItems
 * @returns {Money} total sum
 */
exports.calculateTotalForProvider = lineItems => {
  const providerLineItems = lineItems.filter(lineItem => lineItem.includeFor.includes('provider'));
  return this.calculateTotalFromLineItems(providerLineItems);
};

/**
 * Calculates the total sum of lineTotals for given lineItems where `includeFor` includes `customer`
 * @param {*} lineItems
 * @returns {Money} total sum
 */
exports.calculateTotalForCustomer = lineItems => {
  const providerLineItems = lineItems.filter(lineItem => lineItem.includeFor.includes('customer'));
  return this.calculateTotalFromLineItems(providerLineItems);
};

/**
 * Constructs lineItems that can be used directly in this template.
 * This function checks lineItem code and adds attributes like lineTotal and reversal
 * which are added in API response and some UI components are expecting.
 *
 * This can be used when user is not authenticated and we can't call speculative API endpoints directly
 *
 * @param {Array} lineItems
 * @returns {Array} lineItems with lineTotal and reversal info
 *
 */
exports.constructValidLineItems = lineItems => {
  const lineItemsWithTotals = lineItems.map(lineItem => {
    const { code, quantity, percentage } = lineItem;

    if (!/^line-item\/.+/.test(code)) {
      throw new Error(`Invalid line item code: ${code}`);
    }

    // lineItems are expected to be in similar format as when they are returned from API
    // so that we can use them in e.g. OrderBreakdown component.
    // This means we need to convert quantity to Decimal and add attributes lineTotal and reversal to lineItems
    const lineTotal = this.calculateLineTotal(lineItem);
    return {
      ...lineItem,
      lineTotal,
      quantity: quantity ? new Decimal(quantity) : null,
      percentage: percentage ? new Decimal(percentage) : null,
      reversal: false,
    };
  });
  return lineItemsWithTotals;
};

/**
 * Check if commission object has percentage property defined.
 * @param {Object} commission object potentially containing percentage property.
 * @returns boolean
 */
exports.hasCommissionPercentage = commission => {
  const percentage = commission?.percentage;
  const isDefined = percentage != null;
  const isNumber = typeof percentage === 'number' && !isNaN(percentage);
  if (isDefined && !isNumber) {
    throw new Error(`${percentage} is not a number.`);
  }

  // Only create a line item if the percentage is set to be more than zero
  const isMoreThanZero = percentage > 0;
  return isDefined && isMoreThanZero;
};
