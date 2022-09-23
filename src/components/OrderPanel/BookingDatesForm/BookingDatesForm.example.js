import Decimal from 'decimal.js';
import loadable from '@loadable/component';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { injectIntl } from '../../../util/reactIntl';
import { LINE_ITEM_DAY, LINE_ITEM_NIGHT, TIME_SLOT_TIME } from '../../../util/types';

const BookingDatesForm = loadable(() =>
  import(/* webpackChunkName: "BookingDatesForm" */ './BookingDatesForm')
);

const CURRENCY = 'USD';
const marketplaceName = 'MarketplaceX';
const { Money, UUID } = sdkTypes;

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

const unitPrice = new Decimal(1099);

export const FormWithNightBooking = {
  component: injectIntl(BookingDatesForm),
  props: {
    formId: 'OrderPanelBookingDatesFormExample1',
    listingId: new UUID('listing.id'),
    lineItemUnitType: LINE_ITEM_NIGHT,
    onSubmit: values => {
      console.log('Submit BookingDatesForm with values:', values);
    },
    price: new Money(unitPrice.toNumber(), CURRENCY),
    isOwnListing: false,
    monthlyTimeSlots,
    lineItems: null,

    startDatePlaceholder: 'start date',
    endDatePlaceholder: 'end date',

    fetchLineItemsInProgress: false,
    fetchLineItemsError: null,
    onFetchTransactionLineItems: params =>
      console.log(
        'onFetchTransactionLineItems called with params:',
        JSON.stringify(params, null, 2)
      ),
    onFetchTimeSlots: (listingId, start, end, timeZone) =>
      console.log('onFetchTimeSlots called with args:', listingId, start, end, timeZone),
    timeZone: 'Etc/UTC',
    currency: 'USD',
    marketplaceName,
    dayCountAvailableForBooking: 90,
  },
  group: 'forms',
};

export const FormWithDayBooking = {
  component: injectIntl(BookingDatesForm),
  props: {
    formId: 'OrderPanelBookingDatesFormExample2',
    listingId: new UUID('listing.id'),
    lineItemUnitType: LINE_ITEM_DAY,
    onSubmit: values => {
      console.log('Submit BookingDatesForm with values:', values);
    },
    price: new Money(1099, 'USD'),
    isOwnListing: false,
    monthlyTimeSlots,
    lineItems: null,
    startDatePlaceholder: 'start date',
    endDatePlaceholder: 'end date',

    fetchLineItemsInProgress: false,
    fetchLineItemsError: null,
    onFetchTransactionLineItems: params =>
      console.log(
        'onFetchTransactionLineItems called with params:',
        JSON.stringify(params, null, 2)
      ),
    onFetchTimeSlots: (listingId, start, end, timeZone) =>
      console.log('onFetchTimeSlots called with args:', listingId, start, end, timeZone),
    timeZone: 'Etc/UTC',
    currency: 'USD',
    marketplaceName,
    dayCountAvailableForBooking: 90,
  },
  group: 'forms',
};
