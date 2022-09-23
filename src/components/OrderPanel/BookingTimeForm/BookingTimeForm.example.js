import loadable from '@loadable/component';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { injectIntl } from '../../../util/reactIntl';
import { LINE_ITEM_HOUR, TIME_SLOT_TIME } from '../../../util/types';

const BookingTimeForm = loadable(() =>
  import(/* webpackChunkName: "BookingTimeForm" */ './BookingTimeForm')
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
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(2),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-14T16:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-14T20:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(3),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-20T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-22T18:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(4),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-17T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-17T18:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(5),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-28T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth + 1}-03T18:00:00Z`),
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

export const Form = {
  component: injectIntl(BookingTimeForm),
  props: {
    formId: 'OrderPanelBookingTimeFormExample',
    listingId: new UUID('listing.id'),
    unitType: LINE_ITEM_HOUR,
    monthlyTimeSlots,
    startDatePlaceholder: new Date(2022, 3, 14).toString(),
    endDatePlaceholder: new Date(2022, 3, 14).toString(),
    initialValues: {
      bookingStartDate: { date: new Date(Date.UTC(currentYear, today.getUTCMonth(), 14)) },
    },
    onSubmit: values => {
      console.log('Submit BookingTimeForm with values:', values);
    },
    onFetchTimeSlots: () => console.log('onFetchTimeSlots called'),
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
