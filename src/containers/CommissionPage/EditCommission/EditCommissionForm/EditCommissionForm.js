import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import * as validators from '../../../../util/validators';
import { ensureCurrentUser } from '../../../../util/data';
import { isChangePasswordWrongPassword } from '../../../../util/errors';

import { Form, PrimaryButton, FieldTextInput, H4 } from '../../../../components';

import css from './EditCommissionForm.module.css';

const RESET_TIMEOUT = 800;

class CommissionFormComponent extends Component {
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
            changeCommissionError,
            currentUser,
            handleSubmit,
            inProgress,
            resetPasswordInProgress,
            intl,
            invalid,
            pristine,
            ready,
            form,
            values,
          } = fieldRenderProps;

          const user = ensureCurrentUser(currentUser);

          // if (!user.id) {
          //   return null;
          // }

          Console.log('sssssssssssssssssssssssssssss');

          // New password
          const newCommissionLabel = intl.formatMessage({
            id: 'CommissionForm.newCommissionLabel',
          });
          const newPasswordPlaceholder = intl.formatMessage({
            id: 'CommissionForm.newPasswordPlaceholder',
          });
          const newPasswordRequiredMessage = intl.formatMessage({
            id: 'CommissionForm.newPasswordRequired',
          });
          const newPasswordRequired = validators.requiredStringNoTrim(newPasswordRequiredMessage);

          const passwordMinLengthMessage = intl.formatMessage(
            {
              id: 'CommissionForm.passwordTooShort',
            },
            {
              minLength: validators.PASSWORD_MIN_LENGTH,
            }
          );
          const passwordMaxLengthMessage = intl.formatMessage(
            {
              id: 'CommissionForm.passwordTooLong',
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
            id: 'CommissionForm.passwordLabel',
          });
          const passwordPlaceholder = intl.formatMessage({
            id: 'CommissionForm.passwordPlaceholder',
          });
          const passwordRequiredMessage = intl.formatMessage({
            id: 'CommissionForm.passwordRequired',
          });

          const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);

          const passwordFailedMessage = intl.formatMessage({
            id: 'CommissionForm.passwordFailed',
          });
          const passwordTouched =
            values.currentPassword &&
            this.submittedValues.currentPassword !== values.currentPassword;
          const changeCommissionText = isChangePasswordWrongPassword(changeCommissionError)
            ? passwordFailedMessage
            : null;

          const confirmClasses = classNames(css.confirmChangesSection, {
            [css.confirmChangesSectionVisible]: !pristine,
          });

          const genericFailure =
          changeCommissionError && !changeCommissionText ? (
              <span className={css.error}>
                <FormattedMessage id="CommissionForm.genericFailure" />
              </span>
            ) : null;

          const classes = classNames(rootClassName || css.root, className);
          const submitDisabled = invalid || inProgress;

          const sendPasswordLink = (
            <span className={css.helperLink} onClick={this.handleResetPassword} role="button">
              <FormattedMessage id="CommissionForm.resetPasswordLinkText" />
            </span>
          );

          const resendPasswordLink = (
            <span className={css.helperLink} onClick={this.handleResetPassword} role="button">
              <FormattedMessage id="CommissionForm.resendPasswordLinkText" />
            </span>
          );

          const resetPasswordLink =
            this.state.showResetPasswordMessage || resetPasswordInProgress ? (
              <>
                <FormattedMessage
                  id="CommissionForm.resetPasswordLinkSent"
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
                  <FormattedMessage id="CommissionForm.confirmChangesTitle" />
                </H4>
                <p className={css.confirmChangesInfo}>
                  <FormattedMessage id="CommissionForm.confirmChangesInfo" />
                  <br />
                  <FormattedMessage
                    id="CommissionForm.resetPasswordInfo"
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
                  <FormattedMessage id="CommissionForm.saveChanges" />
                </PrimaryButton>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

CommissionFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  changeCommissionError: null,
  inProgress: false,
  formId: null,
};

const { bool, string } = PropTypes;

CommissionFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  changeCommissionError: propTypes.error,
  inProgress: bool,
  intl: intlShape.isRequired,
  ready: bool.isRequired,
  formId: string,
};

const CommissionForm = compose(injectIntl)(CommissionFormComponent);
CommissionForm.displayName = 'CommissionForm';

export default CommissionForm;
