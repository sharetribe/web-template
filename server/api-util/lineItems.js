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
 * Get quantity for fixed bookings with seats.
 * @param {Object} orderData
 * @param {number} [orderData.seats]
 */
const getFixedQuantityAndLineItems = orderData => {
  const { seats } = orderData || {};
  const hasSeats = !!seats;
  // If there are seats, the quantity is split to factors: units and seats.
  // E.g. 1 session x 2 seats (aka unit price is multiplied by 2)
  return hasSeats ? { units: 1, seats, extraLineItems: [] } : { quantity: 1, extraLineItems: [] };
};

/**
 * Get quantity for arbitrary units for time-based bookings.
 *
 * @param {Object} orderData
 * @param {string} orderData.bookingStart
 * @param {string} orderData.bookingEnd
 * @param {number} [orderData.seats]
 */
const getHourQuantityAndLineItems = orderData => {
  const { bookingStart, bookingEnd, seats } = orderData || {};
  const hasSeats = !!seats;
  const units =
    bookingStart && bookingEnd ? calculateQuantityFromHours(bookingStart, bookingEnd) : null;

  // If there are seats, the quantity is split to factors: units and seats.
  // E.g. 3 hours x 2 seats (aka unit price is multiplied by 6)
  return hasSeats ? { units, seats, extraLineItems: [] } : { quantity: units, extraLineItems: [] };
};

/**
 * Calculate quantity based on days or nights between given bookingDates.
 *
 * @param {Object} orderData
 * @param {string} orderData.bookingStart
 * @param {string} orderData.bookingEnd
 * @param {number} [orderData.seats]
 * @param {'line-item/day' | 'line-item/night'} code
 */
const getDateRangeQuantityAndLineItems = (orderData, code) => {
  const { bookingStart, bookingEnd, seats } = orderData;
  const hasSeats = !!seats;
  const units =
    bookingStart && bookingEnd ? calculateQuantityFromDates(bookingStart, bookingEnd, code) : null;

  // If there are seats, the quantity is split to factors: units and seats.
  // E.g. 3 nights x 4 seats (aka unit price is multiplied by 12)
  return hasSeats ? { units, seats, extraLineItems: [] } : { quantity: units, extraLineItems: [] };
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
 * @param {Object} customerCommission
 * @returns {Array} lineItems
 */
exports.transactionLineItems = (listing, orderData, providerCommission, customerCommission) => {
  const { publicData, price: flatPrice } = listing.attributes;
  const unitType = publicData.unitType;
  const currency = flatPrice.currency;

  // Ensure 3-night minimum
  const { bookingStart, bookingEnd } = orderData || {};
  const startDate = new Date(bookingStart);
  const endDate = new Date(bookingEnd);
  const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Add debug logging
  console.log('🕓 Booking dates debug:');
  console.log('📅 bookingStart (raw):', bookingStart);
  console.log('📅 bookingEnd (raw):', bookingEnd);
  console.log('📆 Parsed startDate:', startDate);
  console.log('📆 Parsed endDate:', endDate);
  console.log('🌙 Calculated nights:', nights);

  if (nights < 3) {
    throw new Error('Minimum booking is 3 nights');
  }

  // Calculate base per-day rate from flat price (3-night value)
  const basePerDay = Math.round(flatPrice.amount / 3);
  const unitPrice = new Money(basePerDay, currency);

  const order = {
    code: 'line-item/day',
    unitPrice,
    quantity: nights,
    includeFor: ['customer', 'provider'],
  };

  // Calculate discount
  let discountPercent = 0;
  let discountCode = '';
  if (nights >= 4 && nights <= 5) {
    discountPercent = 0.25;
    discountCode = 'line-item/discount-25';
  } else if (nights >= 6 && nights <= 7) {
    discountPercent = 0.4;
    discountCode = 'line-item/discount-40';
  } else if (nights >= 8) {
    discountPercent = 0.5;
    discountCode = 'line-item/discount-50';
  }

  const discountLineItem = discountPercent > 0 ? {
    code: discountCode,
    unitPrice: new Money(-Math.round(unitPrice.amount * nights * discountPercent), currency),
    quantity: 1,
    includeFor: ['customer']
  } : null;

  const getNegation = percentage => -1 * percentage;

  const providerCommissionMaybe = hasCommissionPercentage(providerCommission)
    ? [{
        code: 'line-item/provider-commission',
        unitPrice: calculateTotalFromLineItems([order]),
        percentage: getNegation(providerCommission.percentage),
        includeFor: ['provider'],
      }]
    : [];

  const customerCommissionMaybe = hasCommissionPercentage(customerCommission)
    ? [{
        code: 'line-item/customer-commission',
        unitPrice: calculateTotalFromLineItems([order]),
        percentage: customerCommission.percentage,
        includeFor: ['customer'],
      }]
    : [];

  // Final lineItems array: only order, discount (if any), and commission line items (no extraLineItems).
  const lineItems = [
    order,
    ...(discountLineItem ? [discountLineItem] : []),
    ...providerCommissionMaybe,
    ...customerCommissionMaybe
  ];

  console.log('🧾 Final line items:', lineItems);

  return lineItems;
};
