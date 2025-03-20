import React, { Component } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { ensureCurrentUser } from '../../../util/data';
import { isChangePasswordWrongPassword } from '../../../util/errors';

import { Form, PrimaryButton, FieldTextInput, H4 } from '../../../components';

import css from './PasswordChangeForm.module.css';

const RESET_TIMEOUT = 800;

/**
 * The change-password form.
 * TODO: change to functional component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form ID
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {function} props.onSubmit - The function to submit the form
 * @param {boolean} [props.inProgress] - Whether the form is in progress
 * @param {boolean} [props.resetPasswordInProgress] - Whether the reset password is in progress
 * @param {boolean} props.ready - Whether the form is ready
 * @param {propTypes.error} [props.changePasswordError] - The change password error
 * @param {propTypes.error} [props.resetPasswordError] - The reset password error
 * @returns {JSX.Element} Change-password form component
 */
class PasswordChangeForm extends Component {
  constructor(props) {
    super(props);
    this.state = { showResetPasswordMessage: false };
    this.resetTimeoutId = null;
    this.submittedValues = {};
    this.handleResetPassword = this.handleResetPassword.bind(this);
  }
  componentWillUnmount() {
    window.clearTimeout(this.resetTimeoutId);
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
            formId,
            changePasswordError,
            currentUser,
            handleSubmit,
            inProgress = false,
            resetPasswordInProgress = false,
            invalid,
            pristine,
            ready,
            form,
            values,
          } = fieldRenderProps;

          const intl = useIntl();
          const user = ensureCurrentUser(currentUser);

          if (!user.id) {
            return null;
          }

          // New password
          const newPasswordLabel = intl.formatMessage({
            id: 'PasswordChangeForm.newPasswordLabel',
          });
          const newPasswordPlaceholder = intl.formatMessage({
            id: 'PasswordChangeForm.newPasswordPlaceholder',
          });
          const newPasswordRequiredMessage = intl.formatMessage({
            id: 'PasswordChangeForm.newPasswordRequired',
          });
          const newPasswordRequired = validators.requiredStringNoTrim(newPasswordRequiredMessage);

          const passwordMinLengthMessage = intl.formatMessage(
            {
              id: 'PasswordChangeForm.passwordTooShort',
            },
            {
              minLength: validators.PASSWORD_MIN_LENGTH,
            }
          );
          const passwordMaxLengthMessage = intl.formatMessage(
            {
              id: 'PasswordChangeForm.passwordTooLong',
            },
            {
              maxLength: validators.PASSWORD_MAX_LENGTH,
            }
          );

          const passwordMinLength = validators.minLength(
            passwordMinLengthMessage,
            validators.PASSWORD_MIN_LENGTH
          );
          const passwordMaxLength = validators.maxLength(
            passwordMaxLengthMessage,
            validators.PASSWORD_MAX_LENGTH
          );

          // password
          const passwordLabel = intl.formatMessage({
            id: 'PasswordChangeForm.passwordLabel',
          });
          const passwordPlaceholder = intl.formatMessage({
            id: 'PasswordChangeForm.passwordPlaceholder',
          });
          const passwordRequiredMessage = intl.formatMessage({
            id: 'PasswordChangeForm.passwordRequired',
          });

          const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);

          const passwordFailedMessage = intl.formatMessage({
            id: 'PasswordChangeForm.passwordFailed',
          });
          const passwordTouched =
            values.currentPassword &&
            this.submittedValues.currentPassword !== values.currentPassword;
          const passwordErrorText = isChangePasswordWrongPassword(changePasswordError)
            ? passwordFailedMessage
            : null;

          const confirmClasses = classNames(css.confirmChangesSection, {
            [css.confirmChangesSectionVisible]: !pristine,
          });

          const genericFailure =
            changePasswordError && !passwordErrorText ? (
              <span className={css.error}>
                <FormattedMessage id="PasswordChangeForm.genericFailure" />
              </span>
            ) : null;

          const classes = classNames(rootClassName || css.root, className);
          const submitDisabled = invalid || inProgress;

          const sendPasswordLink = (
            <span className={css.helperLink} onClick={this.handleResetPassword} role="button">
              <FormattedMessage id="PasswordChangeForm.resetPasswordLinkText" />
            </span>
          );

          const resendPasswordLink = (
            <span className={css.helperLink} onClick={this.handleResetPassword} role="button">
              <FormattedMessage id="PasswordChangeForm.resendPasswordLinkText" />
            </span>
          );

          const resetPasswordLink =
            this.state.showResetPasswordMessage || resetPasswordInProgress ? (
              <>
                <FormattedMessage
                  id="PasswordChangeForm.resetPasswordLinkSent"
                  values={{
                    email: <span className={css.emailStyle}>{currentUser.attributes.email}</span>,
                  }}
                />{' '}
                {resendPasswordLink}
              </>
            ) : (
              sendPasswordLink
            );

          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedValues = values;
                handleSubmit(e)
                  .then(() => {
                    this.resetTimeoutId = window.setTimeout(() => {
                      form.restart();
                      if (this.props.onChange) {
                        this.props.onChange();
                      }
                    }, RESET_TIMEOUT);
                  })
                  .catch(() => {
                    // Error is handled in duck file already.
                  });
              }}
            >
              <div className={css.newPasswordSection}>
                <FieldTextInput
                  type="password"
                  id={formId ? `${formId}.newPassword` : 'newPassword'}
                  name="newPassword"
                  autoComplete="new-password"
                  label={newPasswordLabel}
                  placeholder={newPasswordPlaceholder}
                  validate={validators.composeValidators(
                    newPasswordRequired,
                    passwordMinLength,
                    passwordMaxLength
                  )}
                />
              </div>

              <div className={confirmClasses}>
                <H4 as="h3" className={css.confirmChangesTitle}>
                  <FormattedMessage id="PasswordChangeForm.confirmChangesTitle" />
                </H4>
                <p className={css.confirmChangesInfo}>
                  <FormattedMessage id="PasswordChangeForm.confirmChangesInfo" />
                  <br />
                  <FormattedMessage
                    id="PasswordChangeForm.resetPasswordInfo"
                    values={{ resetPasswordLink }}
                  />
                </p>

                <FieldTextInput
                  className={css.password}
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  autoComplete="current-password"
                  label={passwordLabel}
                  placeholder={passwordPlaceholder}
                  validate={validators.composeValidators(
                    passwordRequired,
                    passwordMinLength,
                    passwordMaxLength
                  )}
                  customErrorText={passwordTouched ? null : passwordErrorText}
                />
              </div>
              <div className={css.bottomWrapper}>
                {genericFailure}
                <PrimaryButton
                  type="submit"
                  inProgress={inProgress}
                  ready={ready}
                  disabled={submitDisabled}
                >
                  <FormattedMessage id="PasswordChangeForm.saveChanges" />
                </PrimaryButton>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

export default PasswordChangeForm;
