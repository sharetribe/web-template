/**
 * This module defines custom PropTypes shared within the application.
 *
 * To learn about validating React component props with PropTypes, see:
 *
 *     https://facebook.github.io/react/docs/typechecking-with-proptypes.html
 *
 * For component specific PropTypes, it's perfectly ok to inline them
 * to the component itself. If the type is shared or external (SDK or
 * API), however, it should be in this file for sharing with other
 * components.
 *
 * PropTypes should usually be validated only at the lowest level
 * where the props are used, not along the way in parents that pass
 * along the props to their children. Those parents should usually
 * just validate the presense of the prop key and that the value is
 * defined. This way we get the validation errors only in the most
 * specific place and avoid duplicate errros.
 */
import {
  arrayOf,
  bool,
  func,
  instanceOf,
  node,
  number,
  object,
  objectOf,
  oneOf,
  oneOfType,
  shape,
  string,
} from 'prop-types';
import Decimal from 'decimal.js';
import { types as sdkTypes } from './sdkLoader';
import {
  getAllTransitionsForEveryProcess,
  TX_TRANSITION_ACTORS,
} from '../transactions/transaction';
// NOTE: This file imports ../transactions/transaction.js, which may lead to circular dependency

const { UUID, LatLng, LatLngBounds, Money } = sdkTypes;
const TRANSITIONS = getAllTransitionsForEveryProcess();

// Supported schema types for custom fields added to extended data through configuration.
export const SCHEMA_TYPE_ENUM = 'enum';
export const SCHEMA_TYPE_MULTI_ENUM = 'multi-enum';
export const SCHEMA_TYPE_TEXT = 'text';
export const SCHEMA_TYPE_LONG = 'long';
export const SCHEMA_TYPE_BOOLEAN = 'boolean';
export const SCHEMA_TYPE_YOUTUBE = 'youtubeVideoUrl';
export const EXTENDED_DATA_SCHEMA_TYPES = [
  SCHEMA_TYPE_ENUM,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_LONG,
  SCHEMA_TYPE_BOOLEAN,
  SCHEMA_TYPE_YOUTUBE,
];

const propTypes = {};

// Fixed value
propTypes.value = val => oneOf([val]);

// SDK type instances
propTypes.uuid = instanceOf(UUID);
propTypes.latlng = instanceOf(LatLng);
propTypes.latlngBounds = instanceOf(LatLngBounds);
propTypes.money = instanceOf(Money);

// Configuration for currency formatting
propTypes.currencyConfig = shape({
  style: string.isRequired,
  currency: string.isRequired,
  currencyDisplay: string,
  useGrouping: bool,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
});

// Configuration for a single route
propTypes.route = shape({
  name: string.isRequired,
  path: string.isRequired,
  exact: bool,
  strict: bool,
  component: oneOfType([object, func]).isRequired,
  loadData: func,
});

// Place object from LocationAutocompleteInput
propTypes.place = shape({
  address: string.isRequired,
  origin: propTypes.latlng,
  bounds: propTypes.latlngBounds, // optional viewport bounds
});

// Denormalised image object
propTypes.image = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('image').isRequired,
  attributes: shape({
    variants: objectOf(
      shape({
        width: number.isRequired,
        height: number.isRequired,
        url: string.isRequired,
      })
    ),
  }),
});

// ImageAsset type from Asset Delivery API
propTypes.imageAsset = shape({
  id: string.isRequired,
  type: propTypes.value('imageAsset').isRequired,
  attributes: shape({
    variants: objectOf(
      shape({
        width: number.isRequired,
        height: number.isRequired,
        url: string.isRequired,
      })
    ),
  }),
});

// Denormalised user object
const currentUser = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('currentUser').isRequired,
  attributes: shape({
    banned: bool.isRequired,
    email: string.isRequired,
    emailVerified: bool.isRequired,
    profile: shape({
      firstName: string.isRequired,
      lastName: string.isRequired,
      displayName: string.isRequired,
      abbreviatedName: string.isRequired,
      bio: string,
    }).isRequired,
    stripeConnected: bool,
  }),
  profileImage: propTypes.image,
});
const currentUserBanned = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('currentUser').isRequired,
  attributes: shape({
    banned: propTypes.value(true).isRequired,
  }),
});
const currentUserDeleted = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('currentUser').isRequired,
  attributes: shape({
    deleted: propTypes.value(true).isRequired,
  }),
});
propTypes.currentUser = oneOfType([currentUser, currentUserBanned, currentUserDeleted]);

