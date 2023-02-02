import Decimal from 'decimal.js';
import { types as sdkTypes } from '../../util/sdkLoader';
import { DATE_TYPE_DATE, DATE_TYPE_DATETIME } from '../../util/types';
import { TX_TRANSITION_ACTOR_CUSTOMER, getProcess } from '../../transactions/transaction';

import OrderBreakdown from './OrderBreakdown';

const { UUID, Money } = sdkTypes;

const CURRENCY = 'USD';
const marketplaceName = 'MarketplaceX';

const exampleBooking = attributes => {
  return {
    id: new UUID('example-booking'),
    type: 'booking',
    attributes,
  };
};

const processName = 'default-purchase';
const transitions = getProcess(processName)?.transitions;

const exampleTransaction = params => {
  const created = new Date(Date.UTC(2017, 1, 1));
  const confirmed = new Date(Date.UTC(2017, 1, 1, 0, 1));
  return {
    id: new UUID('example-transaction'),
    type: 'transaction',
    attributes: {
      createdAt: created,
      processName,
      lastTransitionedAt: created,
      lastTransition: transitions.CONFIRM_PAYMENT,
      transitions: [
        {
          createdAt: created,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          transition: transitions.REQUEST_PAYMENT,
        },
        {
          createdAt: confirmed,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          transition: transitions.CONFIRM_PAYMENT,
        },
      ],

      // payinTotal, payoutTotal, and lineItems required in params
      ...params,
    },
  };
};

const unitPrice = new Decimal(4500);
const quantity = new Decimal(2);
const basePrice = unitPrice.times(quantity);
const fee = basePrice.dividedBy(10).times(-1);
const shipping = new Decimal(1000);

export const ProductShippingCustomer = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    transaction: exampleTransaction({
      payinTotal: new Money(basePrice.plus(shipping), CURRENCY),
      payoutTotal: new Money(
        basePrice
          .plus(shipping)
          .plus(fee)
          .toNumber(),
        CURRENCY
      ),
      lineItems: [
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(shipping, CURRENCY),
          lineTotal: new Money(shipping, CURRENCY),
          reversal: false,
        },
      ],
    }),
  },
  group: 'payment',
};

export const ProductShippingProvider = {
  component: OrderBreakdown,
  props: {
    userRole: 'provider',
    marketplaceName,
    transaction: exampleTransaction({
      payinTotal: new Money(basePrice.plus(shipping), CURRENCY),
      payoutTotal: new Money(
        basePrice
          .plus(shipping)
          .plus(fee)
          .toNumber(),
        CURRENCY
      ),
      lineItems: [
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(shipping, CURRENCY),
          lineTotal: new Money(shipping, CURRENCY),
          reversal: false,
        },
      ],
    }),
  },
  group: 'payment',
};

export const ProductRefundShippingCustomer = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    transaction: exampleTransaction({
      payinTotal: new Money(0, CURRENCY),
      payoutTotal: new Money(0, CURRENCY),
      lineItems: [
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.times(-1).toNumber(), CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.times(-1).toNumber(), CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(shipping, CURRENCY),
          lineTotal: new Money(shipping, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(shipping, CURRENCY),
          lineTotal: new Money(shipping.times(-1), CURRENCY),
          reversal: true,
        },
      ],
    }),
  },
  group: 'payment',
};

export const ProductRefundShippingProvider = {
  component: OrderBreakdown,
  props: {
    userRole: 'provider',
    marketplaceName,
    transaction: exampleTransaction({
      payinTotal: new Money(0, CURRENCY),
      payoutTotal: new Money(0, CURRENCY),
      lineItems: [
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.times(-1).toNumber(), CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.times(-1).toNumber(), CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(shipping, CURRENCY),
          lineTotal: new Money(shipping, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(shipping, CURRENCY),
          lineTotal: new Money(shipping.times(-1), CURRENCY),
          reversal: true,
        },
      ],
    }),
  },
  group: 'payment',
};

export const ProductRefundPickupCustomer = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    transaction: exampleTransaction({
      payinTotal: new Money(0, CURRENCY),
      payoutTotal: new Money(0, CURRENCY),
      lineItems: [
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.times(-1).toNumber(), CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.times(-1).toNumber(), CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/pickup-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(0, CURRENCY),
          lineTotal: new Money(0, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/pickup-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(-1),
          unitPrice: new Money(0, CURRENCY),
          lineTotal: new Money(-0, CURRENCY),
          reversal: true,
        },
      ],
    }),
  },
  group: 'payment',
};

export const ProductRefundPickupProvider = {
  component: OrderBreakdown,
  props: {
    userRole: 'provider',
    marketplaceName,
    transaction: exampleTransaction({
      payinTotal: new Money(0, CURRENCY),
      payoutTotal: new Money(0, CURRENCY),
      lineItems: [
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity,
          unitPrice: new Money(unitPrice.toNumber(), CURRENCY),
          lineTotal: new Money(basePrice.times(-1).toNumber(), CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.toNumber(), CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(fee.toNumber(), CURRENCY),
          lineTotal: new Money(fee.times(-1).toNumber(), CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/pickup-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(0, CURRENCY),
          lineTotal: new Money(0, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/pickup-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(-1),
          unitPrice: new Money(0, CURRENCY),
          lineTotal: new Money(-0, CURRENCY),
          reversal: true,
        },
      ],
    }),
  },
  group: 'payment',
};

export const BookingCheckout = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      payinTotal: new Money(9000, CURRENCY),
      payoutTotal: new Money(9000, CURRENCY),
      lineItems: [
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 16)),
    }),
  },
  group: 'payment',
};

