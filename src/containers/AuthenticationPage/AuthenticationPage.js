import React, { useState, useEffect } from 'react';
import { bool, func, object, oneOf, shape } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import classNames from 'classnames';
import { isEmpty } from 'lodash';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { camelize } from '../../util/string';
import { pathByRouteName } from '../../util/routes';
import { apiBaseUrl } from '../../util/api';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import {
  isSignupEmailTakenError,
  isTooManyEmailVerificationRequestsError,
} from '../../util/errors';

import { login, authenticationInProgress, signup, signupWithIdp } from '../../ducks/auth.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { sendVerificationEmail } from '../../ducks/user.duck';

import {
  Page,
  Heading,
  NamedRedirect,
  LinkTabNavHorizontal,
  SocialLoginButton,
  ResponsiveBackgroundImageContainer,
  Modal,
  LayoutSingleColumn,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import TermsAndConditions from './TermsAndConditions/TermsAndConditions';
import ConfirmSignupForm from './ConfirmSignupForm/ConfirmSignupForm';
import LoginForm from './LoginForm/LoginForm';
import SignupForm from './SignupForm/SignupForm';
import EmailVerificationInfo from './EmailVerificationInfo';

// We need to get ToS asset and get it rendered for the modal on this page.
import { TermsOfServiceContent } from '../../containers/TermsOfServicePage/TermsOfServicePage';

// We need to get PrivacyPolicy asset and get it rendered for the modal on this page.
import { PrivacyPolicyContent } from '../../containers/PrivacyPolicyPage/PrivacyPolicyPage';

import { TOS_ASSET_NAME, PRIVACY_POLICY_ASSET_NAME } from './AuthenticationPage.duck';

import css from './AuthenticationPage.module.css';
import { FacebookLogo, GoogleLogo } from './socialLoginLogos';

// Social login buttons are needed by AuthenticationForms
export const SocialLoginButtonsMaybe = props => {
  const routeConfiguration = useRouteConfiguration();
  const { isLogin, showFacebookLogin, showGoogleLogin, from } = props;
  const showSocialLogins = showFacebookLogin || showGoogleLogin;

  const getDefaultRoutes = () => {
    const baseUrl = apiBaseUrl();

    // Route where the user should be returned after authentication
    // This is used e.g. with EditListingPage and ListingPage
    const fromParam = from ? `from=${from}` : '';

    // Default route where user is returned after successfull authentication
    const defaultReturn = pathByRouteName('LandingPage', routeConfiguration);
    const defaultReturnParam = defaultReturn ? `&defaultReturn=${defaultReturn}` : '';

    // Route for confirming user data before creating a new user
    const defaultConfirm = pathByRouteName('ConfirmPage', routeConfiguration);
    const defaultConfirmParam = defaultConfirm ? `&defaultConfirm=${defaultConfirm}` : '';

    return { baseUrl, fromParam, defaultReturnParam, defaultConfirmParam };
  };

  const authWithFacebook = () => {
    const defaultRoutes = getDefaultRoutes();
    const { baseUrl, fromParam, defaultReturnParam, defaultConfirmParam } = defaultRoutes;
    window.location.href = `${baseUrl}/api/auth/facebook?${fromParam}${defaultReturnParam}${defaultConfirmParam}`;
  };

  const authWithGoogle = () => {
    const defaultRoutes = getDefaultRoutes();
    const { baseUrl, fromParam, defaultReturnParam, defaultConfirmParam } = defaultRoutes;
    window.location.href = `${baseUrl}/api/auth/google?${fromParam}${defaultReturnParam}${defaultConfirmParam}`;
  };

  return showSocialLogins ? (
    <div className={css.idpButtons}>
      <div className={css.socialButtonsOr}>
        <span className={css.socialButtonsOrText}>
          <FormattedMessage id="AuthenticationPage.or" />
        </span>
      </div>

      {showFacebookLogin ? (
        <div className={css.socialButtonWrapper}>
          <SocialLoginButton onClick={() => authWithFacebook()}>
            <span className={css.buttonIcon}>{FacebookLogo}</span>
            {isLogin ? (
              <FormattedMessage id="AuthenticationPage.loginWithFacebook" />
            ) : (
              <FormattedMessage id="AuthenticationPage.signupWithFacebook" />
            )}
          </SocialLoginButton>
        </div>
      ) : null}

      {showGoogleLogin ? (
        <div className={css.socialButtonWrapper}>
          <SocialLoginButton onClick={() => authWithGoogle()}>
            <span className={css.buttonIcon}>{GoogleLogo}</span>
            {isLogin ? (
              <FormattedMessage id="AuthenticationPage.loginWithGoogle" />
            ) : (
              <FormattedMessage id="AuthenticationPage.signupWithGoogle" />
            )}
          </SocialLoginButton>
        </div>
      ) : null}
    </div>
  ) : null;
};

// Tabs for SignupForm and LoginForm
export const AuthenticationForms = props => {
  const {
    isLogin,
    showFacebookLogin,
    showGoogleLogin,
    from,
    submitLogin,
    loginError,
    signupError,
    authInProgress,
    submitSignup,
    termsAndConditions,
  } = props;
  const fromState = { state: from ? { from } : null };
  const tabs = [
    {
      text: (
        <Heading as={!isLogin ? 'h1' : 'h2'} rootClassName={css.tab}>
          <FormattedMessage id="AuthenticationPage.signupLinkText" />
        </Heading>
      ),
      selected: !isLogin,
      linkProps: {
        name: 'SignupPage',
        to: fromState,
      },
    },
    {
      text: (
        <Heading as={isLogin ? 'h1' : 'h2'} rootClassName={css.tab}>
          <FormattedMessage id="AuthenticationPage.loginLinkText" />
        </Heading>
      ),
      selected: isLogin,
      linkProps: {
        name: 'LoginPage',
        to: fromState,
      },
    },
  ];

  const handleSubmitSignup = values => {
    const { fname, lname, ...rest } = values;
    const params = { firstName: fname.trim(), lastName: lname.trim(), ...rest };
    submitSignup(params);
  };

  const loginErrorMessage = (
    <div className={css.error}>
      <FormattedMessage id="AuthenticationPage.loginFailed" />
    </div>
  );

  const signupErrorMessage = (
    <div className={css.error}>
      {isSignupEmailTakenError(signupError) ? (
        <FormattedMessage id="AuthenticationPage.signupFailedEmailAlreadyTaken" />
      ) : (
        <FormattedMessage id="AuthenticationPage.signupFailed" />
      )}
    </div>
  );

  // eslint-disable-next-line no-confusing-arrow
  const errorMessage = (error, message) => (error ? message : null);
  const loginOrSignupError = isLogin
    ? errorMessage(loginError, loginErrorMessage)
    : errorMessage(signupError, signupErrorMessage);

  return (
    <div className={css.content}>
      <LinkTabNavHorizontal className={css.tabs} tabs={tabs} />
      {loginOrSignupError}

      {isLogin ? (
        <LoginForm className={css.loginForm} onSubmit={submitLogin} inProgress={authInProgress} />
      ) : (
        <SignupForm
          className={css.signupForm}
          onSubmit={handleSubmitSignup}
          inProgress={authInProgress}
          termsAndConditions={termsAndConditions}
        />
      )}

      <SocialLoginButtonsMaybe
        isLogin={isLogin}
        showFacebookLogin={showFacebookLogin}
        showGoogleLogin={showGoogleLogin}
        from={from}
      />
    </div>
  );
};

// Form for confirming information from IdP (e.g. Facebook)
// This is shown before new user is created to Marketplace API
const ConfirmIdProviderInfoForm = props => {
  const { authInfo, authInProgress, confirmError, submitSingupWithIdp, termsAndConditions } = props;
  const idp = authInfo ? authInfo.idpId.replace(/^./, str => str.toUpperCase()) : null;

  const handleSubmitConfirm = values => {
    const { idpToken, email, firstName, lastName, idpId } = authInfo;
    const { email: newEmail, firstName: newFirstName, lastName: newLastName, ...rest } = values;

    // Pass email, fistName or lastName to Marketplace API only if user has edited them
    // sand they can't be fetched directly from idp provider (e.g. Facebook)

    const authParams = {
      ...(newEmail !== email && { email: newEmail }),
      ...(newFirstName !== firstName && { firstName: newFirstName }),
      ...(newLastName !== lastName && { lastName: newLastName }),
    };

    // If the confirm form has any additional values, pass them forward as user's protected data
    const protectedData = !isEmpty(rest) ? { ...rest } : null;

    submitSingupWithIdp({
      idpToken,
      idpId,
      ...authParams,
      ...(!!protectedData && { protectedData }),
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

  return (
    <div className={css.content}>
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
      />
    </div>
  );
};

export const AuthenticationOrConfirmInfoForm = props => {
  const {
    tab,
    authInfo,
    from,
    showFacebookLogin,
    showGoogleLogin,
    submitLogin,
    submitSignup,
    submitSingupWithIdp,
    authInProgress,
    loginError,
    signupError,
    confirmError,
    termsAndConditions,
  } = props;
  const isConfirm = tab === 'confirm';
  const isLogin = tab === 'login';

  return isConfirm ? (
    <ConfirmIdProviderInfoForm
      authInfo={authInfo}
      submitSingupWithIdp={submitSingupWithIdp}
      authInProgress={authInProgress}
      confirmError={confirmError}
      termsAndConditions={termsAndConditions}
    />
  ) : (
    <AuthenticationForms
      isLogin={isLogin}
      showFacebookLogin={showFacebookLogin}
      showGoogleLogin={showGoogleLogin}
      from={from}
      loginError={loginError}
      signupError={signupError}
      submitLogin={submitLogin}
      authInProgress={authInProgress}
      submitSignup={submitSignup}
      termsAndConditions={termsAndConditions}
    ></AuthenticationForms>
  );
};

const getAuthInfoFromCookies = () => {
  return Cookies.get('st-authinfo')
    ? JSON.parse(Cookies.get('st-authinfo').replace('j:', ''))
    : null;
};
const getAuthErrorFromCookies = () => {
  return Cookies.get('st-autherror')
    ? JSON.parse(Cookies.get('st-autherror').replace('j:', ''))
    : null;
};

export const AuthenticationPageComponent = props => {
  const [tosModalOpen, setTosModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [authInfo, setAuthInfo] = useState(getAuthInfoFromCookies());
  const [authError, setAuthError] = useState(getAuthErrorFromCookies());
  const config = useConfiguration();

  useEffect(() => {
    // Remove the autherror cookie once the content is saved to state
    // because we don't want to show the error message e.g. after page refresh
    if (authError) {
      Cookies.remove('st-autherror');
    }
  }, []);

  // On mobile, it's better to scroll to top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tosModalOpen, privacyModalOpen]);

  const {
    authInProgress,
    currentUser,
    intl,
    isAuthenticated,
    location,
    loginError,
    scrollingDisabled,
    signupError,
    submitLogin,
    submitSignup,
    confirmError,
    submitSingupWithIdp,
    tab,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
    onResendVerificationEmail,
    onManageDisableScrolling,
    tosAssetsData,
    tosFetchInProgress,
    tosFetchError,
  } = props;

  // History API has potentially state tied to this route
  // We have used that state to store previous URL ("from"),
  // so that use can be redirected back to that page after authentication.
  const locationFrom = location.state?.from || null;
  const authinfoFrom = authInfo?.from || null;
  const from = locationFrom ? locationFrom : authinfoFrom ? authinfoFrom : null;

  const user = ensureCurrentUser(currentUser);
  const currentUserLoaded = !!user.id;
  const isLogin = tab === 'login';

  // We only want to show the email verification dialog in the signup
  // tab if the user isn't being redirected somewhere else
  // (i.e. `from` is present). We must also check the `emailVerified`
  // flag only when the current user is fully loaded.
  const showEmailVerification = !isLogin && currentUserLoaded && !user.attributes.emailVerified;

  // Already authenticated, redirect away from auth page
  if (isAuthenticated && from) {
    return <Redirect to={from} />;
  } else if (isAuthenticated && currentUserLoaded && !showEmailVerification) {
    return <NamedRedirect name="LandingPage" />;
  }

  const resendErrorTranslationId = isTooManyEmailVerificationRequestsError(
    sendVerificationEmailError
  )
    ? 'AuthenticationPage.resendFailedTooManyRequests'
    : 'AuthenticationPage.resendFailed';
  const resendErrorMessage = sendVerificationEmailError ? (
    <p className={css.error}>
      <FormattedMessage id={resendErrorTranslationId} />
    </p>
  ) : null;

  const marketplaceName = config.marketplaceName;
  const schemaTitle = isLogin
    ? intl.formatMessage({ id: 'AuthenticationPage.schemaTitleLogin' }, { marketplaceName })
    : intl.formatMessage({ id: 'AuthenticationPage.schemaTitleSignup' }, { marketplaceName });
  const schemaDescription = isLogin
    ? intl.formatMessage({ id: 'AuthenticationPage.schemaDescriptionLogin' }, { marketplaceName })
    : intl.formatMessage({ id: 'AuthenticationPage.schemaDescriptionSignup' }, { marketplaceName });

  const topbarClasses = classNames({
    [css.hideOnMobile]: showEmailVerification,
  });

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        name: schemaTitle,
        description: schemaDescription,
      }}
    >
      <LayoutSingleColumn
        mainColumnClassName={css.layoutWrapperMain}
        topbar={<TopbarContainer className={topbarClasses} />}
        footer={<FooterContainer />}
      >
        <ResponsiveBackgroundImageContainer
          className={css.root}
          childrenWrapperClassName={css.contentContainer}
          as="section"
          image={config.branding.brandImage}
          sizes="100%"
          useOverlay
        >
          {showEmailVerification ? (
            <EmailVerificationInfo
              name={user.attributes.profile.firstName}
              email={<span className={css.email}>{user.attributes.email}</span>}
              onResendVerificationEmail={onResendVerificationEmail}
              resendErrorMessage={resendErrorMessage}
              sendVerificationEmailInProgress={sendVerificationEmailInProgress}
            />
          ) : (
            <AuthenticationOrConfirmInfoForm
              tab={tab}
              authInfo={authInfo}
              from={from}
              showFacebookLogin={!!process.env.REACT_APP_FACEBOOK_APP_ID}
              showGoogleLogin={!!process.env.REACT_APP_GOOGLE_CLIENT_ID}
              submitLogin={submitLogin}
              submitSignup={submitSignup}
              submitSingupWithIdp={submitSingupWithIdp}
              authInProgress={authInProgress}
              loginError={loginError}
              signupError={signupError}
              confirmError={confirmError}
              termsAndConditions={
                <TermsAndConditions
                  onOpenTermsOfService={() => setTosModalOpen(true)}
                  onOpenPrivacyPolicy={() => setPrivacyModalOpen(true)}
                  intl={intl}
                />
              }
            />
          )}
        </ResponsiveBackgroundImageContainer>
      </LayoutSingleColumn>
      <Modal
        id="AuthenticationPage.tos"
        isOpen={tosModalOpen}
        onClose={() => setTosModalOpen(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <div className={css.termsWrapper}>
          <TermsOfServiceContent
            inProgress={tosFetchInProgress}
            error={tosFetchError}
            data={tosAssetsData?.[camelize(TOS_ASSET_NAME)]?.data}
          />
        </div>
      </Modal>
      <Modal
        id="AuthenticationPage.privacyPolicy"
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <div className={css.privacyWrapper}>
          <PrivacyPolicyContent
            inProgress={tosFetchInProgress}
            error={tosFetchError}
            data={tosAssetsData?.[camelize(PRIVACY_POLICY_ASSET_NAME)]?.data}
          />
        </div>
      </Modal>
    </Page>
  );
};

AuthenticationPageComponent.defaultProps = {
  currentUser: null,
  loginError: null,
  signupError: null,
  confirmError: null,
  tab: 'signup',
  sendVerificationEmailError: null,
  showSocialLoginsForTests: false,
  privacyAssetsData: null,
  privacyFetchInProgress: false,
  privacyFetchError: null,
  tosAssetsData: null,
  tosFetchInProgress: false,
  tosFetchError: null,
};

AuthenticationPageComponent.propTypes = {
  authInProgress: bool.isRequired,
  currentUser: propTypes.currentUser,
  isAuthenticated: bool.isRequired,
  loginError: propTypes.error,
  scrollingDisabled: bool.isRequired,
  signupError: propTypes.error,
  confirmError: propTypes.error,

  submitLogin: func.isRequired,
  submitSignup: func.isRequired,
  tab: oneOf(['login', 'signup', 'confirm']),

  sendVerificationEmailInProgress: bool.isRequired,
  sendVerificationEmailError: propTypes.error,
  onResendVerificationEmail: func.isRequired,
  onManageDisableScrolling: func.isRequired,

  // to fetch privacy-policy page asset
  // which is shown in modal
  privacyAssetsData: object,
  privacyFetchInProgress: bool,
  privacyFetchError: propTypes.error,

  // to fetch terms-of-service page asset
  // which is shown in modal
  tosAssetsData: object,
  tosFetchInProgress: bool,
  tosFetchError: propTypes.error,

  // from withRouter
  location: shape({ state: object }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { isAuthenticated, loginError, signupError, confirmError } = state.auth;
  const { currentUser, sendVerificationEmailInProgress, sendVerificationEmailError } = state.user;
  const {
    pageAssetsData: privacyAssetsData,
    inProgress: privacyFetchInProgress,
    error: privacyFetchError,
  } = state.hostedAssets || {};
  const { pageAssetsData: tosAssetsData, inProgress: tosFetchInProgress, error: tosFetchError } =
    state.hostedAssets || {};

  return {
    authInProgress: authenticationInProgress(state),
    currentUser,
    isAuthenticated,
    loginError,
    scrollingDisabled: isScrollingDisabled(state),
    signupError,
    confirmError,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
    privacyAssetsData,
    privacyFetchInProgress,
    privacyFetchError,
    tosAssetsData,
    tosFetchInProgress,
    tosFetchError,
  };
};

const mapDispatchToProps = dispatch => ({
  submitLogin: ({ email, password }) => dispatch(login(email, password)),
  submitSignup: params => dispatch(signup(params)),
  submitSingupWithIdp: params => dispatch(signupWithIdp(params)),
  onResendVerificationEmail: () => dispatch(sendVerificationEmail()),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const AuthenticationPage = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(AuthenticationPageComponent);

export default AuthenticationPage;
