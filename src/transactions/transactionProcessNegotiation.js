/**
 * Transaction process graph for price negotiations:
 *   - default-negotiation
 * This transction process has 2 modes: forward & reverse.
 * - Forward mode is used when customer makes the first offer.
 * - Reverse mode is used when provider makes the first offer.
 *
 * Listing type determines the mode, which is set to listing's publicData.
 * Based on that, we offer different initial transitions for the user of the marketplace.
 * I.e. listings of type 'forward' will offer forward-specific transition: request-quote. And
 * listings of type 'reverse' will offer reverse-specific transitions: make-offer and inquire.
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
  // Inquire is only available for the provider,
  // which in 'reverse' mode is the one reacts to the customer's request (through a listing created by the customer).
  // It's meant for the service providers to inquire about the customer's request
  // before making an offer.
  INQUIRE: 'transition/inquire',

  // Make offer is only available for the provider,
  // which in 'reverse' mode is the one reacts to the customer's request (through a listing created by the customer).
  MAKE_OFFER: 'transition/make-offer',
  MAKE_OFFER_AFTER_INQUIRY: 'transition/make-offer-after-inquiry',

  // Request quote is only available for the customer,
  // which in 'forward' mode is the one who contacts the provider (through a listing created by the provider).
  REQUEST_QUOTE: 'transition/request-quote',
  MAKE_OFFER_FROM_REQUEST: 'transition/make-offer-from-request',
  REJECT_REQUEST: 'transition/reject-request',
  WITHDRAW_REQUEST: 'transition/withdraw-request',
  OPERATOR_REJECT_REQUEST: 'transition/operator-reject-request',

  // Reject offer is available for both parties and the marketplace operator.
  OPERATOR_REJECT_OFFER: 'transition/operator-reject-offer',
  CUSTOMER_REJECT_OFFER: 'transition/customer-reject-offer',
  PROVIDER_WITHDRAW_OFFER: 'transition/provider-withdraw-offer',

  // Transitions for provider-driven negotiation loop
  // TODO: this loop is not yet in use
  UPDATE_OFFER: 'transition/update-offer',
  ACCEPT_OFFER: 'transition/accept-offer',
  OPERATOR_ACCEPT_OFFER: 'transition/operator-accept-offer',
  UPDATE_FROM_UPDATE_PENDING: 'transition/update-from-update-pending',
  CUSTOMER_REJECT_FROM_UPDATE_PENDING: 'transition/customer-reject-from-update-pending',
  PROVIDER_WITHDRAW_FROM_UPDATE_PENDING: 'transition/provider-withdraw-from-update-pending',

  // Transitions for customer-driven price negotiation loop: customer makes a counter offer.
  CUSTOMER_MAKE_COUNTER_OFFER: 'transition/customer-make-counter-offer',
  PROVIDER_MAKE_COUNTER_OFFER: 'transition/provider-make-counter-offer',
  PROVIDER_ACCEPT_COUNTER_OFFER: 'transition/provider-accept-counter-offer',

  CUSTOMER_WITHDRAW_COUNTER_OFFER: 'transition/customer-withdraw-counter-offer',
  OPERATOR_REJECT_FROM_CUSTOMER_COUNTER_OFFER:
    'transition/operator-reject-from-customer-counter-offer',
  PROVIDER_REJECT_COUNTER_OFFER: 'transition/provider-reject-counter-offer',

  // When the customer is satisfied with the offer,
  // they can start the payment process.
  REQUEST_PAYMENT_TO_ACCEPT_OFFER: 'transition/request-payment-to-accept-offer',
  EXPIRE_PAYMENT: 'transition/expire-payment',
  CONFIRM_PAYMENT: 'transition/confirm-payment',

  AUTO_CANCEL: 'transition/auto-cancel',
  OPERATOR_CANCEL: 'transition/operator-cancel',

  DELIVER: 'transition/deliver',
  OPERATOR_MARK_DELIVERED: 'transition/operator-mark-delivered',

  // Request changes loop:
  // after the delivered service/item, the customer can request changes.
  REQUEST_CHANGES: 'transition/request-changes',
  OPERATOR_REQUEST_CHANGES: 'transition/operator-request-changes',
  DELIVER_CHANGES: 'transition/deliver-changes',
  OPERATOR_MARK_CHANGES_DELIVERED: 'transition/operator-mark-changes-delivered',
  OPERATOR_CANCEL_FROM_DELIVERED: 'transition/operator-cancel-from-delivered',

  AUTO_CANCEL_FROM_CHANGES_REQUESTED: 'transition/auto-cancel-from-changes-requested',
  OPERATOR_CANCEL_FROM_CHANGES_REQUESTED: 'transition/operator-cancel-from-changes-requested',

  // Accept deliverable:
  // when the customer is satisfied with the service/item, they can accept the deliverable.
  ACCEPT_DELIVERABLE: 'transition/accept-deliverable',
  AUTO_ACCEPT_DELIVERABLE: 'transition/auto-accept-deliverable',
  OPERATOR_ACCEPT_DELIVERABLE: 'transition/operator-accept-deliverable',

  // Reviews are given through transaction transitions. Review 1 can be
  // by provider or customer, and review 2 will be the other party of
  // the transaction.
  REVIEW_1_BY_PROVIDER: 'transition/review-1-by-provider',
  REVIEW_1_BY_CUSTOMER: 'transition/review-1-by-customer',
  REVIEW_2_BY_PROVIDER: 'transition/review-2-by-provider',
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
  QUOTE_REQUESTED: 'quote-requested',
  REQUEST_REJECTED: 'request-rejected',
  OFFER_PENDING: 'offer-pending',
  UPDATE_PENDING: 'update-pending', // TODO: this is not yet in use/handled
  CUSTOMER_OFFER_PENDING: 'customer-offer-pending',
  OFFER_REJECTED: 'offer-rejected',
  PENDING_PAYMENT: 'pending-payment',
  PAYMENT_EXPIRED: 'payment-expired',
  OFFER_ACCEPTED: 'offer-accepted',
  CANCELED: 'canceled',
  DELIVERED: 'delivered',
  CHANGES_REQUESTED: 'changes-requested',
  COMPLETED: 'completed',
  REVIEWED_BY_CUSTOMER: 'reviewed-by-customer',
  REVIEWED_BY_PROVIDER: 'reviewed-by-provider',
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
  id: 'default-negotiation/release-1',

  // This 'initial' state is a starting point for new transaction
  initial: states.INITIAL,

  // States
  states: {
    [states.INITIAL]: {
      on: {
        [transitions.INQUIRE]: states.INQUIRY,
        [transitions.MAKE_OFFER]: states.OFFER_PENDING,
        [transitions.REQUEST_QUOTE]: states.QUOTE_REQUESTED,
      },
    },
    [states.QUOTE_REQUESTED]: {
      on: {
        [transitions.MAKE_OFFER_FROM_REQUEST]: states.OFFER_PENDING,
        [transitions.REJECT_REQUEST]: states.REQUEST_REJECTED,
        [transitions.WITHDRAW_REQUEST]: states.REQUEST_REJECTED,
        [transitions.OPERATOR_REJECT_REQUEST]: states.REQUEST_REJECTED,
      },
    },
    [states.INQUIRY]: {
      on: {
        [transitions.MAKE_OFFER_AFTER_INQUIRY]: states.OFFER_PENDING,
      },
    },
    [states.OFFER_PENDING]: {
      on: {
        [transitions.CUSTOMER_REJECT_OFFER]: states.OFFER_REJECTED,
        [transitions.OPERATOR_REJECT_OFFER]: states.OFFER_REJECTED,
        [transitions.PROVIDER_WITHDRAW_OFFER]: states.OFFER_REJECTED,
        [transitions.CUSTOMER_MAKE_COUNTER_OFFER]: states.CUSTOMER_OFFER_PENDING,
        [transitions.REQUEST_PAYMENT_TO_ACCEPT_OFFER]: states.PENDING_PAYMENT,
        [transitions.UPDATE_OFFER]: states.UPDATE_PENDING,
      },
    },
    // Provider-driven negotiation loop
    // TODO: this is not yet in use
    [states.UPDATE_PENDING]: {
      on: {
        [transitions.ACCEPT_OFFER]: states.OFFER_PENDING,
        [transitions.OPERATOR_ACCEPT_OFFER]: states.OFFER_PENDING,
        [transitions.UPDATE_FROM_UPDATE_PENDING]: states.UPDATE_PENDING,
        [transitions.CUSTOMER_REJECT_FROM_UPDATE_PENDING]: states.OFFER_REJECTED,
        [transitions.PROVIDER_WITHDRAW_FROM_UPDATE_PENDING]: states.OFFER_REJECTED,
      },
    },
    // Customer-driven negotiation loop
    [states.CUSTOMER_OFFER_PENDING]: {
      on: {
        [transitions.PROVIDER_REJECT_COUNTER_OFFER]: states.OFFER_PENDING,
        [transitions.OPERATOR_REJECT_FROM_CUSTOMER_COUNTER_OFFER]: states.OFFER_REJECTED,
        [transitions.CUSTOMER_WITHDRAW_COUNTER_OFFER]: states.OFFER_PENDING,
        [transitions.PROVIDER_ACCEPT_COUNTER_OFFER]: states.OFFER_PENDING,
        [transitions.PROVIDER_MAKE_COUNTER_OFFER]: states.OFFER_PENDING,
      },
    },

    [states.PENDING_PAYMENT]: {
      on: {
        [transitions.CONFIRM_PAYMENT]: states.OFFER_ACCEPTED,
        [transitions.EXPIRE_PAYMENT]: states.PAYMENT_EXPIRED,
      },
    },
    [states.PAYMENT_EXPIRED]: { type: 'final' },
    [states.OFFER_ACCEPTED]: {
      on: {
        [transitions.AUTO_CANCEL]: states.CANCELED,
        [transitions.OPERATOR_CANCEL]: states.CANCELED,
        [transitions.DELIVER]: states.DELIVERED,
        [transitions.OPERATOR_MARK_DELIVERED]: states.DELIVERED,
      },
    },
    [states.DELIVERED]: {
      on: {
        [transitions.REQUEST_CHANGES]: states.CHANGES_REQUESTED,
        [transitions.OPERATOR_REQUEST_CHANGES]: states.CHANGES_REQUESTED,
        [transitions.ACCEPT_DELIVERABLE]: states.COMPLETED,
        [transitions.AUTO_ACCEPT_DELIVERABLE]: states.COMPLETED,
        [transitions.OPERATOR_ACCEPT_DELIVERABLE]: states.COMPLETED,
        [transitions.OPERATOR_CANCEL_FROM_DELIVERED]: states.CANCELED,
      },
    },
    [states.CHANGES_REQUESTED]: {
      on: {
        [transitions.DELIVER_CHANGES]: states.DELIVERED,
        [transitions.OPERATOR_MARK_CHANGES_DELIVERED]: states.DELIVERED,
        [transitions.AUTO_CANCEL_FROM_CHANGES_REQUESTED]: states.CANCELED,
        [transitions.OPERATOR_CANCEL_FROM_CHANGES_REQUESTED]: states.CANCELED,
      },
    },
    [states.COMPLETED]: {
      on: {
        [transitions.REVIEW_1_BY_PROVIDER]: states.REVIEWED_BY_PROVIDER,
        [transitions.REVIEW_1_BY_CUSTOMER]: states.REVIEWED_BY_CUSTOMER,
        [transitions.EXPIRE_REVIEW_PERIOD]: states.REVIEWED,
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
    [states.OFFER_REJECTED]: { type: 'final' },
    [states.CANCELED]: { type: 'final' },
  },
};

// transitions that make the first offer
const makeOfferTransitions = [
  'transition/make-offer',
  'transition/make-offer-after-inquiry',
  'transition/make-offer-from-request',
];

// transitions that make a counter offer
const counterOfferTransitions = [
  'transition/customer-make-counter-offer',
  'transition/provider-make-counter-offer',
];

// transitions that revoke a counter offer
const revokeCounterOfferTransitions = [
  'transition/customer-withdraw-counter-offer',
  'transition/provider-reject-counter-offer',
];

// transitions that affect pricing on negotiation loop
const offerTransitions = [
  ...makeOfferTransitions,
  ...counterOfferTransitions,
  ...revokeCounterOfferTransitions,
];

const filterOfferTransitions = (transitions, offerTransitions) => {
  return transitions.filter(t => offerTransitions.includes(t.transition));
};

/**
 * @typedef {Object} NegotiationOffer
 * @property {string} transition - The transition name that was triggered to make this offer
 * @property {string} by - The actor who made the offer ('provider' or 'customer')
 * @property {number} offerInSubunits - The offer amount in subunits (smallest currency unit)
 */

