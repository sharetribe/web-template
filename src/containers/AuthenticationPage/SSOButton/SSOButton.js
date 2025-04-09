import React, { useEffect } from 'react';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { pathByRouteName } from '../../../util/routes';
import { apiBaseUrl } from '../../../util/api';
import { FormattedMessage } from '../../../util/reactIntl';
import { isStudioBrand, isCreativeSeller } from '../../../util/userHelpers';

import { SocialLoginButton } from '../../../components';
import css from './SSOButton.module.css';

const getDataForAuth0Routes = ({
  isLogin,
  defaultReturn,
  defaultConfirm,
  from,
  userType,
  brandStudioId,
}) => {
  const baseUrl = apiBaseUrl();
  const withBrandStudioId = isStudioBrand(userType) && !!brandStudioId;
  const queryParamsObject = new URLSearchParams({
    // Default route where user is returned after successfull authentication
    ...(defaultReturn ? { defaultReturn } : {}),
    // Route for confirming user data before creating a new user
    ...(defaultConfirm ? { defaultConfirm } : {}),
    // Route where the user should be returned after authentication
    // This is used e.g. with EditListingPage and ListingPage
    ...(from ? { from } : {}),
    // The preselected userType needs to be saved over the visit to identity provider's service
    ...(userType ? { userType } : {}),
    ...(withBrandStudioId ? { brandStudioId } : {}),
    screenHint: isLogin ? 'login' : 'signup',
  });
  const queryParams = queryParamsObject.toString();
  return { baseUrl, queryParams, auth0Route: `${baseUrl}/api/auth/auth0/login?${queryParams}` };
};

export const SSOButton = ({ isLogin, from, userType, brandStudioId, forceRedirect = false }) => {
  const routeConfiguration = useRouteConfiguration();
  const signupMsg = isCreativeSeller(userType)
    ? 'AuthenticationPage.signupSellerWithAuth0'
    : 'AuthenticationPage.signupWithAuth0';
  const authWithAuth0 = () => {
    const defaultReturn = pathByRouteName('LandingPage', routeConfiguration);
    const defaultConfirm = pathByRouteName('ConfirmPage', routeConfiguration);
    const { auth0Route } = getDataForAuth0Routes({
      isLogin,
      defaultReturn,
      defaultConfirm,
      from,
      userType,
      brandStudioId,
    });
    window.location.href = auth0Route;
  };

  useEffect(() => {
    if (forceRedirect) {
      authWithAuth0();
    }
  }, []);

  if (forceRedirect) {
    return null;
  }

  return (
    <div className={css.socialButtonWrapper}>
      <SocialLoginButton onClick={() => authWithAuth0()}>
        {isLogin ? (
          <FormattedMessage id="AuthenticationPage.loginWithAuth0" />
        ) : (
          <FormattedMessage id={signupMsg} />
        )}
      </SocialLoginButton>
    </div>
  );
};
