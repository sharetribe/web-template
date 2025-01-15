import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';

import { Form, PrimaryButton, FieldTextInput } from '../../../components';

import css from './PasswordResetForm.module.css';

/**
 * The reset-password form.
 *
 * @param {Object} props
 * @param {string} [props.formId] - The form ID
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {boolean} [props.inProgress] - Whether the form is in progress
 * @returns {JSX.Element} Reset-password form component
 */
const PasswordResetForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress = false,
        invalid,
      } = fieldRenderProps;

      const intl = useIntl();
      // password
      const passwordLabel = intl.formatMessage({
        id: 'PasswordResetForm.passwordLabel',
      });
      const passwordPlaceholder = intl.formatMessage({
        id: 'PasswordResetForm.passwordPlaceholder',
      });
      const passwordRequiredMessage = intl.formatMessage({
        id: 'PasswordResetForm.passwordRequired',
      });
      const passwordMinLengthMessage = intl.formatMessage(
        {
          id: 'PasswordResetForm.passwordTooShort',
        },
        {
          minLength: validators.PASSWORD_MIN_LENGTH,
        }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        {
          id: 'PasswordResetForm.passwordTooLong',
        },
        {
          maxLength: validators.PASSWORD_MAX_LENGTH,
        }
      );
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);
      const passwordMinLength = validators.minLength(
        passwordMinLengthMessage,
        validators.PASSWORD_MIN_LENGTH
      );
      const passwordMaxLength = validators.maxLength(
        passwordMaxLengthMessage,
        validators.PASSWORD_MAX_LENGTH
      );

      const classes = classNames(rootClassName || css.root, className);

      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldTextInput
            className={css.password}
            type="password"
            id={formId ? `${formId}.password` : 'password'}
            name="password"
            autoComplete="new-password"
            label={passwordLabel}
            placeholder={passwordPlaceholder}
            validate={validators.composeValidators(
              passwordRequired,
              passwordMinLength,
              passwordMaxLength
            )}
          />
          <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
            <FormattedMessage id="PasswordResetForm.submitButtonText" />
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

export default PasswordResetForm;
