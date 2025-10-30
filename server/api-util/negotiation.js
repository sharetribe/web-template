// default-negotiation process: transitions that make the first offer
const makeOfferTransitions = [
  'transition/make-offer',
  'transition/make-offer-after-inquiry',
  'transition/make-offer-from-request',
];

// default-negotiation process: transitions that make a counter offer
const counterOfferTransitions = [
  'transition/customer-make-counter-offer',
  'transition/provider-make-counter-offer',
];

// default-negotiation process: transitions that revoke a counter offer
const revokeCounterOfferTransitions = [
  'transition/customer-withdraw-counter-offer',
  'transition/provider-reject-counter-offer',
];

// default-negotiation process: transitions that affect pricing on negotiation loop
const offerTransitionsInNegotiationProcess = [
  ...makeOfferTransitions,
  ...counterOfferTransitions,
  ...revokeCounterOfferTransitions,
];

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
 * Checks if the transition is a make offer transition and if the offer is greater than 0.
 *
 * @param {number} offerInSubunits
 * @param {string} transitionName
 * @returns {boolean}
 */
exports.isIntentionToMakeOffer = (offerInSubunits, transitionName) => {
  const isIntentionToMakeOffer = makeOfferTransitions.includes(transitionName);
  const hasOffer = offerInSubunits > 0;
  return isIntentionToMakeOffer && hasOffer;
};
/**
 * Checks if the transition is a make counter offer transition and if the offer is greater than 0.
 *
 * @param {number} offerInSubunits
 * @param {string} transitionName
 * @returns {boolean}
 */
exports.isIntentionToMakeCounterOffer = (offerInSubunits, transitionName) => {
  const isIntentionToMakeCounterOffer = counterOfferTransitions.includes(transitionName);
  const hasOffer = offerInSubunits > 0;
  return isIntentionToMakeCounterOffer && hasOffer;
};
/**
 * Checks if the transition is a revoke counter offer transition.
 *
 * @param {string} transitionName
 * @returns {boolean}
 */
exports.isIntentionToRevokeCounterOffer = transitionName => {
  return revokeCounterOfferTransitions.includes(transitionName);
};

const filterRelevantTransitions = (transitions, relevantTransitions) => {
  return transitions.filter(t => relevantTransitions.includes(t.transition));
};
const isValidNegotiationOffersArray = (offers, transitions, relevantTransitions) => {
  const pickedTransitions = filterRelevantTransitions(transitions, relevantTransitions);
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
 * Throws an error if the negotiation offers array is invalid.
 * Validation is done by reducing transitions array to only include relevant transitions (that set offers)
 * and then checking that transitions match with the offers array.
 *
 * @param {string} transitionName
 * @param {Array<NegotiationOffer>} offers - Array of negotiation offers
 * @param {Array<TransitionRecord>} transitions - Array of transition records
 */
exports.throwErrorIfNegotiationOfferHasInvalidHistory = (transitionName, offers, transitions) => {
  // const isNegotiationProcess = transaction.attributes.processName === 'default-negotiation';
  const isRelevantTransition = offerTransitionsInNegotiationProcess.includes(transitionName);

  if (
    isRelevantTransition &&
    !isValidNegotiationOffersArray(offers, transitions, offerTransitionsInNegotiationProcess)
  ) {
    const error = new Error('Past negotiation offers are invalid');
    error.status = 400;
    error.statusText = 'Past negotiation offers are invalid';
    error.data = {
      offers: offers,
      relevantTransitions: filterRelevantTransitions(
        transitions,
        offerTransitionsInNegotiationProcess
      ),
    };
    throw error;
  }
};

const getPreviousOffer = offers => {
  if (offers?.length < 2) {
    const error = new Error('Past negotiation offers are invalid');
    error.status = 400;
    error.statusText = 'Past negotiation offers are invalid';
    error.data = {
      offers: offers,
    };
    throw error;
  }
  return offers[offers.length - 2];
};

/**
 * Returns the offerInSubunits from the previous offer.
 *
 * @param {Array<NegotiationOffer>} offers - Array of negotiation offers
 * @returns {number} offer from the previous offer (in subunits)
 */
exports.getAmountFromPreviousOffer = offers => {
  const offer = getPreviousOffer(offers);
  return offer.offerInSubunits;
};

/**
 * Adds an offer to the offers array in the metadata of a transaction.
 *
 * @param {Object} metadata - Transaction's metadata object
 * @param {NegotiationOffer} offer - The offer to add to the metadata
 * @returns {Object} The updated metadata object
 */
exports.addOfferToMetadata = (metadata, offer) => {
  const existingOffers = metadata?.offers || [];
  return !!offer && metadata
    ? {
        metadata: {
          ...metadata,
          offers: [...existingOffers, offer],
        },
      }
    : metadata
    ? { metadata }
    : {};
};