/**
 * @typedef {Object} TransitionRecord
 * @property {string} transition - The transition name
 * @property {string} by - The actor who made the transition ('provider' or 'customer')
 * @property {string} createdAt - ISO timestamp when the transition was created
 */

/**
 * @typedef {Object} TransitionWithOfferInSubunitsRecord
 * @property {string} transition - The transition name
 * @property {string} by - The actor who made the transition ('provider' or 'customer')
 * @property {string} createdAt - ISO timestamp when the transition was created
 * @property {number} [offerInSubunits] - The offer amount in subunits (smallest currency unit)
 */

/**
 * Checks if the offers array is valid against the (past) transitions array.
 *
 * @param {Array<TransitionRecord>} transitions
 * @param {Array<NegotiationOffer>} offers
 * @returns {boolean}
 */
export const isValidNegotiationOffersArray = (transitions, offers) => {
  const pickedTransitions = filterOfferTransitions(transitions, offerTransitions);
  const isOffersAnArray = !!offers && Array.isArray(offers);

  // First check if we have the same number of offers and transitions
  if (!isOffersAnArray || offers.length !== pickedTransitions.length) {
    return false;
  }

  // Then verify that each offer corresponds to the transition at the same index
  // and that the order matches
  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const transition = pickedTransitions[i];

    // Check if the offer's transition and actor match the transition at the same index
    if (offer.transition !== transition.transition || offer.by !== transition.by) {
      return false;
    }
  }

  return true;
};

