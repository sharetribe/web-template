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
  const unitPrice = listing.attributes.price;
  const publicData = listing.attributes.publicData;
  const shippingPriceInSubunitsOneItem = publicData && publicData.shippingPriceInSubunitsOneItem;
  const shippingPriceInSubunitsAdditionalItems =
    publicData && publicData.shippingPriceInSubunitsAdditionalItems;
  const currency = unitPrice.currency;
  const hasShippingFee =
    orderData && orderData.deliveryMethod && orderData.deliveryMethod === 'shipping';
  const hasQuantity = orderData && orderData.quantity;
  const { startDate, endDate } = orderData && orderData.bookinDates ? orderData.bookinDates : {};
  const hasBookingDates = startDate && endDate;
  const orderQuantity = hasQuantity
    ? orderData.quantity
    : hasBookingDates
    ? calculateQuantityFromDates(startDate, endDate, lineItemUnitType)
    : 1;

  /**
   * If you want to use pre-defined component and translations for printing the lineItems base price for order,
   * you should use one of the codes:
   * line-item/night, line-item/day or line-item/units.
   *
   * Pre-definded commission components expects line item code to be one of the following:
   * 'line-item/provider-commission', 'line-item/customer-commission'
   *
   * By default BookingBreakdown prints line items inside LineItemUnknownItemsMaybe if the lineItem code is not recognized. */

  const order = {
    code: lineItemUnitType,
    unitPrice,
    quantity: orderQuantity,
    includeFor: ['customer', 'provider'],
  };

  const shippingFee = hasShippingFee
    ? calculateShippingFee(
        shippingPriceInSubunitsOneItem,
        shippingPriceInSubunitsAdditionalItems,
        currency,
        orderQuantity
      )
    : null;
  const shippingFeeLineItem = shippingFee
    ? [
        {
          code: 'line-item/shipping-fee',
          unitPrice: shippingFee,
          quantity: 1,
          includeFor: ['customer', 'provider'],
        },
      ]
    : [];

  const providerCommission = {
    code: 'line-item/provider-commission',
    unitPrice: calculateTotalFromLineItems([order, ...shippingFeeLineItem]),
    percentage: PROVIDER_COMMISSION_PERCENTAGE,
    includeFor: ['provider'],
  };

  const lineItems = [order, ...shippingFeeLineItem, providerCommission];

  return lineItems;
};
