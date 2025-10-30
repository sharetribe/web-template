import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';

// Import contexts and util modules
import { types as sdkTypes } from '../../util/sdkLoader.js';
import { useConfiguration } from '../../context/configurationContext.js';
import { useRouteConfiguration } from '../../context/routeConfigurationContext.js';
import { userDisplayNameAsString } from '../../util/data.js';
import { isErrorNoPermissionForInitiateTransactions } from '../../util/errors.js';
import {
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  parse,
} from '../../util/urlHelpers.js';
import { hasPermissionToInitiateTransactions, isUserAuthorized } from '../../util/userHelpers.js';
import { displayPrice } from '../../util/configHelpers.js';
import { pathByRouteName } from '../../util/routes.js';
import {
  NEGOTIATION_PROCESS_NAME,
  REQUEST,
  resolveLatestProcessName,
} from '../../transactions/transaction.js';
import { requireListingImage } from '../../util/configHelpers.js';

// Import global thunk functions
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck.js';
import { isScrollingDisabled } from '../../ducks/ui.duck.js';

// Import shared components
import { H3, ErrorMessage, NamedRedirect, Page, TopbarSimplified } from '../../components/index.js';

// Import modules from this directory
import HeadingDetails from './HeadingDetails.js';
import DetailsSideCard from './DetailsSideCard/DetailsSideCard.js';
import MobileListingImage from './MobileListingImage/MobileListingImage.js';
import LocationDetails from './LocationDetails/LocationDetails.js';
import MakeOfferForm from './MakeOfferForm/MakeOfferForm.js';

import { makeOffer } from './MakeOfferPage.duck.js';

import css from './MakeOfferPage.module.css';

const { UUID } = sdkTypes;

const getProcessName = (transaction, listing) => {
  const processName = transaction?.id
    ? transaction?.attributes?.processName
    : listing?.id
    ? listing?.attributes?.publicData?.transactionProcessAlias?.split('/')[0]
    : null;
  return resolveLatestProcessName(processName);
};

const getTransactionTypeData = (listingType, unitTypeInPublicData, config) => {
  const listingTypeConfig = config.listing.listingTypes.find(lt => lt.listingType === listingType);
  const { process, alias, unitType, ...rest } = listingTypeConfig?.transactionType || {};
  // Note: we want to rely on unitType written in public data of the listing entity.
  //       The listingType configuration might have changed on the fly.
  return unitTypeInPublicData ? { unitType: unitTypeInPublicData, ...rest } : {};
};

const handleSubmit = (submitting, setSubmitting, props) => values => {
  if (submitting) {
    return;
  }
  setSubmitting(true);

  const {
    history,
    config,
    routeConfiguration,
    location,
    listing,
    currentUser,
    onMakeOffer,
    onSubmitCallback,
  } = props;

  const searchParams = parse(location.search);
  const transactionId = searchParams.transactionId;

  const { providerDefaultMessage, customerDefaultMessage, quote } = values;

  const { listingType, transactionProcessAlias, unitType } = listing?.attributes?.publicData || {};

  // These are the inquiry parameters for the (one and only) transition
  const makeOfferParams = {
    listingId: listing?.id,
    protectedData: {
      ...(providerDefaultMessage ? { providerDefaultMessage } : {}),
      ...(customerDefaultMessage ? { customerDefaultMessage } : {}),
      ...getTransactionTypeData(listingType, unitType, config),
    },
    offerInSubunits: quote?.amount,
    currency: quote?.currency,
  };
  const isPrivilegedTransition = true;

  // This makes a single transition directly to the API endpoint
  // (unlike in the payment-related processes, where call is proxied through the server to make privileged transition)
  onMakeOffer(makeOfferParams, transactionProcessAlias, transactionId, isPrivilegedTransition)
    .then(transaction => {
      setSubmitting(false);
      onSubmitCallback();

      // Currently, only provider is going to see this page. They should be redirected to the SaleDetailsPage
      // If unitType is 'request', then the author of the listing is 'customer' ('offer' and other unit types are created by provider)
      const isOwnListing = listing.author.id === currentUser.id;
      const isRequest = unitType === REQUEST;
      const isCurrentUserCustomer = isOwnListing && isRequest;
      const transactionPage = isCurrentUserCustomer ? 'OrderDetailsPage' : 'SaleDetailsPage';
      const txDetailsPath = pathByRouteName(transactionPage, routeConfiguration, {
        id: transaction?.id?.uuid,
      });

      history.push(txDetailsPath);
    })
    .catch(err => {
      console.error(err);
      setSubmitting(false);
    });
};

const getStripeAccountData = stripeAccount => stripeAccount.attributes.stripeAccountData || null;

// Check if there's requirements on selected type: 'past_due', 'currently_due' etc.
const hasRequirements = (stripeAccountData, requirementType) =>
  stripeAccountData != null &&
  stripeAccountData.requirements &&
  Array.isArray(stripeAccountData.requirements[requirementType]) &&
  stripeAccountData.requirements[requirementType].length > 0;