const userAttributes = shape({
  banned: propTypes.value(false).isRequired,
  deleted: propTypes.value(false).isRequired,
  profile: shape({
    displayName: string.isRequired,
    abbreviatedName: string.isRequired,
    bio: string,
  }),
});

// Listing queries can include author.
// Banned and deleted are not relevant then
// since banned and deleted users can't have listings.
const authorAttributes = shape({
  profile: shape({
    displayName: string.isRequired,
    abbreviatedName: string.isRequired,
    bio: string,
  }),
});

const deletedUserAttributes = shape({
  deleted: propTypes.value(true).isRequired,
});

const bannedUserAttributes = shape({
  banned: propTypes.value(true).isRequired,
});

// Denormalised user object
propTypes.user = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('user').isRequired,
  attributes: oneOfType([
    userAttributes,
    authorAttributes,
    deletedUserAttributes,
    bannedUserAttributes,
  ]).isRequired,
  profileImage: propTypes.image,
});

export const LISTING_STATE_DRAFT = 'draft';
export const LISTING_STATE_PENDING_APPROVAL = 'pendingApproval';
export const LISTING_STATE_PUBLISHED = 'published';
export const LISTING_STATE_CLOSED = 'closed';

const LISTING_STATES = [
  LISTING_STATE_DRAFT,
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_PUBLISHED,
  LISTING_STATE_CLOSED,
];

const listingAttributes = shape({
  title: string.isRequired,
  description: string,
  geolocation: propTypes.latlng,
  deleted: propTypes.value(false),
  state: oneOf(LISTING_STATES),
  price: propTypes.money,
  publicData: object,
});

const AVAILABILITY_PLAN_DAY = 'availability-plan/day';
const AVAILABILITY_PLAN_TIME = 'availability-plan/time';
export const DAYS_OF_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const availabilityPlan = shape({
  type: oneOf([AVAILABILITY_PLAN_DAY, AVAILABILITY_PLAN_TIME]).isRequired,
  timezone: string,
  entries: arrayOf(
    shape({
      dayOfWeek: oneOf(DAYS_OF_WEEK).isRequired,
      seats: number.isRequired,
      start: string,
      end: string,
    })
  ),
});

propTypes.availabilityPlan = availabilityPlan;

const ownListingAttributes = shape({
  title: string.isRequired,
  description: string,
  geolocation: propTypes.latlng,
  deleted: propTypes.value(false).isRequired,
  state: oneOf(LISTING_STATES).isRequired,
  price: propTypes.money,
  availabilityPlan: availabilityPlan,
  publicData: object.isRequired,
});

const deletedListingAttributes = shape({
  deleted: propTypes.value(true).isRequired,
});

// Denormalised listing object
propTypes.listing = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('listing').isRequired,
  attributes: oneOfType([listingAttributes, deletedListingAttributes]).isRequired,
  author: propTypes.user,
  images: arrayOf(propTypes.image),
});

// Denormalised ownListing object
propTypes.ownListing = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('ownListing').isRequired,
  attributes: oneOfType([ownListingAttributes, deletedListingAttributes]).isRequired,
  author: propTypes.currentUser,
  images: arrayOf(propTypes.image),
});

export const BOOKING_STATE_PENDING = 'pending';
export const BOOKING_STATE_ACCEPTED = 'accepted';
export const BOOKING_STATE_DECLINED = 'declined';
export const BOOKING_STATE_CANCELLED = 'cancelled';
export const BOOKING_STATES = [
  BOOKING_STATE_PENDING,
  BOOKING_STATE_ACCEPTED,
  BOOKING_STATE_DECLINED,
  BOOKING_STATE_CANCELLED,
];

