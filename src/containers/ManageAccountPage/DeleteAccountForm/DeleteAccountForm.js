import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import {
  isChangeEmailWrongPassword,
  isErrorUserHasUnfinishedTransactions,
  isStripeDeletionFailedNonZeroBalance,
} from '../../../util/errors';

import { Form, PrimaryButton, FieldTextInput, H4, FieldCheckbox } from '../../../components';

import css from './DeleteAccountForm.module.css';

const ErrorMessage = props => {
  const { error } = props;

  // Account deletion fails if there are transactions on states that include payment processing.
  // Check server/api/README.md for more information
  const unfinishedTransactionsError = isErrorUserHasUnfinishedTransactions(error);

  // Checks for forbidden error - the password is incorrect and this is handled in
  // the customErrorText of the FieldTextInput
  const incorrectPasswordError = isChangeEmailWrongPassword(error);

  // Account deletion fails if the user's Stripe Connect account
  // has a non-zero balance.
  const stripeDeletionFailedError = isStripeDeletionFailedNonZeroBalance(error);

  return error && !incorrectPasswordError ? (
    <p className={css.error}>
      {unfinishedTransactionsError ? (
        <FormattedMessage id="DeleteAccountForm.ongoingTransactionsError" />
      ) : stripeDeletionFailedError ? (
        <FormattedMessage id="DeleteAccountForm.stripeDeletionFailedError" />
      ) : (
        <FormattedMessage id="DeleteAccountForm.deleteAccountError" />
      )}
    </p>
  ) : null;
};

const DeleteAccountForm = props => {
  const { onSubmitDeleteAccount, intl, marketplaceName, onResetPassword } = props;
  // submittedValues: the checkbox value and the given current password
  const [submittedValues, setSubmittedValues] = useState({});
  // showResetPasswordMessage: dictates if the reset password text should be shown
  const [showResetPasswordMessage, setShowResetPasswordMessage] = useState(false);

  const handleSubmitDeleteAccount = values => {
    // save  for the next rendering in case the onSubmitDeleteAccount call fails
    setSubmittedValues(values);
    return onSubmitDeleteAccount(values);
  };

  const handleResetPassword = () => {
    setShowResetPasswordMessage(true);
    onResetPassword(props.currentUser.attributes.email);
  };

  return (
    <FinalForm
      {...props}
      initialValues={submittedValues}
      onSubmit={handleSubmitDeleteAccount}
      render={fieldRenderProps => {
        const {
          rootClassName,
          className,
          deleteAccountError,
          formId,
          handleSubmit,
          currentUser,
          inProgress = false,
          invalid,
          values,
          resetPasswordInProgress = false,
        } = fieldRenderProps;
        const { confirmDeleteAccount, currentPassword } = values;
        const { email } = currentUser.attributes;

        const deleteAccountConfirmed =
          Array.isArray(confirmDeleteAccount) && confirmDeleteAccount.length > 0;

        const passwordRequiredMessage = intl.formatMessage({
          id: 'DeleteAccountForm.passwordRequired',
        });

        const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);

        const passwordMinLengthMessage = intl.formatMessage(
          {
            id: 'DeleteAccountForm.passwordTooShort',
          },
          {
            minLength: validators.PASSWORD_MIN_LENGTH,
          }
        );

        const passwordMinLength = validators.minLength(
          passwordMinLengthMessage,
          validators.PASSWORD_MIN_LENGTH
        );

        const passwordValidators = deleteAccountConfirmed
          ? validators.composeValidators(passwordRequired, passwordMinLength)
          : null;

        const passwordFailedMessage = intl.formatMessage({
          id: 'DeleteAccountForm.passwordFailed',
        });

        const passwordErrorText = isChangeEmailWrongPassword(deleteAccountError)
          ? passwordFailedMessage
          : null;

        const resetPasswordLink =
          showResetPasswordMessage || resetPasswordInProgress ? (
            <FormattedMessage
              id="DeleteAccountForm.resetPasswordLinkSent"
              values={{
                email: <span className={css.emailStyle}>{currentUser.attributes.email}</span>,
                resendPasswordLink: (
                  <span className={css.helperLink} onClick={handleResetPassword} role="button">
                    <FormattedMessage id="DeleteAccountForm.resendPasswordLinkText" />
                  </span>
                ),
              }}
            />
          ) : (
            <span className={css.helperLink} onClick={handleResetPassword} role="button">
              <FormattedMessage id="DeleteAccountForm.resetPasswordLinkText" />
            </span>
          );

        const confirmClasses = classNames(css.confirmChangesSection, {
          [css.confirmChangesSectionVisible]: deleteAccountConfirmed,
        });

        const classes = classNames(rootClassName || css.root, className);
        const submitDisabled =
          invalid || inProgress || !(deleteAccountConfirmed && currentPassword);

        return (
          <Form
            className={classes}
            onSubmit={e => {
              handleSubmit(e);
            }}
          >
            <FieldCheckbox
              id="confirmDeleteAccount"
              name="confirmDeleteAccount"
              label={intl.formatMessage({ id: 'DeleteAccountForm.checkboxLabel' })}
              value="deleteAccountSelected"
              useSuccessColor
            />
            <br />
            <p className={css.confirmChangesInfo}>
              <FormattedMessage
                id="DeleteAccountForm.confirmDeleteInfo"
                values={{ marketplaceName }}
              />
              <br />
            </p>
            <div className={confirmClasses}>
              <H4 as="h3" className={css.confirmChangesTitle}>
                <FormattedMessage id="DeleteAccountForm.confirmDeleteTitle" />
              </H4>
              <p className={css.confirmChangesInfo}>
                <FormattedMessage id="DeleteAccountForm.deleteAccountInfo" values={{ email }} />
                <br />
                <FormattedMessage
                  id="DeleteAccountForm.resetPasswordInfo"
                  values={{ resetPasswordLink }}
                />
              </p>

              <FieldTextInput
                className={css.password}
                type="password"
                name="currentPassword"
                id={formId ? `${formId}.currentPassword` : 'currentPassword'}
                autoComplete="current-password"
                label={intl.formatMessage({
                  id: 'DeleteAccountForm.passwordLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'DeleteAccountForm.passwordPlaceholder',
                })}
                validate={passwordValidators}
                customErrorText={passwordErrorText}
              />
            </div>
            <div className={css.bottomWrapper}>
              <ErrorMessage error={deleteAccountError} />
              <PrimaryButton
                className={css.submitButton}
                type="submit"
                inProgress={inProgress}
                disabled={submitDisabled}
              >
                <FormattedMessage id="DeleteAccountForm.deleteAccount" />
              </PrimaryButton>
            </div>
          </Form>
        );
      }}
    />
  );
};

export default DeleteAccountForm;
