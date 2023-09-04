/**
 * Transaction process graph for plain inquiries:
 *   - default-inquiry
 */

/**
 * Transitions
 *
 * These strings must sync with values defined in Marketplace API,
 * since transaction objects given by API contain info about last transitions.
 * All the actions in API side happen in transitions,
 * so we need to understand what those strings mean.
 */

export const transitions = {
  // A customer can initiate a transaction with an inquiry, and
  // then transition that with a request.
  INQUIRE_WITHOUT_PAYMENT: 'transition/inquire-without-payment',
};

/**
 * States
 *
 * These constants are only for making it clear how transitions work together.
 * You should not use these constants outside of this file.
 *
 * Note: these states are not in sync with states used transaction process definitions
 *       in Marketplace API. Only last transitions are passed along transaction object.
 */
export const states = {
  INITIAL: 'initial',
  FREE_INQUIRY: 'free-inquiry',
};

/**
 * Description of transaction process graph
 *
 * You should keep this in sync with transaction process defined in Marketplace API
 *
 * Note: we don't use yet any state machine library,
 *       but this description format is following Xstate (FSM library)
 *       https://xstate.js.org/docs/
 */
export const graph = {
  // id is defined only to support Xstate format.
  // However if you have multiple transaction processes defined,
  // it is best to keep them in sync with transaction process aliases.
  id: 'default-inquiry/release-1',

  // This 'initial' state is a starting point for new transaction
  initial: states.INITIAL,

  // States
  states: {
    [states.INITIAL]: {
      on: {
        [transitions.INQUIRE_WITHOUT_PAYMENT]: states.FREE_INQUIRY,
      },
    },
    [states.FREE_INQUIRY]: { type: 'final' },
  },
};

// Check if a transition is the kind that should be rendered
// when showing transition history (e.g. ActivityFeed)
// The first transition and most of the expiration transitions made by system are not relevant
export const isRelevantPastTransition = transition => {
  return [transitions.INQUIRE_WITHOUT_PAYMENT].includes(transition);
};

// Processes might be different on how reviews are handled.
// Default processes use two-sided diamond shape, where either party can make the review first
// NOTE: this functions is added just for the sake of consistency
export const isCustomerReview = transition => {
  return false;
};

// Processes might be different on how reviews are handled.
// Default processes use two-sided diamond shape, where either party can make the review first
// NOTE: this functions is added just for the sake of consistency
export const isProviderReview = transition => {
  return false;
};

// Check if the given transition is privileged.
//
// Privileged transitions need to be handled from a secure context,
// i.e. the backend. This helper is used to check if the transition
// should go through the local API endpoints, or if using JS SDK is
// enough.
// NOTE: this functions is added just for the sake of consistency
export const isPrivileged = transition => {
  return false;
};

// Check when transaction is completed (booking over)
// NOTE: this functions is added just for the sake of consistency
export const isCompleted = transition => {
  return false;
};

// Check when transaction is refunded (booking did not happen)
// In these transitions action/stripe-refund-payment is called
// NOTE: this functions is added just for the sake of consistency
export const isRefunded = transition => {
  return false;
};

// NOTE: this functions is added just for the sake of consistency
// We don't know if inquiry is on-going or complete
export const statesNeedingProviderAttention = [];
