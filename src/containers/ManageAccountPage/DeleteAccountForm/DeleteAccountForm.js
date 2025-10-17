import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import {
  isChangeEmailWrongPassword,
  isErrorUserHasUnfinishedTransactions,
} from '../../../util/errors';

import { Form, PrimaryButton, FieldTextInput, H4, FieldCheckbox } from '../../../components';

import css from './DeleteAccountForm.module.css';

const ErrorMessage = props => {
  const { error } = props;

  const unfinishedTransactionsError = isErrorUserHasUnfinishedTransactions(error);

  // TODO: other error handling based on backend responses

  return error && !props.passwordErrorText ? (
    <p className={css.error}>
      {unfinishedTransactionsError ? (
        <FormattedMessage id="DeleteAccountForm.ongoingTransactionsError" />
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
        const { confirmDeleteAccount } = values;

        const deleteAccountConfirmed =
          Array.isArray(confirmDeleteAccount) && confirmDeleteAccount.length > 0;

        // password
        const passwordLabel = intl.formatMessage({
          id: 'DeleteAccountForm.passwordLabel',
        });
        const passwordPlaceholder = intl.formatMessage({
          id: 'DeleteAccountForm.passwordPlaceholder',
        });
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

        const sendPasswordLink = (
          <span className={css.helperLink} onClick={handleResetPassword} role="button">
            <FormattedMessage id="DeleteAccountForm.resetPasswordLinkText" />
          </span>
        );

        const resendPasswordLink = (
          <span className={css.helperLink} onClick={handleResetPassword} role="button">
            <FormattedMessage id="DeleteAccountForm.resendPasswordLinkText" />
          </span>
        );

        const resetPasswordLink =
          showResetPasswordMessage || resetPasswordInProgress ? (
            <>
              <FormattedMessage
                id="ContactDetailsForm.resetPasswordLinkSent"
                values={{
                  email: <span className={css.emailStyle}>{currentUser.attributes.email}</span>,
                }}
              />{' '}
              {resendPasswordLink}
            </>
          ) : (
            sendPasswordLink
          );

        const confirmClasses = classNames(css.confirmChangesSection, {
          [css.confirmChangesSectionVisible]: deleteAccountConfirmed,
        });

        const classes = classNames(rootClassName || css.root, className);
        const submitDisabled = invalid || inProgress || !deleteAccountConfirmed;

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
                <FormattedMessage id="DeleteAccountForm.deleteAccountInfo" />
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
                label={passwordLabel}
                placeholder={passwordPlaceholder}
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
