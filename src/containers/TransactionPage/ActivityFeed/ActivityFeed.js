import React from 'react';
import { string, arrayOf, bool, func, number, object } from 'prop-types';
import dropWhile from 'lodash/dropWhile';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { formatDateWithProximity } from '../../../util/dates';
import { propTypes } from '../../../util/types';
import {
  getProcess,
  getUserTxRole,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_OPERATOR,
  TX_TRANSITION_ACTOR_SYSTEM,
} from '../../../transactions/transaction';

import { Avatar, InlineTextButton, ReviewRating, UserDisplayName } from '../../../components';

import { stateDataShape } from '../TransactionPage.stateData';

import css from './ActivityFeed.module.css';

const Message = props => {
  const { message, formattedDate } = props;
  return (
    <div className={css.message}>
      <Avatar className={css.avatar} user={message.sender} />
      <div>
        <p className={css.messageContent}>{message.attributes.content}</p>
        <p className={css.messageDate}>{formattedDate}</p>
      </div>
    </div>
  );
};

Message.propTypes = {
  message: propTypes.message.isRequired,
  formattedDate: string.isRequired,
};

const OwnMessage = props => {
  const { message, formattedDate } = props;
  return (
    <div className={css.ownMessage}>
      <div className={css.ownMessageContentWrapper}>
        <p className={css.ownMessageContent}>{message.attributes.content}</p>
      </div>
      <p className={css.ownMessageDate}>{formattedDate}</p>
    </div>
  );
};

OwnMessage.propTypes = {
  message: propTypes.message.isRequired,
  formattedDate: string.isRequired,
};

const Review = props => {
  const { content, rating } = props;
  return (
    <div>
      <p className={css.reviewContent}>{content}</p>
      {rating ? (
        <ReviewRating
          reviewStarClassName={css.reviewStar}
          className={css.reviewStars}
          rating={rating}
        />
      ) : null}
    </div>
  );
};

Review.propTypes = {
  content: string.isRequired,
  rating: number.isRequired,
};

const TransitionMessage = props => {
  const {
    transition,
    nextState,
    stateData,
    deliveryMethod,
    listingTitle,
    ownRole,
    otherUsersName,
    onOpenReviewModal,
    intl,
  } = props;
  const { processName, processState, showReviewAsFirstLink, showReviewAsSecondLink } = stateData;
  const stateStatus = nextState === processState ? 'current' : 'past';

  // actor: 'you', 'system', 'operator', or display name of the other party
  const actor =
    transition.by === ownRole
      ? 'you'
      : [TX_TRANSITION_ACTOR_SYSTEM, TX_TRANSITION_ACTOR_OPERATOR].includes(transition.by)
      ? transition.by
      : otherUsersName;

  const reviewLink = showReviewAsFirstLink ? (
    <InlineTextButton onClick={onOpenReviewModal}>
      <FormattedMessage id="TransactionPage.ActivityFeed.reviewLink" values={{ otherUsersName }} />
    </InlineTextButton>
  ) : showReviewAsSecondLink ? (
    <InlineTextButton onClick={onOpenReviewModal}>
      <FormattedMessage
        id="TransactionPage.ActivityFeed.reviewAsSecondLink"
        values={{ otherUsersName }}
      />
    </InlineTextButton>
  ) : null;

  // ActivityFeed messages are tied to transaction process and transitions.
  // However, in practice, transitions leading to same state have had the same message.
  const message = intl.formatMessage(
    { id: `TransactionPage.ActivityFeed.${processName}.${nextState}` },
    { actor, otherUsersName, listingTitle, reviewLink, deliveryMethod, stateStatus }
  );

  return message;
};

const Transition = props => {
  const { transitionMessageComponent, formattedDate, reviewComponent } = props;
  return (
    <div className={css.transition}>
      <div className={css.bullet}>
        <p className={css.transitionContent}>•</p>
      </div>
      <div>
        <p className={css.transitionContent}>{transitionMessageComponent}</p>
        <p className={css.transitionDate}>{formattedDate}</p>
        {reviewComponent}
      </div>
    </div>
  );
};

Transition.propTypes = {
  formattedDate: string,
};

const reviewByAuthorId = (transaction, userId) => {
  return transaction.reviews.filter(
    r => !r.attributes.deleted && r.author.id.uuid === userId.uuid
  )[0];
};

const ReviewComponentMaybe = props => {
  const { showReviews, isRelevantTransition, reviewEntity, intl } = props;
  if (showReviews && isRelevantTransition) {
    const deletedReviewContent = intl.formatMessage({
      id: 'TransactionPage.ActivityFeed.deletedReviewContent',
    });
    const content = reviewEntity?.attributes?.deleted
      ? deletedReviewContent
      : reviewEntity?.attributes?.content;
    const rating = reviewEntity?.attributes?.rating;
    const ratingMaybe = rating ? { rating } : {};
    return <Review content={content} {...ratingMaybe} />;
  }
  return null;
};

const isMessage = item => item && item.type === 'message';

// Compare function for sorting an array containing messages and transitions
const compareItems = (a, b) => {
  const itemDate = item => (isMessage(item) ? item.attributes.createdAt : item.createdAt);
  return itemDate(a) - itemDate(b);
};

