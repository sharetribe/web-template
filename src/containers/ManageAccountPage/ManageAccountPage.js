import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import {
  showCreateListingLinkForUser,
  showPaymentDetailsForUser,
  initialValuesForUserFields,
  pickUserFieldsData,
} from '../../util/userHelpers';
import { pathByRouteName } from '../../util/routes';

import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H3, H4, Page, UserNav, LayoutSideNavigation } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import DeleteAccountForm from './DeleteAccountForm/DeleteAccountForm';

import { deleteAccount, resetPassword, updateProfile } from './ManageAccountPage.duck';
import css from './ManageAccountPage.module.css';
import PrivateDetailsForm from './PrivateDetailsForm/PrivateDetailsForm';

/**
 * @param {Object} props
 * @param {boolean} [props.deleteAccountInProgress] - Whether the account deletion in progress
 * @param {propTypes.currentUser} [props.currentUser] - The current user
 * @param {boolean} [props.accountDeletionConfirmed] - Whether the account has been deleted
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {Function} props.onSubmitDeleteAccount - The submit delete account function
 * @param {Function} props.onResetPassword - The reset password function
 * @param {boolean} [props.resetPasswordInProgress] - Whether the reset password is in progress
 * @param {propTypes.error} [props.resetPasswordError] - The reset password error
 * @returns {JSX.Element}
 */
export const ManageAccountPageComponent = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const {
    deleteAccountError,
    deleteAccountInProgress,
    currentUser,
    scrollingDisabled,
    onSubmitDeleteAccount,
    onResetPassword,
    onUpdateProfile,
    resetPasswordInProgress = false,
    resetPasswordError,
    updateProfileInProgress = false,
    updateProfileError,
  } = props;

  const user = ensureCurrentUser(currentUser);
  const { publicData, protectedData, privateData } = user?.attributes.profile;
  const { userType } = publicData || {};

  const { userFields, userTypes = [] } = config.user;
  const nonPublicUserFields = userFields.filter(uf => ['private', 'protected'].includes(uf.scope));
  const userTypeConfig = userTypes.find(config => config.userType === userType);

  const hasUserTypeFields =
    nonPublicUserFields.length > 0 &&
    !!nonPublicUserFields.find(
      uf =>
        !uf.userTypeConfig.limitToUserTypeIds ||
        (uf.userTypeConfig.limitToUserTypeIds &&
          uf.userTypeConfig.userTypeIds.includes(userTypeConfig?.userType))
    );

  // Currently, we don't have support for Console-defined protected user data fields.
  // If we do start supporting Console-defined protected user data fields, the
  // page where those are handled might change.
  const handleFieldSubmit = (values, userType) => {
    const profile = {
      protectedData: {
        ...pickUserFieldsData(values, 'protected', userType, userFields),
      },
      privateData: {
        ...pickUserFieldsData(values, 'private', userType, userFields),
      },
    };

    onUpdateProfile(profile);
  };

  const handleDeleteSubmit = values => {
    // Get password from form, use it to delete the user account
    const { currentPassword } = values;

    return onSubmitDeleteAccount(currentPassword).then(() => {
      const path = pathByRouteName('LandingPage', routeConfiguration);

      // Enforce full page load against LandingPage route
      if (typeof window !== 'undefined') {
        window.location = path;
      }

      console.log('logged out'); // eslint-disable-line
    });
  };

  const title = intl.formatMessage({ id: 'ManageAccountPage.title' });

  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);
  const { showPayoutDetails, showPaymentMethods } = showPaymentDetailsForUser(config, currentUser);
  const accountSettingsNavProps = {
    currentPage: 'ManageAccountPage',
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
              currentPage="ManageAccountPage"
              showManageListingsLink={showManageListingsLink}
            />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        accountSettingsNavProps={accountSettingsNavProps}
        footer={<FooterContainer />}
        intl={intl}
      >
        <div className={css.content}>
          <H3 as="h1">
            <FormattedMessage id="ManageAccountPage.heading" />
          </H3>
          {hasUserTypeFields ? (
            <>
              <PrivateDetailsForm
                className={css.form}
                currentUser={currentUser}
                initialValues={{
                  ...initialValuesForUserFields(protectedData, 'protected', userType, userFields),
                  ...initialValuesForUserFields(privateData, 'private', userType, userFields),
                }}
                updateProfileError={updateProfileError}
                updateInProgress={updateProfileInProgress}
                onSubmit={values => handleFieldSubmit(values, userType)}
                marketplaceName={config.marketplaceName}
                userFields={nonPublicUserFields}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />
              <hr className={css.accountPageDivider} />
              <H4 as="h3" className={css.deleteAccountSubtitle}>
                <FormattedMessage id="ManageAccountPage.deleteAccountSubtitle" />
              </H4>
            </>
          ) : null}
          {user.id ? (
            <DeleteAccountForm
              intl={intl}
              deleteAccountError={deleteAccountError}
              onSubmitDeleteAccount={handleDeleteSubmit}
              marketplaceName={config.marketplaceName}
              currentUser={currentUser}
              deleteAccountInProgress={deleteAccountInProgress}
              onResetPassword={onResetPassword}
              resetPasswordInProgress={resetPasswordInProgress}
              resetPasswordError={resetPasswordError}
            />
          ) : null}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  // Topbar needs user info.
  const { currentUser } = state.user;
  const {
    deleteAccountError,
    deleteAccountInProgress,
    accountDeletionConfirmed,
    resetPasswordInProgress,
    resetPasswordError,
    updateProfileInProgress,
    updateProfileError,
  } = state.ManageAccountPage;
  return {
    deleteAccountError,
    deleteAccountInProgress,
    currentUser,
    accountDeletionConfirmed,
    scrollingDisabled: isScrollingDisabled(state),
    resetPasswordInProgress,
    resetPasswordError,
    updateProfileInProgress,
    updateProfileError,
  };
};

const mapDispatchToProps = dispatch => ({
  onSubmitDeleteAccount: values => dispatch(deleteAccount(values)),
  onResetPassword: values => dispatch(resetPassword(values)),
  onUpdateProfile: values => dispatch(updateProfile(values)),
});

const ManageAccountPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ManageAccountPageComponent);

export default ManageAccountPage;
