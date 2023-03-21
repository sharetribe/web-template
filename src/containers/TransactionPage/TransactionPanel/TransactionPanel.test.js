import React from 'react';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../../util/sdkLoader';
import {
  createListing,
  createUser,
  createCurrentUser,
  createMessage,
  fakeIntl,
} from '../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';

import { TransactionPanelComponent } from './TransactionPanel';

const { screen } = testingLibrary;
const { UUID } = sdkTypes;

const noop = () => null;

describe('TransactionPanel - Sale', () => {
  const providerId = 'provider';
  const customerId = 'customer';

  const panelBaseProps = {
    stateData: { processName: 'default-purchase', processState: 'inquiry' },
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

  test('Inquired is shown', () => {
    render(<TransactionPanelComponent {...panelBaseProps} />);

    const providerTitle = 'TransactionPage.default-purchase.provider.inquiry.title';
    expect(screen.getByText(providerTitle)).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('TransactionPanel.sendMessagePlaceholder')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SendMessageForm.sendMessage' })
    ).toBeInTheDocument();
  });
});

describe('TransactionPanel - Order', () => {
  const providerId = 'provider';
  const customerId = 'customer';

  const panelBaseProps = {
    stateData: { processName: 'default-purchase', processState: 'inquiry' },
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

  test('Inquired is shown', () => {
    render(<TransactionPanelComponent {...panelBaseProps} />);

    const customerTitle = 'TransactionPage.default-purchase.customer.inquiry.title';
    expect(screen.getByText(customerTitle)).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('TransactionPanel.sendMessagePlaceholder')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SendMessageForm.sendMessage' })
    ).toBeInTheDocument();
  });
});