const organizedItems = (messages, transitions, hideOldTransitions) => {
  const items = messages.concat(transitions).sort(compareItems);
  if (hideOldTransitions) {
    // Hide transitions that happened before the oldest message. Since
    // we have older items (messages) that we are not showing, seeing
    // old transitions would be confusing.
    return dropWhile(items, i => !isMessage(i));
  } else {
    return items;
  }
};

export const ActivityFeedComponent = props => {
  const {
    rootClassName,
    className,
    messages,
    transaction,
    stateData,
    currentUser,
    hasOlderMessages,
    fetchMessagesInProgress,
    onOpenReviewModal,
    onShowOlderMessages,
    intl,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const processName = stateData.processName;

  // If stateData doesn't have processName, full tx data has not been fetched.
  if (!processName) {
    return null;
  }
  const process = getProcess(processName);
  const transitions = transaction?.attributes?.transitions || [];
  const relevantTransitions = transitions.filter(t =>
    process.isRelevantPastTransition(t.transition)
  );
  const todayString = intl.formatMessage({ id: 'TransactionPage.ActivityFeed.today' });

  // combine messages and transaction transitions
  const hideOldTransitions = hasOlderMessages || fetchMessagesInProgress;
  const items = organizedItems(messages, relevantTransitions, hideOldTransitions);

  const messageListItem = message => {
    const formattedDate = formatDateWithProximity(message.attributes.createdAt, intl, todayString);
    const isOwnMessage = currentUser?.id && message?.sender?.id?.uuid === currentUser.id?.uuid;
    const messageComponent = isOwnMessage ? (
      <OwnMessage message={message} formattedDate={formattedDate} />
    ) : (
      <Message message={message} formattedDate={formattedDate} />
    );

    return (
      <li id={`msg-${message.id.uuid}`} key={message.id.uuid} className={css.messageItem}>
        {messageComponent}
      </li>
    );
  };

  const transitionListItem = transition => {
    const formattedDate = formatDateWithProximity(transition.createdAt, intl, todayString);
    const { customer, provider, listing } = transaction || {};

    // Initially transition component is empty;
    let transitionComponent = <Transition />;

    if (currentUser?.id && customer?.id && provider?.id && listing?.id) {
      const transitionName = transition.transition;
      const nextState = process.getStateAfterTransition(transition.transition);
      const isCustomerReview = process.isCustomerReview(transitionName);
      const isProviderRieview = process.isProviderReview(transitionName);
      const reviewEntity = isCustomerReview
        ? reviewByAuthorId(transaction, customer.id)
        : isProviderRieview
        ? reviewByAuthorId(transaction, provider.id)
        : null;

      const listingTitle = listing.attributes.deleted
        ? intl.formatMessage({ id: 'TransactionPage.ActivityFeed.deletedListing' })
        : listing.attributes.title;

      const ownRole = getUserTxRole(currentUser.id, transaction);
      const otherUser = ownRole === TX_TRANSITION_ACTOR_PROVIDER ? customer : provider;

      transitionComponent = (
        <Transition
          formattedDate={formattedDate}
          transitionMessageComponent={
            <TransitionMessage
              transition={transition}
              nextState={nextState}
              stateData={stateData}
              deliveryMethod={transaction.attributes?.protectedData?.deliveryMethod}
              listingTitle={listingTitle}
              ownRole={ownRole}
              otherUsersName={<UserDisplayName user={otherUser} intl={intl} />}
              onOpenReviewModal={onOpenReviewModal}
              intl={intl}
            />
          }
          reviewComponent={
            <ReviewComponentMaybe
              showReviews={stateData.showReviews}
              isRelevantTransition={isCustomerReview || isProviderRieview}
              reviewEntity={reviewEntity}
              intl={intl}
            />
          }
        />
      );
    }
    return (
      <li key={transition.transition} className={css.transitionItem}>
        {transitionComponent}
      </li>
    );
  };

  return (
    <ul className={classes}>
      {hasOlderMessages ? (
        <li className={css.showOlderWrapper} key="show-older-messages">
          <InlineTextButton className={css.showOlderButton} onClick={onShowOlderMessages}>
            <FormattedMessage id="TransactionPage.ActivityFeed.showOlderMessages" />
          </InlineTextButton>
        </li>
      ) : null}
      {items.map(item => {
        if (isMessage(item)) {
          return messageListItem(item);
        } else {
          return transitionListItem(item);
        }
      })}
    </ul>
  );
};

ActivityFeedComponent.defaultProps = {
  rootClassName: null,
  className: null,
  stateData: {},
};

ActivityFeedComponent.propTypes = {
  rootClassName: string,
  className: string,

  messages: arrayOf(propTypes.message),
  transaction: propTypes.transaction,
  stateData: stateDataShape,
  currentUser: propTypes.currentUser,
  hasOlderMessages: bool.isRequired,
  fetchMessagesInProgress: bool.isRequired,
  onOpenReviewModal: func.isRequired,
  onShowOlderMessages: func.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const ActivityFeed = injectIntl(ActivityFeedComponent);

export default ActivityFeed;
