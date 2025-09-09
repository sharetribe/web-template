import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import { showCreateListingLinkForUser, showPaymentDetailsForUser } from '../../util/userHelpers';

import { sendVerificationEmail } from '../../ducks/user.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H3, Page, UserNav, LayoutSideNavigation } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import DeleteAccountForm from './DeleteAccountForm/DeleteAccountForm';

import { deleteAccount, resetPassword } from './DeleteAccountPage.duck';
import css from './DeleteAccountPage.module.css';

/**
 * @param {Object} props
 * @param {boolean} [props.deleteAccountInProgress] - Whether the account deletion in progress
 * @param {propTypes.currentUser} [props.currentUser] - The current user
 * @param {boolean} [props.accountDeletionConfirmed] - Whether the account has been deleted
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {boolean} props.sendVerificationEmailInProgress - Whether the verification email is in progress
 * @param {propTypes.error} [props.sendVerificationEmailError] - The verification email error
 * @param {Function} props.onResendVerificationEmail - The resend verification email function
 * @param {Function} props.onSubmitDeleteAccount - The submit delete account function
 * @param {Function} props.onResetPassword - The reset password function
 * @param {boolean} [props.resetPasswordInProgress] - Whether the reset password is in progress
 * @param {propTypes.error} [props.resetPasswordError] - The reset password error
 * @returns {JSX.Element}
 */
export const DeleteAccountPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const {
    deleteAccountInProgress,
    currentUser,
    accountDeletionConfirmed,
    scrollingDisabled,
    sendVerificationEmailInProgress = false,
    sendVerificationEmailError,
    onResendVerificationEmail,
    onSubmitDeleteAccount,
    onResetPassword,
    resetPasswordInProgress = false,
    resetPasswordError,
  } = props;

  const user = ensureCurrentUser(currentUser);
  const currentEmail = user.attributes.email || '';

  const handleSubmit = values => {
    // Get password from form, use it to delete the user account
    const {
      /* currentPassword */
    } = values;
    return onSubmitDeleteAccount({
      /* currentPassword */
    });
  };

  const deleteAccountForm = user.id ? (
    <DeleteAccountForm
      className={css.form}
      initialValues={{ email: currentEmail }}
      currentUser={currentUser}
      onResendVerificationEmail={onResendVerificationEmail}
      onResetPassword={onResetPassword}
      onSubmit={handleSubmit}
      inProgress={deleteAccountInProgress}
      ready={accountDeletionConfirmed}
      sendVerificationEmailInProgress={sendVerificationEmailInProgress}
      sendVerificationEmailError={sendVerificationEmailError}
      resetPasswordInProgress={resetPasswordInProgress}
      resetPasswordError={resetPasswordError}
    />
  ) : null;

  const title = intl.formatMessage({ id: 'DeleteAccountPage.title' });

  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);
  const { showPayoutDetails, showPaymentMethods } = showPaymentDetailsForUser(config, currentUser);
  const accountSettingsNavProps = {
    currentPage: 'DeleteAccountPage',
    showPaymentMethods,
    showPayoutDetails,
  };

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav
              currentPage="DeleteAccountPage"
              showManageListingsLink={showManageListingsLink}
            />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        accountSettingsNavProps={accountSettingsNavProps}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1">
            <FormattedMessage id="DeleteAccountPage.heading" />
          </H3>
          {deleteAccountForm}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  // Topbar needs user info.
  const { currentUser, sendVerificationEmailInProgress, sendVerificationEmailError } = state.user;
  const {
    deleteAccountInProgress,
    accountDeletionConfirmed,
    resetPasswordInProgress,
    resetPasswordError,
  } = state.DeleteAccountPage;
  return {
    deleteAccountInProgress,
    currentUser,
    accountDeletionConfirmed,
    scrollingDisabled: isScrollingDisabled(state),
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
    resetPasswordInProgress,
    resetPasswordError,
  };
};

const mapDispatchToProps = dispatch => ({
  onResendVerificationEmail: () => dispatch(sendVerificationEmail()),
  onSubmitDeleteAccount: values => dispatch(deleteAccount(values)),
  onResetPassword: values => dispatch(resetPassword(values)),
});

const DeleteAccountPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(DeleteAccountPageComponent);

export default DeleteAccountPage;
