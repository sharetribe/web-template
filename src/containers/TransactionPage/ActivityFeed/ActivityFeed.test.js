import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import {
  fakeIntl,
  createUser,
  createCurrentUser,
  createMessage,
  createListing,
  createTransaction,
} from '../../../util/testData';
import { TX_TRANSITION_ACTOR_CUSTOMER, getProcess } from '../../../transactions/transaction';

import { ActivityFeed } from './ActivityFeed';

const processTransitions = getProcess('default-purchase')?.transitions;

const { screen, within } = testingLibrary;
const noop = () => null;

export const createTxTransition = options => {
  return {
    createdAt: new Date(Date.UTC(2023, 4, 1)),
    by: TX_TRANSITION_ACTOR_CUSTOMER,
    transition: processTransitions.REQUEST_PAYMENT,
    ...options,
  };
};

describe('ActivityFeed', () => {
  it('verify that messages and relevant transition are shown', () => {
    const customer = createUser('user1');
    const provider = createUser('user2');
    const listing = createListing('listing');
    const props = {
      messages: [
        createMessage(
          'msg1',
          { content: 'message 1', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
          { sender: customer }
        ),
        createMessage(
          'msg2',
          { content: 'message 2', createdAt: new Date(Date.UTC(2023, 10, 10, 8, 12)) },
          { sender: provider }
        ),
      ],
      transaction: createTransaction({
        id: 'tx1',
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 4, 1)),
        transitions: [
          createTxTransition({
            createdAt: new Date(Date.UTC(2023, 4, 1)),
            by: TX_TRANSITION_ACTOR_CUSTOMER,
            transition: processTransitions.REQUEST_PAYMENT,
          }),
          createTxTransition({
            createdAt: new Date(Date.UTC(2023, 4, 1, 0, 0, 1)),
            by: TX_TRANSITION_ACTOR_CUSTOMER,
            transition: processTransitions.CONFIRM_PAYMENT,
          }),
        ],
      }),
      stateData: {
        processName: 'default-purchase',
        processState: 'inquiry',
      },
      currentUser: createCurrentUser('user2'),
      hasOlderMessages: false,
      fetchMessagesInProgress: false,
      onOpenReviewModal: noop,
      onShowOlderMessages: noop,
      intl: fakeIntl,
    };

    render(<ActivityFeed {...props} />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    const fragment = within(list);
    const items = fragment.getAllByRole('listitem');
    // 1 transition and 2 messages
    expect(items.length).toBe(3);

    // Find processTransitions.CONFIRM_PAYMENT
    // The first relevant transition in the process
    const firstLI = within(items[0]);
    expect(
      firstLI.getByText('TransactionPage.ActivityFeed.default-purchase.purchased')
    ).toBeInTheDocument();
    expect(firstLI.getByText('2023-05-01')).toBeInTheDocument();

    // Find first message
    const firstMsg = within(items[1]);
    expect(firstMsg.getByText('message 1')).toBeInTheDocument();
    expect(firstMsg.getByText('2023-11-09')).toBeInTheDocument();

    // Find first message
    const secondMsg = within(items[2]);
    expect(secondMsg.getByText('message 2')).toBeInTheDocument();
    expect(secondMsg.getByText('2023-11-10')).toBeInTheDocument();
  });
});
