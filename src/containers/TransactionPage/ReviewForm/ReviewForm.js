import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { isTransactionsTransitionAlreadyReviewed } from '../../../util/errors';
import { propTypes } from '../../../util/types';
import { required } from '../../../util/validators';

import { FieldReviewRating, Form, PrimaryButton, FieldTextInput } from '../../../components';

import css from './ReviewForm.module.css';

/**
 * Review form
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.formId - The form id
 * @param {Function} props.onSubmit - The on submit function
 * @param {boolean} props.reviewSent - Whether the review is sent
 * @param {propTypes.error} props.sendReviewError - The send review error
 * @param {boolean} props.sendReviewInProgress - Whether the send review is in progress
 * @returns {JSX.Element} The ReviewForm component
 */
const ReviewForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        className,
        rootClassName,
        disabled,
        handleSubmit,
        formId,
        invalid,
        reviewSent,
        sendReviewError,
        sendReviewInProgress,
      } = fieldRenderProps;
      const intl = useIntl();
      const reviewRating = intl.formatMessage({ id: 'ReviewForm.reviewRatingLabel' });
      const reviewRatingRequiredMessage = intl.formatMessage({
        id: 'ReviewForm.reviewRatingRequired',
      });

      const reviewContent = intl.formatMessage({ id: 'ReviewForm.reviewContentLabel' });
      const reviewContentPlaceholderMessage = intl.formatMessage({
        id: 'ReviewForm.reviewContentPlaceholder',
      });
      const reviewContentRequiredMessage = intl.formatMessage({
        id: 'ReviewForm.reviewContentRequired',
      });

      const errorMessage = isTransactionsTransitionAlreadyReviewed(sendReviewError) ? (
        <p className={css.error}>
          <FormattedMessage id="ReviewForm.reviewSubmitAlreadySent" />
        </p>
      ) : (
        <p className={css.error}>
          <FormattedMessage id="ReviewForm.reviewSubmitFailed" />
        </p>
      );
      const errorArea = sendReviewError ? errorMessage : <p className={css.errorPlaceholder} />;

      const reviewSubmitMessage = intl.formatMessage({
        id: 'ReviewForm.reviewSubmit',
      });

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = sendReviewInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldReviewRating
            className={css.reviewRating}
            id={formId ? `${formId}.starRating` : 'starRating'}
            name="reviewRating"
            label={reviewRating}
            validate={required(reviewRatingRequiredMessage)}
          />

          <FieldTextInput
            className={css.reviewContent}
            type="textarea"
            id={formId ? `${formId}.reviewContent` : 'reviewContent'}
            name="reviewContent"
            label={reviewContent}
            placeholder={reviewContentPlaceholderMessage}
            validate={required(reviewContentRequiredMessage)}
          />

          {errorArea}
          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={reviewSent}
          >
            {reviewSubmitMessage}
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

export default ReviewForm;
