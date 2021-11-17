import React from 'react';
import { renderDeep } from '../../../util/test-helpers';
import {
  fakeIntl,
  createUser,
  createCurrentUser,
  createMessage,
  createTransaction,
} from '../../../util/test-data';
import { ActivityFeedComponent } from './ActivityFeed';

const noop = () => null;

describe('ActivityFeed', () => {
  it('matches snapshot', () => {
    const props = {
      messages: [
        createMessage('msg1', {}, { sender: createUser('user1') }),
        createMessage('msg2', {}, { sender: createUser('user2') }),
      ],
      transaction: createTransaction('tx1'),
      stateData: {
        processName: 'flex-product-default-process',
        processState: 'enquiry',
      },
      currentUser: createCurrentUser('user2'),
      hasOlderMessages: false,
      fetchMessagesInProgress: false,
      onOpenReviewModal: noop,
      onShowOlderMessages: noop,
      intl: fakeIntl,
    };

    const tree = renderDeep(<ActivityFeedComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
});
