import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import loadable from '@loadable/component';

import {
  sendVerificationEmail,
  hasCurrentUserErrors,
  markVendedorOnboarded,
} from '../../ducks/user.duck';
import { logout, authenticationInProgress } from '../../ducks/auth.duck';
import { manageDisableScrolling } from '../../ducks/ui.duck';
import AVWelcomePopup from '../../components/AVWelcomePopup';

const Topbar = loadable(() => import(/* webpackChunkName: "Topbar" */ './Topbar/Topbar'));

/**
 * Topbar container component, which is connected to Redux Store.
 * @component
 * @param {Object} props
 * @param {number} props.notificationCount number of notifications
 * @param {Function} props.onLogout logout function
 * @param {Function} props.onManageDisableScrolling manage disable scrolling function
 * @param {Function} props.onResendVerificationEmail resend verification email function
 * @param {Object} props.sendVerificationEmailInProgress send verification email in progress
 * @param {Object} props.sendVerificationEmailError send verification email error
 * @param {boolean} props.hasGenericError has generic error
 * @returns {JSX.Element}
 */
export const TopbarContainerComponent = props => {
  const {
    notificationCount = 0,
    hasGenericError,
    currentUser,
    onManageDisableScrolling,
    onMarkVendedorOnboarded,
    ...rest
  } = props;

  const [popupDismissed, setPopupDismissed] = useState(false);

  const publicData = currentUser?.attributes?.profile?.publicData || {};
  const showWelcomePopup =
    !popupDismissed &&
    ['vendedor', 'vendedor-tienda'].includes(publicData.userType) &&
    !publicData.onboardingCompleted;

  const handlePopupClose = () => {
    setPopupDismissed(true);
    onMarkVendedorOnboarded();
  };

  return (
    <>
      <Topbar
        notificationCount={notificationCount}
        showGenericError={hasGenericError}
        currentUser={currentUser}
        onManageDisableScrolling={onManageDisableScrolling}
        {...rest}
      />
      <AVWelcomePopup
        userType={publicData.userType}
        isOpen={showWelcomePopup}
        onClose={handlePopupClose}
        onManageDisableScrolling={onManageDisableScrolling}
      />
    </>
  );
};

const mapStateToProps = state => {
  // Topbar needs isAuthenticated and isLoggedInAs
  const { isAuthenticated, isLoggedInAs, logoutError, authScopes } = state.auth;
  // Topbar needs user info.
  const {
    currentUser,
    currentUserHasListings,
    currentUserHasOrders,
    currentUserSaleNotificationCount = 0,
    currentUserOrderNotificationCount = 0,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
  } = state.user;
  const hasGenericError = !!(logoutError || hasCurrentUserErrors(state));
  return {
    authInProgress: authenticationInProgress(state),
    currentUser,
    currentUserHasListings,
    currentUserHasOrders,
    notificationCount: currentUserSaleNotificationCount + currentUserOrderNotificationCount,
    isAuthenticated,
    isLoggedInAs,
    authScopes,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
    hasGenericError,
  };
};

const mapDispatchToProps = dispatch => ({
  onLogout: historyPush => dispatch(logout(historyPush)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onResendVerificationEmail: () => dispatch(sendVerificationEmail()),
  onMarkVendedorOnboarded: () => dispatch(markVendedorOnboarded()),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const TopbarContainer = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TopbarContainerComponent);

export default TopbarContainer;
