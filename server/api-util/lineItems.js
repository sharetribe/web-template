const {
  calculateQuantityFromDates,
  calculateQuantityFromHours,
  calculateTotalFromLineItems,
  calculateShippingFee,
  hasCommissionPercentage,
} = require('./lineItemHelpers');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

/**
 * Get quantity and add extra line-items that are related to delivery method
 *
 * @param {Object} orderData should contain stockReservationQuantity and deliveryMethod
 * @param {*} publicData should contain shipping prices
 * @param {*} currency should point to the currency of listing's price.
 */
const getItemQuantityAndLineItems = (orderData, publicData, currency) => {
  // Check delivery method and shipping prices
  const quantity = orderData ? orderData.stockReservationQuantity : null;
  const deliveryMethod = orderData && orderData.deliveryMethod;
  const isShipping = deliveryMethod === 'shipping';
  const isPickup = deliveryMethod === 'pickup';
  const { shippingPriceInSubunitsOneItem, shippingPriceInSubunitsAdditionalItems } =
    publicData || {};

  // Calculate shipping fee if applicable
  const shippingFee = isShipping
    ? calculateShippingFee(
        shippingPriceInSubunitsOneItem,
        shippingPriceInSubunitsAdditionalItems,
        currency,
        quantity
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

  return { quantity, extraLineItems: deliveryLineItem };
};

/**
 * Get quantity for arbitrary units for time-based bookings.
 *
 * @param {*} orderData should contain quantity
 */
const getHourQuantityAndLineItems = orderData => {
  const { bookingStart, bookingEnd } = orderData || {};
  const quantity =
    bookingStart && bookingEnd ? calculateQuantityFromHours(bookingStart, bookingEnd) : null;

  return { quantity, extraLineItems: [] };
};

/**
 * Calculate quantity based on days or nights between given bookingDates.
 *
 * @param {*} orderData should contain bookingDates
 * @param {*} code should be either 'line-item/day' or 'line-item/night'
 */
const getDateRangeQuantityAndLineItems = (orderData, code) => {
  // bookingStart & bookingend are used with day-based bookings (how many days / nights)
  const { bookingStart, bookingEnd } = orderData || {};
  const quantity =
    bookingStart && bookingEnd ? calculateQuantityFromDates(bookingStart, bookingEnd, code) : null;

  return { quantity, extraLineItems: [] };
};

/**
 * Returns collection of lineItems (max 50)
 *
 * All the line-items dedicated to _customer_ define the "payin total".
 * Similarly, the sum of all the line-items included for _provider_ create "payout total".
 * Platform gets the commission, which is the difference between payin and payout totals.
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
 * @param {Object} providerCommission
 * @returns {Array} lineItems
 */
exports.transactionLineItems = (listing, orderData, providerCommission) => {
  const publicData = listing.attributes.publicData;
  const unitPrice = listing.attributes.price;
  const currency = unitPrice.currency;

  /**
   * Pricing starts with order's base price:
   * Listing's price is related to a single unit. It needs to be multiplied by quantity
   *
   * Initial line-item needs therefore:
   * - code (based on unitType)
   * - unitPrice
   * - quantity
   * - includedFor
   */

  // Unit type needs to be one of the following:
  // day, night, hour or item
  const unitType = publicData.unitType;
  const code = `line-item/${unitType}`;

  // Here "extra line-items" means line-items that are tied to unit type
  // E.g. by default, "shipping-fee" is tied to 'item' aka buying products.
  const quantityAndExtraLineItems =
    unitType === 'item'
      ? getItemQuantityAndLineItems(orderData, publicData, currency)
      : unitType === 'hour'
      ? getHourQuantityAndLineItems(orderData)
      : ['day', 'night'].includes(unitType)
      ? getDateRangeQuantityAndLineItems(orderData, code)
      : {};

  const { quantity, extraLineItems } = quantityAndExtraLineItems;

  // Throw error if there is no quantity information given
  if (!quantity) {
    const message = `Error: transition should contain quantity information: 
      stockReservationQuantity, quantity, or bookingStart & bookingEnd (if "line-item/day" or "line-item/night" is used)`;
    const error = new Error(message);
    error.status = 400;
    error.statusText = message;
    error.data = {};
    throw error;
  }

  /**
   * If you want to use pre-defined component and translations for printing the lineItems base price for order,
   * you should use one of the codes:
   * line-item/night, line-item/day, line-item/hour or line-item/item.
   *
   * Pre-definded commission components expects line item code to be one of the following:
   * 'line-item/provider-commission', 'line-item/customer-commission'
   *
   * By default OrderBreakdown prints line items inside LineItemUnknownItemsMaybe if the lineItem code is not recognized. */

  const order = {
    code,
    unitPrice,
    quantity,
    includeFor: ['customer', 'provider'],
  };

  // Provider commission reduces the amount of money that is paid out to provider.
  // Therefore, the provider commission line-item should have negative effect to the payout total.
  const getNegation = percentage => {
    return -1 * percentage;
  };

  // Note: extraLineItems for product selling (aka shipping fee)
  //       is not included to commission calculation.
  const providerCommissionMaybe = hasCommissionPercentage(providerCommission)
    ? [
        {
          code: 'line-item/provider-commission',
          unitPrice: calculateTotalFromLineItems([order]),
          percentage: getNegation(providerCommission.percentage),
          includeFor: ['provider'],
        },
      ]
    : [];

  // Let's keep the base price (order) as first line item and provider's commission as last one.
  // Note: the order matters only if OrderBreakdown component doesn't recognize line-item.
  const lineItems = [order, ...extraLineItems, ...providerCommissionMaybe];

  return lineItems;
};
