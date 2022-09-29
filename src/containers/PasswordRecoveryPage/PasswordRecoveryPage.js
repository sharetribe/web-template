import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isPasswordRecoveryEmailNotFoundError } from '../../util/errors';
import { isScrollingDisabled } from '../../ducks/UI.duck';

import {
  Page,
  InlineTextButton,
  IconKeys,
  ResponsiveBackgroundImageContainer,
  LayoutSingleColumn,
  LayoutWrapperMain,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  Footer,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import PasswordRecoveryForm from './PasswordRecoveryForm/PasswordRecoveryForm';

import {
  recoverPassword,
  retypePasswordRecoveryEmail,
  clearPasswordRecoveryError,
} from './PasswordRecoveryPage.duck';
import css from './PasswordRecoveryPage.module.css';

const PasswordRecovery = props => {
  const { initialEmail, onChange, onSubmitEmail, recoveryInProgress, recoveryError } = props;
  return (
    <div className={css.submitEmailContent}>
      <IconKeys className={css.modalIcon} />
      <h1 className={css.modalTitle}>
        <FormattedMessage id="PasswordRecoveryPage.forgotPasswordTitle" />
      </h1>
      <p className={css.modalMessage}>
        <FormattedMessage id="PasswordRecoveryPage.forgotPasswordMessage" />
      </p>
      <PasswordRecoveryForm
        inProgress={recoveryInProgress}
        onChange={onChange}
        onSubmit={values => onSubmitEmail(values.email)}
        initialValues={{ email: initialEmail }}
        recoveryError={recoveryError}
      />
    </div>
  );
};

const GenericError = () => {
  return (
    <div className={css.genericErrorContent}>
      <IconKeys className={css.modalIcon} />
      <h1 className={css.modalTitle}>
        <FormattedMessage id="PasswordRecoveryPage.actionFailedTitle" />
      </h1>
      <p className={css.modalMessage}>
        <FormattedMessage id="PasswordRecoveryPage.actionFailedMessage" />
      </p>
    </div>
  );
};

const EmailSubmittedContent = props => {
  const {
    passwordRequested,
    initialEmail,
    submittedEmail,
    onRetypeEmail,
    onSubmitEmail,
    recoveryInProgress,
  } = props;

  const submittedEmailText = (
    <span className={css.email}>{passwordRequested ? initialEmail : submittedEmail}</span>
  );

  const resendEmailLink = (
    <InlineTextButton rootClassName={css.helperLink} onClick={() => onSubmitEmail(submittedEmail)}>
      <FormattedMessage id="PasswordRecoveryPage.resendEmailLinkText" />
    </InlineTextButton>
  );

  const fixEmailLink = (
    <InlineTextButton rootClassName={css.helperLink} onClick={onRetypeEmail}>
      <FormattedMessage id="PasswordRecoveryPage.fixEmailLinkText" />
    </InlineTextButton>
  );

  return (
    <div className={css.emailSubmittedContent}>
      <IconKeys className={css.modalIcon} />
      <h1 className={css.modalTitle}>
        <FormattedMessage id="PasswordRecoveryPage.emailSubmittedTitle" />
      </h1>
      <p className={css.modalMessage}>
        <FormattedMessage
          id="PasswordRecoveryPage.emailSubmittedMessage"
          values={{ submittedEmailText }}
        />
      </p>
      <div className={css.bottomWrapper}>
        <p className={css.helperText}>
          {recoveryInProgress ? (
            <FormattedMessage id="PasswordRecoveryPage.resendingEmailInfo" />
          ) : (
            <FormattedMessage
              id="PasswordRecoveryPage.resendEmailInfo"
              values={{ resendEmailLink }}
            />
          )}
        </p>
        <p className={css.helperText}>
          <FormattedMessage id="PasswordRecoveryPage.fixEmailInfo" values={{ fixEmailLink }} />
        </p>
      </div>
    </div>
  );
};

export const PasswordRecoveryPageComponent = props => {
  const config = useConfiguration();
  const {
    scrollingDisabled,
    initialEmail,
    submittedEmail,
    recoveryError,
    recoveryInProgress,
    passwordRequested,
    onChange,
    onSubmitEmail,
    onRetypeEmail,
    intl,
  } = props;
  const alreadyrequested = submittedEmail || passwordRequested;
  const showPasswordRecoveryForm = (
    <PasswordRecovery
      initialEmail={initialEmail}
      onChange={onChange}
      onSubmitEmail={onSubmitEmail}
      recoveryInProgress={recoveryInProgress}
      recoveryError={recoveryError}
    />
  );

  return (
    <Page
      title={intl.formatMessage({
        id: 'PasswordRecoveryPage.title',
      })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.layoutWrapperMain}>
          <ResponsiveBackgroundImageContainer
            className={css.root}
            childrenWrapperClassName={css.contentContainer}
            as="section"
            image={config.branding.brandImageURL}
            sizes="100%"
            useOverlay
          >
            {isPasswordRecoveryEmailNotFoundError(recoveryError) ? (
              showPasswordRecoveryForm
            ) : recoveryError ? (
              <GenericError />
            ) : alreadyrequested ? (
              <EmailSubmittedContent
                passwordRequested={passwordRequested}
                initialEmail={initialEmail}
                submittedEmail={submittedEmail}
                onRetypeEmail={onRetypeEmail}
                onSubmitEmail={onSubmitEmail}
                recoveryInProgress={recoveryInProgress}
              />
            ) : (
              showPasswordRecoveryForm
            )}
          </ResponsiveBackgroundImageContainer>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

PasswordRecoveryPageComponent.defaultProps = {
  sendVerificationEmailError: null,
  initialEmail: null,
  submittedEmail: null,
  recoveryError: null,
};

const { bool, func, string } = PropTypes;

PasswordRecoveryPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
  initialEmail: string,
  submittedEmail: string,
  recoveryError: propTypes.error,
  recoveryInProgress: bool.isRequired,
  passwordRequested: bool.isRequired,
  onChange: func.isRequired,
  onSubmitEmail: func.isRequired,
  onRetypeEmail: func.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    initialEmail,
    submittedEmail,
    recoveryError,
    recoveryInProgress,
    passwordRequested,
  } = state.PasswordRecoveryPage;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    initialEmail,
    submittedEmail,
    recoveryError,
    recoveryInProgress,
    passwordRequested,
  };
};

const mapDispatchToProps = dispatch => ({
  onChange: () => dispatch(clearPasswordRecoveryError()),
  onSubmitEmail: email => dispatch(recoverPassword(email)),
  onRetypeEmail: () => dispatch(retypePasswordRecoveryEmail()),
});

const PasswordRecoveryPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(PasswordRecoveryPageComponent);

export default PasswordRecoveryPage;