// Denormalised booking object
propTypes.booking = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('booking').isRequired,
  attributes: shape({
    end: instanceOf(Date).isRequired,
    start: instanceOf(Date).isRequired,
    displayStart: instanceOf(Date),
    displayEnd: instanceOf(Date),
    state: oneOf(BOOKING_STATES),
  }),
});

// A time slot that covers one day, having a start and end date.
export const TIME_SLOT_TIME = 'time-slot/time';

// Denormalised time slot object
propTypes.timeSlot = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('timeSlot').isRequired,
  attributes: shape({
    type: oneOf([TIME_SLOT_TIME]).isRequired,
    end: instanceOf(Date).isRequired,
    start: instanceOf(Date).isRequired,
  }),
});

// Denormalised availability exception object
propTypes.availabilityException = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('availabilityException').isRequired,
  attributes: shape({
    end: instanceOf(Date).isRequired,
    seats: number.isRequired,
    start: instanceOf(Date).isRequired,
  }),
});

export const STOCK_ONE_ITEM = 'oneItem';
export const STOCK_MULTIPLE_ITEMS = 'multipleItems';
export const STOCK_INFINITE_ONE_ITEM = 'infiniteOneItem';
export const STOCK_INFINITE_MULTIPLE_ITEMS = 'infiniteMultipleItems';
export const STOCK_INFINITE_ITEMS = [STOCK_INFINITE_ONE_ITEM, STOCK_INFINITE_MULTIPLE_ITEMS];
export const STOCK_TYPES = [
  STOCK_ONE_ITEM,
  STOCK_MULTIPLE_ITEMS,
  STOCK_INFINITE_ONE_ITEM,
  STOCK_INFINITE_MULTIPLE_ITEMS,
];

propTypes.transition = shape({
  createdAt: instanceOf(Date).isRequired,
  by: oneOf(TX_TRANSITION_ACTORS).isRequired,
  transition: oneOf(TRANSITIONS).isRequired,
});

// Possible amount of stars in a review
export const REVIEW_RATINGS = [1, 2, 3, 4, 5];

// Review types: review of a provider and of a customer
export const REVIEW_TYPE_OF_PROVIDER = 'ofProvider';
export const REVIEW_TYPE_OF_CUSTOMER = 'ofCustomer';

// A review on a user
propTypes.review = shape({
  id: propTypes.uuid.isRequired,
  attributes: shape({
    createdAt: instanceOf(Date).isRequired,
    content: string,
    rating: oneOf(REVIEW_RATINGS),
    state: string.isRequired,
    type: oneOf([REVIEW_TYPE_OF_PROVIDER, REVIEW_TYPE_OF_CUSTOMER]).isRequired,
  }).isRequired,
  author: propTypes.user,
  subject: propTypes.user,
});

// A Stripe account entity
propTypes.stripeAccount = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('stripeAccount').isRequired,
  attributes: shape({
    stripeAccountId: string.isRequired,
    stripeAccountData: object,
  }),
});

propTypes.defaultPaymentMethod = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('stripePaymentMethod').isRequired,
  attributes: shape({
    type: propTypes.value('stripe-payment-method/card').isRequired,
    stripePaymentMethodId: string.isRequired,
    card: shape({
      brand: string.isRequired,
      expirationMonth: number.isRequired,
      expirationYear: number.isRequired,
      last4Digits: string.isRequired,
    }).isRequired,
  }),
});

export const LINE_ITEM_NIGHT = 'line-item/night';
export const LINE_ITEM_DAY = 'line-item/day';
export const LINE_ITEM_HOUR = 'line-item/hour';
export const LINE_ITEM_ITEM = 'line-item/item';
export const LINE_ITEM_CUSTOMER_COMMISSION = 'line-item/customer-commission';
export const LINE_ITEM_PROVIDER_COMMISSION = 'line-item/provider-commission';
export const LINE_ITEM_SHIPPING_FEE = 'line-item/shipping-fee';
export const LINE_ITEM_PICKUP_FEE = 'line-item/pickup-fee';

