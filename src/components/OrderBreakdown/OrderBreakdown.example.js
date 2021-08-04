import Decimal from 'decimal.js';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  TRANSITION_REQUEST_PAYMENT,
  TRANSITION_CONFIRM_PAYMENT,
  TX_TRANSITION_ACTOR_CUSTOMER,
} from '../../util/transaction';
import {
  LINE_ITEM_DAY,
  LINE_ITEM_NIGHT,
  LINE_ITEM_UNITS,
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
} from '../../util/types';
import config from '../../config';
import OrderBreakdown from './OrderBreakdown';

const { UUID, Money } = sdkTypes;

const CURRENCY = config.currency;

const exampleBooking = attributes => {
  return {
    id: new UUID('example-booking'),
    type: 'booking',
    attributes,
  };
};

const exampleTransaction = params => {
  const created = new Date(Date.UTC(2017, 1, 1));
  const confirmed = new Date(Date.UTC(2017, 1, 1, 0, 1));
  return {
    id: new UUID('example-transaction'),
    type: 'transaction',
    attributes: {
      createdAt: created,
      lastTransitionedAt: created,
      lastTransition: TRANSITION_CONFIRM_PAYMENT,
      transitions: [
        {
          createdAt: created,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          transition: TRANSITION_REQUEST_PAYMENT,
        },
        {
          createdAt: confirmed,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          transition: TRANSITION_CONFIRM_PAYMENT,
        },
      ],

      // payinTotal, payoutTotal, and lineItems required in params
      ...params,
    },
  };
};

export const ProductCheckout = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    unitType: LINE_ITEM_UNITS,
    transaction: exampleTransaction({
      payinTotal: new Money(10000, CURRENCY),
      payoutTotal: new Money(10000, CURRENCY),
      lineItems: [
        {
          code: 'line-item/units',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(1000, CURRENCY),
          lineTotal: new Money(1000, CURRENCY),
          reversal: false,
        },
      ],
    }),
  },
  group: 'payment',
};

export const ProductRefundShipping = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    unitType: LINE_ITEM_UNITS,
    transaction: exampleTransaction({
      payinTotal: new Money(0, CURRENCY),
      payoutTotal: new Money(0, CURRENCY),
      lineItems: [
        {
          code: 'line-item/units',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/units',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(-2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(-9000, CURRENCY),
          reversal: true,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(1),
          unitPrice: new Money(1000, CURRENCY),
          lineTotal: new Money(1000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/shipping-fee',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(-1),
          unitPrice: new Money(1000, CURRENCY),
          lineTotal: new Money(-1000, CURRENCY),
          reversal: true,
        },
      ],
    }),
  },
  group: 'payment',
};
export const ProductRefundPickup = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    unitType: LINE_ITEM_UNITS,
    transaction: exampleTransaction({
      payinTotal: new Money(0, CURRENCY),
      payoutTotal: new Money(0, CURRENCY),
      lineItems: [
        {
          code: 'line-item/units',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(9000, CURRENCY),
          reversal: false,
        },
        {
          code: 'line-item/units',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(-2),
          unitPrice: new Money(4500, CURRENCY),
          lineTotal: new Money(-9000, CURRENCY),
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
    unitType: LINE_ITEM_NIGHT,
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
    unitType: LINE_ITEM_NIGHT,
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
    unitType: LINE_ITEM_NIGHT,
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
    unitType: LINE_ITEM_NIGHT,
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
    unitType: LINE_ITEM_NIGHT,
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
    unitType: LINE_ITEM_NIGHT,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      lastTransition: TRANSITION_CONFIRM_PAYMENT,
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
    unitType: LINE_ITEM_DAY,
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
    unitType: LINE_ITEM_DAY,
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

export const BookingWithUnitsType = {
  component: OrderBreakdown,
  props: {
    userRole: 'customer',
    unitType: LINE_ITEM_UNITS,
    dateType: DATE_TYPE_DATETIME,
    transaction: exampleTransaction({
      payinTotal: new Money(9000, CURRENCY),
      payoutTotal: new Money(9000, CURRENCY),
      lineItems: [
        {
          code: 'line-item/units',
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
    unitType: LINE_ITEM_NIGHT,
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
    unitType: LINE_ITEM_NIGHT,
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
