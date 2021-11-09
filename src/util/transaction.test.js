import { createUser, createTransaction, createListing, createTxTransition } from './test-data';

import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_SYSTEM,
  getProcess,
} from './transaction';

const process = getProcess('flex-product-default-process');
const transitions = process?.transitions;
const txHasBeenReceived = tx => process.hasPassedState(process.states.RECEIVED, tx);

// transitions
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
  transitions: [transitionConfirmPayment],
});

const txReceived = createTransaction({
  lastTransition: transitions.MARK_RECEIVED,
  customer: createUser('user1'),
  provider: createUser('user2'),
  listing: createListing('Listing'),
  transitions: [transitionConfirmPayment, transitionMarkDelivered, transitionMarkReceived],
});

const txReviewed = createTransaction({
  lastTransition: transitions.EXPIRE_REVIEW_PERIOD,
  customer: createUser('user1'),
  provider: createUser('user2'),
  listing: createListing('Listing'),
  transitions: [
    transitionConfirmPayment,
    transitionMarkDelivered,
    transitionMarkReceived,
    transitionReviewed,
  ],
});

describe('transaction utils', () => {
  describe('tx is in correct state', () => {
    const state = process.getState(txReviewed);
    it(`State is REVIEWED when lastTransition is ${transitions.EXPIRE_REVIEW_PERIOD}`, () => {
      expect(state === process.states.REVIEWED).toEqual(true);
    });
    it(`State is REVIEWED when lastTransition is  ${transitions.PURCHASED}`, () => {
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
