import React from 'react';
import { shallow } from 'enzyme';

import { types as sdkTypes } from '../../../util/sdkLoader';
import {
  createTxTransition,
  createTransaction,
  createBooking,
  createListing,
  createUser,
  createCurrentUser,
  createMessage,
} from '../../../util/test-data';
import { renderShallow } from '../../../util/test-helpers';
import { fakeIntl } from '../../../util/test-data';
import {
  TRANSITION_ENQUIRE,
  TRANSITION_REQUEST_PAYMENT,
  TRANSITION_CONFIRM_PAYMENT,
  TRANSITION_MARK_DELIVERED,
  TRANSITION_CANCEL,
  TRANSITION_MARK_RECEIVED,
} from '../../../util/transaction';

import BreakdownMaybe from './BreakdownMaybe';
import { TransactionPanelComponent } from './TransactionPanel';

const noop = () => null;

const { Money } = sdkTypes;

describe('TransactionPanel - Sale', () => {
  const providerId = 'provider';
  const customerId = 'customer';
  const start = new Date(Date.UTC(2017, 5, 10));
  const end = new Date(Date.UTC(2017, 5, 13));

  const baseTxAttrs = {
    total: new Money(16500, 'USD'),
    commission: new Money(1000, 'USD'),
    listing: createListing('listing1'),
    customer: createUser(customerId),
    provider: createUser(providerId),
    lastTransitionedAt: new Date(Date.UTC(2017, 5, 10)),
  };

  const txEnquired = createTransaction({
    id: 'sale-enquired',
    lastTransition: TRANSITION_ENQUIRE,
    ...baseTxAttrs,
  });

  const txPurchased = createTransaction({
    id: 'sale-purchased',
    lastTransition: TRANSITION_CONFIRM_PAYMENT,
    ...baseTxAttrs,
  });

  const txDelivered = createTransaction({
    id: 'sale-delivered',
    lastTransition: TRANSITION_MARK_DELIVERED,
    transitions: [
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: 'customer',
        transition: TRANSITION_REQUEST_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: 'customer',
        transition: TRANSITION_CONFIRM_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 5, 1)),
        by: 'provider',
        transition: TRANSITION_MARK_DELIVERED,
      }),
    ],
    ...baseTxAttrs,
  });

  const txCanceled = createTransaction({
    id: 'sale-canceled',
    lastTransition: TRANSITION_CANCEL,
    ...baseTxAttrs,
  });

  const txReceived = createTransaction({
    id: 'sale-received',
    lastTransition: TRANSITION_MARK_RECEIVED,
    transitions: [
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: 'customer',
        transition: TRANSITION_REQUEST_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: 'customer',
        transition: TRANSITION_CONFIRM_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 5, 1)),
        by: 'provider',
        transition: TRANSITION_MARK_DELIVERED,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 5, 1)),
        by: 'provider',
        transition: TRANSITION_MARK_RECEIVED,
      }),
    ],
    ...baseTxAttrs,
  });

  const panelBaseProps = {
    markReceivedFromPurchasedProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'mark received',
      errorText: 'mark received failed',
    },
    markDeliveredProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'mark delivered',
      errorText: 'mark delivered failed',
    },
    markReceivedProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'mark received',
      errorText: 'mark received failed',
    },
    disputeProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'dispute',
      errorText: 'dispute failed',
    },
    leaveReviewProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'leave review',
      errorText: 'leave review failed',
    },
    currentUser: createCurrentUser(providerId),
    totalMessages: 2,
    totalMessagePages: 1,
    oldestMessagePageFetched: 1,
    messages: [
      createMessage('msg1', {}, { sender: createUser(customerId) }),
      createMessage('msg2', {}, { sender: createUser(providerId) }),
    ],
    initialMessageFailed: false,
    fetchMessagesInProgress: false,
    sendMessageInProgress: false,
    sendReviewInProgress: false,
    onManageDisableScrolling: noop,
    onOpenReviewModal: noop,
    onOpenDisputeModal: noop,
    onShowMoreMessages: noop,
    onSendMessage: noop,
    onSendReview: noop,
    onResetForm: noop,
    onSubmitOrderRequest: noop,
    onFetchTransactionLineItems: noop,
    fetchLineItemsInProgress: false,
    intl: fakeIntl,
  };

  it('enquired matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txEnquired,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('purchased matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txPurchased,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('delivered matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txDelivered,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('canceled matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txCanceled,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('received matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txReceived,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
  it('renders correct total price', () => {
    const start = new Date(Date.UTC(2017, 5, 10));
    const end = new Date(Date.UTC(2017, 5, 13));

    const transaction = createTransaction({
      id: 'sale-tx',
      lastTransition: TRANSITION_REQUEST_PAYMENT,
      total: new Money(16500, 'USD'),
      commission: new Money(1000, 'USD'),
      listing: createListing('listing1'),
      customer: createUser('customer1'),
      provider: createUser('provider1'),
      lastTransitionedAt: new Date(Date.UTC(2017, 5, 10)),
    });
    const props = {
      ...panelBaseProps,
      transaction,
    };
    const panel = shallow(<TransactionPanelComponent {...props} />);
    const breakdownProps = panel
      .find(BreakdownMaybe)
      .first()
      .props();

    // Total price for the provider should be transaction total minus the commission.
    expect(breakdownProps.transaction.attributes.payoutTotal).toEqual(new Money(15500, 'USD'));
  });
});

describe('TransactionPanel - Order', () => {
  const providerId = 'provider';
  const customerId = 'customer';
  const start = new Date(Date.UTC(2017, 5, 10));
  const end = new Date(Date.UTC(2017, 5, 13));
  const baseTxAttrs = {
    total: new Money(16500, 'USD'),
    booking: createBooking('booking1', {
      start,
      end,
      displayStart: start,
      displayEnd: end,
    }),
    listing: createListing('listing1'),
    provider: createUser(providerId),
    customer: createUser(customerId),
  };

  const txEnquired = createTransaction({
    id: 'order-enquired',
    lastTransition: TRANSITION_ENQUIRE,
    ...baseTxAttrs,
  });

  const txPurchased = createTransaction({
    id: 'order-purchased',
    lastTransition: TRANSITION_CONFIRM_PAYMENT,
    ...baseTxAttrs,
  });

  const txDelivered = createTransaction({
    id: 'order-delivered',
    lastTransition: TRANSITION_MARK_DELIVERED,
    transitions: [
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: 'customer',
        transition: TRANSITION_REQUEST_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: 'customer',
        transition: TRANSITION_CONFIRM_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 5, 1)),
        by: 'provider',
        transition: TRANSITION_MARK_DELIVERED,
      }),
    ],
    ...baseTxAttrs,
  });

  const txCanceled = createTransaction({
    id: 'order-canceled',
    lastTransition: TRANSITION_CANCEL,
    ...baseTxAttrs,
  });

  const txReceived = createTransaction({
    id: 'order-received',
    lastTransition: TRANSITION_MARK_RECEIVED,
    transitions: [
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: 'customer',
        transition: TRANSITION_REQUEST_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 4, 1)),
        by: 'customer',
        transition: TRANSITION_CONFIRM_PAYMENT,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 5, 1)),
        by: 'provider',
        transition: TRANSITION_MARK_DELIVERED,
      }),
      createTxTransition({
        createdAt: new Date(Date.UTC(2017, 5, 1)),
        by: 'provider',
        transition: TRANSITION_MARK_RECEIVED,
      }),
    ],
    ...baseTxAttrs,
  });

  const panelBaseProps = {
    markReceivedFromPurchasedProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'mark received',
      errorText: 'mark received failed',
    },
    markDeliveredProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'mark delivered',
      errorText: 'mark delivered failed',
    },
    markReceivedProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'mark received',
      errorText: 'mark received failed',
    },
    disputeProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'dispute',
      errorText: 'dispute failed',
    },
    leaveReviewProps: {
      inProgress: false,
      error: null,
      onTransition: noop,
      buttonText: 'leave review',
      errorText: 'leave review failed',
    },
    intl: fakeIntl,
    currentUser: createCurrentUser(customerId),
    totalMessages: 2,
    totalMessagePages: 1,
    oldestMessagePageFetched: 1,
    messages: [
      createMessage('msg1', {}, { sender: createUser(customerId) }),
      createMessage('msg2', {}, { sender: createUser(providerId) }),
    ],
    initialMessageFailed: false,
    fetchMessagesInProgress: false,
    sendMessageInProgress: false,
    sendReviewInProgress: false,
    onManageDisableScrolling: noop,
    onOpenReviewModal: noop,
    onOpenDisputeModal: noop,
    onShowMoreMessages: noop,
    onSendMessage: noop,
    onSendReview: noop,
    onResetForm: noop,
    onSubmitOrderRequest: noop,
    onFetchTransactionLineItems: noop,
    fetchLineItemsInProgress: false,
  };

  it('enquired matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txEnquired,
    };

    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('purchased matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txPurchased,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('delivered matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txDelivered,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('canceled matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txCanceled,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('received matches snapshot', () => {
    const props = {
      ...panelBaseProps,
      transaction: txReceived,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('renders correct total price', () => {
    const start = new Date(Date.UTC(2017, 5, 10));
    const end = new Date(Date.UTC(2017, 5, 13));
    const tx = createTransaction({
      id: 'order-tx',
      lastTransition: TRANSITION_REQUEST_PAYMENT,
      total: new Money(16500, 'USD'),
      booking: createBooking('booking1', {
        start,
        end,
        displayStart: start,
        displayEnd: end,
      }),
      listing: createListing('listing1'),
      provider: createUser(providerId),
      customer: createUser(customerId),
    });
    const props = {
      ...panelBaseProps,
      transaction: tx,
    };
    const panel = shallow(<TransactionPanelComponent {...props} />);
    const breakdownProps = panel
      .find(BreakdownMaybe)
      .first()
      .props();
    expect(breakdownProps.transaction.attributes.payinTotal).toEqual(new Money(16500, 'USD'));
  });
});
