import React, { useState, useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { camelize } from '../../util/string';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import { isTooManyEmailVerificationRequestsError } from '../../util/errors';
import { isStudioBrand } from '../../util/userHelpers';
import { authenticationInProgress, signupWithIdp } from '../../ducks/auth.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { sendVerificationEmail } from '../../ducks/user.duck';

import {
  Page,
  IconSpinner,
  NamedRedirect,
  ResponsiveBackgroundImageContainer,
  Marquee,
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

import AuthenticationOrConfirmInfoForm from './AuthenticationForms/AuthenticationForms';
import EmailVerificationInfo from './EmailVerificationInfo';
import { SSOButton } from './SSOButton/SSOButton';
import TermsAndConditions from './TermsAndConditions/TermsAndConditions';

import { TOS_ASSET_NAME, PRIVACY_POLICY_ASSET_NAME } from './AuthenticationPage.duck';
import css from './AuthenticationPage.module.css';

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

const BlankPage = props => {
  const { schemaTitle, schemaDescription, scrollingDisabled, topbarClasses } = props;
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
        topbar={<TopbarContainer className={topbarClasses} />}
        footer={<FooterContainer />}
      >
        <div className={css.spinnerContainer}>
          <IconSpinner />
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

/**
 * The AuthenticationPage component.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.authInProgress - Whether the authentication is in progress
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {propTypes.error} props.loginError - The login error
 * @param {propTypes.error} props.signupError - The signup error
 * @param {propTypes.error} props.confirmError - The confirm error
 * @param {Function} props.submitLogin - The login submit function
 * @param {Function} props.submitSignup - The signup submit function
 * @param {Function} props.submitSingupWithIdp - The signup with IdP submit function
 * @param {'login' | 'signup'| 'confirm'} props.tab - The tab to render
 * @param {boolean} props.sendVerificationEmailInProgress - Whether the verification email is in progress
 * @param {propTypes.error} props.sendVerificationEmailError - The verification email error
 * @param {Function} props.onResendVerificationEmail - The resend verification email function
 * @param {Function} props.onManageDisableScrolling - The manage disable scrolling function
 * @param {object} props.privacyAssetsData - The privacy assets data
 * @param {boolean} props.privacyFetchInProgress - Whether the privacy fetch is in progress
 * @param {propTypes.error} props.privacyFetchError - The privacy fetch error
 * @param {object} props.tosAssetsData - The terms of service assets data
 * @param {boolean} props.tosFetchInProgress - Whether the terms of service fetch is in progress
 * @param {propTypes.error} props.tosFetchError - The terms of service fetch error
 * @param {object} props.location - The location object
 * @param {object} props.params - The path parameters
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @returns {JSX.Element}
 */
export const AuthenticationPageComponent = props => {
  const [tosModalOpen, setTosModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [authInfo] = useState(getAuthInfoFromCookies());
  const [authError] = useState(getAuthErrorFromCookies());
  const [mounted, setMounted] = useState(false);
  const config = useConfiguration();
  const intl = useIntl();

  useEffect(() => {
    // Remove the autherror cookie once the content is saved to state
    // because we don't want to show the error message e.g. after page refresh
    if (authError) {
      Cookies.remove('st-autherror');
    }
    setMounted(true);
  }, []);

  // On mobile, it's better to scroll to top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tosModalOpen, privacyModalOpen]);

  const {
    authInProgress,
    currentUser,
    isAuthenticated,
    location,
    params: pathParams,
    scrollingDisabled,
    confirmError,
    submitSingupWithIdp,
    tab = 'signup',
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

  const isLogin = tab === 'login';
  const isSignup = tab === 'signup';
  const isConfirm = tab === 'confirm';
  const userTypeInPushState = location.state?.userType || null;
  const userTypeInAuthInfo = isConfirm && authInfo?.userType ? authInfo?.userType : null;
  const userType = pathParams?.userType || userTypeInPushState || userTypeInAuthInfo || null;
  const { userTypes = [] } = config.user;
  const preselectedUserType = userTypes.find(conf => conf.userType === userType)?.userType || null;
  const show404 = userType && !preselectedUserType;
  const user = ensureCurrentUser(currentUser);
  const currentUserLoaded = !!user.id;
  const isBrand = isStudioBrand(preselectedUserType);
  const { brandStudioId } = pathParams;

  // We only want to show the email verification dialog in the signup
  // tab if the user isn't being redirected somewhere else
  // (i.e. `from` is present). We must also check the `emailVerified`
  // flag only when the current user is fully loaded.
  const showEmailVerification = !isLogin && currentUserLoaded && !user.attributes.emailVerified;

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

  const shouldRedirectToFrom = isAuthenticated && from;
  const shouldRedirectToLandingPage =
    isAuthenticated && currentUserLoaded && !showEmailVerification;
  if (!mounted && shouldRedirectToLandingPage) {
    // Show a blank page for already authenticated users,
    // when the first rendering on client side is not yet done
    // This is done to avoid hydration issues when full page load is happening.
    return (
      <BlankPage
        schemaTitle={schemaTitle}
        schemaDescription={schemaDescription}
        topbarClasses={topbarClasses}
      />
    );
  }

  if (shouldRedirectToFrom) {
    // Already authenticated, redirect back to the page the user tried to access
    return <Redirect to={from} />;
  } else if (shouldRedirectToLandingPage) {
    // Already authenticated, redirect to the landing page (this was direct access to /login or /signup)
    return <NamedRedirect name="LandingPage" />;
  } else if (show404) {
    // User type not found, show 404
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  // We won't have a LoginPage anymore, instead redirect directly to Auth0
  if (isLogin) {
    return (
      <SSOButton
        isLogin
        forceRedirect
        from={from}
        userType={preselectedUserType}
        brandStudioId={brandStudioId}
      />
    );
  }

  // For users other than Brands we redirect directly to Auth0
  if (isSignup && preselectedUserType && !isBrand) {
    return <SSOButton isLogin={false} forceRedirect from={from} userType={preselectedUserType} />;
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
              brandStudioId={brandStudioId}
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
        <Marquee />
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
  connect(mapStateToProps, mapDispatchToProps)
)(AuthenticationPageComponent);

export default AuthenticationPage;