export const BookingCustomerOrder = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      payinTotal: new Money(9000, CURRENCY),
      payoutTotal: new Money(9000, CURRENCY),
      lineItems: [
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 16)),
    }),
  },
  group: 'payment',
};

export const BookingProviderSale = {
  component: OrderBreakdown,
  props: {
    userRole: 'provider',
    marketplaceName,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      payinTotal: new Money(9000, CURRENCY),
      payoutTotal: new Money(7000, CURRENCY),
      lineItems: [
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(-2000, CURRENCY),
          lineTotal: new Money(-2000, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 16)),
    }),
  },
  group: 'payment',
};

export const BookingProviderSaleZeroCommission = {
  component: OrderBreakdown,
  props: {
    userRole: 'provider',
    marketplaceName,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      payinTotal: new Money(9000, CURRENCY),
      payoutTotal: new Money(9000, CURRENCY),
      lineItems: [
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(0, CURRENCY),
          lineTotal: new Money(0, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 16)),
    }),
  },
  group: 'payment',
};

export const BookingProviderSaleSingleNight = {
  component: OrderBreakdown,
  props: {
    userRole: 'provider',
    marketplaceName,
    dateType: DATE_TYPE_DATE,
    transaction: exampleTransaction({
      payinTotal: new Money(4500, CURRENCY),
      payoutTotal: new Money(2500, CURRENCY),
      lineItems: [
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(4500, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(-2000, CURRENCY),
          lineTotal: new Money(-2000, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 15)),
    }),
  },
  group: 'payment',
};

export const BookingProviderSalePreauthorized = {
  component: OrderBreakdown,
  props: {
    userRole: 'provider',
    marketplaceName,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      lastTransition: transitions.CONFIRM_PAYMENT,
      payinTotal: new Money(4500, CURRENCY),
      payoutTotal: new Money(2500, CURRENCY),
      lineItems: [
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(4500, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(-2000, CURRENCY),
          lineTotal: new Money(-2000, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 15)),
    }),
  },
  group: 'payment',
};

export const BookingSingleDay = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    dateType: DATE_TYPE_DATE,
    transaction: exampleTransaction({
      payinTotal: new Money(4500, CURRENCY),
      payoutTotal: new Money(4500, CURRENCY),
      lineItems: [
        {
          code: 'line-item/day',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(4500, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 15)),
    }),
  },
  group: 'payment',
};

export const BookingMultipleDays = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    dateType: DATE_TYPE_DATE,
    transaction: exampleTransaction({
      payinTotal: new Money(9000, CURRENCY),
      payoutTotal: new Money(9000, CURRENCY),
      lineItems: [
        {
          code: 'line-item/day',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 16)),
    }),
  },
  group: 'payment',
};

export const BookingWithItemType = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      payinTotal: new Money(9000, CURRENCY),
      payoutTotal: new Money(9000, CURRENCY),
      lineItems: [
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 18)),
    }),
  },
  group: 'payment',
};

export const BookingCustomPricing = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      payinTotal: new Money(12800, CURRENCY),
      payoutTotal: new Money(12600, CURRENCY),
      lineItems: [
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/car-cleaning',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(5000, CURRENCY),
          lineTotal: new Money(5000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/season-discount',
          includeFor: ['customer', 'provider'],
          percentage: new Decimal(-10),
          unitPrice: new Money(14000, CURRENCY),
          lineTotal: new Money(-1400, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/customer-commission',
          includeFor: ['customer'],
          percentage: new Decimal(10),
          unitPrice: new Money(2000, CURRENCY),
          lineTotal: new Money(200, CURRENCY),
          reversal: false,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 16)),
    }),
  },
  group: 'payment',
};

export const BookingCustomPricingWithRefund = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    marketplaceName,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      payinTotal: new Money(0, CURRENCY),
      payoutTotal: new Money(0, CURRENCY),
      lineItems: [
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/night',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(-2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(-9000, CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/car-cleaning',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(5000, CURRENCY),
          lineTotal: new Money(5000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/car-cleaning',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(-1),
          unitPrice: new Money(5000, CURRENCY),
          lineTotal: new Money(-5000, CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/season-discount',
          includeFor: ['customer', 'provider'],
          percentage: new Decimal(-10),
          unitPrice: new Money(14000, CURRENCY),
          lineTotal: new Money(-1400, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/season-discount',
          includeFor: ['customer', 'provider'],
          percentage: new Decimal(10),
          unitPrice: new Money(14000, CURRENCY),
          lineTotal: new Money(1400, CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/customer-commission',
          includeFor: ['customer'],
          percentage: new Decimal(10),
          unitPrice: new Money(2000, CURRENCY),
          lineTotal: new Money(200, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/customer-commission',
          includeFor: ['customer'],
          percentage: new Decimal(-10),
          unitPrice: new Money(2000, CURRENCY),
          lineTotal: new Money(-200, CURRENCY),
          reversal: true,
        },
      ],
    }),
    booking: exampleBooking({
      start: new Date(Date.UTC(2017, 3, 14)),
      end: new Date(Date.UTC(2017, 3, 16)),
    }),
  },
  group: 'payment',
};