/**
 * Checks if the state is a negotiation state.
 * Negotiation states are states where the user can make an offer.
 *
 * @param {string} state
 * @returns {boolean}
 */
export const isNegotiationState = state => {
  if (state == null) {
    return false;
  }
  const unprefixedState = state.indexOf('/') === -1 ? state : state.split('/')[1];
  return [states.OFFER_PENDING, states.CUSTOMER_OFFER_PENDING].includes(unprefixedState);
};

/**
 * Returns a new array of transitions with the offerInSubunits property added to the transitions that have a matching offer.
 *
 * @param {Array<TransitionRecord>} transitions
 * @param {Array<NegotiationOffer>} offers
 * @returns {Array<TransitionWithOfferInSubunitsRecord>}
 */
export const getTransitionsWithMatchingOffers = (transitions, offers) => {
  const isValidOffersArray = isValidNegotiationOffersArray(transitions, offers);
  if (isValidOffersArray) {
    const transitionsWithOffers = [];
    let offerIndex = 0;
    for (let i = 0; i < transitions.length; i++) {
      let transition = { ...transitions[i] };

      if (offerTransitions.includes(transition.transition)) {
        transition.offerInSubunits = offers[offerIndex]?.offerInSubunits;
        transitionsWithOffers.push(transition);
        offerIndex++;
      } else {
        transitionsWithOffers.push(transition);
      }
    }
    return transitionsWithOffers;
  }

  return transitions;
};

