import React from 'react';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../../util/sdkLoader';
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
const { UUID } = sdkTypes;

const { screen, within, fireEvent } = testingLibrary;
const noop = () => null;

const createFileAttachment = (id, fileName) => ({
  id: new UUID(id),
  file: {
    attributes: {
      name: fileName,
      state: 'available',
      deleted: false,
      size: 100 * 1024,
    },
  },
});

const createPendingFileAttachment = (id, fileName) => ({
  id: new UUID(id),
  file: {
    attributes: {
      name: fileName,
      state: 'pendingVerification',
      deleted: false,
      size: 100 * 1024,
    },
  },
});

const createFailedFileAttachment = (id, fileName) => ({
  id: new UUID(id),
  file: {
    attributes: {
      name: fileName,
      state: 'verificationFailed',
      deleted: false,
      size: 100 * 1024,
    },
  },
});

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

  it('hide message if the sender is banned', () => {
    const customer = createUser('user1', { banned: true });
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
            transition: processTransitions.INQUIRE,
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
    expect(items.length).toBe(2);

    // Ensure that first message sent by a banned user
    // is replaced with marketplace text key
    const firstMsg = within(items[0]);
    expect(firstMsg.getByText('TransactionPage.messageSenderBanned')).toBeInTheDocument();
    expect(firstMsg.getByText('2023-11-09')).toBeInTheDocument();

    // Find second message
    const secondMsg = within(items[1]);
    expect(secondMsg.getByText('message 2')).toBeInTheDocument();
    expect(secondMsg.getByText('2023-11-10')).toBeInTheDocument();
  });
});

