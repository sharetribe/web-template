import React from 'react';

import { types as sdkTypes } from '../../../util/sdkLoader';
import {
  createListing,
  createUser,
  createCurrentUser,
  createMessage,
} from '../../../util/test-data';
import { renderShallow } from '../../../util/test-helpers';
import { fakeIntl } from '../../../util/test-data';

import { TransactionPanelComponent } from './TransactionPanel';

const noop = () => null;

const { UUID } = sdkTypes;

describe('TransactionPanel - Sale', () => {
  const providerId = 'provider';
  const customerId = 'customer';

  const panelBaseProps = {
    stateData: { processName: 'default-buying-products', processState: 'inquiry' },
    transactionId: new UUID('tx-id'),
    listing: createListing('listing1'),
    currentUser: createCurrentUser(providerId),
    transactionRole: 'provider',
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
    config: {
      layout: {
        listingImage: { aspectWidth: 1, aspectHeight: 1, variantPrefix: 'listing-card' },
      },
      localization: { locale: 'en' },
    },
  };

  it('inquired matches snapshot', () => {
    const props = {
      ...panelBaseProps,
    };
    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
});

describe('TransactionPanel - Order', () => {
  const providerId = 'provider';
  const customerId = 'customer';

  const panelBaseProps = {
    stateData: { processName: 'default-buying-products', processState: 'inquiry' },
    transactionId: new UUID('tx-id'),
    listing: createListing('listing1'),
    currentUser: createCurrentUser(customerId),
    transactionRole: 'customer',
    intl: fakeIntl,
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
    config: {
      layout: {
        listingImage: { aspectWidth: 1, aspectHeight: 1, variantPrefix: 'listing-card' },
      },
      localization: { locale: 'en' },
    },
  };

  it('inquired matches snapshot', () => {
    const props = {
      ...panelBaseProps,
    };

    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
});