// Check if a transition is the kind that should be rendered
// when showing transition history (e.g. ActivityFeed)
// The first transition and most of the expiration transitions made by system are not relevant
export const isRelevantPastTransition = transition => {
  return [
    transitions.MAKE_OFFER,
    transitions.MAKE_OFFER_AFTER_INQUIRY,
    transitions.REQUEST_QUOTE,
    transitions.MAKE_OFFER_FROM_REQUEST,
    transitions.REJECT_REQUEST,
    transitions.WITHDRAW_REQUEST,
    transitions.OPERATOR_REJECT_REQUEST,
    transitions.OPERATOR_REJECT_OFFER,
    transitions.CUSTOMER_REJECT_OFFER,
    transitions.PROVIDER_WITHDRAW_OFFER,
    transitions.CUSTOMER_MAKE_COUNTER_OFFER,
    transitions.PROVIDER_MAKE_COUNTER_OFFER,
    transitions.PROVIDER_ACCEPT_COUNTER_OFFER,
    transitions.CUSTOMER_WITHDRAW_COUNTER_OFFER,
    transitions.OPERATOR_REJECT_FROM_CUSTOMER_COUNTER_OFFER,
    transitions.PROVIDER_REJECT_COUNTER_OFFER,
    transitions.EXPIRE_PAYMENT,
    transitions.CONFIRM_PAYMENT,
    transitions.AUTO_CANCEL,
    transitions.OPERATOR_CANCEL,
    transitions.DELIVER,
    transitions.OPERATOR_MARK_DELIVERED,
    transitions.REQUEST_CHANGES,
    transitions.OPERATOR_REQUEST_CHANGES,
    transitions.DELIVER_CHANGES,
    transitions.OPERATOR_MARK_CHANGES_DELIVERED,
    transitions.OPERATOR_CANCEL_FROM_DELIVERED,
    transitions.AUTO_CANCEL_FROM_CHANGES_REQUESTED,
    transitions.OPERATOR_CANCEL_FROM_CHANGES_REQUESTED,
    transitions.ACCEPT_DELIVERABLE,
    transitions.AUTO_ACCEPT_DELIVERABLE,
    transitions.OPERATOR_ACCEPT_DELIVERABLE,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_PROVIDER,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_2_BY_CUSTOMER,
  ].includes(transition);
};