export const LINE_ITEMS = [
  LINE_ITEM_NIGHT,
  LINE_ITEM_DAY,
  LINE_ITEM_HOUR,
  LINE_ITEM_ITEM,
  LINE_ITEM_CUSTOMER_COMMISSION,
  LINE_ITEM_PROVIDER_COMMISSION,
  LINE_ITEM_SHIPPING_FEE,
  LINE_ITEM_PICKUP_FEE,
];
export const LISTING_UNIT_TYPES = [LINE_ITEM_NIGHT, LINE_ITEM_DAY, LINE_ITEM_HOUR, LINE_ITEM_ITEM];

propTypes.lineItemUnitType = oneOf(LISTING_UNIT_TYPES);

const requiredLineItemPropType = (props, propName, componentName) => {
  const prop = props[propName];

  if (!prop || prop === '') {
    return new Error(`Missing line item code prop from ${componentName}.`);
  }
  if (!/^line-item\/.+/.test(prop)) {
    return new Error(`Invalid line item code value ${prop} passed to ${componentName}.`);
  }
};

propTypes.lineItems = arrayOf(
  shape({
    code: requiredLineItemPropType,
    includeFor: arrayOf(oneOf(['customer', 'provider'])).isRequired,
    quantity: instanceOf(Decimal),
    unitPrice: propTypes.money.isRequired,
    lineTotal: propTypes.money.isRequired,
    reversal: bool.isRequired,
  })
);

// Denormalised transaction object
propTypes.transaction = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('transaction').isRequired,
  attributes: shape({
    createdAt: instanceOf(Date),
    processName: string.isRequired,
    lastTransitionedAt: instanceOf(Date).isRequired,
    lastTransition: oneOf(TRANSITIONS).isRequired,

    // An inquiry won't need a total sum nor a booking so these are
    // optional.
    payinTotal: propTypes.money,
    payoutTotal: propTypes.money,

    lineItems: propTypes.lineItems,
    transitions: arrayOf(propTypes.transition).isRequired,
  }),
  booking: propTypes.booking,
  listing: propTypes.listing,
  customer: propTypes.user,
  provider: propTypes.user,
  reviews: arrayOf(propTypes.review),
});

// Denormalised transaction message
propTypes.message = shape({
  id: propTypes.uuid.isRequired,
  type: propTypes.value('message').isRequired,
  attributes: shape({
    createdAt: instanceOf(Date).isRequired,
    content: string.isRequired,
  }).isRequired,
  sender: propTypes.user,
});

// Pagination information in the response meta
propTypes.pagination = shape({
  page: number.isRequired,
  perPage: number.isRequired,
  totalItems: number,
  totalPages: number,
});

// Search filter definition
propTypes.filterConfig = arrayOf(
  shape({
    id: string.isRequired,
    label: node,
    type: string.isRequired,
    group: oneOf(['primary', 'secondary']).isRequired,
    queryParamNames: arrayOf(string).isRequired,
    config: object,
  }).isRequired
);

// Default search filters definition
propTypes.defaultFiltersConfig = arrayOf(
  shape({
    key: string.isRequired,
    schemaType: oneOf(['price', 'text', 'dates']).isRequired,
    min: number,
    max: number,
    step: number,
  }).isRequired
);

// Extended data config
propTypes.userType = shape({
  userType: string.isRequired,
  label: string.isRequired,
  defaultUserFields: shape({
    displayName: bool,
    phoneNumber: bool,
  }),
  displayNameSettings: shape({
    displayInSignUp: bool,
    required: bool,
  }),
  phoneNumberSettings: shape({
    displayInSignUp: bool,
    required: bool,
  }),
});
propTypes.userTypes = arrayOf(propTypes.userType);

propTypes.fieldEnumOptions = arrayOf(
  shape({
    option: oneOfType([string, number]).isRequired,
    label: string.isRequired,
  })
);

