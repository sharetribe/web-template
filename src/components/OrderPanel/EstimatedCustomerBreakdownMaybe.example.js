import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';

import EstimatedCustomerBreakdownMaybe from './EstimatedCustomerBreakdownMaybe';

const { Money } = sdkTypes;
const CURRENCY = 'USD';
const marketplaceName = 'MarketplaceX';
const processName = 'default-booking';

export const EmptyWithoutDatesOrLineItems = {
  component: EstimatedCustomerBreakdownMaybe,
  props: {
    marketplaceName,
    processName,
  },
  group: 'payment',
};

export const EmptyWithoutDates = {
  component: EstimatedCustomerBreakdownMaybe,
  props: {
    marketplaceName,
    processName,
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
  },
  group: 'payment',
};

export const EmptyWithoutLineItems = {
  component: EstimatedCustomerBreakdownMaybe,
  props: {
    marketplaceName,
    processName,
    breakdownData: {
      startDate: new Date(Date.UTC(2017, 3, 14)),
      endDate: new Date(Date.UTC(2017, 3, 15)),
    },
  },
  group: 'payment',
};

export const BookingSingleDay = {
  component: EstimatedCustomerBreakdownMaybe,
  props: {
    marketplaceName,
    processName,
    breakdownData: {
      startDate: new Date(Date.UTC(2017, 3, 14)),
      endDate: new Date(Date.UTC(2017, 3, 15)),
    },
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
  },
  group: 'payment',
};

export const BookingMultipleNights = {
  component: EstimatedCustomerBreakdownMaybe,
  props: {
    marketplaceName,
    processName,
    breakdownData: {
      startDate: new Date(Date.UTC(2017, 3, 14)),
      endDate: new Date(Date.UTC(2017, 3, 16)),
    },
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
  },
  group: 'payment',
};

export const BookingUnits = {
  component: EstimatedCustomerBreakdownMaybe,
  props: {
    marketplaceName,
    processName,
    breakdownData: {
      startDate: new Date(Date.UTC(2017, 3, 14)),
      endDate: new Date(Date.UTC(2017, 3, 16)),
    },
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
  },
  group: 'payment',
};

export const OrderProductWithShipping = {
  component: EstimatedCustomerBreakdownMaybe,
  props: {
    marketplaceName,
    processName,
    breakdownData: {},
    lineItems: [
      {
        code: 'line-item/item',
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
  },
  group: 'payment',
};

export const OrderProductWithPickup = {
  component: EstimatedCustomerBreakdownMaybe,
  props: {
    marketplaceName,
    processName,
    breakdownData: {},
    lineItems: [
      {
        code: 'line-item/item',
        includeFor: ['customer', 'provider'],
        quantity: new Decimal(2),
        unitPrice: new Money(4500, CURRENCY),
        lineTotal: new Money(9000, CURRENCY),
        reversal: false,
      },
      {
        code: 'line-item/pickup-fee',
        includeFor: ['customer', 'provider'],
        quantity: new Decimal(1),
        unitPrice: new Money(0, CURRENCY),
        lineTotal: new Money(0, CURRENCY),
        reversal: false,
      },
    ],
  },
  group: 'payment',
};
