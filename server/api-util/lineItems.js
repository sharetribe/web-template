const {
  calculateQuantityFromDates,
  calculateTotalFromLineItems,
  calculateShippingFee,
} = require('./lineItemHelpers');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

// This unit type needs to be one of the following:
// line-item/night, line-item/day or line-item/units
const lineItemUnitType = 'line-item/units';
const PROVIDER_COMMISSION_PERCENTAGE = -10;

/** Returns collection of lineItems (max 50)
 *
 * Each line items has following fields:
 * - `code`: string, mandatory, indentifies line item type (e.g. \"line-item/cleaning-fee\"), maximum length 64 characters.
 * - `unitPrice`: money, mandatory
 * - `lineTotal`: money
 * - `quantity`: number
 * - `percentage`: number (e.g. 15.5 for 15.5%)
 * - `seats`: number
 * - `units`: number
 * - `includeFor`: array containing strings \"customer\" or \"provider\", default [\":customer\"  \":provider\" ]
 *
 * Line item must have either `quantity` or `percentage` or both `seats` and `units`.
 *
 * `includeFor` defines commissions. Customer commission is added by defining `includeFor` array `["customer"]` and provider commission by `["provider"]`.
 *
 * @param {Object} listing
 * @param {Object} orderData
 * @returns {Array} lineItems
 */
exports.transactionLineItems = (listing, orderData) => {
  const publicData = listing.attributes.publicData;
  const unitPrice = listing.attributes.price;
  const currency = unitPrice.currency;

  // Check delivery method and shipping prices
  const deliveryMethod = orderData && orderData.deliveryMethod;
  const isShipping = deliveryMethod === 'shipping';
  const isPickup = deliveryMethod === 'pickup';
  const shippingPriceInSubunitsOneItem = publicData && publicData.shippingPriceInSubunitsOneItem;
  const shippingPriceInSubunitsAdditionalItems =
    publicData && publicData.shippingPriceInSubunitsAdditionalItems;

  // stockReservationQuantity is used with stock management
  const hasStockReservationQuantity = orderData && orderData.stockReservationQuantity;
  // quantity is used with bookings (time-based process: e.g. units: hours, quantity: 5)
  const hasQuantity = orderData && orderData.quantity;
  // bookingStart & bookingend are used with day-based bookings (how many days / nights)
  const { bookingStart, bookingEnd } = orderData || {};
  const shouldCalculateQuantityFromDates =
    bookingStart && bookingEnd && ['line-item/day', 'line-item/night'].includes(lineItemUnitType);

  // Throw error if there is no quantity information given
  const hasQuantityInformation =
    hasStockReservationQuantity || hasQuantity || shouldCalculateQuantityFromDates;
  if (!hasQuantityInformation) {
    const message = `Error: transition should contain quantity information: 
      stockReservationQuantity, quantity, or bookingStart & bookingEnd (if "line-item/day" or "line-item/night" is used)`;
    const error = new Error(message);
    error.status = 400;
    error.statusText = message;
    error.data = {};
    throw error;
  }

  // Quantity for line-items
  // Note: this uses ternary as conditional chain
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator#conditional_chains
  const orderQuantity = hasStockReservationQuantity
    ? orderData.stockReservationQuantity
    : hasQuantity
    ? orderData.quantity
    : shouldCalculateQuantityFromDates
    ? calculateQuantityFromDates(bookingStart, bookingEnd, lineItemUnitType)
    : 1;

  /**
   * If you want to use pre-defined component and translations for printing the lineItems base price for order,
   * you should use one of the codes:
   * line-item/night, line-item/day or line-item/units.
   *
   * Pre-definded commission components expects line item code to be one of the following:
   * 'line-item/provider-commission', 'line-item/customer-commission'
   *
   * By default OrderBreakdown prints line items inside LineItemUnknownItemsMaybe if the lineItem code is not recognized. */

  const order = {
    code: lineItemUnitType,
    unitPrice,
    quantity: orderQuantity,
    includeFor: ['customer', 'provider'],
  };

  // Calculate shipping fee if applicable
  const shippingFee = isShipping
    ? calculateShippingFee(
        shippingPriceInSubunitsOneItem,
        shippingPriceInSubunitsAdditionalItems,
        currency,
        orderQuantity
      )
    : null;

  // Add line-item for given delivery method.
  // Note: by default, pickup considered as free.
  const deliveryLineItem = !!shippingFee
    ? [
        {
          code: 'line-item/shipping-fee',
          unitPrice: shippingFee,
          quantity: 1,
          includeFor: ['customer', 'provider'],
        },
      ]
    : isPickup
    ? [
        {
          code: 'line-item/pickup-fee',
          unitPrice: new Money(0, currency),
          quantity: 1,
          includeFor: ['customer', 'provider'],
        },
      ]
    : [];

  const providerCommission = {
    code: 'line-item/provider-commission',
    unitPrice: calculateTotalFromLineItems([order]),
    percentage: PROVIDER_COMMISSION_PERCENTAGE,
    includeFor: ['provider'],
  };

  const lineItems = [order, ...deliveryLineItem, providerCommission];

  return lineItems;
};
