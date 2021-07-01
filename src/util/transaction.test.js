import { createUser, createTransaction, createListing, createTxTransition } from './test-data';

import {
  TRANSITION_CONFIRM_PAYMENT,
  TRANSITION_EXPIRE_REVIEW_PERIOD,
  TRANSITION_MARK_DELIVERED,
  TRANSITION_MARK_RECEIVED,
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_SYSTEM,
  txHasBeenReceived,
  txIsPurchased,
  txIsReviewed,
} from './transaction';

// transitions
const transitionConfirmPayment = createTxTransition({
  createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
  by: TX_TRANSITION_ACTOR_CUSTOMER,
  transition: TRANSITION_CONFIRM_PAYMENT,
});
const transitionMarkDelivered = createTxTransition({
  createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
  by: TX_TRANSITION_ACTOR_PROVIDER,
  transition: TRANSITION_MARK_DELIVERED,
});
const transitionMarkReceived = createTxTransition({
  createdAt: new Date(Date.UTC(2017, 10, 9, 8, 10)),
  by: TX_TRANSITION_ACTOR_CUSTOMER,
  transition: TRANSITION_MARK_RECEIVED,
});

const transitionReviewed = createTxTransition({
  createdAt: new Date(Date.UTC(2017, 10, 16, 8, 12)),
  by: TX_TRANSITION_ACTOR_SYSTEM,
  transition: TRANSITION_EXPIRE_REVIEW_PERIOD,
});

// transactions
const txPurchased = createTransaction({
  lastTransition: TRANSITION_CONFIRM_PAYMENT,
  customer: createUser('user1'),
  provider: createUser('user2'),
  listing: createListing('Listing'),
  transitions: [transitionConfirmPayment],
});

const txReceived = createTransaction({
  lastTransition: TRANSITION_MARK_RECEIVED,
  customer: createUser('user1'),
  provider: createUser('user2'),
  listing: createListing('Listing'),
  transitions: [transitionConfirmPayment, transitionMarkDelivered, transitionMarkReceived],
});

const txReviewed = createTransaction({
  lastTransition: TRANSITION_EXPIRE_REVIEW_PERIOD,
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
    it(`txIsReviewed(txReviewed) succeeds with last transaction: ${TRANSITION_EXPIRE_REVIEW_PERIOD}`, () => {
      expect(txIsReviewed(txReviewed)).toEqual(true);
    });
    it(`txIsPurchased(txReviewed) fails with last transaction: ${TRANSITION_EXPIRE_REVIEW_PERIOD}`, () => {
      expect(txIsPurchased(txReviewed)).toEqual(false);
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