const MakeOfferPageComponent = props => {
  const [submitting, setSubmitting] = useState(false);

  const {
    scrollingDisabled,
    intl,
    config,
    processName,
    currentUser,
    stripeAccount,
    stripeAccountFetched,
    listing,
    pageTitle,
    makeOfferError,
  } = props;

  const onSubmit = handleSubmit(submitting, setSubmitting, props);
  const listingTitle = listing?.attributes?.title;
  const { price, publicData } = listing?.attributes || {};
  const firstImage = listing?.images?.length > 0 ? listing.images[0] : null;

  const listingType = publicData?.listingType;
  const listingTypeConfigs = config.listing.listingTypes;
  const listingTypeConfig = listingTypeConfigs.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(listingTypeConfig);
  const showListingImage = requireListingImage(listingTypeConfig);
  const showLocation = publicData?.unitType !== 'offer';

  const stripeConnected = currentUser?.attributes?.stripeConnected;
  const stripeAccountData = stripeConnected ? getStripeAccountData(stripeAccount) : null;
  const requirementsMissing =
    stripeAccount &&
    stripeAccountData &&
    (hasRequirements(stripeAccountData, 'past_due') ||
      hasRequirements(stripeAccountData, 'currently_due'));

  return (
    <Page title={pageTitle} scrollingDisabled={scrollingDisabled}>
      <TopbarSimplified />
      <div className={css.contentContainer}>
        <MobileListingImage
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
          showListingImage={showListingImage}
        />
        <main className={css.orderFormContainer}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              {pageTitle}
            </H3>
            <HeadingDetails
              listing={listing}
              listingTitle={listingTitle}
              listingTypeConfig={listingTypeConfig}
              price={price}
              intl={intl}
            />
          </div>

          <LocationDetails
            showLocation={showLocation}
            listingLocation={publicData?.location}
            intl={intl}
            sectionHeadingClassName={css.locationHeading}
          />

          <section className={css.paymentContainer}>
            <MakeOfferForm
              intl={intl}
              config={config}
              price={price}
              stripeConnected={stripeConnected && stripeAccountData && !requirementsMissing}
              onSubmit={onSubmit}
              errorMessageComponent={ErrorMessage}
              makeOfferError={makeOfferError}
            />
          </section>
        </main>

        <DetailsSideCard
          listing={listing}
          listingTitle={listingTitle}
          author={listing?.author}
          showListingImage={showListingImage}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
          processName={processName}
          showPrice={showPrice && !!price}
          intl={intl}
        />
      </div>
    </Page>
  );
};

const EnhancedMakeOfferPage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();

  const {
    currentUser,
    params: pathParams,
    location,
    scrollingDisabled,
    getListing,
    getTransaction,
    makeOfferError,
  } = props;

  const listingId = new UUID(pathParams.id);
  const listing = getListing(listingId);
  const searchParams = parse(location.search);
  const transactionId = searchParams.transactionId;
  const transaction = transactionId ? getTransaction(transactionId) : null;

  const processName = getProcessName(transaction, listing);
  const isNegotiationProcess = processName === NEGOTIATION_PROCESS_NAME;

  const hasTransaction = !!transaction;
  const isDataLoaded = !!listing && (!transactionId || hasTransaction);

  // Handle redirection to ListingPage, if user is not authorized (state: 'active')
  const shouldRedirectUnathorizedUser = isDataLoaded && !isUserAuthorized(currentUser);
  // Redirect if the user has no transaction rights
  const shouldRedirectNoTransactionRightsUser =
    isDataLoaded &&
    // - either when they first arrive on the MakeOfferPageComponent
    (!hasPermissionToInitiateTransactions(currentUser) ||
      // - or when they are sending the order (if the operator removed transaction rights
      // when they were already on the MakeOfferPageComponent and the user has not refreshed the page)
      isErrorNoPermissionForInitiateTransactions(makeOfferError));

  if (shouldRedirectUnathorizedUser) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (shouldRedirectNoTransactionRightsUser) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_INITIATE_TRANSACTIONS }}
      />
    );
  }

  const listingTitle = listing?.attributes?.title;
  const authorDisplayName = userDisplayNameAsString(listing?.author, '');
  const pageTitle = processName
    ? intl.formatMessage(
        { id: `MakeOfferPage.makeOfferTitle` },
        { listingTitle, authorDisplayName }
      )
    : 'The page is loading data';

  return processName && isNegotiationProcess ? (
    <MakeOfferPageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      processName={processName}
      listing={listing}
      pageTitle={pageTitle}
      onSubmitCallback={() => {}}
      {...props}
    />
  ) : (
    <Page title={pageTitle} scrollingDisabled={scrollingDisabled}>
      <TopbarSimplified />
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    showListingInProgress,
    showListingError,
    makeOfferInProgress,
    makeOfferError,
  } = state.MakeOfferPage;

  const getListing = id => {
    const ref = { id, type: 'listing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const getOwnListing = id => {
    const ref = { id, type: 'ownListing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };
  const getTransaction = id => {
    const ref = { id, type: 'transaction' };
    const transactions = getMarketplaceEntities(state, [ref]);
    return transactions.length === 1 ? transactions[0] : null;
  };

  const { currentUser } = state.user;

  const {
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
  } = state.stripeConnectAccount;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    getListing,
    getOwnListing,
    getTransaction,
    showListingInProgress,
    showListingError,
    makeOfferInProgress,
    makeOfferError,
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
  };
};

const mapDispatchToProps = dispatch => ({
  onMakeOffer: (params, processAlias, transactionId, isPrivileged) =>
    dispatch(makeOffer(params, processAlias, transactionId, isPrivileged)),
});

const MakeOfferPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EnhancedMakeOfferPage);

export default MakeOfferPage;
