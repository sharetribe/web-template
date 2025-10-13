import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { isErrorTransactionHasStripeRelatedStates } from '../../../util/errors';

import { Form, PrimaryButton, FieldTextInput, H4, FieldCheckbox } from '../../../components';

import css from './DeleteAccountForm.module.css';

const DeleteAccountForm = props => {
  const { onSubmitDeleteAccount, intl, marketplaceName } = props;
  // submittedValues: the checkbox value and the given current password
  const [submittedValues, setSubmittedValues] = useState({});

  const handleSubmitDeleteAccount = values => {
    // save  for the next rendering in case the onSubmitDeleteAccount call fails
    setSubmittedValues(values);
    return onSubmitDeleteAccount(values);
  };

  return (
    <FinalForm
      initialValues={submittedValues}
      onSubmit={handleSubmitDeleteAccount}
      render={fieldRenderProps => {
        const {
          rootClassName,
          className,
          deleteAccountError,
          formId,
          handleSubmit,
          inProgress = false,
          invalid,
          values,
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

        const ongoingTransactionsWithStripeRelatedStatesMessage = intl.formatMessage({
          id: 'DeleteAccountForm.ongoingTransactionsWithStripeRelatedStates',
        });
        const userDeletionErrorText = isErrorTransactionHasStripeRelatedStates(deleteAccountError)
          ? ongoingTransactionsWithStripeRelatedStatesMessage
          : null;

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
            <div className={confirmClasses}>
              <H4 as="h3" className={css.confirmChangesTitle}>
                <FormattedMessage id="DeleteAccountForm.confirmDeleteTitle" />
              </H4>
              <p className={css.confirmChangesInfo}>
                <FormattedMessage
                  id="DeleteAccountForm.confirmDeleteInfo"
                  values={{ marketplaceName }}
                />
                <br />
                {/* <FormattedMessage
                  id="DeleteAccountForm.resetPasswordLink"
                  values={{ resetPasswordLink }}
                /> */}
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
                customErrorText={userDeletionErrorText}
              />
            </div>
            <div className={css.bottomWrapper}>
              <PrimaryButton
                type="submit"
                inProgress={inProgress}
                //ready={pristineSinceLastSubmit}
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
