import React, { Component } from 'react';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import arrayMutators from 'final-form-arrays';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { ensureCurrentUser } from '../../../util/data';
import { propTypes, USER_TYPES } from '../../../util/types';
import * as validators from '../../../util/validators';
import {
  getPropsForCustomUserFieldInputs,
  getUserTypeFieldInputs,
  isCreativeSeller,
} from '../../../util/userHelpers';

import {
  Form,
  Button,
  FieldTextInput,
  H4,
  CustomExtendedDataField,
  FieldLocationAutocompleteInput,
} from '../../../components';
import ApplyAsSellerToggle from '../ApplyAsSellerToggle/ApplyAsSellerToggle';
import AvatarField from '../AvatarField/AvatarField';
import DisplayNameMaybe from '../DisplayNameMaybe/DisplayNameMaybe';

import css from './ProfileSettingsForm.module.css';

const identity = v => v;

/**
 * ProfileSettingsForm
 * TODO: change to functional component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.formId] - The form id
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {Object} props.userTypeConfig - The user type config
 * @param {string} props.userTypeConfig.userType - The user type
 * @param {Array<Object>} props.userFields - The user fields
 * @param {Object} [props.profileImage] - The profile image
 * @param {string} props.marketplaceName - The marketplace name
 * @param {Function} props.onImageUpload - The function to handle image upload
 * @param {Function} props.onSubmit - The function to handle form submission
 * @param {boolean} props.uploadInProgress - Whether the upload is in progress
 * @param {propTypes.error} [props.uploadImageError] - The upload image error
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {propTypes.error} [props.updateProfileError] - The update profile error
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
class ProfileSettingsFormComponent extends Component {
  constructor(props) {
    super(props);
    this.submittedValues = {};
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        mutators={{ ...arrayMutators }}
        render={fieldRenderProps => {
          const {
            className,
            currentUser,
            handleSubmit,
            intl,
            invalid,
            onImageUpload,
            pristine,
            profileImage,
            rootClassName,
            updateInProgress,
            updateProfileError,
            uploadImageError,
            uploadInProgress,
            form,
            formId,
            marketplaceName,
            values,
            userFields,
            userTypes,
            sellerStatus,
          } = fieldRenderProps;
          const { applyAsSeller, userType: initialUserType } = values || {};
          const userType = applyAsSeller ? USER_TYPES.SELLER : initialUserType;
          const userTypeConfig = userTypes.find(config => config.userType === userType);
          const user = ensureCurrentUser(currentUser);

          // First name
          const firstNameLabel = intl.formatMessage({
            id: 'ProfileSettingsForm.firstNameLabel',
          });
          const firstNamePlaceholder = intl.formatMessage({
            id: 'ProfileSettingsForm.firstNamePlaceholder',
          });
          const firstNameRequiredMessage = intl.formatMessage({
            id: 'ProfileSettingsForm.firstNameRequired',
          });
          const firstNameRequired = validators.required(firstNameRequiredMessage);
          // Last name
          const lastNameLabel = intl.formatMessage({
            id: 'ProfileSettingsForm.lastNameLabel',
          });
          const lastNamePlaceholder = intl.formatMessage({
            id: 'ProfileSettingsForm.lastNamePlaceholder',
          });
          const lastNameRequiredMessage = intl.formatMessage({
            id: 'ProfileSettingsForm.lastNameRequired',
          });
          const lastNameRequired = validators.required(lastNameRequiredMessage);
          // Bio
          const bioLabel = intl.formatMessage({
            id: 'ProfileSettingsForm.bioLabel',
          });
          const bioPlaceholder = intl.formatMessage({
            id: 'ProfileSettingsForm.bioPlaceholder',
          });
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

          const submitError = updateProfileError ? (
            <div className={css.error}>
              <FormattedMessage id="ProfileSettingsForm.updateProfileFailed" />
            </div>
          ) : null;

          const classes = classNames(rootClassName || css.root, className);
          const submitInProgress = updateInProgress;
          const submittedOnce = Object.keys(this.submittedValues).length > 0;
          const pristineSinceLastSubmit = submittedOnce && isEqual(values, this.submittedValues);
          const submitDisabled =
            invalid || pristine || pristineSinceLastSubmit || uploadInProgress || submitInProgress;
          const userFieldProps = getPropsForCustomUserFieldInputs(
            userFields,
            intl,
            userType,
            false
          );

          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedValues = values;
                handleSubmit(e);
              }}
            >
              <AvatarField
                user={user}
                onImageUpload={onImageUpload}
                profileImage={profileImage}
                uploadImageError={uploadImageError}
                uploadInProgress={uploadInProgress}
                form={form}
              />
              <div className={css.sectionContainer}>
                <H4 as="h2" className={css.sectionTitle}>
                  <FormattedMessage id="ProfileSettingsForm.yourName" />
                </H4>
                <div className={css.nameContainer}>
                  <FieldTextInput
                    className={css.firstName}
                    type="text"
                    id="firstName"
                    name="firstName"
                    label={firstNameLabel}
                    placeholder={firstNamePlaceholder}
                    validate={firstNameRequired}
                  />
                  <FieldTextInput
                    className={css.lastName}
                    type="text"
                    id="lastName"
                    name="lastName"
                    label={lastNameLabel}
                    placeholder={lastNamePlaceholder}
                    validate={lastNameRequired}
                  />
                </div>
              </div>

              <DisplayNameMaybe userTypeConfig={userTypeConfig} intl={intl} />

              <div className={classNames(css.sectionContainer)}>
                <H4 as="h2" className={css.sectionTitle}>
                  <FormattedMessage id="ProfileSettingsForm.bioHeading" />
                </H4>
                <FieldTextInput
                  type="textarea"
                  id="bio"
                  name="bio"
                  label={bioLabel}
                  placeholder={bioPlaceholder}
                />
                <p className={css.extraInfo}>
                  <FormattedMessage id="ProfileSettingsForm.bioInfo" values={{ marketplaceName }} />
                </p>
              </div>

              <ApplyAsSellerToggle userType={initialUserType} sellerStatus={sellerStatus} />

              <div className={classNames(css.sectionContainer, css.lastSection)}>
                {applyAsSeller ? (
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

                {userFieldProps.map(fieldProps => {
                  const isBrandAdmin =
                    currentUser.attributes.profile.metadata.isBrandAdmin || false;
                  const fieldKey = fieldProps.fieldConfig.key;
                  const enableField = getUserTypeFieldInputs(
                    userType,
                    fieldKey,
                    isBrandAdmin,
                    !!applyAsSeller,
                    false
                  );
                  const showField = isCreativeSeller(userType) ? enableField : true;
                  return showField ? (
                    <CustomExtendedDataField
                      {...fieldProps}
                      formId={formId}
                      disabled={!enableField}
                    />
                  ) : null;
                })}
              </div>
              {submitError}
              <Button
                className={css.submitButton}
                type="submit"
                inProgress={submitInProgress}
                disabled={submitDisabled}
                ready={pristineSinceLastSubmit}
              >
                <FormattedMessage id="ProfileSettingsForm.saveChanges" />
              </Button>
            </Form>
          );
        }}
      />
    );
  }
}

const ProfileSettingsForm = compose(injectIntl)(ProfileSettingsFormComponent);

ProfileSettingsForm.displayName = 'ProfileSettingsForm';

export default ProfileSettingsForm;