describe('ActivityFeed file display and download', () => {
  it('own message with one attached file renders the file name and icon', () => {
    const customer = createUser('user1');
    const provider = createUser('user2');
    const listing = createListing('listing');

    const props = {
      messages: [
        createMessage(
          'msg1',
          { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
          { sender: provider, publicFiles: [createFileAttachment('pf1', 'invoice.pdf')] }
        ),
      ],
      transaction: createTransaction({
        id: 'tx1',
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 4, 1)),
        transitions: [],
      }),
      stateData: { processName: 'default-purchase', processState: 'inquiry' },
      currentUser: createCurrentUser('user2'),
      hasOlderMessages: false,
      fetchMessagesInProgress: false,
      onOpenReviewModal: noop,
      onShowOlderMessages: noop,
      onDownloadFile: noop,
      intl: fakeIntl,
    };

    render(<ActivityFeed {...props} />);

    expect(screen.getByText('invoice')).toBeInTheDocument();
    expect(screen.getByText('.pdf')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Message.downloadFile' })).toBeInTheDocument();
  });

  it('own message with no publicFiles array renders no file links', () => {
    const customer = createUser('user1');
    const provider = createUser('user2');
    const listing = createListing('listing');
    const props = {
      messages: [
        createMessage(
          'msg1',
          { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
          { sender: provider, publicFiles: [] }
        ),
      ],
      transaction: createTransaction({
        id: 'tx1',
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 4, 1)),
        transitions: [],
      }),
      stateData: { processName: 'default-purchase', processState: 'inquiry' },
      currentUser: createCurrentUser('user2'),
      hasOlderMessages: false,
      fetchMessagesInProgress: false,
      onOpenReviewModal: noop,
      onShowOlderMessages: noop,
      onDownloadFile: noop,
      intl: fakeIntl,
    };

    render(<ActivityFeed {...props} />);

    expect(screen.queryByRole('img', { name: 'Message.downloadFile' })).not.toBeInTheDocument();
  });

  it('own message with multiple attached files renders all file names and icons', () => {
    const customer = createUser('user1');
    const provider = createUser('user2');
    const listing = createListing('listing');

    const props = {
      messages: [
        createMessage(
          'msg1',
          { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
          {
            sender: provider,
            publicFiles: [
              createFileAttachment('pf1', 'invoice.pdf'),
              createFileAttachment('pf2', 'photo.jpg'),
            ],
          }
        ),
      ],
      transaction: createTransaction({
        id: 'tx1',
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 4, 1)),
        transitions: [],
      }),
      stateData: { processName: 'default-purchase', processState: 'inquiry' },
      currentUser: createCurrentUser('user2'),
      hasOlderMessages: false,
      fetchMessagesInProgress: false,
      onOpenReviewModal: noop,
      onShowOlderMessages: noop,
      onDownloadFile: noop,
      intl: fakeIntl,
    };

    render(<ActivityFeed {...props} />);

    expect(screen.getByText('invoice')).toBeInTheDocument();
    expect(screen.getByText('photo')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Message.downloadFile' })).toHaveLength(2);
  });

  it('message from another user renders file links when publicFiles is present', () => {
    const customer = createUser('user1');
    const provider = createUser('user2');
    const listing = createListing('listing');

    const props = {
      messages: [
        createMessage(
          'msg1',
          { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
          { sender: customer, publicFiles: [createFileAttachment('pf1', 'spec.pdf')] }
        ),
      ],
      transaction: createTransaction({
        id: 'tx1',
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 4, 1)),
        transitions: [],
      }),
      stateData: { processName: 'default-purchase', processState: 'inquiry' },
      currentUser: createCurrentUser('user2'),
      hasOlderMessages: false,
      fetchMessagesInProgress: false,
      onOpenReviewModal: noop,
      onShowOlderMessages: noop,
      onDownloadFile: noop,
      intl: fakeIntl,
    };

    render(<ActivityFeed {...props} />);

    expect(screen.getByText('spec')).toBeInTheDocument();
  });

  it('only clicking a file link calls onDownloadFile with the fileAttachmentId', () => {
    const onDownloadFile = jest.fn();

    const customer = createUser('user1');
    const provider = createUser('user2');
    const listing = createListing('listing');
    const props = {
      messages: [
        createMessage(
          'msg1',
          { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
          { sender: provider, publicFiles: [createFileAttachment('pf-uuid-1', 'report.pdf')] }
        ),
      ],
      transaction: createTransaction({
        id: 'tx1',
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 4, 1)),
        transitions: [],
      }),
      stateData: { processName: 'default-purchase', processState: 'inquiry' },
      currentUser: createCurrentUser('user2'),
      hasOlderMessages: false,
      fetchMessagesInProgress: false,
      onOpenReviewModal: noop,
      onShowOlderMessages: noop,
      onDownloadFile,
      intl: fakeIntl,
    };

    render(<ActivityFeed {...props} />);

    expect(onDownloadFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('report'));
    expect(onDownloadFile).toHaveBeenCalledTimes(1);
    expect(onDownloadFile).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'pf-uuid-1' }));
  });

  it('clicking the second of two file links calls onDownloadFile with the correct id', () => {
    const onDownloadFile = jest.fn();

    const customer = createUser('user1');
    const provider = createUser('user2');
    const listing = createListing('listing');
    const props = {
      messages: [
        createMessage(
          'msg1',
          { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
          {
            sender: provider,
            publicFiles: [
              createFileAttachment('pf-uuid-1', 'first.pdf'),
              createFileAttachment('pf-uuid-2', 'second.pdf'),
            ],
          }
        ),
      ],
      transaction: createTransaction({
        id: 'tx1',
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 4, 1)),
        transitions: [],
      }),
      stateData: { processName: 'default-purchase', processState: 'inquiry' },
      currentUser: createCurrentUser('user2'),
      hasOlderMessages: false,
      fetchMessagesInProgress: false,
      onOpenReviewModal: noop,
      onShowOlderMessages: noop,
      onDownloadFile,
      intl: fakeIntl,
    };

    render(<ActivityFeed {...props} />);

    expect(onDownloadFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('second'));
    expect(onDownloadFile).toHaveBeenCalledTimes(1);
    expect(onDownloadFile).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'pf-uuid-2' }));
    expect(onDownloadFile).not.toHaveBeenCalledWith(expect.objectContaining({ uuid: 'pf-uuid-1' }));
  });
});

