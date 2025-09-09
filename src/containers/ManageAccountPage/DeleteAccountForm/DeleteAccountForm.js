import React, { Component } from 'react';
import { compose } from 'redux';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { ensureCurrentUser } from '../../../util/data';
import { isTooManyEmailVerificationRequestsError } from '../../../util/errors';

import { Form, PrimaryButton, FieldTextInput, H4, FieldCheckbox } from '../../../components';

import css from './DeleteAccountForm.module.css';

const SHOW_EMAIL_SENT_TIMEOUT = 2000;

/**
 * The DeleteAccountForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - The root class name to be used instead of the default css.root.
 * @param {string} [props.className] - The class name
 * @param {string} [props.formId] - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {intlShape} props.intl - The intl object
 * @param {Function} props.onResendVerificationEmail - The resend verification email function
 * @param {boolean} props.ready - Whether the form is ready
 * @param {propTypes.error} props.sendVerificationEmailError - The send verification email error
 * @param {boolean} props.sendVerificationEmailInProgress - Whether the send verification email is in progress
 * @param {boolean} props.resetPasswordInProgress - Whether the reset password is in progress
 * @param {propTypes.error} props.resetPasswordError - The reset password error
 * @returns {JSX.Element}
 */
class DeleteAccountFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { showVerificationEmailSentMessage: false, showResetPasswordMessage: false };
    this.emailSentTimeoutId = null;
    this.handleResendVerificationEmail = this.handleResendVerificationEmail.bind(this);
    this.handleResetPassword = this.handleResetPassword.bind(this);
    this.submittedValues = {};
  }

  componentWillUnmount() {
    window.clearTimeout(this.emailSentTimeoutId);
  }

  handleResendVerificationEmail() {
    this.setState({ showVerificationEmailSentMessage: true });

    this.props.onResendVerificationEmail().then(() => {
      // show "verification email sent" text for a bit longer.
      this.emailSentTimeoutId = window.setTimeout(() => {
        this.setState({ showVerificationEmailSentMessage: false });
      }, SHOW_EMAIL_SENT_TIMEOUT);
    });
  }

  handleResetPassword() {
    this.setState({ showResetPasswordMessage: true });
    const email = this.props.currentUser.attributes.email;
    this.props.onResetPassword(email);
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        render={fieldRenderProps => {
          const {
            rootClassName,
            className,
            currentUser,
            formId,
            handleSubmit,
            inProgress = false,
            intl,
            invalid,
            sendVerificationEmailError,
            sendVerificationEmailInProgress = false,
            resetPasswordInProgress = false,
            values,
          } = fieldRenderProps;
          const { confirmDeleteAccount } = values;

          const user = ensureCurrentUser(currentUser);

          if (!user.id) {
            return null;
          }

          const deleteAccountConfirmed =
            Array.isArray(confirmDeleteAccount) && confirmDeleteAccount.length > 0;

          const tooManyVerificationRequests = isTooManyEmailVerificationRequestsError(
            sendVerificationEmailError
          );

          let resendEmailMessage = null;
          if (tooManyVerificationRequests) {
            resendEmailMessage = (
              <span className={css.tooMany}>
                <FormattedMessage id="DeleteAccountForm.tooManyVerificationRequests" />
              </span>
            );
          } else if (
            sendVerificationEmailInProgress ||
            this.state.showVerificationEmailSentMessage
          ) {
            resendEmailMessage = (
              <span className={css.emailSent}>
                <FormattedMessage id="DeleteAccountForm.emailSent" />
              </span>
            );
          } else {
            resendEmailMessage = (
              <span
                className={css.helperLink}
                onClick={this.handleResendVerificationEmail}
                role="button"
              >
                <FormattedMessage id="DeleteAccountForm.resendEmailVerificationText" />
              </span>
            );
          }

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

          const passwordValidators = deleteAccountConfirmed
            ? validators.composeValidators(passwordRequired)
            : null;

          // Need to add password validation - still investigating how isChangeEmailWrongPassword (from ContactDetailsForm.js) works
          /* const passwordFailedMessage = intl.formatMessage({
            id: 'DeleteAccountForm.passwordFailed',
          });
          const passwordTouched = this.submittedValues.currentPassword !== values.currentPassword;
          const passwordErrorText = isChangeEmailWrongPassword(saveEmailError)
            ? passwordFailedMessage
            : null; */

          const confirmClasses = classNames(css.confirmChangesSection, {
            [css.confirmChangesSectionVisible]: deleteAccountConfirmed,
          });

          const sendPasswordLink = (
            <span className={css.helperLink} onClick={this.handleResetPassword} role="button">
              <FormattedMessage id="DeleteAccountForm.resetPasswordLinkText" />
            </span>
          );

          const resendPasswordLink = (
            <span className={css.helperLink} onClick={this.handleResetPassword} role="button">
              <FormattedMessage id="DeleteAccountForm.resendPasswordLinkText" />
            </span>
          );

          const resetPasswordLink =
            this.state.showResetPasswordMessage || resetPasswordInProgress ? (
              <>
                <FormattedMessage
                  id="DeleteAccountForm.resetPasswordLinkSent"
                  values={{
                    email: <span className={css.emailStyle}>{currentUser.attributes.email}</span>,
                  }}
                />{' '}
                {resendPasswordLink}
              </>
            ) : (
              sendPasswordLink
            );

          const classes = classNames(rootClassName || css.root, className);
          const submittedOnce = Object.keys(this.submittedValues).length > 0;
          const pristineSinceLastSubmit = submittedOnce && isEqual(values, this.submittedValues);
          const submitDisabled =
            invalid || pristineSinceLastSubmit || inProgress || !deleteAccountConfirmed;

          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedValues = values;
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
                  <FormattedMessage id="DeleteAccountForm.confirmDeleteInfo" />
                  <br />
                  <FormattedMessage
                    id="DeleteAccountForm.resetPasswordLink"
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
                  //customErrorText={passwordTouched ? null : passwordErrorText}
                />
              </div>
              <div className={css.bottomWrapper}>
                <PrimaryButton
                  type="submit"
                  inProgress={inProgress}
                  ready={pristineSinceLastSubmit}
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
  }
}

const DeleteAccountForm = compose(injectIntl)(DeleteAccountFormComponent);

DeleteAccountForm.displayName = 'DeleteAccountForm';

export default DeleteAccountForm;
