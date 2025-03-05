// Enum for Sharetribe Events Type
const SharetribeEventsType = Object.freeze({
  AVAILABILITY_EXCEPTION_CREATED: 'availabilityException/created',
  AVAILABILITY_EXCEPTION_UPDATED: 'availabilityException/updated',
  AVAILABILITY_EXCEPTION_DELETED: 'availabilityException/deleted',
  LISTING_UPDATED: 'listing/updated',
  BOOKING_CREATED: 'booking/created',
  TRANSACTION_TRANSITIONED: 'transaction/transitioned',
});

// Enum for Sharetribe Availability Exception
const AvailabilityException = Object.freeze({
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable',
});

// Enum for Sharetribe Transitions
const Transitions = Object.freeze({
  OPERATOR_DECLINED: 'transition/operator-decline',
  TRANSITION_DECLINED: 'transition/decline',
  OPERATOR_CANCEL: 'transition/cancel',
  TRANSITION_ACCEPT: 'transition/accept',
});
// Enum for Event Status
const EventStatus = Object.freeze({
  CANCELLED: 'cancelled',
});
// Enum for Event Status
const ResourceState = Object.freeze({
  EXISTS: 'exists',
  SYNC: 'sync',
});

// In-memory counters for demonstration
const executionCounts = Object.freeze({
  BOOKING_CREATED: 0,
  AVAILABILITY_EXCEPTION_CREATED: 0,
  LISTING_UPDATED: 0,
});

// Enum for StatusCode

const StatusCode = Object.freeze({
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  TOO_MANY_REQUESTS: 429,
});

module.exports = {
  SharetribeEventsType,
  AvailabilityException,
  StatusCode,
  Transitions,
  EventStatus,
  executionCounts,
  ResourceState,
};
