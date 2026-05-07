import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { camelize } from '../../util/string';
import { useIntl } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { signup, authenticationInProgress } from '../../ducks/auth.duck';
import { manageDisableScrolling } from '../../ducks/ui.duck';

import { Page, LayoutSingleColumn, NamedRedirect, Modal } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
// We need to get ToS asset and get it rendered for the modal on this page.
import { TermsOfServiceContent } from '../TermsOfServicePage/TermsOfServicePage';
// We need to get PrivacyPolicy asset and get it rendered for the modal on this page.
import { PrivacyPolicyContent } from '../PrivacyPolicyPage/PrivacyPolicyPage';
import TermsAndConditions from '../AuthenticationPage/TermsAndConditions/TermsAndConditions';

import ExpertSignupForm from './ExpertSignupForm/ExpertSignupForm';
import { TOS_ASSET_NAME, PRIVACY_POLICY_ASSET_NAME } from './ExpertSignupPage.duck';

import css from './ExpertSignupPage.module.css';

/**
 * Builds the signup params for the expert application form.
 * Core identity fields (email, password, fname, lname) are mapped to SDK fields.
 * All remaining form values are stored in privateData.
 *
 * @param {Object} values - form submit values
 * @returns {Object} params for the signup thunk
 */
const getExpertSignupParams = values => {
  const { email, password, fname, lname, terms, ...rest } = values;

  // Strip empty strings so privateData stays clean
  const privateData = Object.entries(rest).reduce((acc, [key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      acc[key] = val;
    }
    return acc;
  }, {});

  return {
    email,
    password,
    firstName: fname.trim(),
    lastName: lname.trim(),
    protectedData: { terms },
    privateData: {
      applicationData: privateData,
    },
  };
};

/**
 * The ExpertSignupPage component.
 *
 * @component
 * @returns {JSX.Element}
 */
const ExpertSignupPage = () => {
  const dispatch = useDispatch();
  const intl = useIntl();

  const [tosModalOpen, setTosModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Redux state
  const authInProgress = useSelector(state => authenticationInProgress(state));
  const signupError = useSelector(state => state.auth?.signupError);
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
  const currentUser = useSelector(state => state.user?.currentUser);
  const hostedAssets = useSelector(state => state.hostedAssets || {});
  const pageAssetsData = hostedAssets.pageAssetsData;
  const pageAssetsFetchInProgress = hostedAssets.inProgress;
  const pageAssetsFetchError = hostedAssets.error;

  const user = ensureCurrentUser(currentUser);
  const currentUserLoaded = !!user.id;

  const handleSubmit = useCallback(
    values => {
      dispatch(signup(getExpertSignupParams(values)));
    },
    [dispatch]
  );

  const onManageDisableScrolling = useCallback(
    (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    [dispatch]
  );

  const title = intl.formatMessage({ id: 'ExpertSignupPage.title' });

  // Redirect to thank you page once the user is fully created
  if (isAuthenticated && currentUserLoaded) {
    return <NamedRedirect name="ExpertSignupThankYouPage" />;
  }

  const termsAndConditions = (
    <TermsAndConditions
      onOpenTermsOfService={() => setTosModalOpen(true)}
      onOpenPrivacyPolicy={() => setPrivacyModalOpen(true)}
      intl={intl}
    />
  );

  return (
    <Page title={title} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.formContent}>
            <h1 className={css.heading}>
              {intl.formatMessage({ id: 'ExpertSignupPage.heading' })}
            </h1>
            <p className={css.description}>
              {intl.formatMessage({ id: 'ExpertSignupPage.description' })}
            </p>
            {signupError ? (
              <p className={css.error}>
                {intl.formatMessage({ id: 'ExpertSignupPage.signupFailed' })}
              </p>
            ) : null}
            <ExpertSignupForm
              formId="ExpertSignupForm"
              onSubmit={handleSubmit}
              inProgress={authInProgress}
              termsAndConditions={termsAndConditions}
            />
          </div>
        </div>
      </LayoutSingleColumn>
      <Modal
        id="ExpertSignupPage.tos"
        isOpen={tosModalOpen}
        onClose={() => setTosModalOpen(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <div className={css.termsWrapper} role="complementary">
          <TermsOfServiceContent
            inProgress={pageAssetsFetchInProgress}
            error={pageAssetsFetchError}
            data={pageAssetsData?.[camelize(TOS_ASSET_NAME)]?.data}
            isOpen={tosModalOpen}
          />
        </div>
      </Modal>
      <Modal
        id="ExpertSignupPage.privacyPolicy"
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <div className={css.privacyWrapper} role="complementary">
          <PrivacyPolicyContent
            inProgress={pageAssetsFetchInProgress}
            error={pageAssetsFetchError}
            data={pageAssetsData?.[camelize(PRIVACY_POLICY_ASSET_NAME)]?.data}
            isOpen={privacyModalOpen}
          />
        </div>
      </Modal>
    </Page>
  );
};

export default ExpertSignupPage;
