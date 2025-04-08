import React from 'react';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage } from '../../../util/reactIntl';
import { isSignupEmailTakenError } from '../../../util/errors';
import {
  pickUserFieldsData,
  addScopePrefix,
  isStudioBrand,
  isCreativeSeller,
} from '../../../util/userHelpers';
import { Heading } from '../../../components';

import ConfirmSignupForm from '../ConfirmSignupForm/ConfirmSignupForm';
import BaseSignup from '../Signup/BaseSignup';
import BrandSignup from '../Signup/BrandSignup';

import css from './AuthenticationForms.module.css';

const getNonUserFieldParams = (values, userFieldConfigs) => {
  const userFieldKeys = userFieldConfigs.map(({ scope, key }) => addScopePrefix(scope, key));
  return Object.entries(values).reduce((picked, [key, value]) => {
    const isUserFieldKey = userFieldKeys.includes(key);
    return isUserFieldKey
      ? picked
      : {
          ...picked,
          [key]: value,
        };
  }, {});
};

const AuthenticationForms = props => {
  const { userType, from, idpAuthError, brandStudioId } = props;
  const isBrand = isStudioBrand(userType);
  const idpAuthErrorMessage = (
    <div className={css.error}>
      <FormattedMessage id="AuthenticationPage.idpAuthFailed" />
    </div>
  );
  return (
    <div className={css.signupForm}>
      {!!idpAuthError && idpAuthErrorMessage}
      {isBrand ? (
        <BrandSignup from={from} brandStudioId={brandStudioId} />
      ) : (
        <BaseSignup from={from} />
      )}
    </div>
  );
};

// Form for confirming information from IdP (e.g. Auth0)
// This is shown before new user is created to Marketplace API
const ConfirmIdProviderInfoForm = props => {
  const {
    userType,
    authInfo,
    authInProgress,
    confirmError,
    submitSingupWithIdp,
    termsAndConditions,
  } = props;
  const config = useConfiguration();
  const { userFields, userTypes } = config.user;
  const preselectedUserType = userTypes.find(conf => conf.userType === userType)?.userType || null;
  const idp = authInfo ? authInfo.idpId.replace(/^./, str => str.toUpperCase()) : null;
  const showBrandExperience = isStudioBrand(preselectedUserType);
  const showSellerExperience = isCreativeSeller(preselectedUserType);
  const showInfoSection = showBrandExperience || showSellerExperience;
  const rootStyles = classNames(css.confirmFormRoot, {
    [css.forBrand]: showBrandExperience,
    [css.forSeller]: showSellerExperience,
  });
  const handleSubmitConfirm = values => {
    const { idpToken, email, brandStudioId, idpId } = authInfo;
    const {
      userType,
      email: newEmail,
      firstName: newFirstName,
      lastName: newLastName,
      displayName,
      location: newLocation,
      ...rest
    } = values;
    const displayNameMaybe = displayName ? { displayName: displayName.trim() } : {};
    // Pass email, fistName or lastName to Marketplace API only if user has edited them
    // and they can't be fetched directly from idp provider (e.g. Facebook)
    const authParams = {
      ...(newEmail !== email && { email: newEmail }),
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
    };
    const location = newLocation && {
      address: newLocation?.selectedPlace?.address,
      geolocation: {
        lat: newLocation?.selectedPlace?.origin?.lat,
        lng: newLocation?.selectedPlace?.origin?.lng,
      },
      building: '',
    };
    const withHiddenPrivateData = isStudioBrand(userType) && !!brandStudioId;
    // Pass other values as extended data according to user field configuration
    const extendedDataMaybe =
      !isEmpty(rest) || withHiddenPrivateData
        ? {
            publicData: {
              userType,
              ...pickUserFieldsData(rest, 'public', userType, userFields),
            },
            privateData: {
              ...pickUserFieldsData(rest, 'private', userType, userFields),
              ...(!!brandStudioId && { brandStudioId }),
              ...(!!location && { location }),
            },
            protectedData: {
              ...pickUserFieldsData(rest, 'protected', userType, userFields),
              // If the confirm form has any additional values, pass them forward as user's protected data
              ...getNonUserFieldParams(rest, userFields),
            },
          }
        : {};
    submitSingupWithIdp({
      idpToken,
      idpId,
      ...authParams,
      ...displayNameMaybe,
      ...extendedDataMaybe,
    });
  };

  const confirmErrorMessage = confirmError ? (
    <div className={css.error}>
      {isSignupEmailTakenError(confirmError) ? (
        <FormattedMessage id="AuthenticationPage.signupFailedEmailAlreadyTaken" />
      ) : (
        <FormattedMessage id="AuthenticationPage.signupFailed" />
      )}
    </div>
  ) : null;

  const infoSection = showInfoSection ? (
    <div className={css.infoSection}>
      <Heading as="h1" rootClassName={css.infoTitle}>
        <FormattedMessage
          id={`ConfirmSignupForm.${showBrandExperience ? 'brandInfoTitle' : 'sellerInfoTitle'}`}
        />
      </Heading>
      <Heading as="h3" rootClassName={css.infoSubtitle}>
        <FormattedMessage
          id={`ConfirmSignupForm.${
            showBrandExperience ? 'brandInfoDescription' : 'sellerInfoDescription'
          }`}
          values={{
            lineBreak: (
              <>
                <br /> <br />
              </>
            ),
          }}
        />
      </Heading>
    </div>
  ) : null;

  return (
    <section className={rootStyles}>
      {infoSection}
      <div className={css.confirmForm}>
        <Heading as="h1" rootClassName={css.signupWithIdpTitle}>
          <FormattedMessage id="AuthenticationPage.confirmSignupWithIdpTitle" values={{ idp }} />
        </Heading>
        <p className={css.confirmInfoText}>
          <FormattedMessage id="AuthenticationPage.confirmSignupInfoText" />
        </p>
        {confirmErrorMessage}
        <ConfirmSignupForm
          className={css.form}
          onSubmit={handleSubmitConfirm}
          inProgress={authInProgress}
          termsAndConditions={termsAndConditions}
          authInfo={authInfo}
          idp={idp}
          preselectedUserType={preselectedUserType}
          userTypes={userTypes}
          userFields={userFields}
        />
      </div>
    </section>
  );
};

const AuthenticationOrConfirmInfoForm = props => {
  const {
    tab,
    userType,
    authInfo,
    from,
    submitSingupWithIdp,
    authInProgress,
    idpAuthError,
    confirmError,
    termsAndConditions,
    brandStudioId,
  } = props;
  const isConfirm = tab === 'confirm';
  return isConfirm ? (
    <ConfirmIdProviderInfoForm
      userType={userType}
      authInfo={authInfo}
      submitSingupWithIdp={submitSingupWithIdp}
      authInProgress={authInProgress}
      confirmError={confirmError}
      termsAndConditions={termsAndConditions}
    />
  ) : (
    <AuthenticationForms
      userType={userType}
      from={from}
      idpAuthError={idpAuthError}
      brandStudioId={brandStudioId}
    ></AuthenticationForms>
  );
};

export default AuthenticationOrConfirmInfoForm;
