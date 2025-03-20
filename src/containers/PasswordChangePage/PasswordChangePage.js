import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, UserNav, H3, LayoutSideNavigation } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import PasswordChangeForm from './PasswordChangeForm/PasswordChangeForm';

import { changePassword, changePasswordClear, resetPassword } from './PasswordChangePage.duck';
import css from './PasswordChangePage.module.css';

/**
 * The change-password page.
 *
 * @param {Object} props
 * @param {propTypes.error} props.changePasswordError - The change password error
 * @param {boolean} props.changePasswordInProgress - Whether the change password is in progress
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {function} props.onChange - The function to change the password
 * @param {function} props.onSubmitChangePassword - The function to submit the change password form
 * @param {boolean} props.passwordChanged - Whether the password has changed
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {boolean} props.resetPasswordInProgress - Whether the reset password is in progress
 * @param {propTypes.error} props.resetPasswordError - The reset password error
 * @returns {JSX.Element} Password change page component
 */
export const PasswordChangePageComponent = props => {
  const intl = useIntl();
  const {
    changePasswordError,
    changePasswordInProgress,
    currentUser,
    onChange,
    onSubmitChangePassword,
    onResetPassword,
    resetPasswordInProgress = false,
    resetPasswordError,
    passwordChanged,
    scrollingDisabled,
  } = props;

  const changePasswordForm =
    currentUser && currentUser.id ? (
      <PasswordChangeForm
        className={css.form}
        changePasswordError={changePasswordError}
        currentUser={currentUser}
        onSubmit={onSubmitChangePassword}
        onChange={onChange}
        onResetPassword={onResetPassword}
        resetPasswordInProgress={resetPasswordInProgress}
        resetPasswordError={resetPasswordError}
        inProgress={changePasswordInProgress}
        ready={passwordChanged}
      />
    ) : null;

  const title = intl.formatMessage({ id: 'PasswordChangePage.title' });

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav currentPage="PasswordChangePage" />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        currentPage="PasswordChangePage"
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1">
            <FormattedMessage id="PasswordChangePage.heading" />
          </H3>
          {changePasswordForm}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  // Topbar needs user info.
  const {
    changePasswordError,
    changePasswordInProgress,
    passwordChanged,
    resetPasswordInProgress,
    resetPasswordError,
  } = state.PasswordChangePage;
  const { currentUser } = state.user;
  return {
    changePasswordError,
    changePasswordInProgress,
    currentUser,
    passwordChanged,
    scrollingDisabled: isScrollingDisabled(state),
    resetPasswordInProgress,
    resetPasswordError,
  };
};

const mapDispatchToProps = dispatch => ({
  onChange: () => dispatch(changePasswordClear()),
  onSubmitChangePassword: values => dispatch(changePassword(values)),
  onResetPassword: values => dispatch(resetPassword(values)),
});

const PasswordChangePage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(PasswordChangePageComponent);

export default PasswordChangePage;
