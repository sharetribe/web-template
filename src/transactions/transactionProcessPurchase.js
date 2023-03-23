/**
 * Transaction process graph for product orders:
 *   - default-purchase
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
  // When a customer makes an order for a listing, a transaction is
  // created with the initial request-payment transition.
  // At this transition a PaymentIntent is created by Marketplace API.
  // After this transition, the actual payment must be made on client-side directly to Stripe.
  REQUEST_PAYMENT: 'transition/request-payment',

  // A customer can also initiate a transaction with an inquiry, and
  // then transition that with a request.
  INQUIRE: 'transition/inquire',
  REQUEST_PAYMENT_AFTER_INQUIRY: 'transition/request-payment-after-inquiry',

  // Stripe SDK might need to ask 3D security from customer, in a separate front-end step.
  // Therefore we need to make another transition to Marketplace API,
  // to tell that the payment is confirmed.
  CONFIRM_PAYMENT: 'transition/confirm-payment',

  // If the payment is not confirmed in the time limit set in transaction process (by default 15min)
  // the transaction will expire automatically.
  EXPIRE_PAYMENT: 'transition/expire-payment',

  // Provider or opeartor can mark the product shipped/delivered
  MARK_DELIVERED: 'transition/mark-delivered',
  OPERATOR_MARK_DELIVERED: 'transition/operator-mark-delivered',

  // Customer can mark the product received (e.g. picked up from provider)
  MARK_RECEIVED_FROM_PURCHASED: 'transition/mark-received-from-purchased',

  // Automatic cancellation happens if none marks the delivery happened
  AUTO_CANCEL: 'transition/auto-cancel',

  // Operator can cancel the purchase before product has been marked as delivered / received
  CANCEL: 'transition/cancel',

  // If provider has marked the product delivered (e.g. shipped),
  // customer can then mark the product received
  MARK_RECEIVED: 'transition/mark-received',

  // If customer doesn't mark the product received manually, it can happen automatically
  AUTO_MARK_RECEIVED: 'transition/auto-mark-received',

  // When provider has marked the product delivered, customer or operator can dispute the transaction
  DISPUTE: 'transition/dispute',
  OPERATOR_DISPUTE: 'transition/operator-dispute',

  // If nothing is done to disputed transaction it ends up to Canceled state
  AUTO_CANCEL_FROM_DISPUTED: 'transition/auto-cancel-from-disputed',

  // Operator can cancel disputed transaction manually
  CANCEL_FROM_DISPUTED: 'transition/cancel-from-disputed',

  // Operator can mark the disputed transaction as received
  MARK_RECEIVED_FROM_DISPUTED: 'transition/mark-received-from-disputed',

  // System moves transaction automatically from received state to complete state
  // This makes it possible to to add notifications to that single transition.
  AUTO_COMPLETE: 'transition/auto-complete',

  // Reviews are given through transaction transitions. Review 1 can be
  // by provider or customer, and review 2 will be the other party of
  // the transaction.
  REVIEW_1_BY_PROVIDER: 'transition/review-1-by-provider',
  REVIEW_2_BY_PROVIDER: 'transition/review-2-by-provider',
  REVIEW_1_BY_CUSTOMER: 'transition/review-1-by-customer',
  REVIEW_2_BY_CUSTOMER: 'transition/review-2-by-customer',
  EXPIRE_CUSTOMER_REVIEW_PERIOD: 'transition/expire-customer-review-period',
  EXPIRE_PROVIDER_REVIEW_PERIOD: 'transition/expire-provider-review-period',
  EXPIRE_REVIEW_PERIOD: 'transition/expire-review-period',
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
  INQUIRY: 'inquiry',
  PENDING_PAYMENT: 'pending-payment',
  PAYMENT_EXPIRED: 'payment-expired',
  PURCHASED: 'purchased',
  DELIVERED: 'delivered',
  RECEIVED: 'received',
  DISPUTED: 'disputed',
  CANCELED: 'canceled',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
  REVIEWED_BY_CUSTOMER: 'reviewed-by-customer',
  REVIEWED_BY_PROVIDER: 'reviewed-by-provider',
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
  id: 'default-purchase/release-1',

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
        [transitions.REQUEST_PAYMENT_AFTER_INQUIRY]: states.PENDING_PAYMENT,
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
        [transitions.MARK_DELIVERED]: states.DELIVERED,
        [transitions.OPERATOR_MARK_DELIVERED]: states.DELIVERED,
        [transitions.MARK_RECEIVED_FROM_PURCHASED]: states.RECEIVED,
        [transitions.AUTO_CANCEL]: states.CANCELED,
        [transitions.CANCEL]: states.CANCELED,
      },
    },

    [states.CANCELED]: {},

    [states.DELIVERED]: {
      on: {
        [transitions.MARK_RECEIVED]: states.RECEIVED,
        [transitions.AUTO_MARK_RECEIVED]: states.RECEIVED,
        [transitions.DISPUTE]: states.DISPUTED,
        [transitions.OPERATOR_DISPUTE]: states.DISPUTED,
      },
    },

    [states.DISPUTED]: {
      on: {
        [transitions.AUTO_CANCEL_FROM_DISPUTED]: states.CANCELED,
        [transitions.CANCEL_FROM_DISPUTED]: states.CANCELED,
        [transitions.MARK_RECEIVED_FROM_DISPUTED]: states.RECEIVED,
      },
    },

    [states.RECEIVED]: {
      on: {
        [transitions.AUTO_COMPLETE]: states.COMPLETED,
      },
    },

    [states.COMPLETED]: {
      on: {
        [transitions.EXPIRE_REVIEW_PERIOD]: states.REVIEWED,
        [transitions.REVIEW_1_BY_CUSTOMER]: states.REVIEWED_BY_CUSTOMER,
        [transitions.REVIEW_1_BY_PROVIDER]: states.REVIEWED_BY_PROVIDER,
      },
    },

    [states.REVIEWED_BY_CUSTOMER]: {
      on: {
        [transitions.REVIEW_2_BY_PROVIDER]: states.REVIEWED,
        [transitions.EXPIRE_PROVIDER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.REVIEWED_BY_PROVIDER]: {
      on: {
        [transitions.REVIEW_2_BY_CUSTOMER]: states.REVIEWED,
        [transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD]: states.REVIEWED,
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
    transitions.AUTO_CANCEL,
    transitions.CANCEL,
    transitions.MARK_DELIVERED,
    transitions.OPERATOR_MARK_DELIVERED,
    transitions.DISPUTE,
    transitions.OPERATOR_DISPUTE,
    transitions.AUTO_COMPLETE,
    transitions.AUTO_CANCEL_FROM_DISPUTED,
    transitions.CANCEL_FROM_DISPUTED,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_CUSTOMER,
    transitions.REVIEW_2_BY_PROVIDER,
  ].includes(transition);
};
export const isCustomerReview = transition => {
  return [transitions.REVIEW_1_BY_CUSTOMER, transitions.REVIEW_2_BY_CUSTOMER].includes(transition);
};

export const isProviderReview = transition => {
  return [transitions.REVIEW_1_BY_PROVIDER, transitions.REVIEW_2_BY_PROVIDER].includes(transition);
};

// Check if the given transition is privileged.
//
// Privileged transitions need to be handled from a secure context,
// i.e. the backend. This helper is used to check if the transition
// should go through the local API endpoints, or if using JS SDK is
// enough.
export const isPrivileged = transition => {
  return [transitions.REQUEST_PAYMENT, transitions.REQUEST_PAYMENT_AFTER_INQUIRY].includes(
    transition
  );
};

// Check when transaction is completed (item is received and review notifications sent)
export const isCompleted = transition => {
  const txCompletedTransitions = [
    transitions.AUTO_COMPLETE,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_CUSTOMER,
    transitions.REVIEW_2_BY_PROVIDER,
    transitions.EXPIRE_REVIEW_PERIOD,
    transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD,
    transitions.EXPIRE_PROVIDER_REVIEW_PERIOD,
  ];
  return txCompletedTransitions.includes(transition);
};

// Check when transaction is refunded (order did not happen)
// In these transitions action/stripe-refund-payment is called
export const isRefunded = transition => {
  const txRefundedTransitions = [
    transitions.EXPIRE_PAYMENT,
    transitions.CANCEL,
    transitions.AUTO_CANCEL,
    transitions.AUTO_CANCEL_FROM_DISPUTED,
    transitions.CANCEL_FROM_DISPUTED,
  ];
  return txRefundedTransitions.includes(transition);
};

export const statesNeedingProviderAttention = [states.PURCHASED];
