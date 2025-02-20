export const SELL_PURCHASE_PROCESS_NAME = 'sell-purchase';

export const transitions = {
  INQUIRE: 'transition/inquire',
  REQUEST_PAYMENT: 'transition/request-payment',
  REQUEST_PAYMENT_AFTER_INQUIRY: 'transition/request-payment-after-inquiry',
  CONFIRM_PAYMENT: 'transition/confirm-payment',
  EXPIRE_PAYMENT: 'transition/expire-payment',
  BUYER_REFUND_BEFORE_SELLER_CONFIRMED: 'transition/buyer-refund-before-seller-confirmed',
  SELLER_REFUND_BEFORE_SELLER_CONFIRMED: 'transition/seller-refund-before-seller-confirmed',
  SELLER_CONFIRM_PURCHASE: 'transition/seller-confirm-purchase',
  EXPIRE_SELLER_CONFIRM_PERIOD: 'transition/expire-seller-confirm-period',
  BUYER_REFUND_BEFORE_CAPTURE_INTENT: 'transition/buyer-refund-before-capture-intent',
  SELLER_REFUND_BEFORE_CAPTURE_INTENT: 'transition/seller-refund-before-capture-intent',
  OPERATOR_CANCEL_TRANSITION_AFTER_EXPIRE_INTENT:
    'transition/operator-cancel-transition-after-expire-intent',
  BUYER_MARK_COMPLETE_BEFORE_CAPTURE_INTENT: 'transition/buyer-mark-complete-before-capture-intent',
  EXPIRE_PAYMENT_HOLD_PERIOD: 'transition/expire-payment-hold-period',
  BUYER_MARK_COMPLETE: 'transition/buyer-mark-complete',
  AUTO_DISABLE_REFUND: 'transition/auto-disable-refund',
  BUYER_ISSUE_REFUND: 'transition/buyer-issue-refund',
  SELLER_ISSUE_REFUND: 'transition/seller-issue-refund',
  SELLER_DISPUTE: 'transition/seller-dispute',
  SELLER_APPROVE_REFUND: 'transition/seller-approve-refund',
  OPERATOR_MARK_COMPLETE: 'transition/operator-mark-complete',
  EXPIRE_DISPUTE_PERIOD: 'transition/expire-dispute-period',
  OPERATOR_APPROVE_REFUND: 'transition/operator-approve-refund',
  BUYER_MARK_COMPLETE_REFUND_DISABLED: 'transition/buyer-mark-complete-refund-disabled',
  AUTO_MARK_COMPLETE: 'transition/auto-mark-complete',
  REVIEW_1_BY_PROVIDER: 'transition/review-1-by-provider',
  REVIEW_2_BY_PROVIDER: 'transition/review-2-by-provider',
  REVIEW_1_BY_CUSTOMER: 'transition/review-1-by-customer',
  REVIEW_2_BY_CUSTOMER: 'transition/review-2-by-customer',
  EXPIRE_REVIEW_PERIOD: 'transition/expire-review-period',
  EXPIRE_PROVIDER_REVIEW_PERIOD: 'transition/expire-provider-review-period',
  EXPIRE_CUSTOMER_REVIEW_PERIOD: 'transition/expire-customer-review-period',
};

export const states = {
  INITIAL: 'initial',
  INQUIRY: 'inquiry',
  PENDING_PAYMENT: 'pending-payment',
  PURCHASE_CONFIRMED_BY_BUYER: 'purchase-confirmed-by-buyer',
  PAYMENT_EXPIRED: 'payment-expired',
  REFUND_BEFORE_CAPTURE: 'refund-before-capture',
  PURCHASED: 'purchased',
  PURCHASE_EXPIRED: 'purchase-expired',
  COMPLETED: 'completed',
  STRIPE_INTENT_CAPTURED: 'stripe-intent-captured',
  REFUND_DISABLED: 'refund-disabled',
  SELLER_HANDLE_DISPUTED: 'seller-handle-disputed',
  OPERATOR_HANDLE_DISPUTED: 'operator-handle-disputed',
  CANCELED: 'canceled',
  REVIEWED_BY_PROVIDER: 'reviewed-by-provider',
  REVIEWED: 'reviewed',
  REVIEWED_BY_CUSTOMER: 'reviewed-by-customer',
};

