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
} from '../../util/urlHelpers.js';
import { hasPermissionToInitiateTransactions, isUserAuthorized } from '../../util/userHelpers.js';
import { displayPrice } from '../../util/configHelpers.js';
import { pathByRouteName } from '../../util/routes.js';
import {
  NEGOTIATION_PROCESS_NAME,
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
import RequestQuoteForm from './RequestQuoteForm/RequestQuoteForm.js';

import { requestQuote } from './RequestQuotePage.duck.js';

import css from './RequestQuotePage.module.css';

const { UUID } = sdkTypes;

const getProcessName = listing => {
  const processName = listing?.id
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

  const { history, config, routeConfiguration, listing, onRequestQuote, onSubmitCallback } = props;

  const { customerDefaultMessage } = values;

  const { listingType, transactionProcessAlias, unitType } = listing?.attributes?.publicData || {};

  // These are the inquiry parameters for the (one and only) transition
  const requestQuoteParams = {
    listingId: listing?.id,
    protectedData: {
      ...(customerDefaultMessage ? { customerDefaultMessage } : {}),
      ...getTransactionTypeData(listingType, unitType, config),
    },
  };

  // This makes a single transition directly to the API endpoint
  // (unlike in the payment-related processes, where call is proxied through the server to make privileged transition)
  onRequestQuote(requestQuoteParams, transactionProcessAlias)
    .then(transaction => {
      setSubmitting(false);
      onSubmitCallback();

      const transactionPage = 'OrderDetailsPage';
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

const RequestQuotePageComponent = props => {
  const [submitting, setSubmitting] = useState(false);

  const {
    scrollingDisabled,
    intl,
    config,
    processName,
    listing,
    pageTitle,
    requestQuoteError,
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
            showLocation={true}
            listingLocation={publicData?.location}
            intl={intl}
            sectionHeadingClassName={css.locationHeading}
          />

          <section className={css.paymentContainer}>
            <RequestQuoteForm
              intl={intl}
              config={config}
              authorDisplayName={userDisplayNameAsString(listing?.author, '')}
              onSubmit={onSubmit}
              errorMessageComponent={ErrorMessage}
              requestQuoteError={requestQuoteError}
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

const EnhancedRequestQuotePage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();

  const {
    currentUser,
    params: pathParams,
    scrollingDisabled,
    getListing,
    requestQuoteError,
  } = props;

  const listingId = new UUID(pathParams.id);
  const listing = getListing(listingId);

  const processName = getProcessName(listing);
  const isNegotiationProcess = processName === NEGOTIATION_PROCESS_NAME;

  const isDataLoaded = !!listing;

  // Handle redirection to ListingPage, if user is not authorized (state: 'active')
  const shouldRedirectUnathorizedUser = isDataLoaded && !isUserAuthorized(currentUser);
  // Redirect if the user has no transaction rights
  const shouldRedirectNoTransactionRightsUser =
    isDataLoaded &&
    // - either when they first arrive on the RequestQuotePageComponent
    (!hasPermissionToInitiateTransactions(currentUser) ||
      // - or when they are sending the order (if the operator removed transaction rights
      // when they were already on the RequestQuotePageComponent and the user has not refreshed the page)
      isErrorNoPermissionForInitiateTransactions(requestQuoteError));

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
    ? intl.formatMessage({ id: `RequestQuotePage.heading` }, { listingTitle, authorDisplayName })
    : 'The page is loading data';

  return processName && isNegotiationProcess ? (
    <RequestQuotePageComponent
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
    requestQuoteInProgress,
    requestQuoteError,
  } = state.RequestQuotePage;

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
    showListingInProgress,
    showListingError,
    requestQuoteInProgress,
    requestQuoteError,
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
  };
};

const mapDispatchToProps = dispatch => ({
  onRequestQuote: (params, processAlias) => dispatch(requestQuote(params, processAlias)),
});

const RequestQuotePage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EnhancedRequestQuotePage);

export default RequestQuotePage;
