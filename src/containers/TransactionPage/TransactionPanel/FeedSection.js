import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { Heading, PrimaryButton } from '../../../components';

import css from './TransactionPanel.module.css';
import { useHistory } from 'react-router-dom';

// Functional component as a helper to build ActivityFeed section
const FeedSection = props => {
  const history = useHistory();
  const {
    className,
    rootClassName,
    activityFeed,
    hasTransitions,
    fetchMessagesError,
    hasMessages,
    isConversation,
    metadata,
    isCustomer,
    isCompleted,
  } = props;

  const showFeed = hasMessages || hasTransitions || fetchMessagesError;

  const classes = classNames(rootClassName || css.feedContainer, className);

  const isVideoRoomCreated = !!metadata?.customerCode && !!metadata?.providerCode;

  const handleVideoCall = () => {
    history.push(
      `/video-meeting?roomCode=${isCustomer ? metadata.customerCode : metadata.providerCode}`
    );
  };

  return showFeed ? (
    <div className={classes}>
      <div className={css.feedSectionHeader}>
        <Heading as="h3" rootClassName={css.sectionHeading}>
          {isConversation ? (
            <FormattedMessage id="TransactionPanel.conversationHeading" />
          ) : (
            <FormattedMessage id="TransactionPanel.activityHeading" />
          )}
        </Heading>

        {isVideoRoomCreated && !isCompleted && (
          <PrimaryButton type="button" className={css.videoCallButton} onClick={handleVideoCall}>
            Join video call
          </PrimaryButton>
        )}
      </div>
      {fetchMessagesError ? (
        <p className={css.messageError}>
          <FormattedMessage id="TransactionPanel.messageLoadingFailed" />
        </p>
      ) : null}
      <div className={css.feedContent}>{activityFeed}</div>
    </div>
  ) : null;
};

export default FeedSection;
