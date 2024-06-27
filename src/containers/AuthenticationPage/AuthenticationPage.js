import React, { useState, useEffect } from 'react';
import { bool, func, object, oneOf, shape } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';

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
import { pickUserFieldsData, addScopePrefix } from '../../util/userHelpers';
import { authenticationInProgress, signupWithIdp } from '../../ducks/auth.duck';
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
// We need to get ToS asset and get it rendered for the modal on this page.
import { TermsOfServiceContent } from '../../containers/TermsOfServicePage/TermsOfServicePage';
// We need to get PrivacyPolicy asset and get it rendered for the modal on this page.
import { PrivacyPolicyContent } from '../../containers/PrivacyPolicyPage/PrivacyPolicyPage';
import NotFoundPage from '../NotFoundPage/NotFoundPage';
import TermsAndConditions from './TermsAndConditions/TermsAndConditions';
import ConfirmSignupForm from './ConfirmSignupForm/ConfirmSignupForm';
import LoginForm from './LoginForm/LoginForm';
import SignupForm from './SignupForm/SignupForm';
import EmailVerificationInfo from './EmailVerificationInfo';
import { TOS_ASSET_NAME, PRIVACY_POLICY_ASSET_NAME } from './AuthenticationPage.duck';
import css from './AuthenticationPage.module.css';
import { Auth0Logo } from './socialLoginLogos';

// SSO (Auth0) buttons are needed by AuthenticationForms
export const SSOButton = ({ isLogin, from, userType }) => {
  const routeConfiguration = useRouteConfiguration();
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

  const authWithAuth0 = () => {
    const { baseUrl, queryParams } = getDataForSSORoutes();
    window.location.href = `${baseUrl}/api/auth/auth0/login?${queryParams}`;
  };

  return (
    <div className={css.idpButtons}>
      <div className={css.socialButtonWrapper}>
        <SocialLoginButton onClick={() => authWithAuth0()}>
          <span className={css.buttonIcon}>{Auth0Logo}</span>
          {isLogin ? (
            <FormattedMessage id="AuthenticationPage.loginWithAuth0" />
          ) : (
            <FormattedMessage id="AuthenticationPage.signupWithAuth0" />
          )}
        </SocialLoginButton>
      </div>
    </div>
  );
};

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

// Tabs for SignupForm and LoginForm
export const AuthenticationForms = props => {
  const { isLogin, userType, from, idpAuthError } = props;
  const config = useConfiguration();
  const { userTypes = [] } = config.user;
  const preselectedUserType = userTypes.find(conf => conf.userType === userType)?.userType || null;
  const fromMaybe = from ? { from } : null;
  const signupRouteName = !!preselectedUserType ? 'SignupForUserTypePage' : 'SignupPage';
  const userTypeMaybe = preselectedUserType ? { userType: preselectedUserType } : null;
  const fromState = { state: { ...fromMaybe, ...userTypeMaybe } };
  const tabs = [
    {
      text: (
        <Heading as={!isLogin ? 'h1' : 'h2'} rootClassName={css.tab}>
          <FormattedMessage id="AuthenticationPage.signupLinkText" />
        </Heading>
      ),
      selected: !isLogin,
      linkProps: {
        name: signupRouteName,
        params: userTypeMaybe,
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
  const idpAuthErrorMessage = (
    <div className={css.error}>
      <FormattedMessage id="AuthenticationPage.idpAuthFailed" />
    </div>
  );
  const loginOrSignupError = isLogin && !!idpAuthError ? idpAuthErrorMessage : null;

  return (
    <div className={css.content}>
      <LinkTabNavHorizontal className={css.tabs} tabs={tabs} />
      {loginOrSignupError}
      {isLogin ? <LoginForm /> : <SignupForm />}
      <SSOButton isLogin={isLogin} {...fromMaybe} {...userTypeMaybe} />
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

  const handleSubmitConfirm = values => {
    const { idpToken, email, firstName, lastName, idpId } = authInfo;
    const {
      userType,
      email: newEmail,
      firstName: newFirstName,
      lastName: newLastName,
      displayName,
      ...rest
    } = values;
    const displayNameMaybe = displayName ? { displayName: displayName.trim() } : {};
    // Pass email, fistName or lastName to Marketplace API only if user has edited them
    // and they can't be fetched directly from idp provider (e.g. Facebook)
    const authParams = {
      ...(newEmail !== email && { email: newEmail }),
      ...(newFirstName !== firstName && { firstName: newFirstName }),
      ...(newLastName !== lastName && { lastName: newLastName }),
    };
    // Pass other values as extended data according to user field configuration
    const extendedDataMaybe = !isEmpty(rest)
      ? {
          publicData: {
            userType,
            ...pickUserFieldsData(rest, 'public', userType, userFields),
          },
          privateData: {
            ...pickUserFieldsData(rest, 'private', userType, userFields),
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
        preselectedUserType={preselectedUserType}
        userTypes={userTypes}
        userFields={userFields}
      />
    </div>
  );
};

export const AuthenticationOrConfirmInfoForm = props => {
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
  } = props;
  const isConfirm = tab === 'confirm';
  const isLogin = tab === 'login';
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
      isLogin={isLogin}
      userType={userType}
      from={from}
      idpAuthError={idpAuthError}
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
  const [authInfo] = useState(getAuthInfoFromCookies());
  const [authError] = useState(getAuthErrorFromCookies());
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
    params: pathParams,
    scrollingDisabled,
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
  const from = locationFrom || authinfoFrom || null;

  const isConfirm = tab === 'confirm';
  const userTypeInPushState = location.state?.userType || null;
  const userTypeInAuthInfo = isConfirm && authInfo?.userType ? authInfo?.userType : null;
  const userType = pathParams?.userType || userTypeInPushState || userTypeInAuthInfo || null;
  const { userTypes = [] } = config.user;
  const preselectedUserType = userTypes.find(conf => conf.userType === userType)?.userType || null;
  const show404 = userType && !preselectedUserType;
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
  } else if (show404) {
    return <NotFoundPage staticContext={props.staticContext} />;
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
              userType={userType}
              authInfo={authInfo}
              from={from}
              submitSingupWithIdp={submitSingupWithIdp}
              authInProgress={authInProgress}
              idpAuthError={authError}
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
  scrollingDisabled: bool.isRequired,
  confirmError: propTypes.error,
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
  const { isAuthenticated, confirmError } = state.auth;
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
    scrollingDisabled: isScrollingDisabled(state),
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
