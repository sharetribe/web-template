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
