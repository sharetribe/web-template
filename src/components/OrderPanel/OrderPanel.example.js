import React from 'react';

import { types as sdkTypes } from '../../util/sdkLoader';
import { LISTING_STATE_CLOSED, TIME_SLOT_TIME } from '../../util/types';
import { createListing, createUser } from '../../util/testData';

import OrderPanel from './OrderPanel';
import css from './OrderPanelExample.module.css';

const { UUID } = sdkTypes;

const noop = () => null;

const validListingTypes = [
  {
    listingType: 'rent-bicycles-daily',
    transactionType: {
      process: 'default-booking',
      alias: 'default-booking/release-1',
      unitType: 'day',
    },
  },
];

const today = new Date();
const currentYear = today.getUTCFullYear();
const m = (today.getUTCMonth() + 1) % 12;
const currentMonth = m < 10 ? `0${m}` : m;
const mNext = (m + 1) % 12;
const nextMonth = mNext < 10 ? `0${mNext}` : mNext;

const timeSlots = [
  {
    id: new UUID(1),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-14T00:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-17T00:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(2),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-22T00:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-25T00:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(3),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-26T00:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-27T00:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
];

const timeSlotsNextMonth = [
  {
    id: new UUID(4),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${nextMonth}-14T00:00:00Z`),
      end: new Date(`${currentYear}-${nextMonth}-19T00:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(5),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${nextMonth}-22T00:00:00Z`),
      end: new Date(`${currentYear}-${nextMonth}-28T00:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
];

const monthlyId = `${currentYear}-${currentMonth}`;
const nextMonthlyId = `${currentYear}-${nextMonth}`;

const monthlyTimeSlots = {
  [monthlyId]: {
    timeSlots,
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
  },
  [nextMonthlyId]: {
    timeSlots: timeSlotsNextMonth,
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
  },
};

export const Default = {
  component: OrderPanel,
  props: {
    className: css.example,
    marketplaceCurrency: 'USD',
    marketplaceName: 'MarketplaceX',
    dayCountAvailableForBooking: 90,
    listing: createListing('listing_1', {
      availabilityPlan: { timezone: 'Etc/UTC' },
      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
      },
    }),
    validListingTypes,
    author: createUser('AuthorX'),
    onSubmit: values => console.log('Submit:', values),
    title: <span>Booking title</span>,
    subTitle: 'Hosted by Author N',
    authorDisplayName: 'Author Name',
    onManageDisableScrolling: noop,
    onFetchTimeSlots: noop,
    monthlyTimeSlots,
    fetchLineItemsInProgress: false,
    onFetchTransactionLineItems: () => console.log('onFetchTransactionLineItems'),
  },
  group: 'payment',
};

export const WithClosedListing = {
  component: OrderPanel,
  props: {
    className: css.example,
    marketplaceCurrency: 'USD',
    marketplaceName: 'MarketplaceX',
    dayCountAvailableForBooking: 90,
    listing: createListing('listing_1', {
      availabilityPlan: { timezone: 'Etc/UTC' },
      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
      },
      state: LISTING_STATE_CLOSED,
    }),
    validListingTypes,
    author: createUser('AuthorX'),
    onSubmit: values => console.log('Submit:', values),
    title: <span>Booking title</span>,
    subTitle: 'Hosted by Author N',
    authorDisplayName: 'Author Name',
    onManageDisableScrolling: noop,
    onFetchTimeSlots: noop,
    monthlyTimeSlots,
    fetchLineItemsInProgress: false,
    onFetchTransactionLineItems: () => console.log('onFetchTransactionLineItems'),
  },
  group: 'payment',
};
