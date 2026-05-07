import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import {
  Form,
  PrimaryButton,
  FieldTextInput,
  NamedLink,
  SecondaryButton,
} from '../../../components';

import css from './LoginForm.module.css';
import { useHistory } from 'react-router-dom';

const LoginFormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const history = useHistory();
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        intl,
        invalid,
        values,
        errors,
        signupRouteName,
        signupRouteParams,
        authLinkTo,
      } = fieldRenderProps;

      // email
      const emailLabel = intl.formatMessage({
        id: 'LoginForm.emailLabel',
      });
      const emailPlaceholder = intl.formatMessage({
        id: 'LoginForm.emailPlaceholder',
      });
      const emailRequiredMessage = intl.formatMessage({
        id: 'LoginForm.emailRequired',
      });
      const emailRequired = validators.required(emailRequiredMessage);
      const emailInvalidMessage = intl.formatMessage({
        id: 'LoginForm.emailInvalid',
      });
      const emailValid = validators.emailFormatValid(emailInvalidMessage);

      // password
      const passwordLabel = intl.formatMessage({
        id: 'LoginForm.passwordLabel',
      });
      const passwordPlaceholder = intl.formatMessage({
        id: 'LoginForm.passwordPlaceholder',
      });
      const passwordRequiredMessage = intl.formatMessage({
        id: 'LoginForm.passwordRequired',
      });
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      const passwordRecoveryLink = (
        <NamedLink
          name="PasswordRecoveryPage"
          className={css.recoveryLink}
          to={{
            search:
              values?.email && !errors?.email ? `email=${encodeURIComponent(values.email)}` : '',
          }}
        >
          <FormattedMessage id="LoginForm.forgotPassword" />
        </NamedLink>
      );

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <h2 className={css.createAccountTitle}>Login to your account</h2>
          <p className={css.createAccountDescription}>Welcome back! Please enter your details.</p>
          <div>
            <FieldTextInput
              type="email"
              id={formId ? `${formId}.email` : 'email'}
              name="email"
              autoComplete="email"
              label={''}
              placeholder={emailPlaceholder}
              validate={validators.composeValidators(emailRequired, emailValid)}
            />
            <FieldTextInput
              className={css.password}
              type="password"
              id={formId ? `${formId}.password` : 'password'}
              name="password"
              autoComplete="current-password"
              label={''}
              placeholder={passwordPlaceholder}
              validate={passwordRequired}
            />
          </div>
          <div className={css.bottomWrapper}>
            <p className={css.bottomWrapperText}>
              <span className={css.recoveryLinkInfo}>
                <FormattedMessage
                  id="LoginForm.forgotPasswordInfo"
                  values={{ passwordRecoveryLink }}
                />
              </span>
            </p>
            <PrimaryButton
              className={css.primaryButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              <FormattedMessage id="LoginForm.logIn" />
            </PrimaryButton>
            <div className={css.createAccount}>
              <SecondaryButton type="button" onClick={() => history.push('/signup')}>
                <FormattedMessage id="LoginForm.signupLinkText" />
              </SecondaryButton>
              {/* <span className={css.recoveryLinkInfo}>
                <FormattedMessage id="LoginForm.signUpRedirectInfo" values={{ signUpLink }} />
              </span> */}
            </div>
          </div>
        </Form>
      );
    }}
  />
);

/**
 * A component that renders the login form.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name that overrides the default class css.root
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {string} props.signupRouteName - Named route for signup (e.g. SignupPage or SignupForUserTypePage)
 * @param {Object} props.signupRouteParams - Path params for the signup route
 * @param {Object} props.authLinkTo - History `to` object (e.g. state) preserved when switching auth views
 * @returns {JSX.Element}
 */
const LoginForm = props => {
  const intl = useIntl();
  const {
    signupRouteName = 'SignupPage',
    signupRouteParams = {},
    authLinkTo = {},
    ...rest
  } = props;
  return (
    <LoginFormComponent
      {...rest}
      intl={intl}
      signupRouteName={signupRouteName}
      signupRouteParams={signupRouteParams}
      authLinkTo={authLinkTo}
    />
  );
};

export default LoginForm;
