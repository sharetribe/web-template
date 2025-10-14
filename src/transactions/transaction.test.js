import { createUser, createTransaction, createListing, createTxTransition } from '../util/testData';

import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_SYSTEM,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
  getProcess,
} from './transaction';

describe('transaction utils for default-purchase', () => {
  const process = getProcess('default-purchase');
  const transitions = process?.transitions;
  const txHasBeenReceived = tx => process.hasPassedState(process.states.RECEIVED, tx);

  // transitions
  const transitionRequestPayment = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
    by: TX_TRANSITION_ACTOR_CUSTOMER,
    transition: transitions.REQUEST_PAYMENT,
  });

  const transitionConfirmPayment = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
    by: TX_TRANSITION_ACTOR_CUSTOMER,
    transition: transitions.CONFIRM_PAYMENT,
  });

  const transitionMarkDelivered = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
    by: TX_TRANSITION_ACTOR_PROVIDER,
    transition: transitions.MARK_DELIVERED,
  });

  const transitionMarkReceived = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
    by: TX_TRANSITION_ACTOR_CUSTOMER,
    transition: transitions.MARK_RECEIVED,
  });

  const transitionReviewed = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 16, 8, 12)),
    by: TX_TRANSITION_ACTOR_SYSTEM,
    transition: transitions.EXPIRE_REVIEW_PERIOD,
  });

  // transactions
  const txPurchased = createTransaction({
    lastTransition: transitions.CONFIRM_PAYMENT,
    customer: createUser('user1'),
    provider: createUser('user2'),
    listing: createListing('Listing'),
    transitions: [transitionRequestPayment, transitionConfirmPayment],
  });

  const txReceived = createTransaction({
    lastTransition: transitions.MARK_RECEIVED,
    customer: createUser('user1'),
    provider: createUser('user2'),
    listing: createListing('Listing'),
    transitions: [
      transitionRequestPayment,
      transitionConfirmPayment,
      transitionMarkDelivered,
      transitionMarkReceived,
    ],
  });

  const txReviewed = createTransaction({
    lastTransition: transitions.EXPIRE_REVIEW_PERIOD,
    customer: createUser('user1'),
    provider: createUser('user2'),
    listing: createListing('Listing'),
    transitions: [
      transitionRequestPayment,
      transitionConfirmPayment,
      transitionMarkDelivered,
      transitionMarkReceived,
      transitionReviewed,
    ],
  });

  describe('tx is in correct state', () => {
    const state = process.getState(txReviewed);
    it(`State is REVIEWED when lastTransition is ${transitions.EXPIRE_REVIEW_PERIOD}`, () => {
      expect(state === process.states.REVIEWED).toEqual(true);
    });
    it(`State is REVIEWED when lastTransition is ${transitions.CONFIRM_PAYMENT}`, () => {
      expect(state === process.states.PURCHASED).toEqual(false);
    });
  });

  describe('tx has passed a state X', () => {
    it('txHasBeenReceived(txPurchased) fails', () => {
      expect(txHasBeenReceived(txPurchased)).toEqual(false);
    });
    it('txHasBeenReceived(txReceived) succeeds', () => {
      expect(txHasBeenReceived(txReceived)).toEqual(true);
    });
    it('txHasBeenReceived(txReviewed) succeeds', () => {
      expect(txHasBeenReceived(txReviewed)).toEqual(true);
    });
  });
});

