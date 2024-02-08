import React from 'react';
import { bool, node } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { Form, PrimaryButton, FieldTextInput, FieldPhoneNumberInput } from '../../../components';

import css from './ConfirmSignupForm.module.css';
// import FieldPhoneNumberInput from '../../../components';

const ConfirmSignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        termsAndConditions,
        authInfo,
        idp,
      } = formRenderProps;

      // email
      const emailRequired = validators.required(
        intl.formatMessage({
          id: 'ConfirmSignupForm.emailRequired',
        })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({
          id: 'ConfirmSignupForm.emailInvalid',
        })
      );

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      // If authInfo is not available we should not show the ConfirmForm
      if (!authInfo) {
        return;
      }

      // Initial values from idp provider
      const { email, firstName, lastName } = authInfo;

      // phone number
      const phoneLabel = intl.formatMessage({
        id: 'SignupForm.phoneLabel',
      });
      const phonePlaceholder = intl.formatMessage({
        id: 'SignupForm.phonePlaceholder',
      });
      const phoneRequiredMessage = intl.formatMessage({
        id: 'SignupForm.phoneRequired',
      });
      const phoneRequired = validators.required(phoneRequiredMessage);

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div>
            <FieldTextInput
              type="email"
              id={formId ? `${formId}.email` : 'email'}
              name="email"
              autoComplete="email"
              label={intl.formatMessage({
                id: 'ConfirmSignupForm.emailLabel',
              })}
              placeholder={intl.formatMessage({
                id: 'ConfirmSignupForm.emailPlaceholder',
              })}
              initialValue={email}
              validate={validators.composeValidators(emailRequired, emailValid)}
            />
            <FieldPhoneNumberInput
              className={css.phone}
              id={formId ? `${formId}.phoneNumber` : 'phoneNumber'}
              name="phoneNumber"
              label={phoneLabel}
              placeholder={phonePlaceholder}
              validate={phoneRequired}
            />
            <div className={css.name}>
              <FieldTextInput
                className={css.firstNameRoot}
                type="text"
                id={formId ? `${formId}.firstName` : 'firstName'}
                name="firstName"
                autoComplete="given-name"
                label={intl.formatMessage({
                  id: 'ConfirmSignupForm.firstNameLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'ConfirmSignupForm.firstNamePlaceholder',
                })}
                initialValue={firstName}
                validate={validators.required(
                  intl.formatMessage({
                    id: 'ConfirmSignupForm.firstNameRequired',
                  })
                )}
              />
              <FieldTextInput
                className={css.lastNameRoot}
                type="text"
                id={formId ? `${formId}.lastName` : 'lastName'}
                name="lastName"
                autoComplete="family-name"
                label={intl.formatMessage({
                  id: 'ConfirmSignupForm.lastNameLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'ConfirmSignupForm.lastNamePlaceholder',
                })}
                initialValue={lastName}
                validate={validators.required(
                  intl.formatMessage({
                    id: 'ConfirmSignupForm.lastNameRequired',
                  })
                )}
              />
            </div>
          </div>

          <div className={css.bottomWrapper}>
            {termsAndConditions}
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="ConfirmSignupForm.signUp" values={{ idp: idp }} />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

ConfirmSignupFormComponent.defaultProps = { inProgress: false };

ConfirmSignupFormComponent.propTypes = {
  inProgress: bool,
  termsAndConditions: node.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const ConfirmSignupForm = compose(injectIntl)(ConfirmSignupFormComponent);
ConfirmSignupForm.displayName = 'ConfirmSignupForm';

export default ConfirmSignupForm;
