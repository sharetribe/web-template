import React, { useEffect, useState } from 'react';
import { bool, node, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import Cookies from 'js-cookie';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { getPropsForCustomUserFieldInputs } from '../../../util/userHelpers';
import { regions } from '../../../config/regions';

import { Form, PrimaryButton, FieldTextInput, CustomExtendedDataField } from '../../../components';

import FieldSelectUserType from '../FieldSelectUserType';
import UserFieldDisplayName from '../UserFieldDisplayName';
import UserFieldPhoneNumber from '../UserFieldPhoneNumber';

import { getUserLocationData } from '../../../extensions/user-location-data/helpers';

import css from './SignupForm.module.css';

const getSoleUserTypeMaybe = userTypes =>
  Array.isArray(userTypes) && userTypes.length === 1 ? userTypes[0].userType : null;

const SignupFormComponent = props => {
  const [currency, setCurrency] = useState(null);
  const [region, setRegion] = useState(null);
  const [promoCode, setPromoCode] = useState(null);

  useEffect(() => {
    const fetchLocationData = async position => {
      try {
        const userLocationData = await getUserLocationData(position);
        if (userLocationData.currency) {
          setCurrency(userLocationData.currency);
        }
        if (userLocationData.region) {
          setRegion(userLocationData.region);
        }
      } catch (error) {
        console.error('Error fetching user location data:', error);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(fetchLocationData);
    } else {
      console.log('Geolocation is not supported by this browser.');
    }

    // Get promo code from URL if it exists, otherwise check cookie
    //if the value is set, make the field readonly
    const params = new URLSearchParams(window.location.search);
    const fprParam = params.get('fpr');
    const cookiePromoCode = Cookies.get('_fprom_ref');
    if (fprParam) {
      setPromoCode(fprParam);
    } else if (cookiePromoCode) {
        setPromoCode(cookiePromoCode);
      }
    
    if(fprParam || cookiePromoCode){ 
      document.getElementById('pub_userPromoCode').setAttribute('readonly', true)
    }
  }, []);

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      initialValues={{
        userType: props.preselectedUserType || getSoleUserTypeMaybe(props.userTypes),
        pub_userCurrency: currency,
        pub_userLocation: region,
        pub_userPromoCode: promoCode,
        pub_userAffiliateProgram: 'true'
      }}
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

       
        //modify location to be a list of regions
        userFieldProps.find(field => field.key == 'pub_userLocation')
          .fieldConfig.schemaType='enum';
        userFieldProps.find(field => field.key == 'pub_userLocation')
          .fieldConfig.enumOptions= regions;
        //console.log('user fields', userFieldProps)

        const noUserTypes = !userType && !(userTypes?.length > 0);
        const userTypeConfig = userTypes.find(config => config.userType === userType);
        const showDefaultUserFields = userType || noUserTypes;
        const showCustomUserFields = (userType || noUserTypes) && userFieldProps?.length > 0;

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;
        const submitDisabled = invalid || submitInProgress;

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
              </div>
            ) : null}

            {showCustomUserFields ? (
              <div className={css.customFields}>
                {userFieldProps.map(fieldProps => (
                  <CustomExtendedDataField {...fieldProps} formId={formId} />
                ))}
              </div>
            ) : null}

            <div className={css.bottomWrapper}>
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
};

SignupFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  formId: null,
  inProgress: false,
  preselectedUserType: null,
};

SignupFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  formId: string,
  inProgress: bool,
  termsAndConditions: node.isRequired,
  preselectedUserType: string,
  userTypes: propTypes.userTypes.isRequired,
  userFields: propTypes.listingFields.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const SignupForm = compose(injectIntl)(SignupFormComponent);
SignupForm.displayName = 'SignupForm';

export default SignupForm;
