import React from 'react';
import {
  createCurrentUser,
  createListing,
  createTransaction,
  createUser,
  fakeIntl,
} from '../../util/test-data';
import { renderShallow } from '../../util/test-helpers';
import { TRANSITION_CONFIRM_PAYMENT } from '../../util/transaction';
import { TransactionPageComponent } from './TransactionPage';

const noop = () => null;

describe('TransactionPage - Sale', () => {
  it('matches snapshot', () => {
    const txId = 'tx-sale-1';
    const start = new Date(Date.UTC(2017, 5, 10));
    const end = new Date(Date.UTC(2017, 5, 13));
    const transaction = createTransaction({
      id: txId,
      lastTransition: TRANSITION_CONFIRM_PAYMENT,
      listing: createListing('listing1'),
      customer: createUser('customer1'),
      provider: createUser('provider1'),
    });

    const props = {
      params: { id: txId },
      transactionRole: 'provider',

      currentUser: createCurrentUser('provider1'),
      markReceivedFromPurchaseInProgress: false,
      onMarkReceivedFromPurchase: noop,
      markDeliveredInProgress: false,
      onMarkDelivered: noop,
      scrollingDisabled: false,
      callSetInitialValues: noop,
      transaction,
      totalMessages: 0,
      totalMessagePages: 0,
      oldestMessagePageFetched: 0,
      messages: [],
      sendMessageInProgress: false,
      onInitializeCardPaymentData: noop,
      onShowMoreMessages: noop,
      onSendMessage: noop,
      onResetForm: noop,
      onFetchTransactionLineItems: noop,
      fetchLineItemsInProgress: false,
      intl: fakeIntl,

      location: {
        pathname: `/sale/${txId}/details`,
        search: '',
        hash: '',
      },
      history: {
        push: () => console.log('HistoryPush called'),
      },
    };

    const tree = renderShallow(<TransactionPageComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
});

describe('TransactionPage - Order', () => {
  it('matches snapshot', () => {
    const txId = 'tx-order-1';
    const start = new Date(Date.UTC(2017, 5, 10));
    const end = new Date(Date.UTC(2017, 5, 13));

    const transaction = createTransaction({
      id: txId,
      lastTransition: TRANSITION_CONFIRM_PAYMENT,
      listing: createListing('listing1'),
      customer: createUser('customer1'),
      provider: createUser('provider1'),
    });

    const props = {
      params: { id: txId },
      transactionRole: 'customer',

      currentUser: createCurrentUser('customer1'),
      totalMessages: 0,
      totalMessagePages: 0,
      oldestMessagePageFetched: 0,
      messages: [],
      fetchMessagesInProgress: false,
      sendMessageInProgress: false,
      scrollingDisabled: false,
      callSetInitialValues: noop,
      transaction,
      onInitializeCardPaymentData: noop,
      onShowMoreMessages: noop,
      onSendMessage: noop,
      onResetForm: noop,
      onFetchTransactionLineItems: noop,
      fetchLineItemsInProgress: false,
      intl: fakeIntl,

      markReceivedFromPurchaseInProgress: false,
      onMarkReceivedFromPurchase: noop,
      markDeliveredInProgress: false,
      onMarkDelivered: noop,

      location: {
        pathname: `/order/${txId}/details`,
        search: '',
        hash: '',
      },
      history: {
        push: () => console.log('HistoryPush called'),
      },
    };

    const tree = renderShallow(<TransactionPageComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
});