export const graph = {
  id: 'sell-purchase/release-1',
  initial: states.INITIAL,
  states: {
    [states.INITIAL]: {
      on: {
        [transitions.INQUIRE]: states.INQUIRY,
        [transitions.REQUEST_PAYMENT]: states.PENDING_PAYMENT,
      },
    },
    [states.REVIEWED]: {
      type: 'final',
    },
    [states.INQUIRY]: {
      on: {
        [transitions.REQUEST_PAYMENT_AFTER_INQUIRY]: states.PENDING_PAYMENT,
      },
    },
    [states.PENDING_PAYMENT]: {
      on: {
        [transitions.CONFIRM_PAYMENT]: states.PURCHASE_CONFIRMED_BY_BUYER,
        [transitions.EXPIRE_PAYMENT]: states.PAYMENT_EXPIRED,
      },
    },
    [states.PURCHASE_CONFIRMED_BY_BUYER]: {
      on: {
        [transitions.BUYER_REFUND_BEFORE_SELLER_CONFIRMED]: states.REFUND_BEFORE_CAPTURE,
        [transitions.SELLER_REFUND_BEFORE_SELLER_CONFIRMED]: states.REFUND_BEFORE_CAPTURE,
        [transitions.SELLER_CONFIRM_PURCHASE]: states.PURCHASED,
        [transitions.EXPIRE_SELLER_CONFIRM_PERIOD]: states.PURCHASE_EXPIRED,
      },
    },
    [states.PAYMENT_EXPIRED]: {},
    [states.REFUND_BEFORE_CAPTURE]: {},
    [states.PURCHASED]: {
      on: {
        [transitions.BUYER_REFUND_BEFORE_CAPTURE_INTENT]: states.REFUND_BEFORE_CAPTURE,
        [transitions.SELLER_REFUND_BEFORE_CAPTURE_INTENT]: states.REFUND_BEFORE_CAPTURE,
        [transitions.OPERATOR_CANCEL_TRANSITION_AFTER_EXPIRE_INTENT]: states.REFUND_BEFORE_CAPTURE,
        [transitions.BUYER_MARK_COMPLETE_BEFORE_CAPTURE_INTENT]: states.COMPLETED,
        [transitions.EXPIRE_PAYMENT_HOLD_PERIOD]: states.STRIPE_INTENT_CAPTURED,
      },
    },
    [states.PURCHASE_EXPIRED]: {},
    [states.COMPLETED]: {
      on: {
        [transitions.REVIEW_1_BY_PROVIDER]: states.REVIEWED_BY_PROVIDER,
        [transitions.REVIEW_1_BY_CUSTOMER]: states.REVIEWED_BY_CUSTOMER,
        [transitions.EXPIRE_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.STRIPE_INTENT_CAPTURED]: {
      on: {
        [transitions.BUYER_MARK_COMPLETE]: states.COMPLETED,
        [transitions.AUTO_DISABLE_REFUND]: states.REFUND_DISABLED,
        [transitions.BUYER_ISSUE_REFUND]: states.SELLER_HANDLE_DISPUTED,
        [transitions.SELLER_ISSUE_REFUND]: states.OPERATOR_HANDLE_DISPUTED,
      },
    },
    [states.REFUND_DISABLED]: {
      on: {
        [transitions.BUYER_MARK_COMPLETE_REFUND_DISABLED]: states.COMPLETED,
        [transitions.AUTO_MARK_COMPLETE]: states.COMPLETED,
      },
    },
    [states.SELLER_HANDLE_DISPUTED]: {
      on: {
        [transitions.SELLER_DISPUTE]: states.OPERATOR_HANDLE_DISPUTED,
        [transitions.SELLER_APPROVE_REFUND]: states.CANCELED,
      },
    },
    [states.OPERATOR_HANDLE_DISPUTED]: {
      on: {
        [transitions.OPERATOR_MARK_COMPLETE]: states.COMPLETED,
        [transitions.EXPIRE_DISPUTE_PERIOD]: states.COMPLETED,
        [transitions.OPERATOR_APPROVE_REFUND]: states.CANCELED,
      },
    },
    [states.CANCELED]: {},
    [states.REVIEWED_BY_PROVIDER]: {
      on: {
        [transitions.REVIEW_2_BY_CUSTOMER]: states.REVIEWED,
        [transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.REVIEWED_BY_CUSTOMER]: {
      on: {
        [transitions.REVIEW_2_BY_PROVIDER]: states.REVIEWED,
        [transitions.EXPIRE_PROVIDER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
  },
};

// Check if a transition is the kind that should be rendered
// when showing transition history (e.g. ActivityFeed)
// The first transition and most of the expiration transitions made by system are not relevant
export const isRelevantPastTransition = transition => {
  return [
    transitions.CONFIRM_PAYMENT,
    transitions.EXPIRE_PAYMENT,
    transitions.BUYER_REFUND_BEFORE_SELLER_CONFIRMED,
    transitions.SELLER_REFUND_BEFORE_SELLER_CONFIRMED,
    transitions.SELLER_CONFIRM_PURCHASE,
    transitions.EXPIRE_SELLER_CONFIRM_PERIOD,
    transitions.BUYER_REFUND_BEFORE_CAPTURE_INTENT,
    transitions.SELLER_REFUND_BEFORE_CAPTURE_INTENT,
    transitions.OPERATOR_CANCEL_TRANSITION_AFTER_EXPIRE_INTENT,
    transitions.BUYER_MARK_COMPLETE_BEFORE_CAPTURE_INTENT,
    transitions.BUYER_MARK_COMPLETE,
    transitions.BUYER_ISSUE_REFUND,
    transitions.SELLER_ISSUE_REFUND,
    transitions.SELLER_DISPUTE,
    transitions.SELLER_APPROVE_REFUND,
    transitions.OPERATOR_MARK_COMPLETE,
    transitions.EXPIRE_DISPUTE_PERIOD,
    transitions.OPERATOR_APPROVE_REFUND,
    transitions.BUYER_MARK_COMPLETE_REFUND_DISABLED,
    transitions.AUTO_MARK_COMPLETE,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_PROVIDER,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_2_BY_CUSTOMER,
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
const privilegeTransitions = [
  transitions.REQUEST_PAYMENT,
  transitions.REQUEST_PAYMENT_AFTER_INQUIRY,
  transitions.BUYER_MARK_COMPLETE_BEFORE_CAPTURE_INTENT,
  transitions.BUYER_MARK_COMPLETE,
  transitions.BUYER_MARK_COMPLETE_REFUND_DISABLED,
  transitions.BUYER_ISSUE_REFUND,
  transitions.SELLER_ISSUE_REFUND,
];

export const isPrivileged = transition => {
  return privilegeTransitions.includes(transition);
};

// Check when transaction is completed (item is received and review notifications sent)
export const isCompleted = transition => {
  const txCompletedTransitions = [
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

    transitions.BUYER_REFUND_BEFORE_SELLER_CONFIRMED,
    transitions.SELLER_REFUND_BEFORE_SELLER_CONFIRMED,

    transitions.EXPIRE_SELLER_CONFIRM_PERIOD,

    transitions.BUYER_REFUND_BEFORE_CAPTURE_INTENT,
    transitions.SELLER_REFUND_BEFORE_CAPTURE_INTENT,
    transitions.OPERATOR_CANCEL_TRANSITION_AFTER_EXPIRE_INTENT,

    transitions.SELLER_APPROVE_REFUND,
    transitions.OPERATOR_APPROVE_REFUND,
  ];
  return txRefundedTransitions.includes(transition);
};

export const statesNeedingProviderAttention = [states.PURCHASED];
