import React from 'react';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { pathByRouteName } from '../../../util/routes';
import { apiBaseUrl } from '../../../util/api';
import { SocialLoginButton } from '../../../components';

import { FacebookLogo, GoogleLogo } from './socialLoginLogos';
import css from './SocialLoginButtons.module.css';

/**
 * Renders social login buttons if at least one IdP is enabled.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isLogin - Whether login mode is active
 * @param {boolean} props.showFacebookLogin - Whether Facebook login is enabled
 * @param {boolean} props.showGoogleLogin - Whether Google login is enabled
 * @param {string} [props.from] - Return route after auth
 * @param {string} [props.userType] - Preselected user type
 * @returns {JSX.Element|null}
 */
const SocialLoginButtons = props => {
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const { isLogin, showFacebookLogin, showGoogleLogin, from, userType } = props;
  const showSocialLogins = showFacebookLogin || showGoogleLogin;

  const getDataForSSORoutes = () => {
    const baseUrl = apiBaseUrl();

    // Default route where user is returned after successfull authentication
    const defaultReturn = pathByRouteName('LandingPage', routeConfiguration);

    // Route for confirming user data before creating a new user
    const defaultConfirm = pathByRouteName('ConfirmPage', routeConfiguration);

    const queryParams = new URLSearchParams({
      ...(defaultReturn ? { defaultReturn } : {}),
      ...(defaultConfirm ? { defaultConfirm } : {}),
      // Route where the user should be returned after authentication
      // This is used e.g. with EditListingPage and ListingPage
      ...(from ? { from } : {}),
      // The preselected userType needs to be saved over the visit to identity provider's service
      ...(userType ? { userType } : {}),
    });

    return { baseUrl, queryParams: queryParams.toString() };
  };

  const authWithFacebook = () => {
    const { baseUrl, queryParams } = getDataForSSORoutes();
    window.location.href = `${baseUrl}/api/auth/facebook?${queryParams}`;
  };

  const authWithGoogle = () => {
    const { baseUrl, queryParams } = getDataForSSORoutes();
    window.location.href = `${baseUrl}/api/auth/google?${queryParams}`;
  };

  const facebookAuthenticationMessage = isLogin
    ? intl.formatMessage({ id: 'AuthenticationPage.loginWithFacebook' })
    : intl.formatMessage({ id: 'AuthenticationPage.signupWithFacebook' });

  const googleAuthenticationMessage = isLogin
    ? intl.formatMessage({ id: 'AuthenticationPage.loginWithGoogle' })
    : intl.formatMessage({ id: 'AuthenticationPage.signupWithGoogle' });

  return showSocialLogins ? (
    <div className={css.root}>
      <div className={css.socialButtonsOr}>
        <span className={css.socialButtonsOrText}>
          <FormattedMessage id="AuthenticationPage.or" />
        </span>
      </div>

      {showFacebookLogin ? (
        <div className={css.socialButtonWrapper}>
          <SocialLoginButton onClick={() => authWithFacebook()}>
            <span className={css.buttonIcon}>
              <FacebookLogo ariaLabelledBy="facebook-authentication-msg" />
            </span>
            <span id="facebook-authentication-msg">{facebookAuthenticationMessage}</span>
          </SocialLoginButton>
        </div>
      ) : null}

      {showGoogleLogin ? (
        <div className={css.socialButtonWrapper}>
          <SocialLoginButton onClick={() => authWithGoogle()}>
            <span className={css.buttonIcon}>
              <GoogleLogo ariaLabelledBy="google-authentication-msg" />
            </span>
            <span id="google-authentication-msg">{googleAuthenticationMessage}</span>
          </SocialLoginButton>
        </div>
      ) : null}
    </div>
  ) : null;
};

export default SocialLoginButtons;
