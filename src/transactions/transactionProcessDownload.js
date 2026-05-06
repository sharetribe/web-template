/**
 * Transaction process graph for digital file purchases:
 *   - default-download
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
  // When a customer purchases a digital file listing, a transaction is
  // created with the initial request-payment transition.
  // At this transition a PaymentIntent is created by Marketplace API.
  // After this transition, the actual payment must be made on client-side directly to Stripe.
  REQUEST_PAYMENT: 'transition/request-payment',

  // A customer can also initiate a transaction with an inquiry, and
  // then transition that with a purchase.
  INQUIRE: 'transition/inquire',
  PURCHASE_AFTER_INQUIRY: 'transition/purchase-after-inquiry',

  // Stripe SDK might need to ask 3D security from customer, in a separate front-end step.
  // Therefore we need to make another transition to Marketplace API,
  // to tell that the payment is confirmed.
  CONFIRM_PAYMENT: 'transition/confirm-payment',

  // If the payment is not confirmed in the time limit set in transaction process (by default 15min)
  // the transaction will expire automatically.
  EXPIRE_PAYMENT: 'transition/expire-payment',

  // After purchase, the system automatically completes the transaction after 7 days
  AUTO_COMPLETE: 'transition/auto-complete',

  // Operator can manually mark the transaction as completed.
  OPERATOR_COMPLETE: 'transition/operator-complete',

  // Customer or operator can report an issue with the digital file delivery.
  REPORT: 'transition/report',
  OPERATOR_REPORT: 'transition/operator-report',

  // Operator can cancel a reported transaction
  OPERATOR_CANCEL: 'transition/operator-cancel',

  // If nothing is done to a reported transaction, it is automatically cancelled.
  AUTO_CANCEL: 'transition/auto-cancel',

  // Operator can resolve a report by marking the transaction as received
  COMPLETE_FROM_REPORTED: 'transition/complete-from-reported',

  // Only the customer can leave a review in this process.
  REVIEW: 'transition/review',
  EXPIRE_REVIEW_PERIOD: 'transition/expire-review-period',
};

/**
 * States
 *
 * These constants are only for making it clear how transitions work together.
 * You should not use these constants outside of this file.
 *
 */
export const states = {
  INITIAL: 'initial',
  INQUIRY: 'inquiry',
  PENDING_PAYMENT: 'pending-payment',
  PAYMENT_EXPIRED: 'payment-expired',
  PURCHASED: 'purchased',
  REPORTED: 'reported',
  CANCELED: 'canceled',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
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
  id: 'default-download/release-1',

  // This 'initial' state is a starting point for new transaction
  initial: states.INITIAL,

  // States
  states: {
    [states.INITIAL]: {
      on: {
        [transitions.INQUIRE]: states.INQUIRY,
        [transitions.REQUEST_PAYMENT]: states.PENDING_PAYMENT,
      },
    },
    [states.INQUIRY]: {
      on: {
        [transitions.PURCHASE_AFTER_INQUIRY]: states.PENDING_PAYMENT,
      },
    },

    [states.PENDING_PAYMENT]: {
      on: {
        [transitions.EXPIRE_PAYMENT]: states.PAYMENT_EXPIRED,
        [transitions.CONFIRM_PAYMENT]: states.PURCHASED,
      },
    },

    [states.PAYMENT_EXPIRED]: {},

    [states.PURCHASED]: {
      on: {
        [transitions.AUTO_COMPLETE]: states.COMPLETED,
        [transitions.OPERATOR_COMPLETE]: states.COMPLETED,
        [transitions.REPORT]: states.REPORTED,
        [transitions.OPERATOR_REPORT]: states.REPORTED,
      },
    },

    [states.REPORTED]: {
      on: {
        [transitions.OPERATOR_CANCEL]: states.CANCELED,
        [transitions.AUTO_CANCEL]: states.CANCELED,
        [transitions.COMPLETE_FROM_REPORTED]: states.COMPLETED,
      },
    },

    [states.CANCELED]: {},

    [states.COMPLETED]: {
      on: {
        [transitions.REVIEW]: states.REVIEWED,
        [transitions.EXPIRE_REVIEW_PERIOD]: states.REVIEWED,
      },
    },

    [states.REVIEWED]: { type: 'final' },
  },
};

// Check if a transition is the kind that should be rendered
// when showing transition history (e.g. ActivityFeed)
// The first transition and most of the expiration transitions made by system are not relevant
export const isRelevantPastTransition = transition => {
  return [
    transitions.CONFIRM_PAYMENT,
    transitions.REPORT,
    transitions.OPERATOR_REPORT,
    transitions.OPERATOR_CANCEL,
    transitions.AUTO_CANCEL,
    transitions.AUTO_COMPLETE,
    transitions.OPERATOR_COMPLETE,
    transitions.COMPLETE_FROM_REPORTED,
    transitions.REVIEW,
  ].includes(transition);
};

// Only the customer can leave a review in this process.
export const isCustomerReview = transition => {
  return [transitions.REVIEW].includes(transition);
};

// This process does not support provider reviews.
export const isProviderReview = () => false;

// Check if the given transition is privileged.
//
// Privileged transitions need to be handled from a secure context,
// i.e. the backend. This helper is used to check if the transition
// should go through the local API endpoints, or if using JS SDK is
// enough.
export const isPrivileged = transition => {
  return [transitions.REQUEST_PAYMENT, transitions.PURCHASE_AFTER_INQUIRY].includes(transition);
};

// Check when transaction is completed (file access confirmed and review period started)
export const isCompleted = transition => {
  const txCompletedTransitions = [
    transitions.AUTO_COMPLETE,
    transitions.OPERATOR_COMPLETE,
    transitions.COMPLETE_FROM_REPORTED,
    transitions.REVIEW,
    transitions.EXPIRE_REVIEW_PERIOD,
  ];
  return txCompletedTransitions.includes(transition);
};

// Check when transaction is refunded (purchase did not result in file delivery)
// In these transitions action/stripe-refund-payment is called
export const isRefunded = transition => {
  const txRefundedTransitions = [
    transitions.EXPIRE_PAYMENT,
    transitions.OPERATOR_CANCEL,
    transitions.AUTO_CANCEL,
  ];
  return txRefundedTransitions.includes(transition);
};

// No provider attention states: digital file delivery requires no manual provider action.
export const statesNeedingProviderAttention = [];

export const statesNeedingCustomerAttention = [];
