import Decimal from 'decimal.js';
import { types as sdkTypes } from './sdkLoader';
import { daysBetween, getStartOf } from './dates';
import { LISTING_STATE_PUBLISHED, TIME_SLOT_TIME } from './types';
import { TX_TRANSITION_ACTOR_CUSTOMER, getProcess } from '../transactions/transaction';

const { UUID, LatLng, Money } = sdkTypes;
const processTransitions = getProcess('default-purchase')?.transitions;

// Create a booking that conforms to the util/types booking schema
export const createBooking = (id, attributes = {}) => {
  const start = attributes.start || new Date(Date.UTC(2017, 5, 10));
  const end = attributes.end || new Date(Date.UTC(2017, 5, 10));
  return {
    id: new UUID(id),
    type: 'booking',
    attributes: {
      start,
      displayStart: start,
      end,
      displayEnd: end,
      ...attributes,
    },
  };
};

// Create a stripeAccount that conforms to the util/types stripeAccount schema
export const createStripeAccount = (id, attributes = {}) => ({
  id: new UUID(id),
  type: 'stripeAccount',
  attributes: {
    stripeAccountId: 'acc_testiaccountid',
    ...attributes,
  },
});

// Create a user that conforms to the util/types user schema
export const createUser = (id, attributes = {}) => ({
  id: new UUID(id),
  type: 'user',
  attributes: {
    banned: false,
    deleted: false,
    profile: {
      displayName: `${id} display name`,
      abbreviatedName: 'TT',
    },
    ...attributes,
  },
});

// Create a user that conforms to the util/types currentUser schema
export const createCurrentUser = (id, attributes = {}, includes = {}) => ({
  id: new UUID(id),
  type: 'currentUser',
  attributes: {
    banned: false,
    deleted: false,
    email: `${id}@example.com`,
    emailVerified: true,
    profile: {
      firstName: `${id} first name`,
      lastName: `${id} last name`,
      displayName: `${id} display name`,
      abbreviatedName: `${id} abbreviated name`,
    },
    state: 'active',
    ...attributes,
  },
  effectivePermissionSet: {
    id: new UUID('test-effectivePermissionSet'),
    attributes: {
      postListings: 'permission/allow',
    },
  },
  ...includes,
});

// Create a user that conforms to the util/types user schema
export const createImage = id => ({
  id: new UUID(id),
  type: 'image',
  attributes: {
    variants: {
      // TODO: add all possible variants here
      square: {
        name: 'square',
        height: 408,
        width: 408,
        url: 'https://picsum.photos/408/408/',
      },
      square2x: {
        name: 'square2x',
        height: 816,
        width: 816,
        url: 'https://picsum.photos/816/816/',
      },
    },
  },
});

// Create a user that conforms to the util/types listing schema
export const createListing = (id, attributes = {}, includes = {}) => ({
  id: new UUID(id),
  type: 'listing',
  attributes: {
    title: `${id} title`,
    description: `${id} description`,
    geolocation: new LatLng(40, 60),
    deleted: false,
    state: LISTING_STATE_PUBLISHED,
    price: new Money(5500, 'USD'),
    availabilityPlan: {
      type: 'availability-plan/time',
      timezone: 'Etc/UTC',
    },
    publicData: {},
    ...attributes,
  },
  ...includes,
});

