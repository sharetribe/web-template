import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { Heading } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build ActivityFeed section
const FeedSection = props => {
  const {
    className,
    rootClassName,
    activityFeed,
    hasTransitions,
    fetchMessagesError,
    initialMessageFailed,
    hasMessages,
    isConversation,
  } = props;

  const showFeed = hasMessages || hasTransitions || initialMessageFailed || fetchMessagesError;

  const classes = classNames(rootClassName || css.feedContainer, className);

  return showFeed ? (
    <div className={classes}>
      <Heading as="h3" rootClassName={css.sectionHeading}>
        {isConversation ? (
          <FormattedMessage id="TransactionPanel.conversationHeading" />
        ) : (
          <FormattedMessage id="TransactionPanel.activityHeading" />
        )}
      </Heading>
      {initialMessageFailed ? (
        <p className={css.messageError}>
          <FormattedMessage id="TransactionPanel.initialMessageFailed" />
        </p>
      ) : null}
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