describe('transaction utils for default-booking', () => {
  const process = getProcess('default-booking');
  const transitions = process?.transitions;

  // const transitionConfirmPayment = createTxTransition({
  //   createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
  //   by: TX_TRANSITION_ACTOR_CUSTOMER,
  //   transition: transitions.CONFIRM_PAYMENT,
  // });

  // transitions
  const transitionRequestPayment = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
    by: TX_TRANSITION_ACTOR_CUSTOMER,
    transition: transitions.REQUEST_PAYMENT,
  });

  const transitionConfirmPayment = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
    by: TX_TRANSITION_ACTOR_CUSTOMER,
    transition: transitions.CONFIRM_PAYMENT,
  });

  const transitionAccept = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 9, 8, 12)),
    by: TX_TRANSITION_ACTOR_PROVIDER,
    transition: transitions.ACCEPT,
  });

  const transitionComplete = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 16, 8, 12)),
    by: TX_TRANSITION_ACTOR_SYSTEM,
    transition: transitions.COMPLETE,
  });
  const transitionReviewed = createTxTransition({
    createdAt: new Date(Date.UTC(2017, 10, 16, 8, 12)),
    by: TX_TRANSITION_ACTOR_SYSTEM,
    transition: transitions.EXPIRE_REVIEW_PERIOD,
  });

  // transactions
  const txPreauthorized = createTransaction({
    lastTransition: transitions.CONFIRM_PAYMENT,
    customer: createUser('user1'),
    provider: createUser('user2'),
    listing: createListing('Listing'),
    transitions: [transitionRequestPayment, transitionConfirmPayment],
  });

  const txAccepted = createTransaction({
    lastTransition: transitions.ACCEPT,
    customer: createUser('user1'),
    provider: createUser('user2'),
    listing: createListing('Listing'),
    transitions: [transitionRequestPayment, transitionConfirmPayment, transitionAccept],
  });

  const txCompleted = createTransaction({
    lastTransition: transitions.COMPLETE,
    customer: createUser('user1'),
    provider: createUser('user2'),
    listing: createListing('Listing'),
    transitions: [
      transitionRequestPayment,
      transitionConfirmPayment,
      transitionAccept,
      transitionComplete,
    ],
  });

  const txReviewed = createTransaction({
    lastTransition: transitions.EXPIRE_REVIEW_PERIOD,
    customer: createUser('user1'),
    provider: createUser('user2'),
    listing: createListing('Listing'),
    transitions: [
      transitionRequestPayment,
      transitionConfirmPayment,
      transitionAccept,
      transitionComplete,
      transitionReviewed,
    ],
  });

  describe('tx is in correct state', () => {
    const state = process.getState(txReviewed);
    it(`State is REVIEWED when lastTransition is ${transitions.EXPIRE_REVIEW_PERIOD}`, () => {
      expect(state === process.states.REVIEWED).toEqual(true);
    });
    it(`State is not REVIEWED when lastTransition is ${transitions.ACCEPT}`, () => {
      expect(state === process.states.PURCHASED).toEqual(false);
    });
  });

  describe('tx has passed a state X', () => {
    const txHasBeenAccepted = tx => process.hasPassedState(process.states.ACCEPTED, tx);
    const txHasBeenDelivered = tx => process.hasPassedState(process.states.DELIVERED, tx);

    it('txHasBeenAccepted(txPreauthorized) fails', () => {
      expect(txHasBeenAccepted(txPreauthorized)).toEqual(false);
    });
    it('txHasBeenDelivered(txPreauthorized) fails', () => {
      expect(txHasBeenDelivered(txPreauthorized)).toEqual(false);
    });

    it('txHasBeenAccepted(txAccepted) succeeds', () => {
      expect(txHasBeenAccepted(txAccepted)).toEqual(true);
    });
    it('txHasBeenDelivered(txAccepted) fails', () => {
      expect(txHasBeenDelivered(txAccepted)).toEqual(false);
    });

    it('txHasBeenAccepted(txReviewed) succeeds', () => {
      expect(txHasBeenAccepted(txReviewed)).toEqual(true);
    });
    it('txHasBeenDelivered(txReviewed) succeeds', () => {
      expect(txHasBeenDelivered(txReviewed)).toEqual(true);
    });
  });
});

