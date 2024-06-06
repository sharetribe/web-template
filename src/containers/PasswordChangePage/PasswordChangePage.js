import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, UserNav, H3, LayoutSideNavigation } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import PasswordChangeForm from './PasswordChangeForm/PasswordChangeForm';

import { changePassword, changePasswordClear, resetPassword } from './PasswordChangePage.duck';
import css from './PasswordChangePage.module.css';

export const PasswordChangePageComponent = props => {
  const {
    changePasswordError,
    changePasswordInProgress,
    currentUser,
    onChange,
    onSubmitChangePassword,
    onResetPassword,
    resetPasswordInProgress,
    resetPasswordError,
    passwordChanged,
    scrollingDisabled,
    intl,
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
              currentPage="PasswordChangePage"
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

PasswordChangePageComponent.defaultProps = {
  changePasswordError: null,
  currentUser: null,
  resetPasswordInProgress: false,
  resetPasswordError: null,
};

const { bool, func } = PropTypes;

PasswordChangePageComponent.propTypes = {
  changePasswordError: propTypes.error,
  changePasswordInProgress: bool.isRequired,
  currentUser: propTypes.currentUser,
  onChange: func.isRequired,
  onSubmitChangePassword: func.isRequired,
  passwordChanged: bool.isRequired,
  scrollingDisabled: bool.isRequired,
  resetPasswordInProgress: bool,
  resetPasswordError: propTypes.error,

  // from injectIntl
  intl: intlShape.isRequired,
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
  ),
  injectIntl
)(PasswordChangePageComponent);

export default PasswordChangePage;
