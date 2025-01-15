import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { createResourceLocatorString } from '../../util/routes';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import {
  stripeAccountClearError,
  getStripeConnectAccountLink,
} from '../../ducks/stripeConnectAccount.duck';

import {
  H3,
  NamedRedirect,
  Page,
  StripeConnectAccountStatusBox,
  StripeConnectAccountForm,
  UserNav,
  LayoutSideNavigation,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { savePayoutDetails } from './StripePayoutPage.duck';

import css from './StripePayoutPage.module.css';

const STRIPE_ONBOARDING_RETURN_URL_SUCCESS = 'success';
const STRIPE_ONBOARDING_RETURN_URL_FAILURE = 'failure';
const STRIPE_ONBOARDING_RETURN_URL_TYPES = [
  STRIPE_ONBOARDING_RETURN_URL_SUCCESS,
  STRIPE_ONBOARDING_RETURN_URL_FAILURE,
];

// Create return URL for the Stripe onboarding form
const createReturnURL = (returnURLType, rootURL, routes) => {
  const path = createResourceLocatorString(
    'StripePayoutOnboardingPage',
    routes,
    { returnURLType },
    {}
  );
  const root = rootURL.replace(/\/$/, '');
  return `${root}${path}`;
};

// Get attribute: stripeAccountData
const getStripeAccountData = stripeAccount => stripeAccount.attributes.stripeAccountData || null;

// Get last 4 digits of bank account returned in Stripe account
const getBankAccountLast4Digits = stripeAccountData =>
  stripeAccountData && stripeAccountData.external_accounts.data.length > 0
    ? stripeAccountData.external_accounts.data[0].last4
    : null;

// Check if there's requirements on selected type: 'past_due', 'currently_due' etc.
const hasRequirements = (stripeAccountData, requirementType) =>
  stripeAccountData != null &&
  stripeAccountData.requirements &&
  Array.isArray(stripeAccountData.requirements[requirementType]) &&
  stripeAccountData.requirements[requirementType].length > 0;

// Redirect user to Stripe's hosted Connect account onboarding form
const handleGetStripeConnectAccountLinkFn = (getLinkFn, commonParams) => type => () => {
  getLinkFn({ type, ...commonParams })
    .then(url => {
      window.location.href = url;
    })
    .catch(err => console.error(err));
};

/**
 * StripePayoutPage component
 *
 * @component
 * @param {Object} props
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {boolean} props.scrollingDisabled - Whether scrolling is disabled
 * @param {boolean} props.getAccountLinkInProgress - Whether the account link is in progress
 * @param {boolean} props.payoutDetailsSaveInProgress - Whether the payout details are in progress
 * @param {propTypes.error} props.createStripeAccountError - The create stripe account error
 * @param {propTypes.error} props.getAccountLinkError - The get account link error
 * @param {propTypes.error} props.updateStripeAccountError - The update stripe account error
 * @param {propTypes.error} props.fetchStripeAccountError - The fetch stripe account error
 * @param {Object} props.stripeAccount - The stripe account
 * @param {boolean} props.stripeAccountFetched - Whether the stripe account is fetched
 * @param {boolean} props.payoutDetailsSaved - Whether the payout details are saved
 * @param {Function} props.onPayoutDetailsChange - The function to handle the payout details change
 * @param {Function} props.onPayoutDetailsSubmit - The function to handle the payout details submit
 * @param {Function} props.onGetStripeConnectAccountLink - The function to handle the get stripe connect account link
 * @param {Object} props.params - The path params
 * @param {STRIPE_ONBOARDING_RETURN_URL_SUCCESS | STRIPE_ONBOARDING_RETURN_URL_FAILURE} props.params.returnURLType - The return URL type (success or failure)
 * @returns {JSX.Element}
 */
export const StripePayoutPageComponent = props => {
  const config = useConfiguration();
  const routes = useRouteConfiguration();
  const intl = useIntl();
  const {
    currentUser,
    scrollingDisabled,
    getAccountLinkInProgress,
    getAccountLinkError,
    createStripeAccountError,
    updateStripeAccountError,
    fetchStripeAccountError,
    stripeAccountFetched,
    stripeAccount,
    onPayoutDetailsChange,
    onPayoutDetailsSubmit,
    onGetStripeConnectAccountLink,
    payoutDetailsSaveInProgress,
    payoutDetailsSaved,
    params,
  } = props;

  const { returnURLType } = params || {};
  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const currentUserLoaded = !!ensuredCurrentUser.id;
  const stripeConnected = currentUserLoaded && !!stripeAccount && !!stripeAccount.id;

  const title = intl.formatMessage({ id: 'StripePayoutPage.title' });

  const formDisabled = getAccountLinkInProgress;

  const rootURL = config.marketplaceRootURL;
  const successURL = createReturnURL(STRIPE_ONBOARDING_RETURN_URL_SUCCESS, rootURL, routes);
  const failureURL = createReturnURL(STRIPE_ONBOARDING_RETURN_URL_FAILURE, rootURL, routes);

  const accountId = stripeConnected ? stripeAccount.id : null;
  const stripeAccountData = stripeConnected ? getStripeAccountData(stripeAccount) : null;
  const requirementsMissing =
    stripeAccount &&
    (hasRequirements(stripeAccountData, 'past_due') ||
      hasRequirements(stripeAccountData, 'currently_due'));

  const savedCountry = stripeAccountData ? stripeAccountData.country : null;
  const savedAccountType = stripeAccountData ? stripeAccountData.business_type : null;

  const handleGetStripeConnectAccountLink = handleGetStripeConnectAccountLinkFn(
    onGetStripeConnectAccountLink,
    {
      accountId,
      successURL,
      failureURL,
    }
  );

  const returnedNormallyFromStripe = returnURLType === STRIPE_ONBOARDING_RETURN_URL_SUCCESS;
  const returnedAbnormallyFromStripe = returnURLType === STRIPE_ONBOARDING_RETURN_URL_FAILURE;
  const showVerificationNeeded = stripeConnected && requirementsMissing;

  // Redirect from success URL to basic path for StripePayoutPage
  if (returnedNormallyFromStripe && stripeConnected && !requirementsMissing) {
    return <NamedRedirect name="StripePayoutPage" />;
  }

  // Failure url should redirect back to Stripe since it's most likely due to page reload
  // Account link creation will fail if the account is the reason
  if (returnedAbnormallyFromStripe && !getAccountLinkError) {
    handleGetStripeConnectAccountLink('custom_account_verification')();
  }

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav currentPage="StripePayoutPage" />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        currentPage="StripePayoutPage"
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1" className={css.heading}>
            <FormattedMessage id="StripePayoutPage.heading" />
          </H3>
          {!currentUserLoaded ? (
            <FormattedMessage id="StripePayoutPage.loadingData" />
          ) : returnedAbnormallyFromStripe && !getAccountLinkError ? (
            <FormattedMessage id="StripePayoutPage.redirectingToStripe" />
          ) : (
            <StripeConnectAccountForm
              rootClassName={css.stripeConnectAccountForm}
              disabled={formDisabled}
              inProgress={payoutDetailsSaveInProgress}
              ready={payoutDetailsSaved}
              currentUser={ensuredCurrentUser}
              stripeBankAccountLastDigits={getBankAccountLast4Digits(stripeAccountData)}
              savedCountry={savedCountry}
              savedAccountType={savedAccountType}
              submitButtonText={intl.formatMessage({
                id: 'StripePayoutPage.submitButtonText',
              })}
              stripeAccountError={
                createStripeAccountError || updateStripeAccountError || fetchStripeAccountError
              }
              stripeAccountLinkError={getAccountLinkError}
              stripeAccountFetched={stripeAccountFetched}
              onChange={onPayoutDetailsChange}
              onSubmit={onPayoutDetailsSubmit}
              onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink}
              stripeConnected={stripeConnected}
            >
              {stripeConnected && !returnedAbnormallyFromStripe && showVerificationNeeded ? (
                <StripeConnectAccountStatusBox
                  type="verificationNeeded"
                  inProgress={getAccountLinkInProgress}
                  onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink(
                    'custom_account_verification'
                  )}
                />
              ) : stripeConnected && savedCountry && !returnedAbnormallyFromStripe ? (
                <StripeConnectAccountStatusBox
                  type="verificationSuccess"
                  inProgress={getAccountLinkInProgress}
                  disabled={payoutDetailsSaveInProgress}
                  onGetStripeConnectAccountLink={handleGetStripeConnectAccountLink(
                    'custom_account_update'
                  )}
                />
              ) : null}
            </StripeConnectAccountForm>
          )}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    getAccountLinkInProgress,
    getAccountLinkError,
    createStripeAccountError,
    updateStripeAccountError,
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
  } = state.stripeConnectAccount;
  const { currentUser } = state.user;
  const { payoutDetailsSaveInProgress, payoutDetailsSaved } = state.StripePayoutPage;
  return {
    currentUser,
    getAccountLinkInProgress,
    getAccountLinkError,
    createStripeAccountError,
    updateStripeAccountError,
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
    payoutDetailsSaveInProgress,
    payoutDetailsSaved,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onPayoutDetailsChange: () => dispatch(stripeAccountClearError()),
  onPayoutDetailsSubmit: (values, isUpdateCall) =>
    dispatch(savePayoutDetails(values, isUpdateCall)),
  onGetStripeConnectAccountLink: params => dispatch(getStripeConnectAccountLink(params)),
});

const StripePayoutPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(StripePayoutPageComponent);

export default StripePayoutPage;