describe('ActivityFeed file verification states', () => {
  const customer = createUser('user1');
  const provider = createUser('user2');

  const makeBaseProps = messages => ({
    messages,
    transaction: createTransaction({
      id: 'tx1',
      customer,
      provider,
      listing: createListing('listing'),
      lastTransitionedAt: new Date(Date.UTC(2023, 4, 1)),
      transitions: [],
    }),
    stateData: { processName: 'default-purchase', processState: 'inquiry' },
    currentUser: createCurrentUser('user2'),
    hasOlderMessages: false,
    fetchMessagesInProgress: false,
    onOpenReviewModal: noop,
    onShowOlderMessages: noop,
    onDownloadFile: noop,
    intl: fakeIntl,
  });

  it('own message with pending files shows spinner icon and pending verification note', () => {
    const props = makeBaseProps([
      createMessage(
        'msg1',
        { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
        {
          sender: provider,
          publicFiles: [createPendingFileAttachment('pf-pending-1', 'contract.pdf')],
        }
      ),
    ]);

    render(<ActivityFeed {...props} />);

    expect(screen.getByRole('img', { name: 'Message.fileVerifying' })).toBeInTheDocument();
    expect(screen.getByText('contract')).toBeInTheDocument();
    expect(screen.getByText('Message.pendingVerificationNote')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Message.downloadFile' })).not.toBeInTheDocument();
    expect(screen.queryByText('Message.securityCheckFailedNote')).not.toBeInTheDocument();
  });

  it('own message with failed files shows error icon and security check failed note', () => {
    const props = makeBaseProps([
      createMessage(
        'msg1',
        { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
        {
          sender: provider,
          publicFiles: [createFailedFileAttachment('pf-failed-1', 'suspicious.zip')],
        }
      ),
    ]);

    render(<ActivityFeed {...props} />);

    expect(
      screen.getByRole('img', { name: 'Message.fileSecurityCheckFailed' })
    ).toBeInTheDocument();
    expect(screen.getByText('suspicious')).toBeInTheDocument();
    expect(screen.getByText('Message.securityCheckFailedNote')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Message.downloadFile' })).not.toBeInTheDocument();
    expect(screen.queryByText('Message.pendingVerificationNote')).not.toBeInTheDocument();
  });

  it('own message with mixed available and pending files shows pending verification note', () => {
    const props = makeBaseProps([
      createMessage(
        'msg1',
        { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
        {
          sender: provider,
          publicFiles: [
            createFileAttachment('pf-avail', 'ready.pdf'),
            createPendingFileAttachment('pf-pending', 'pending.pdf'),
          ],
        }
      ),
    ]);

    render(<ActivityFeed {...props} />);

    expect(screen.getByText('Message.pendingVerificationNote')).toBeInTheDocument();
    expect(screen.queryByText('Message.securityCheckFailedNote')).not.toBeInTheDocument();
  });

  it('own message with all available files shows no verification note', () => {
    const props = makeBaseProps([
      createMessage(
        'msg1',
        { content: 'hello', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
        {
          sender: provider,
          publicFiles: [createFileAttachment('pf-avail', 'report.pdf')],
        }
      ),
    ]);

    render(<ActivityFeed {...props} />);

    expect(screen.queryByText('Message.pendingVerificationNote')).not.toBeInTheDocument();
    expect(screen.queryByText('Message.securityCheckFailedNote')).not.toBeInTheDocument();
  });

  it('other-party message with pending files is not shown in the feed', () => {
    const props = makeBaseProps([
      createMessage(
        'msg1',
        { content: 'hidden message', createdAt: new Date(Date.UTC(2023, 10, 9, 8, 12)) },
        {
          sender: customer,
          publicFiles: [createPendingFileAttachment('pf-pending-other', 'pending-file.pdf')],
        }
      ),
    ]);

    render(<ActivityFeed {...props} />);

    expect(screen.queryByText('hidden message')).not.toBeInTheDocument();
    expect(screen.queryByText('pending-file')).not.toBeInTheDocument();
  });
});
