import React from 'react';
import { bool, node, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import {
  getPropsForCustomUserFieldInputs,
  getBrandUserFieldInputs,
  isCreativeSeller,
  isStudioBrand,
} from '../../../util/userHelpers';
import {
  Form,
  PrimaryButton,
  FieldTextInput,
  CustomExtendedDataField,
  FieldLocationAutocompleteInput,
} from '../../../components';
import UserFieldDisplayName from '../UserFieldDisplayName';
import UserFieldPhoneNumber from '../UserFieldPhoneNumber';

import css from './ConfirmSignupForm.module.css';

const identity = v => v;

const getSoleUserTypeMaybe = userTypes =>
  Array.isArray(userTypes) && userTypes.length === 1 ? userTypes[0].userType : null;

const ConfirmSignupFormComponent = props => (
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
        authInfo,
        idp,
        userTypes,
        userFields,
        values,
      } = formRenderProps;
      const { userType } = values || {};

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

      // Location
      const addressRequired = validators.autocompleteSearchRequired(
        intl.formatMessage({
          id: 'ConfirmSignupForm.addressRequired',
        })
      );
      const addressValid = validators.autocompletePlaceSelected(
        intl.formatMessage({
          id: 'ConfirmSignupForm.addressNotRecognized',
        })
      );

      // Custom user fields. Since user types are not supported here,
      // only fields with no user type id limitation are selected.
      const userFieldProps = getPropsForCustomUserFieldInputs(userFields, intl, userType);
      const noUserTypes = !userType && !(userTypes?.length > 0);
      const userTypeConfig = userTypes.find(config => config.userType === userType);
      const showDefaultUserFields = userType || noUserTypes;
      const showCustomUserFields = (userType || noUserTypes) && userFieldProps?.length > 0;
      const showSellerLocationFields = isCreativeSeller(userType);
      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      // If authInfo is not available we should not show the ConfirmForm
      if (!authInfo) {
        return;
      }

      // Initial values from idp provider
      const { email, firstName, lastName } = authInfo;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {showDefaultUserFields ? (
            <div className={css.defaultUserFields}>
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

              <UserFieldDisplayName
                formName="ConfirmSignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />
              <UserFieldPhoneNumber
                formName="ConfirmSignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />
            </div>
          ) : null}

          {showCustomUserFields ? (
            <div className={css.customFields}>
              {userFieldProps.map(fieldProps => {
                const { preselectedUserType, authInfo } = props;
                const { brandStudioId } = authInfo;
                const isBrandAdmin = !brandStudioId;
                const fieldKey = fieldProps.fieldConfig.key;
                const showField = isStudioBrand(preselectedUserType)
                  ? getBrandUserFieldInputs(fieldKey, isBrandAdmin)
                  : true;
                return showField ? (
                  <CustomExtendedDataField {...fieldProps} formId={formId} />
                ) : null;
              })}
            </div>
          ) : null}

          {showSellerLocationFields ? (
            <div className={css.customFields}>
              <FieldLocationAutocompleteInput
                rootClassName={css.locationAddress}
                inputClassName={css.locationAutocompleteInput}
                iconClassName={css.locationAutocompleteInputIcon}
                predictionsClassName={css.predictionsRoot}
                validClassName={css.validLocation}
                name="location"
                label={intl.formatMessage({ id: 'ConfirmSignupForm.address' })}
                placeholder={intl.formatMessage({
                  id: 'ConfirmSignupForm.addressPlaceholder',
                })}
                useDefaultPredictions={false}
                format={identity}
                valueFromForm={values.location?.address}
                validate={validators.composeValidators(addressRequired, addressValid)}
              />
            </div>
          ) : null}

          <div className={css.bottomWrapper}>
            {termsAndConditions}
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="ConfirmSignupForm.signUp" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

ConfirmSignupFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  formId: null,
  inProgress: false,
  preselectedUserType: null,
};

ConfirmSignupFormComponent.propTypes = {
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

const ConfirmSignupForm = compose(injectIntl)(ConfirmSignupFormComponent);
ConfirmSignupForm.displayName = 'ConfirmSignupForm';

export default ConfirmSignupForm;