propTypes.userField = shape({
  key: string.isRequired,
  scope: string,
  schemaType: oneOf(EXTENDED_DATA_SCHEMA_TYPES).isRequired,
  enumOptions: propTypes.fieldEnumOptions,
  showConfig: shape({
    label: string.isRequired,
    displayInProfile: bool,
  }),
  saveConfig: shape({
    label: string.isRequired,
    placeholderMessage: string,
    isRequired: bool,
    requiredMessage: string,
    displayInSignUp: bool,
  }).isRequired,
  userTypeConfig: shape({
    limitToUserTypeIds: bool.isRequired,
    userTypeIds: arrayOf(string),
  }),
});
propTypes.userFields = arrayOf(propTypes.userField);

propTypes.listingType = shape({
  listingType: string.isRequired,
  label: string.isRequired,
  transactionType: shape({
    process: string.isRequired,
    alias: string.isRequired,
    unitType: string.isRequired,
  }).isRequired,
  defaultListingFields: shape({
    price: bool,
    location: bool,
    payoutDetails: bool,
    shipping: bool,
    pickup: bool,
  }),
});
propTypes.listingTypes = arrayOf(propTypes.userType);

propTypes.listingField = shape({
  key: string.isRequired,
  scope: string,
  schemaType: oneOf(EXTENDED_DATA_SCHEMA_TYPES).isRequired,
  enumOptions: propTypes.fieldEnumOptions,
  filterConfig: shape({
    indexForSearch: bool,
    label: string.isRequired,
    group: oneOf(['primary', 'secondary']),
    filterType: string,
  }),
  showConfig: shape({
    label: string.isRequired,
    isDetail: bool,
  }),
  saveConfig: shape({
    label: string.isRequired,
    placeholderMessage: string,
    isRequired: bool,
    requiredMessage: string,
  }).isRequired,
  listingTypeConfig: shape({
    limitToListingTypeIds: bool.isRequired,
    listingTypeIds: arrayOf(string),
  }),
  categoryConfig: shape({
    limitToCategoryIds: bool.isRequired,
    categoryIds: arrayOf(string),
  }),
});

propTypes.listingFields = arrayOf(propTypes.listingField);

const sortConfigOptionWithLabel = shape({
  key: oneOf(['createdAt', '-createdAt', 'price', '-price', 'relevance']).isRequired,
  label: string.isRequired,
  longLabel: string,
});

const sortConfigOptionWithTranslationKey = shape({
  key: oneOf(['createdAt', '-createdAt', 'price', '-price', 'relevance']).isRequired,
  labelTranslationKey: string.isRequired,
  labelTranslationKeyLong: string,
});

propTypes.sortConfig = shape({
  active: bool,
  queryParamName: oneOf(['sort']).isRequired,
  relevanceKey: string.isRequired,
  conflictingFilters: arrayOf(string),
  options: arrayOf(oneOfType([sortConfigOptionWithLabel, sortConfigOptionWithTranslationKey])),
});

export const ERROR_CODE_TRANSACTION_LISTING_NOT_FOUND = 'transaction-listing-not-found';
export const ERROR_CODE_TRANSACTION_INVALID_TRANSITION = 'transaction-invalid-transition';
export const ERROR_CODE_TRANSACTION_ALREADY_REVIEWED_BY_CUSTOMER =
  'transaction-already-reviewed-by-customer';
export const ERROR_CODE_TRANSACTION_ALREADY_REVIEWED_BY_PROVIDER =
  'transaction-already-reviewed-by-provider';
export const ERROR_CODE_TRANSACTION_BOOKING_TIME_NOT_AVAILABLE =
  'transaction-booking-time-not-available';
export const ERROR_CODE_TRANSACTION_LISTING_INSUFFICIENT_STOCK =
  'transaction-listing-insufficient-stock';