// Create a user that conforms to the util/types ownListing schema
export const createOwnListing = (id, attributes = {}, includes = {}) => ({
  id: new UUID(id),
  type: 'ownListing',
  attributes: {
    title: `${id} title`,
    description: `${id} description`,
    geolocation: new LatLng(40, 60),
    deleted: false,
    state: LISTING_STATE_PUBLISHED,
    price: new Money(5500, 'USD'),
    availabilityPlan: {
      type: 'availability-plan/time',
      timezone: 'Etc/UTC',
      entries: [
        { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
        { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
        { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
        { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
        { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
        { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
        { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 1 },
      ],
    },
    publicData: {},
    ...attributes,
  },
  ...includes,
});

export const createStock = (id, attributes = {}) => {
  return {
    id: new UUID(id),
    type: 'stock',
    attributes: {
      quantity: 10,
      ...attributes,
    },
  };
};

export const createTxTransition = options => {
  return {
    createdAt: new Date(Date.UTC(2017, 4, 1)),
    by: TX_TRANSITION_ACTOR_CUSTOMER,
    transition: processTransitions.REQUEST_PAYMENT,
    ...options,
  };
};

export const createTransaction = options => {
  const {
    id,
    processName = 'default-purchase',
    processVersion = 1,
    lastTransition = processTransitions.CONFIRM_PAYMENT,
    total = new Money(1000, 'USD'),
    commission = new Money(100, 'USD'),
    booking = null,
    listing = null,
    customer = null,
    provider = null,
    reviews = [],
    lastTransitionedAt = new Date(Date.UTC(2017, 5, 1)),
    transitions = [
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: TX_TRANSITION_ACTOR_CUSTOMER,
        transition: processTransitions.REQUEST_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1, 0, 0, 1)),
        by: TX_TRANSITION_ACTOR_CUSTOMER,
        transition: processTransitions.CONFIRM_PAYMENT,
      }),
    ],
    lineItems: lineItemsParam,
  } = options;

  const dayCount = booking ? daysBetween(booking.attributes.start, booking.attributes.end) : 1;
  const lineItems = lineItemsParam
    ? lineItemsParam
    : [
        {
          code: 'line-item/item',
          includeFor: ['customer', 'provider'],
          quantity: new Decimal(dayCount),
          unitPrice: new Money(total.amount / dayCount, total.currency),
          lineTotal: total,
          reversal: false,
        },
        {
          code: 'line-item/provider-commission',
          includeFor: ['provider'],
          unitPrice: new Money(commission.amount * -1, commission.currency),
          lineTotal: new Money(commission.amount * -1, commission.currency),
          reversal: false,
        },
      ];

  return {
    id: new UUID(id),
    type: 'transaction',
    attributes: {
      createdAt: new Date(Date.UTC(2017, 4, 1)),
      processName,
      processVersion,
      lastTransitionedAt,
      lastTransition,
      payinTotal: total,
      payoutTotal: new Money(total.amount - commission.amount, total.currency),
      transitions,
      lineItems,
    },
    booking,
    listing,
    customer,
    provider,
    reviews,
  };
};

export const createMessage = (id, attributes = {}, includes = {}) => {
  return {
    id: new UUID(id),
    type: 'message',
    attributes: {
      createdAt: new Date(Date.UTC(2017, 10, 9, 8, 12)),
      content: `Message ${id}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      ...attributes,
    },
    ...includes,
  };
};

export const createReview = (id, attributes = {}, includes = {}) => {
  return {
    id: new UUID(id),
    attributes: {
      createdAt: new Date(),
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      rating: 3,
      state: 'public',
      type: 'ofProvider',
      ...attributes,
    },
    ...includes,
  };
};

/**
 * Creates an array of time slot objects.
 *
 * @param {Date} startDate date when the time slots start
 * @param {Number} numberOfDays number of time slots to create
 *
 * @return {Array} array of time slots
 */
export const createTimeSlots = (startDate, numberOfDays) => {
  return Array.from({ length: numberOfDays }, (v, i) => i).map(i => {
    return {
      id: new UUID(i),
      type: 'timeSlot',
      attributes: {
        start: getStartOf(startDate, 'day', 'Etc/UTC', i, 'days'),
        end: getStartOf(startDate, 'day', 'Etc/UTC', i + 1, 'days'),
        type: TIME_SLOT_TIME,
      },
    };
  });
};

// Default config for currency formatting in tests and examples.
export const currencyConfig = {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'symbol',
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const pad = num => {
  return num >= 0 && num < 10 ? `0${num}` : `${num}`;
};

// Create fake Internalization object to help with shallow rendering.
export const fakeIntl = {
  formatDate: d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  formatDateTimeRange: (start, end) =>
    `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(
      start.getUTCDate()
    )} - ${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
  formatMessage: msg => msg.id,
  formatNumber: d => `${d}`,
  formatPlural: d => d,
  formatRelativeTime: d => d,
  formatTime: d => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  now: () => Date.UTC(2017, 10, 23, 12, 59),
  messages: {},
};

const noop = () => null;

export const fakeFormProps = {
  anyTouched: false,
  asyncValidating: false,
  dirty: false,
  form: 'fakeTestForm',
  invalid: false,
  pristine: true,
  clearSubmit: noop,
  touch: noop,
  untouch: noop,
  submit: noop,
  reset: noop,
  resetSection: noop,
  initialize: noop,
  handleSubmit: noop,
  destroy: noop,
  clearAsyncError: noop,
  clearFields: noop,
  clearSubmitErrors: noop,
  change: noop,
  blur: noop,
  autofill: noop,
  asyncValidate: noop,
  valid: true,
  submitSucceeded: false,
  submitFailed: false,
  submitting: false,
  pure: true,
  initialized: true,
};

// Create fake viewport to help with shallow rendering
export const fakeViewport = {
  width: 2100,
  height: 1339,
};
