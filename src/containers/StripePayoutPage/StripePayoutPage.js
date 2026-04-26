import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { createResourceLocatorString } from '../../util/routes';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { showCreateListingLinkForUser, showPaymentDetailsForUser } from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import ManualPayoutForm from './ManualPayoutForm';

import {
  H3,
  NamedRedirect,
  Page,
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
 * @param {boolean} props.scrollingDisabled - Whether scrolling is disabled
 * @param {boolean} props.getAccountLinkInProgress - Whether the account link is in progress
 * @param {boolean} props.payoutDetailsSaveInProgress - Whether the payout details are in progress
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
  const { currentUser, scrollingDisabled, payoutDetailsSaveInProgress, payoutDetailsSaved, onPayoutDetailsSubmit, onPayoutDetailsDelete } = props;  
  const intl = useIntl();
  const config = useConfiguration();

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const currentUserLoaded = !!ensuredCurrentUser.id;
  const saved = ensuredCurrentUser.attributes?.profile?.privateData?.manualPayoutDetails;

  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);
  const { showPayoutDetails, showPaymentMethods } = showPaymentDetailsForUser(config, currentUser);

  return (
    <Page title="Payout details" scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer desktopClassName={css.desktopTopbar} mobileClassName={css.mobileTopbar} />
            <UserNav currentPage="StripePayoutPage" showManageListingsLink={showManageListingsLink} />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        accountSettingsNavProps={{ currentPage: 'StripePayoutPage', showPaymentMethods, showPayoutDetails }}
        footer={<FooterContainer />}
        intl={intl}
      >
        <div className={css.content}>
          <H3 as="h1" className={css.heading}>Payout details</H3>
          {!currentUserLoaded ? (
            <p>Loading…</p>
          ) : (
            <ManualPayoutForm
              onSubmit={onPayoutDetailsSubmit}
              onDelete={onPayoutDetailsDelete}
              inProgress={payoutDetailsSaveInProgress}
              saved={payoutDetailsSaved}
              existingDetails={saved}
            />
          )}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { payoutDetailsSaveInProgress, payoutDetailsSaved } = state.StripePayoutPage;
  return {
    currentUser,
    payoutDetailsSaveInProgress,
    payoutDetailsSaved,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onPayoutDetailsSubmit: values => dispatch(savePayoutDetails(values)),
  onPayoutDetailsDelete: () => dispatch(savePayoutDetails(null)),
});

const StripePayoutPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(StripePayoutPageComponent);

export default StripePayoutPage;