export const ERROR_CODE_PAYMENT_FAILED = 'transaction-payment-failed';
export const ERROR_CODE_CHARGE_ZERO_PAYIN = 'transaction-charge-zero-payin';
export const ERROR_CODE_CHARGE_ZERO_PAYOUT = 'transaction-charge-zero-payout';
export const ERROR_CODE_EMAIL_TAKEN = 'email-taken';
export const ERROR_CODE_EMAIL_NOT_FOUND = 'email-not-found';
export const ERROR_CODE_TOO_MANY_VERIFICATION_REQUESTS = 'email-too-many-verification-requests';
export const ERROR_CODE_UPLOAD_OVER_LIMIT = 'request-upload-over-limit';
export const ERROR_CODE_VALIDATION_INVALID_PARAMS = 'validation-invalid-params';
export const ERROR_CODE_VALIDATION_INVALID_VALUE = 'validation-invalid-value';
export const ERROR_CODE_NOT_FOUND = 'not-found';
export const ERROR_CODE_FORBIDDEN = 'forbidden';
export const ERROR_CODE_MISSING_STRIPE_ACCOUNT = 'transaction-missing-stripe-account';
export const ERROR_CODE_STOCK_OLD_TOTAL_MISMATCH = 'old-total-mismatch';
export const ERROR_CODE_PERMISSION_DENIED_POST_LISTINGS = 'permission-denied-post-listings';
export const ERROR_CODE_PERMISSION_DENIED_PENDING_APPROVAL = 'permission-denied-pending-approval';
export const ERROR_CODE_USER_PENDING_APPROVAL = 'user-pending-approval';
export const ERROR_CODE_PERMISSION_DENIED_INITIATE_TRANSACTIONS =
  'permission-denied-initiate-transactions';
export const ERROR_CODE_PERMISSION_DENIED_READ = 'permission-denied-read';

const ERROR_CODES = [
  ERROR_CODE_TRANSACTION_LISTING_NOT_FOUND,
  ERROR_CODE_TRANSACTION_INVALID_TRANSITION,
  ERROR_CODE_TRANSACTION_ALREADY_REVIEWED_BY_CUSTOMER,
  ERROR_CODE_TRANSACTION_ALREADY_REVIEWED_BY_PROVIDER,
  ERROR_CODE_PAYMENT_FAILED,
  ERROR_CODE_CHARGE_ZERO_PAYIN,
  ERROR_CODE_CHARGE_ZERO_PAYOUT,
  ERROR_CODE_EMAIL_TAKEN,
  ERROR_CODE_EMAIL_NOT_FOUND,
  ERROR_CODE_TOO_MANY_VERIFICATION_REQUESTS,
  ERROR_CODE_UPLOAD_OVER_LIMIT,
  ERROR_CODE_VALIDATION_INVALID_PARAMS,
  ERROR_CODE_VALIDATION_INVALID_VALUE,
  ERROR_CODE_NOT_FOUND,
  ERROR_CODE_FORBIDDEN,
  ERROR_CODE_MISSING_STRIPE_ACCOUNT,
  ERROR_CODE_STOCK_OLD_TOTAL_MISMATCH,
  ERROR_CODE_PERMISSION_DENIED_POST_LISTINGS,
  ERROR_CODE_PERMISSION_DENIED_PENDING_APPROVAL,
  ERROR_CODE_USER_PENDING_APPROVAL,
  ERROR_CODE_PERMISSION_DENIED_INITIATE_TRANSACTIONS,
  ERROR_CODE_PERMISSION_DENIED_READ,
];

// API error
propTypes.apiError = shape({
  id: propTypes.uuid.isRequired,
  status: number.isRequired,
  code: oneOf(ERROR_CODES).isRequired,
  title: string.isRequired,
  meta: object,
});

propTypes.assetDeliveryApiError = shape({
  code: oneOf(ERROR_CODES).isRequired,
  id: string.isRequired,
  status: number.isRequired,
  title: string.isRequired,
});

// Storable error prop type. (Error object should not be stored as it is.)
propTypes.error = shape({
  type: propTypes.value('error').isRequired,
  name: string.isRequired,
  message: string,
  status: number,
  statusText: string,
  apiErrors: arrayOf(oneOfType([propTypes.apiError, propTypes.assetDeliveryApiError])),
});

// Options for showing just date or date and time on TimeRange and OrderBreakdown
export const DATE_TYPE_DATE = 'date';
export const DATE_TYPE_TIME = 'time';
export const DATE_TYPE_DATETIME = 'datetime';

propTypes.dateType = oneOf([DATE_TYPE_DATE, DATE_TYPE_TIME, DATE_TYPE_DATETIME]);

export { propTypes };