describe('transaction utils for ConditionalResolver', () => {
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  it('exact parameter match succeeds', () => {
    const inputData = ['inquiry', 'customer'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .cond(['inquiry', 'customer'], () => ({ showInfoX: true, isSomethingOn: true }))
      .cond(['purchase', _], () => ({ showInfoX: false, isSomethingOn: true }))
      .default(() => ({ defaultValue: true }))
      .resolve();
    expect(resolvedOutputData).toEqual({ showInfoX: true, isSomethingOn: true });
  });

  it('exact parameter match succeeds when cond order is changed ', () => {
    const inputData = ['inquiry', 'customer'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .cond(['purchase', _], () => ({ showInfoX: false, isSomethingOn: true }))
      .cond(['inquiry', 'customer'], () => ({ showInfoX: true, isSomethingOn: true }))
      .default(() => ({ defaultValue: true }))
      .resolve();
    expect(resolvedOutputData).toEqual({ showInfoX: true, isSomethingOn: true });
  });

  it('partial parameters (wildcard) match succeeds', () => {
    const inputData = ['purchase', 'provider'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .cond(['inquiry', 'provider'], () => ({ showInfoX: true, isSomethingOn: true }))
      .cond(['purchase', 'customer'], () => ({ showInfoX: false, isSomethingOn: true }))
      .cond(['purchase', _], () => ({ showInfoX: false, isSomethingOn: true }))
      .default(() => ({ defaultValue: true }))
      .resolve();
    expect(resolvedOutputData).toEqual({ showInfoX: false, isSomethingOn: true });
  });

  it('Unknown parameters return default value', () => {
    const inputData = ['asdf', 'asdf'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .cond(['inquiry', 'customer'], () => ({ showInfoX: true, isSomethingOn: true }))
      .cond(['purchase', _], () => ({ showInfoX: false, isSomethingOn: true }))
      .default(() => ({ defaultValue: true }))
      .resolve();
    expect(resolvedOutputData).toEqual({ defaultValue: true });
  });

  it('Unknown parameters with plain wildcard conditions return correct value', () => {
    const inputData = ['asdf', 'asdf'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .cond([_, _], () => ({ wildcardDefault: true }))
      .default(() => ({ defaultValue: true }))
      .resolve();
    expect(resolvedOutputData).toEqual({ wildcardDefault: true });
  });

  it('Empty conditions array does not get picked', () => {
    const inputData = ['inquiry', 'customer'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .cond([], () => ({ showInfoX: true, isSomethingOn: true }))
      .default(() => ({ defaultValue: true }))
      .resolve();
    expect(resolvedOutputData).toEqual({ defaultValue: true });
  });

  it('Shorter conditions array does not get picked', () => {
    const inputData = ['inquiry', 'customer'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .cond(['inquiry'], () => ({ showInfoX: true, isSomethingOn: true }))
      .default(() => ({ defaultValue: true }))
      .resolve();
    expect(resolvedOutputData).toEqual({ defaultValue: true });
  });

  it('The order of default and cond functions does not affect', () => {
    const inputData = ['inquiry', 'customer'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .default(() => ({ defaultValue: true }))
      .cond(['inquiry', 'customer'], () => ({ showInfoX: true, isSomethingOn: true }))
      .cond(['purchase', _], () => ({ showInfoX: false, isSomethingOn: true }))
      .resolve();
    expect(resolvedOutputData).toEqual({ showInfoX: true, isSomethingOn: true });
  });

  it('Returns null if mismatching cond and no default method is set', () => {
    const inputData = ['inquiry', 'provider'];
    const resolvedOutputData = new ConditionalResolver(inputData)
      .cond(['inquiry', 'customer'], () => ({ showInfoX: true, isSomethingOn: true }))
      .resolve();
    expect(resolvedOutputData).toEqual(null);
  });

  it('Returns null if no cond or default method is set', () => {
    const inputData = ['inquiry', 'provider'];
    const resolvedOutputData = new ConditionalResolver(inputData).resolve();
    expect(resolvedOutputData).toEqual(null);
  });

  it('Throws an error if resolve is not positioned last in the chain', () => {
    const inputData = ['inquiry', 'customer'];
    const resolveOutputData = () =>
      new ConditionalResolver(inputData)
        .cond(['inquiry', 'customer'], () => ({ showInfoX: true, isSomethingOn: true }))
        .resolve()
        .default(() => ({ defaultValue: true }));
    expect(() => resolveOutputData()).toThrow(/is not a function/);
  });
});

describe('getTransitionsWithMatchingOffers', () => {
  const process = getProcess('default-negotiation');
  const negotiationTransitions = process?.transitions;

  // Create test transitions that match the negotiation offer transitions
  const createNegotiationTransition = (transition, by, createdAt = new Date()) => ({
    transition,
    by,
    createdAt: createdAt.toISOString(),
  });

  const makeOfferTransition = createNegotiationTransition(
    negotiationTransitions.MAKE_OFFER,
    TX_TRANSITION_ACTOR_PROVIDER
  );

  const customerCounterOfferTransition = createNegotiationTransition(
    negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
    TX_TRANSITION_ACTOR_CUSTOMER
  );

  const providerCounterOfferTransition = createNegotiationTransition(
    negotiationTransitions.PROVIDER_MAKE_COUNTER_OFFER,
    TX_TRANSITION_ACTOR_PROVIDER
  );

  const customerWithdrawCounterOfferTransition = createNegotiationTransition(
    negotiationTransitions.CUSTOMER_WITHDRAW_COUNTER_OFFER,
    TX_TRANSITION_ACTOR_CUSTOMER
  );

  const nonOfferTransition = createNegotiationTransition(
    negotiationTransitions.REQUEST_QUOTE,
    TX_TRANSITION_ACTOR_CUSTOMER
  );

  const transitionsWithOffers = [
    makeOfferTransition,
    customerCounterOfferTransition,
    providerCounterOfferTransition,
  ];

  const transitionsWithNonOffers = [
    nonOfferTransition,
    makeOfferTransition,
    customerCounterOfferTransition,
  ];

  const transitionsWithCustomerWithdraw = [
    makeOfferTransition,
    customerCounterOfferTransition,
    customerWithdrawCounterOfferTransition,
  ];

  const validOffers = [
    {
      transition: negotiationTransitions.MAKE_OFFER,
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 1000,
    },
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
    {
      transition: negotiationTransitions.PROVIDER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 950,
    },
  ];

  const validOffersPartial = [
    {
      transition: negotiationTransitions.MAKE_OFFER,
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 1000,
    },
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
  ];

  const invalidOffersWrongTransition = [
    {
      transition: 'wrong-transition',
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 1000,
    },
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
  ];

  const invalidOffersWrongActor = [
    {
      transition: negotiationTransitions.MAKE_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER, // Wrong actor
      offerInSubunits: 1000,
    },
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
  ];

  const invalidOffersWrongOrder = [
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER, // Wrong order
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
    {
      transition: negotiationTransitions.MAKE_OFFER, // Wrong order
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 1000,
    },
  ];

  describe('with valid offers array', () => {
    it('should add offerInSubunits to offer transitions in correct order', () => {
      const result = process.getTransitionsWithMatchingOffers(transitionsWithOffers, validOffers);

      expect(result).toHaveLength(3);
      expect(result[0].offerInSubunits).toBe(1000);
      expect(result[1].offerInSubunits).toBe(900);
      expect(result[2].offerInSubunits).toBe(950);
    });

    it('should add offerInSubunits to transitions including customer withdraw counter offer', () => {
      const offersWithCustomerWithdraw = [
        {
          transition: negotiationTransitions.MAKE_OFFER,
          by: TX_TRANSITION_ACTOR_PROVIDER,
          offerInSubunits: 1000,
        },
        {
          transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          offerInSubunits: 900,
        },
        {
          transition: negotiationTransitions.CUSTOMER_WITHDRAW_COUNTER_OFFER,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          offerInSubunits: 1000,
        },
      ];

      const result = process.getTransitionsWithMatchingOffers(
        transitionsWithCustomerWithdraw,
        offersWithCustomerWithdraw
      );

      expect(result).toHaveLength(3);
      expect(result[0].offerInSubunits).toBe(1000);
      expect(result[1].offerInSubunits).toBe(900);
      expect(result[2].offerInSubunits).toBe(1000);
    });

    it('should preserve all transition properties', () => {
      const result = process.getTransitionsWithMatchingOffers(transitionsWithOffers, validOffers);

      expect(result[0].transition).toBe(negotiationTransitions.MAKE_OFFER);
      expect(result[0].by).toBe(TX_TRANSITION_ACTOR_PROVIDER);
      expect(result[0].createdAt).toBeDefined();
      expect(result[0].offerInSubunits).toBe(1000);
    });

    it('should handle partial offers array by not adding offerInSubunits', () => {
      const result = process.getTransitionsWithMatchingOffers(
        transitionsWithOffers,
        validOffersPartial
      );

      expect(result).toHaveLength(3);
      expect(result[0].offerInSubunits).toBeUndefined();
      expect(result[1].offerInSubunits).toBeUndefined();
      expect(result[2].offerInSubunits).toBeUndefined();
    });

    it('should handle transitions with non-offer transitions mixed in', () => {
      const result = process.getTransitionsWithMatchingOffers(
        transitionsWithNonOffers,
        validOffersPartial
      );

      expect(result).toHaveLength(3);
      // First transition is non-offer transition (REQUEST_QUOTE) - should not have offerInSubunits
      expect(result[0].offerInSubunits).toBeUndefined();
      // Second transition is MAKE_OFFER - should have offerInSubunits
      expect(result[1].offerInSubunits).toBe(1000);
      // Third transition is CUSTOMER_MAKE_COUNTER_OFFER - should have offerInSubunits
      expect(result[2].offerInSubunits).toBe(900);
    });
  });

  describe('with invalid offers array', () => {
    it('should return original transitions when offers array is null', () => {
      const result = process.getTransitionsWithMatchingOffers(transitionsWithOffers, null);
      expect(result).toEqual(transitionsWithOffers);
    });

    it('should return original transitions when offers array is undefined', () => {
      const result = process.getTransitionsWithMatchingOffers(transitionsWithOffers, undefined);
      expect(result).toEqual(transitionsWithOffers);
    });

    it('should return original transitions when offers is not an array', () => {
      const result = process.getTransitionsWithMatchingOffers(
        transitionsWithOffers,
        'not-an-array'
      );
      expect(result).toEqual(transitionsWithOffers);
    });

    it('should return original transitions when offers length does not match', () => {
      const shortOffers = [validOffers[0]];
      const result = process.getTransitionsWithMatchingOffers(transitionsWithOffers, shortOffers);
      expect(result).toEqual(transitionsWithOffers);
    });

    it('should return original transitions when offers length is longer than transitions', () => {
      const longOffers = [
        ...validOffers,
        { transition: 'extra', by: 'customer', offerInSubunits: 500 },
      ];
      const result = process.getTransitionsWithMatchingOffers(transitionsWithOffers, longOffers);
      expect(result).toEqual(transitionsWithOffers);
    });

    it('should return original transitions when transition names do not match', () => {
      const result = process.getTransitionsWithMatchingOffers(
        transitionsWithOffers,
        invalidOffersWrongTransition
      );
      expect(result).toEqual(transitionsWithOffers);
    });

    it('should return original transitions when actors do not match', () => {
      const result = process.getTransitionsWithMatchingOffers(
        transitionsWithOffers,
        invalidOffersWrongActor
      );
      expect(result).toEqual(transitionsWithOffers);
    });

    it('should return original transitions when offer order does not match transition order', () => {
      const result = process.getTransitionsWithMatchingOffers(
        transitionsWithOffers,
        invalidOffersWrongOrder
      );
      expect(result).toEqual(transitionsWithOffers);
    });
  });

  describe('edge cases', () => {
    it('should handle empty transitions array', () => {
      const result = process.getTransitionsWithMatchingOffers([], []);
      expect(result).toEqual([]);
    });

    it('should handle empty offers array', () => {
      const result = process.getTransitionsWithMatchingOffers(transitionsWithOffers, []);
      expect(result).toEqual(transitionsWithOffers);
    });

    it('should handle transitions with no offer transitions', () => {
      const nonOfferTransitions = [nonOfferTransition, nonOfferTransition];
      const result = process.getTransitionsWithMatchingOffers(nonOfferTransitions, validOffers);
      expect(result).toEqual(nonOfferTransitions);
    });
  });

  describe('integration with isValidNegotiationOffersArray', () => {
    it('should work correctly when isValidNegotiationOffersArray returns true', () => {
      const result = process.getTransitionsWithMatchingOffers(transitionsWithOffers, validOffers);
      expect(result).not.toEqual(transitionsWithOffers); // Should be modified
      expect(result[0].offerInSubunits).toBeDefined();
    });

    it('should work correctly when isValidNegotiationOffersArray returns false', () => {
      const result = process.getTransitionsWithMatchingOffers(
        transitionsWithOffers,
        invalidOffersWrongTransition
      );
      expect(result).toEqual(transitionsWithOffers); // Should be unchanged
    });
  });
});

describe('isValidNegotiationOffersArray', () => {
  const process = getProcess('default-negotiation');
  const negotiationTransitions = process?.transitions;

  // Create test transitions that match the negotiation offer transitions
  const createNegotiationTransition = (transition, by, createdAt = new Date()) => ({
    transition,
    by,
    createdAt: createdAt.toISOString(),
  });

  const makeOfferTransition = createNegotiationTransition(
    negotiationTransitions.MAKE_OFFER,
    TX_TRANSITION_ACTOR_PROVIDER
  );

  const customerCounterOfferTransition = createNegotiationTransition(
    negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
    TX_TRANSITION_ACTOR_CUSTOMER
  );

  const providerCounterOfferTransition = createNegotiationTransition(
    negotiationTransitions.PROVIDER_MAKE_COUNTER_OFFER,
    TX_TRANSITION_ACTOR_PROVIDER
  );

  const customerWithdrawCounterOfferTransition = createNegotiationTransition(
    negotiationTransitions.CUSTOMER_WITHDRAW_COUNTER_OFFER,
    TX_TRANSITION_ACTOR_CUSTOMER
  );

  const nonOfferTransition = createNegotiationTransition(
    negotiationTransitions.REQUEST_QUOTE,
    TX_TRANSITION_ACTOR_CUSTOMER
  );

  const transitionsWithOffers = [
    makeOfferTransition,
    customerCounterOfferTransition,
    providerCounterOfferTransition,
  ];

  const transitionsWithNonOffers = [
    nonOfferTransition,
    makeOfferTransition,
    customerCounterOfferTransition,
    providerCounterOfferTransition,
  ];

  const transitionsWithCustomerWithdraw = [
    makeOfferTransition,
    customerCounterOfferTransition,
    customerWithdrawCounterOfferTransition,
  ];

  const validOffers = [
    {
      transition: negotiationTransitions.MAKE_OFFER,
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 1000,
    },
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
    {
      transition: negotiationTransitions.PROVIDER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 950,
    },
  ];

  const validOffersPartial = [
    {
      transition: negotiationTransitions.MAKE_OFFER,
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 1000,
    },
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
  ];

  const invalidOffersWrongTransition = [
    {
      transition: 'wrong-transition',
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 1000,
    },
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
  ];

  const invalidOffersWrongActor = [
    {
      transition: negotiationTransitions.MAKE_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER, // Wrong actor
      offerInSubunits: 1000,
    },
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
  ];

  const invalidOffersWrongOrder = [
    {
      transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER, // Wrong order
      by: TX_TRANSITION_ACTOR_CUSTOMER,
      offerInSubunits: 900,
    },
    {
      transition: negotiationTransitions.MAKE_OFFER, // Wrong order
      by: TX_TRANSITION_ACTOR_PROVIDER,
      offerInSubunits: 1000,
    },
  ];

  describe('with valid offers array', () => {
    it('should return true when offers array matches transitions array exactly', () => {
      const result = process.isValidNegotiationOffersArray(transitionsWithOffers, validOffers);
      expect(result).toBe(true);
    });

    it('should return true when offers array matches transitions array with customer withdraw', () => {
      const offersWithCustomerWithdraw = [
        {
          transition: negotiationTransitions.MAKE_OFFER,
          by: TX_TRANSITION_ACTOR_PROVIDER,
          offerInSubunits: 1000,
        },
        {
          transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          offerInSubunits: 900,
        },
        {
          transition: negotiationTransitions.CUSTOMER_WITHDRAW_COUNTER_OFFER,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          offerInSubunits: 1000,
        },
      ];

      const result = process.isValidNegotiationOffersArray(
        transitionsWithCustomerWithdraw,
        offersWithCustomerWithdraw
      );
      expect(result).toBe(true);
    });

    it('should return true when offers array matches transitions array with non-offer transitions mixed in', () => {
      const result = process.isValidNegotiationOffersArray(transitionsWithNonOffers, validOffers);
      expect(result).toBe(true);
    });

    it('should return true when offers array matches transitions array with only offer transitions', () => {
      const result = process.isValidNegotiationOffersArray(transitionsWithOffers, validOffers);
      expect(result).toBe(true);
    });
  });

  describe('with invalid offers array', () => {
    it('should return false when offers array is null', () => {
      const result = process.isValidNegotiationOffersArray(transitionsWithOffers, null);
      expect(result).toBe(false);
    });

    it('should return false when offers array is undefined', () => {
      const result = process.isValidNegotiationOffersArray(transitionsWithOffers, undefined);
      expect(result).toBe(false);
    });

    it('should return false when offers is not an array', () => {
      const result = process.isValidNegotiationOffersArray(transitionsWithOffers, 'not-an-array');
      expect(result).toBe(false);
    });

    it('should return false when offers length does not match transitions length', () => {
      const shortOffers = [validOffers[0]];
      const result = process.isValidNegotiationOffersArray(transitionsWithOffers, shortOffers);
      expect(result).toBe(false);
    });

    it('should return false when offers length is longer than transitions length', () => {
      const longOffers = [
        ...validOffers,
        { transition: 'extra', by: 'customer', offerInSubunits: 500 },
      ];
      const result = process.isValidNegotiationOffersArray(transitionsWithOffers, longOffers);
      expect(result).toBe(false);
    });

    it('should return false when transition names do not match', () => {
      const result = process.isValidNegotiationOffersArray(
        transitionsWithOffers,
        invalidOffersWrongTransition
      );
      expect(result).toBe(false);
    });

    it('should return false when actors do not match', () => {
      const result = process.isValidNegotiationOffersArray(
        transitionsWithOffers,
        invalidOffersWrongActor
      );
      expect(result).toBe(false);
    });

    it('should return false when offer order does not match transition order', () => {
      const result = process.isValidNegotiationOffersArray(
        transitionsWithOffers,
        invalidOffersWrongOrder
      );
      expect(result).toBe(false);
    });

    it('should return false when offers array is empty but transitions array has offer transitions', () => {
      const result = process.isValidNegotiationOffersArray(transitionsWithOffers, []);
      expect(result).toBe(false);
    });

    it('should return false when transitions array is empty but offers array has offers', () => {
      const result = process.isValidNegotiationOffersArray([], validOffers);
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return true when both arrays are empty', () => {
      const result = process.isValidNegotiationOffersArray([], []);
      expect(result).toBe(true);
    });

    it('should return true when transitions array has no offer transitions and offers array is empty', () => {
      const nonOfferTransitions = [nonOfferTransition, nonOfferTransition];
      const result = process.isValidNegotiationOffersArray(nonOfferTransitions, []);
      expect(result).toBe(true);
    });

    it('should return false when transitions array has no offer transitions but offers array has offers', () => {
      const nonOfferTransitions = [nonOfferTransition, nonOfferTransition];
      const result = process.isValidNegotiationOffersArray(nonOfferTransitions, validOffers);
      expect(result).toBe(false);
    });

    it('should handle transitions with mixed offer and non-offer transitions correctly', () => {
      const mixedTransitions = [
        nonOfferTransition,
        makeOfferTransition,
        nonOfferTransition,
        customerCounterOfferTransition,
      ];

      const mixedOffers = [
        {
          transition: negotiationTransitions.MAKE_OFFER,
          by: TX_TRANSITION_ACTOR_PROVIDER,
          offerInSubunits: 1000,
        },
        {
          transition: negotiationTransitions.CUSTOMER_MAKE_COUNTER_OFFER,
          by: TX_TRANSITION_ACTOR_CUSTOMER,
          offerInSubunits: 900,
        },
      ];

      const result = process.isValidNegotiationOffersArray(mixedTransitions, mixedOffers);
      expect(result).toBe(true);
    });
  });

  describe('integration with filterOfferTransitions', () => {
    it('should work correctly with the internal filterOfferTransitions function', () => {
      // This test ensures that the function correctly filters transitions
      // and validates against the filtered transitions, not the original array
      const transitionsWithExtraNonOffers = [
        nonOfferTransition,
        makeOfferTransition,
        nonOfferTransition,
        customerCounterOfferTransition,
        nonOfferTransition,
      ];

      const result = process.isValidNegotiationOffersArray(
        transitionsWithExtraNonOffers,
        validOffersPartial
      );
      expect(result).toBe(true);
    });
  });
});

describe('isNegotiationState', () => {
  const process = getProcess('default-negotiation');
  const negotiationStates = process?.states;

  describe('with unprefixed states', () => {
    it('should return true for OFFER_PENDING state', () => {
      const result = process.isNegotiationState(negotiationStates.OFFER_PENDING);
      expect(result).toBe(true);
    });

    it('should return true for CUSTOMER_OFFER_PENDING state', () => {
      const result = process.isNegotiationState(negotiationStates.CUSTOMER_OFFER_PENDING);
      expect(result).toBe(true);
    });

    it('should return false for other states', () => {
      const result1 = process.isNegotiationState(negotiationStates.INITIAL);
      const result2 = process.isNegotiationState(negotiationStates.INQUIRY);
      const result3 = process.isNegotiationState(negotiationStates.QUOTE_REQUESTED);
      const result4 = process.isNegotiationState(negotiationStates.OFFER_REJECTED);
      const result5 = process.isNegotiationState(negotiationStates.PENDING_PAYMENT);
      const result6 = process.isNegotiationState(negotiationStates.PAYMENT_EXPIRED);
      const result7 = process.isNegotiationState(negotiationStates.OFFER_ACCEPTED);
      const result8 = process.isNegotiationState(negotiationStates.CANCELED);
      const result9 = process.isNegotiationState(negotiationStates.DELIVERED);
      const result10 = process.isNegotiationState(negotiationStates.CHANGES_REQUESTED);
      const result11 = process.isNegotiationState(negotiationStates.COMPLETED);
      const result12 = process.isNegotiationState(negotiationStates.REVIEWED_BY_CUSTOMER);
      const result13 = process.isNegotiationState(negotiationStates.REVIEWED_BY_PROVIDER);
      const result14 = process.isNegotiationState(negotiationStates.REVIEWED);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
      expect(result4).toBe(false);
      expect(result5).toBe(false);
      expect(result6).toBe(false);
      expect(result7).toBe(false);
      expect(result8).toBe(false);
      expect(result9).toBe(false);
      expect(result10).toBe(false);
      expect(result11).toBe(false);
      expect(result12).toBe(false);
      expect(result13).toBe(false);
      expect(result14).toBe(false);
    });
  });

  describe('with prefixed states', () => {
    it('should return true for prefixed OFFER_PENDING state', () => {
      const result = process.isNegotiationState(`state/${negotiationStates.OFFER_PENDING}`);
      expect(result).toBe(true);
    });

    it('should return true for prefixed CUSTOMER_OFFER_PENDING state', () => {
      const result = process.isNegotiationState(
        `state/${negotiationStates.CUSTOMER_OFFER_PENDING}`
      );
      expect(result).toBe(true);
    });

    it('should return false for prefixed non-negotiation states', () => {
      const result1 = process.isNegotiationState(`state/${negotiationStates.INITIAL}`);
      const result2 = process.isNegotiationState(`state/${negotiationStates.COMPLETED}`);
      const result3 = process.isNegotiationState(`state/${negotiationStates.CANCELED}`);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = process.isNegotiationState('');
      expect(result).toBe(false);
    });

    it('should handle string with only forward slash', () => {
      const result = process.isNegotiationState('/');
      expect(result).toBe(false);
    });

    it('should handle string ending with forward slash', () => {
      const result = process.isNegotiationState('process/');
      expect(result).toBe(false);
    });

    it('should handle string starting with forward slash', () => {
      const result = process.isNegotiationState('/state');
      expect(result).toBe(false);
    });

    it('should handle null input', () => {
      const result = process.isNegotiationState(null);
      expect(result).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = process.isNegotiationState(undefined);
      expect(result).toBe(false);
    });
  });
});
