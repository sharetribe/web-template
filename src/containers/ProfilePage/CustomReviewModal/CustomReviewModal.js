import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { IconReviewUser, Modal } from '../../../components';
import { injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';

import ReviewForm from '../../TransactionPage/ReviewForm/ReviewForm';
import css from './CustomReviewModal.module.css';

const CustomReviewModal = props => {
  const {
    className,
    rootClassName,
    id,
    marketplaceName,
    intl,
    isOpen,
    onCloseModal,
    onManageDisableScrolling,
    onSubmitReview,
    // revieweeName,
    reviewSent,
    sendReviewInProgress,
    sendReviewError,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const closeButtonMessage = intl.formatMessage({ id: 'ReviewModal.later' });
  // const reviewee = <span className={css.reviewee}>{revieweeName}</span>;

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
      {/* <p className={css.modalTitle}>
        <FormattedMessage id="ReviewModal.title" values={{ revieweeName: reviewee }} />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="ReviewModal.description" values={{ marketplaceName }} />
      </p> */}
      <ReviewForm
        onSubmit={onSubmitReview}
        reviewSent={reviewSent}
        sendReviewInProgress={sendReviewInProgress}
        sendReviewError={sendReviewError}
      />
    </Modal>
  );
};

const { bool, string } = PropTypes;

CustomReviewModal.defaultProps = {
  className: null,
  rootClassName: null,
  reviewSent: false,
  sendReviewInProgress: false,
  sendReviewError: null,
};

CustomReviewModal.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
  reviewSent: bool,
  sendReviewInProgress: bool,
  sendReviewError: propTypes.error,
  marketplaceName: string.isRequired,
};

export default injectIntl(CustomReviewModal);
