import React, { Component } from 'react';
import { arrayOf, bool, func, string } from 'prop-types';
import classNames from 'classnames';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import { FormattedMessage } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { propTypes } from '../../util/types';
import { isUserAuthorized } from '../../util/userHelpers';
import { pathByRouteName } from '../../util/routes';

import { Modal } from '../../components';

import EmailReminder from './EmailReminder';
import css from './ModalMissingInformation.module.css';

const MISSING_INFORMATION_MODAL_WHITELIST = [
  'LoginPage',
  'SignupPage',
  'ContactDetailsPage',
  'EmailVerificationPage',
  'PasswordResetPage',
  'StripePayoutPage',
];

const EMAIL_VERIFICATION = 'EMAIL_VERIFICATION';

class ModalMissingInformation extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMissingInformationReminder: null,
      hasSeenMissingInformationReminder: false,
    };
    this.handleMissingInformationReminder = this.handleMissingInformationReminder.bind(this);
  }

  componentDidUpdate() {
    const { currentUser, currentUserHasListings, currentUserHasOrders, location } = this.props;
    const user = ensureCurrentUser(currentUser);
    this.handleMissingInformationReminder(
      user,
      currentUserHasListings,
      currentUserHasOrders,
      location
    );
  }

  handleMissingInformationReminder(
    currentUser,
    currentUserHasListings,
    currentUserHasOrders,
    newLocation
  ) {
    const routes = this.props.routeConfiguration;
    const whitelistedPaths = MISSING_INFORMATION_MODAL_WHITELIST.map(page =>
      pathByRouteName(page, routes)
    );

    // Is the current page whitelisted?
    const isPageWhitelisted = whitelistedPaths.includes(newLocation.pathname);

    // Track if path changes inside Page level component
    const pathChanged = newLocation.pathname !== this.props.location.pathname;
    const notRemindedYet =
      !this.state.showMissingInformationReminder && !this.state.hasSeenMissingInformationReminder;

    // Is the reminder already shown on current page
    const showOnPathChange = notRemindedYet || pathChanged;

    if (!isPageWhitelisted && showOnPathChange) {
      // Emails are sent when order is initiated
      // Customer is likely to get email soon when she books something
      // Provider email should work - she should get an email when someone books a listing
      const hasOrders = currentUserHasOrders === true;
      const hasListingsOrOrders = currentUserHasListings || hasOrders;

      const emailUnverified = !!currentUser.id && !currentUser.attributes.emailVerified;
      const emailVerificationNeeded = hasListingsOrOrders && emailUnverified;

      // Show reminder
      if (emailVerificationNeeded) {
        this.setState({ showMissingInformationReminder: EMAIL_VERIFICATION });
      }
    }
  }

  render() {
    const {
      rootClassName,
      className,
      containerClassName,
      currentUser,
      sendVerificationEmailInProgress,
      sendVerificationEmailError,
      onManageDisableScrolling,
      onResendVerificationEmail,
    } = this.props;

    const user = ensureCurrentUser(currentUser);
    const classes = classNames(rootClassName || css.root, className);

    let content = null;

    const currentUserLoaded = user && user.id;
    if (currentUserLoaded && isUserAuthorized(currentUser)) {
      if (this.state.showMissingInformationReminder === EMAIL_VERIFICATION) {
        content = (
          <EmailReminder
            className={classes}
            user={user}
            onResendVerificationEmail={onResendVerificationEmail}
            sendVerificationEmailInProgress={sendVerificationEmailInProgress}
            sendVerificationEmailError={sendVerificationEmailError}
          />
        );
      }
    }

    const closeButtonMessage = (
      <FormattedMessage id="ModalMissingInformation.closeVerifyEmailReminder" />
    );

    return (
      <Modal
        id="MissingInformationReminder"
        containerClassName={containerClassName}
        isOpen={!!this.state.showMissingInformationReminder}
        onClose={() => {
          this.setState({
            showMissingInformationReminder: null,
            hasSeenMissingInformationReminder: true,
          });
        }}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
        closeButtonMessage={closeButtonMessage}
      >
        {content}
      </Modal>
    );
  }
}

ModalMissingInformation.defaultProps = {
  className: null,
  rootClassName: null,
  currentUser: null,
};

ModalMissingInformation.propTypes = {
  id: string.isRequired,
  className: string,
  rootClassName: string,
  containerClassName: string,

  currentUser: propTypes.currentUser,
  onManageDisableScrolling: func.isRequired,
  sendVerificationEmailError: propTypes.error,
  sendVerificationEmailInProgress: bool.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

const EnhancedModalMissingInformation = props => {
  const routeConfiguration = useRouteConfiguration();

  return <ModalMissingInformation routeConfiguration={routeConfiguration} {...props} />;
};

export default EnhancedModalMissingInformation;
