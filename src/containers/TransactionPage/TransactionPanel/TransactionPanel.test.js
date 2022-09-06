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
    stateData: { processName: 'flex-product-default-process', processState: 'enquiry' },
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
      listing: { aspectWidth: 1, aspectHeight: 1, listingPrefix: 'listing-card' },
      localization: { locale: 'en' },
    },
  };

  it('enquired matches snapshot', () => {
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
    stateData: { processName: 'flex-product-default-process', processState: 'enquiry' },
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
      listing: { aspectWidth: 1, aspectHeight: 1, variantPrefix: 'listing-card' },
      localization: { locale: 'en' },
    },
  };

  it('enquired matches snapshot', () => {
    const props = {
      ...panelBaseProps,
    };

    const tree = renderShallow(<TransactionPanelComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
});
