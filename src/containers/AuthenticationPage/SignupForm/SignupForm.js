import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { getPropsForCustomUserFieldInputs } from '../../../util/userHelpers';
import getZodiacSign from '../../../util/getZodiacSign';

import { Form, PrimaryButton, FieldTextInput, FieldSelect, CustomExtendedDataField, FieldCheckbox } from '../../../components';

import FieldSelectUserType from '../FieldSelectUserType';
import UserFieldDisplayName from '../UserFieldDisplayName';
import UserFieldPhoneNumber from '../UserFieldPhoneNumber';

import css from './SignupForm.module.css';
import termsCss from '../TermsAndConditions/TermsAndConditions.module.css';

const getSoleUserTypeMaybe = userTypes =>
  Array.isArray(userTypes) && userTypes.length === 1 ? userTypes[0].userType : null;

/**
 * Get values for submission. By default, the values that have been touched get submitted.
 *
 * @param {Object} values
 * @param {Object} registeredFields
 * @param {Array<Object>} userFields
 * @param {string} userType
 * @param {Array<Object>} userTypes
 * @param {Object} intl
 * @returns {Object}
 */
const getValuesForSubmission = (values, registeredFields, userFields, userType, userTypes, intl) => {
  const { fname, lname, ...restOfValues } = values;
  const publicData = {
    // There are several custom user fields, so we need to filter out the ones
    // that are not in the form.
    ...registeredFields.reduce((acc, v) => {
      const isFName = v === 'firstName';
      const isLName = v === 'lastName';

      // The backend has a validation that requires the first name to be present.
      const fNameMaybe = isLName ? { firstName: values.firstName } : {};

      // The backend has a validation that requires the last name to be present.
      const lNameMaybe = isFName ? { lastName: values.lastName } : {};

      return { ...acc, ...fNameMaybe, ...lNameMaybe, [v]: values[v] };
    }, {}),
  };

  // The protected data object contains the user's private information.
  // We need to add the user's phone number to the protected data if it's present.
  const { phoneNumber, ...restOfPublicData } = publicData;
  const protectedData = phoneNumber ? { phoneNumber } : {};

  return { publicData: restOfPublicData, protectedData };
};

const SignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    initialValues={{ userType: props.preselectedUserType || getSoleUserTypeMaybe(props.userTypes) }}
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
        preselectedUserType,
        userTypes,
        userFields,
        values,
      } = formRenderProps;

      const { userType } = values || {};

      // email
      const emailRequired = validators.required(
        intl.formatMessage({
          id: 'SignupForm.emailRequired',
        })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({
          id: 'SignupForm.emailInvalid',
        })
      );

      // password
      const passwordRequiredMessage = intl.formatMessage({
        id: 'SignupForm.passwordRequired',
      });
      const passwordMinLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooShort',
        },
        {
          minLength: validators.PASSWORD_MIN_LENGTH,
        }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooLong',
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
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);
      const passwordValidators = validators.composeValidators(
        passwordRequired,
        passwordMinLength,
        passwordMaxLength
      );

      // Custom user fields. Since user types are not supported here,
      // only fields with no user type id limitation are selected.
      const userFieldProps = getPropsForCustomUserFieldInputs(userFields, intl, userType);

      const noUserTypes = !userType && !(userTypes?.length > 0);
      const userTypeConfig = userTypes.find(config => config.userType === userType);
      const showDefaultUserFields = userType || noUserTypes;
      const showCustomUserFields = (userType || noUserTypes) && userFieldProps?.length > 0;

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      const {
        email,
        password,
        firstName,
        lastName,
        birthdayMonth,
        birthdayDay,
        birthdayYear,
        instagramHandle,
        ...restOfValues
      } = values;

      const zodiac = getZodiacSign(birthdayMonth, birthdayDay);

      const { publicData, protectedData } = getValuesForSubmission(
        values,
        formRenderProps.form.getRegisteredFields(),
        userFields,
        userType,
        userTypes,
        intl
      );

      // pass all the form values to the parent component
      const signupParams = {
        email,
        password,
        firstName,
        lastName,
        publicData: {
          ...publicData,
          instagramHandle,
          birthdayMonth,
          birthdayDay,
          birthdayYear: birthdayYear || null,
        },
        privateData: {
          // Remove birthday data from privateData since we're storing it in publicData
        },
        protectedData: {
          ...protectedData,
          zodiacSign: zodiac,
        },
      };

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldSelectUserType
            name="userType"
            userTypes={userTypes}
            hasExistingUserType={!!preselectedUserType}
            intl={intl}
          />

          {showDefaultUserFields ? (
            <div className={css.defaultUserFields}>
              <FieldTextInput
                type="email"
                id={formId ? `${formId}.email` : 'email'}
                name="email"
                autoComplete="email"
                label={intl.formatMessage({
                  id: 'SignupForm.emailLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.emailPlaceholder',
                })}
                validate={validators.composeValidators(emailRequired, emailValid)}
              />
              <div className={css.name}>
                <FieldTextInput
                  className={css.firstNameRoot}
                  type="text"
                  id={formId ? `${formId}.fname` : 'fname'}
                  name="fname"
                  autoComplete="given-name"
                  label={intl.formatMessage({
                    id: 'SignupForm.firstNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.firstNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.firstNameRequired',
                    })
                  )}
                />
                <FieldTextInput
                  className={css.lastNameRoot}
                  type="text"
                  id={formId ? `${formId}.lname` : 'lname'}
                  name="lname"
                  autoComplete="family-name"
                  label={intl.formatMessage({
                    id: 'SignupForm.lastNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.lastNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.lastNameRequired',
                    })
                  )}
                />
              </div>

              <UserFieldDisplayName
                formName="SignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />

              <FieldTextInput
                className={css.password}
                type="password"
                id={formId ? `${formId}.password` : 'password'}
                name="password"
                autoComplete="new-password"
                label={intl.formatMessage({
                  id: 'SignupForm.passwordLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.passwordPlaceholder',
                })}
                validate={passwordValidators}
              />

              <UserFieldPhoneNumber
                formName="SignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />

              {console.log('userType at render:', userType)}
              {userType === 'lender' ? (
                <FieldTextInput
                  id="instagramHandle"
                  name="instagramHandle"
                  label="Instagram handle (optional)"
                  placeholder="@"
                  className={css.row}
                />
              ) : null}

              <div className={css.birthdayContainer}>
                <FieldSelect
                  id="birthdayMonth"
                  name="birthdayMonth"
                  label="Month"
                  className={css.birthdayField}
                  validate={validators.required('Month is required')}
                >
                  <option disabled value="">
                    Month
                  </option>
                  {[
                    { key: '1', label: 'January' },
                    { key: '2', label: 'February' },
                    { key: '3', label: 'March' },
                    { key: '4', label: 'April' },
                    { key: '5', label: 'May' },
                    { key: '6', label: 'June' },
                    { key: '7', label: 'July' },
                    { key: '8', label: 'August' },
                    { key: '9', label: 'September' },
                    { key: '10', label: 'October' },
                    { key: '11', label: 'November' },
                    { key: '12', label: 'December' },
                  ].map(option => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </FieldSelect>

                <FieldSelect
                  id="birthdayDay"
                  name="birthdayDay"
                  label="Day"
                  className={css.birthdayField}
                  validate={validators.required('Day is required')}
                >
                  <option disabled value="">
                    Day
                  </option>
                  {Array.from({ length: 31 }, (_, i) => ({
                    key: `${i + 1}`,
                    label: `${i + 1}`,
                  })).map(option => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </FieldSelect>

                <FieldSelect
                  id="birthdayYear"
                  name="birthdayYear"
                  label="Year (optional)"
                  className={css.birthdayField}
                >
                  <option disabled value="">
                    Year
                  </option>
                  {Array.from({ length: new Date().getFullYear() - 1919 }, (_, i) => ({
                    key: `${new Date().getFullYear() - i}`,
                    label: `${new Date().getFullYear() - i}`,
                  })).map(option => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            </div>
          ) : null}

          {showCustomUserFields ? (
            <div className={css.customFields}>
              {userFieldProps.map(({ key, ...fieldProps }) => (
                <CustomExtendedDataField key={key} {...fieldProps} formId={formId} />
              ))}
            </div>
          ) : null}

          <div className={css.bottomWrapper}>
            <div style={{ marginBottom: '16px' }}>
              <FieldCheckbox
                id={formId ? `${formId}.smsOptIn` : 'smsOptIn'}
                name="smsOptIn"
                label="I agree to receive SMS notifications about my account"
                textClassName={termsCss.finePrint}
                required
              />
            </div>
            {termsAndConditions}
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="SignupForm.signUp" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

/**
 * A component that renders the signup form.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name that overrides the default class css.root
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {ReactNode} props.termsAndConditions - The terms and conditions
 * @param {string} props.preselectedUserType - The preselected user type
 * @param {propTypes.userTypes} props.userTypes - The user types
 * @param {propTypes.listingFields} props.userFields - The user fields
 * @returns {JSX.Element}
 */
const SignupForm = props => {
  const intl = useIntl();
  return <SignupFormComponent {...props} intl={intl} />;
};

export default SignupForm;
