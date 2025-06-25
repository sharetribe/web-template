import loadable from '@loadable/component';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { injectIntl } from '../../../util/reactIntl';
import { LINE_ITEM_FIXED, TIME_SLOT_TIME } from '../../../util/types';

import PriceVariantPicker from '../PriceVariantPicker/PriceVariantPicker';

const BookingFixedDurationForm = loadable(() =>
  import(/* webpackChunkName: "BookingFixedDurationForm" */ './BookingFixedDurationForm')
);

const { UUID, Money } = sdkTypes;

const today = new Date();
const currentYear = today.getUTCFullYear();
const m = today.getUTCMonth() + 1;
const currentMonth = m < 10 ? `0${m}` : m;

const timeSlots = [
  {
    id: new UUID(1),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-14T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-14T10:00:00Z`),
      seats: 1,
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(2),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-14T16:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-14T20:00:00Z`),
      seats: 1,
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(3),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-20T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-22T18:00:00Z`),
      seats: 1,
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(4),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-17T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-17T18:00:00Z`),
      seats: 1,
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(5),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-28T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth + 1}-03T18:00:00Z`),
      seats: 1,
      type: TIME_SLOT_TIME,
    },
  },
];

const monthlyId = `${currentYear}-${currentMonth}`;
const monthlyTimeSlots = {
  [monthlyId]: {
    timeSlots,
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
  },
};
const timeSlotsForDate = {
  [`${currentYear}-${currentMonth}-14`]: {
    timeSlots: [timeSlots[0], timeSlots[1]],
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
    fetchedAt: new Date().getTime(),
  },
  [`${currentYear}-${currentMonth}-20`]: {
    timeSlots: [timeSlots[2]],
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
    fetchedAt: new Date().getTime(),
  },
  [`${currentYear}-${currentMonth}-21`]: {
    timeSlots: [timeSlots[2]],
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
    fetchedAt: new Date().getTime(),
  },
  [`${currentYear}-${currentMonth}-22`]: {
    timeSlots: [timeSlots[2]],
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
    fetchedAt: new Date().getTime(),
  },
};

const priceVariants = [
  {
    // price: new Money(1000, 'USD'),
    priceInSubUnits: 1000,
    bookingLengthInMinutes: 30,
  },
];

export const Form = {
  component: injectIntl(BookingFixedDurationForm),
  props: {
    formId: 'OrderPanelBookingTimeFormExample',
    listingId: new UUID('listing.id'),
    unitType: LINE_ITEM_FIXED,
    monthlyTimeSlots,
    timeSlotsForDate,
    seatsEnabled: false,
    startTimeInterval: 'quarterHour',
    priceVariants,
    priceVariantFieldComponent: PriceVariantPicker,
    startDatePlaceholder: new Date(2022, 3, 14).toString(),
    endDatePlaceholder: new Date(2022, 3, 14).toString(),
    // override initialValues prop that's set inside BookingFixedDurationForm
    initialValues: {
      bookingStartDate: { date: new Date(Date.UTC(currentYear, today.getUTCMonth(), 14)) },
      priceVariant: priceVariants[0],
    },
    onSubmit: values => {
      console.log('Submit BookingTimeForm with values:', values);
    },
    onFetchTimeSlots: () => Promise.resolve(() => console.log('onFetchTimeSlots called')),
    fetchLineItemsInProgress: false,
    onFetchTransactionLineItems: params => {
      console.log(
        'Call to onFetchTransactionLineItems with params:',
        JSON.stringify(params, null, 2)
      );
    },
    price: new Money(1099, 'USD'),
    timeZone: 'Etc/UTC',
    marketplaceName: 'MarketplaceX',
    dayCountAvailableForBooking: 90,
  },
  group: 'forms',
};
