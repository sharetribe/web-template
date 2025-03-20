import React, { Component } from 'react';
import { Form as FinalForm } from 'react-final-form';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { isPasswordRecoveryEmailNotFoundError } from '../../../util/errors';

import { Form, PrimaryButton, FieldTextInput, NamedLink } from '../../../components';

import css from './PasswordRecoveryForm.module.css';

/**
 * The password recovery form.
 * TODO: change to functional component
 *
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.formId] - The form ID
 * @param {boolean} [props.inProgress] - Whether the form is in progress
 * @param {propTypes.error} [props.recoveryError] - The recovery error
 * @returns {JSX.Element} Password recovery form component
 */
class PasswordRecoveryForm extends Component {
  constructor(props) {
    super(props);
    this.submittedValues = {};
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
            handleSubmit,
            pristine,
            initialValues,
            inProgress = false,
            recoveryError,
            values,
          } = fieldRenderProps;

          const intl = useIntl();

          // email
          const emailLabel = intl.formatMessage({
            id: 'PasswordRecoveryForm.emailLabel',
          });
          const emailPlaceholder = intl.formatMessage({
            id: 'PasswordRecoveryForm.emailPlaceholder',
          });
          const emailRequiredMessage = intl.formatMessage({
            id: 'PasswordRecoveryForm.emailRequired',
          });
          const emailNotFoundMessage = intl.formatMessage({
            id: 'PasswordRecoveryForm.emailNotFound',
          });
          const emailInvalidMessage = intl.formatMessage({
            id: 'PasswordRecoveryForm.emailInvalid',
          });

          const emailRequired = validators.required(emailRequiredMessage);
          const emailValid = validators.emailFormatValid(emailInvalidMessage);

          // In case a given email is not found, pass a custom error message
          // to be rendered with the input component
          const customErrorText = isPasswordRecoveryEmailNotFoundError(recoveryError)
            ? emailNotFoundMessage
            : null;
          const initialEmail = initialValues ? initialValues.email : null;
          const emailTouched = values.email !== this.submittedValues.email;

          const classes = classNames(rootClassName || css.root, className);
          const submitInProgress = inProgress;
          const submittedOnce = Object.keys(this.submittedValues).length > 0;
          const pristineSinceLastSubmit = submittedOnce && isEqual(values, this.submittedValues);
          const submitDisabled =
            (pristine && !initialEmail) || submitInProgress || pristineSinceLastSubmit;

          const loginLink = (
            <NamedLink name="LoginPage" className={css.modalHelperLink}>
              <FormattedMessage id="PasswordRecoveryForm.loginLinkText" />
            </NamedLink>
          );

          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedValues = values;
                handleSubmit(e);
              }}
            >
              <FieldTextInput
                className={css.email}
                type="email"
                id={formId ? `${formId}.email` : 'email'}
                name="email"
                autoComplete="email"
                label={emailLabel}
                placeholder={emailPlaceholder}
                validate={validators.composeValidators(emailRequired, emailValid)}
                customErrorText={emailTouched ? null : customErrorText}
              />

              <div className={css.bottomWrapper}>
                <p className={css.bottomWrapperText}>
                  <span className={css.modalHelperText}>
                    <FormattedMessage
                      id="PasswordRecoveryForm.loginLinkInfo"
                      values={{ loginLink }}
                    />
                  </span>
                </p>

                <PrimaryButton
                  type="submit"
                  inProgress={submitInProgress}
                  disabled={submitDisabled}
                >
                  <FormattedMessage id="PasswordRecoveryForm.sendInstructions" />
                </PrimaryButton>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

export default PasswordRecoveryForm;
