import React from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { IconReviewUser, Modal } from '../../../components';

import ReviewForm from '../ReviewForm/ReviewForm';

import css from './ReviewModal.module.css';

/**
 * Review modal
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.id - The id
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onCloseModal - The on close modal function
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {Function} props.onSubmitReview - The on submit review function
 * @param {string} props.revieweeName - The reviewee name
 * @param {boolean} props.reviewSent - Whether the review is sent
 * @param {boolean} props.sendReviewInProgress - Whether the send review is in progress
 * @param {propTypes.error} props.sendReviewError - The send review error
 * @param {string} props.marketplaceName - The marketplace name
 * @returns {JSX.Element} The ReviewModal component
 */
const ReviewModal = props => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    id,
    marketplaceName,
    isOpen,
    onCloseModal,
    onManageDisableScrolling,
    onSubmitReview,
    revieweeName,
    reviewSent = false,
    sendReviewInProgress = false,
    sendReviewError,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const closeButtonMessage = intl.formatMessage({ id: 'ReviewModal.later' });
  const reviewee = <span className={css.reviewee}>{revieweeName}</span>;

  return (
    <Modal
      id={id}
      containerClassName={classes}
      contentClassName={css.modalContent}
      isOpen={isOpen}
      onClose={onCloseModal}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      closeButtonMessage={closeButtonMessage}
    >
      <IconReviewUser className={css.modalIcon} />
      <p className={css.modalTitle}>
        <FormattedMessage id="ReviewModal.title" values={{ revieweeName: reviewee }} />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="ReviewModal.description" values={{ marketplaceName }} />
      </p>
      <ReviewForm
        onSubmit={onSubmitReview}
        reviewSent={reviewSent}
        sendReviewInProgress={sendReviewInProgress}
        sendReviewError={sendReviewError}
      />
    </Modal>
  );
};

export default ReviewModal;