// Processes might be different on how reviews are handled.
// Default processes use two-sided diamond shape, where either party can make the review first
export const isCustomerReview = transition => {
  return [transitions.REVIEW_1_BY_CUSTOMER, transitions.REVIEW_2_BY_CUSTOMER].includes(transition);
};

// Processes might be different on how reviews are handled.
// Default processes use two-sided diamond shape, where either party can make the review first
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
  return [
    transitions.MAKE_OFFER,
    transitions.MAKE_OFFER_AFTER_INQUIRY,
    transitions.MAKE_OFFER_FROM_REQUEST,
    transitions.CUSTOMER_MAKE_COUNTER_OFFER,
    transitions.PROVIDER_MAKE_COUNTER_OFFER,
    transitions.CUSTOMER_WITHDRAW_COUNTER_OFFER,
    transitions.PROVIDER_REJECT_COUNTER_OFFER,
  ].includes(transition);
};

// Check when transaction is completed (offer is received and review notifications sent)
export const isCompleted = transition => {
  const txCompletedTransitions = [
    transitions.ACCEPT_DELIVERABLE,
    transitions.AUTO_ACCEPT_DELIVERABLE,
    transitions.OPERATOR_ACCEPT_DELIVERABLE,
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

// Check when transaction is refunded (booking did not happen)
// In these transitions action/stripe-refund-payment is called
// NOTE: this functions is added just for the sake of consistency
export const isRefunded = transition => {
  const txRefundedTransitions = [
    transitions.EXPIRE_PAYMENT,
    transitions.AUTO_CANCEL,
    transitions.OPERATOR_CANCEL,
    transitions.OPERATOR_CANCEL_FROM_DELIVERED,
    transitions.AUTO_CANCEL_FROM_CHANGES_REQUESTED,
    transitions.OPERATOR_CANCEL_FROM_CHANGES_REQUESTED,
  ];
  return txRefundedTransitions.includes(transition);
};

export const statesNeedingProviderAttention = [
  states.QUOTE_REQUESTED,
  states.CUSTOMER_OFFER_PENDING,
  states.OFFER_ACCEPTED,
  states.CHANGES_REQUESTED,
];

export const statesNeedingCustomerAttention = [states.OFFER_PENDING, states.DELIVERED];
