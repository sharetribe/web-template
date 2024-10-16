import React, { useState } from 'react';
import { array, arrayOf, bool, func, shape, string, oneOf, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

// Contexts
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
// Utils
import { FormattedMessage, intlShape, useIntl } from '../../util/reactIntl';
import { LISTING_STATE_PENDING_APPROVAL, LISTING_STATE_CLOSED, propTypes } from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
} from '../../util/urlHelpers';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
} from '../../util/errors.js';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers.js';
import {
  ensureListing,
  ensureOwnListing,
  ensureUser,
  userDisplayNameAsString,
} from '../../util/data';
import { richText } from '../../util/richText';
import {
  isBookingProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../../transactions/transaction';

// Global ducks (for Redux actions and thunks)
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

// Shared components
import {
  H4,
  Page,
  NamedLink,
  NamedRedirect,
  OrderPanel,
  LayoutSingleColumn,
} from '../../components';

// Related components and modules
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import {
  sendInquiry,
  setInitialValues,
  fetchTimeSlots,
  fetchTransactionLineItems,
} from './ListingPage.duck';

import {
  LoadingPage,
  ErrorPage,
  priceData,
  listingImages,
  handleContactUser,
  handleSubmitInquiry,
  handleSubmit,
  priceForSchemaMaybe,
} from './ListingPage.shared';
import SectionHero from './SectionHero';
import SectionTextMaybe from './SectionTextMaybe';
import SectionReviews from './SectionReviews';
import SectionAuthorMaybe from './SectionAuthorMaybe';
import SectionMapMaybe from './SectionMapMaybe';
import CustomListingFields from './CustomListingFields';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE = 16;

const { UUID } = sdkTypes;

export const ListingPageComponent = props => {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(
    props.inquiryModalOpenForListingId === props.params.id
  );
  const [imageCarouselOpen, setImageCarouselOpen] = useState(false);

  const {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    intl,
    onManageDisableScrolling,
    params: rawParams,
    location,
    scrollingDisabled,
    showListingError,
    reviews,
    fetchReviewsError,
    sendInquiryInProgress,
    sendInquiryError,
    monthlyTimeSlots,
    onFetchTimeSlots,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    history,
    callSetInitialValues,
    onSendInquiry,
    onInitializeCardPaymentData,
    config,
    routeConfiguration,
    showOwnListingsOnly,
  } = props;

  const listingConfig = config.listing;
  const listingId = new UUID(rawParams.id);
  const isPendingApprovalVariant = rawParams.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
  const isDraftVariant = rawParams.variant === LISTING_PAGE_DRAFT_VARIANT;
  const currentListing =
    isPendingApprovalVariant || isDraftVariant || showOwnListingsOnly
      ? ensureOwnListing(getOwnListing(listingId))
      : ensureListing(getListing(listingId));

  const listingSlug = rawParams.slug || createSlug(currentListing.attributes.title || '');
  const params = { slug: listingSlug, ...rawParams };

  const listingPathParamType = isDraftVariant
    ? LISTING_PAGE_PARAM_TYPE_DRAFT
    : LISTING_PAGE_PARAM_TYPE_EDIT;
  const listingTab = isDraftVariant ? 'photos' : 'details';

  const isApproved =
    currentListing.id && currentListing.attributes.state !== LISTING_STATE_PENDING_APPROVAL;

  const pendingIsApproved = isPendingApprovalVariant && isApproved;

  // If a /pending-approval URL is shared, the UI requires
  // authentication and attempts to fetch the listing from own
  // listings. This will fail with 403 Forbidden if the author is
  // another user. We use this information to try to fetch the
  // public listing.
  const pendingOtherUsersListing =
    (isPendingApprovalVariant || isDraftVariant) &&
    showListingError &&
    showListingError.status === 403;
  const shouldShowPublicListingPage = pendingIsApproved || pendingOtherUsersListing;

  if (shouldShowPublicListingPage) {
    return <NamedRedirect name="ListingPage" params={params} search={location.search} />;
  }

  const topbar = <TopbarContainer />;

  if (showListingError && showListingError.status === 404) {
    // 404 listing not found
    return <NotFoundPage staticContext={props.staticContext} />;
  } else if (showListingError) {
    // Other error in fetching listing
    return <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} />;
  } else if (!currentListing.id) {
    // Still loading the listing
    return <LoadingPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} />;
  }

  const {
    description = '',
    geolocation = null,
    price = null,
    title = '',
    publicData = {},
    metadata = {},
  } = currentListing.attributes;

  const richTitle = (
    <span>
      {richText(title, {
        longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE,
        longWordClass: css.longWord,
      })}
    </span>
  );

  const authorAvailable = currentListing && currentListing.author;
  const userAndListingAuthorAvailable = !!(currentUser && authorAvailable);
  const isOwnListing =
    userAndListingAuthorAvailable && currentListing.author.id.uuid === currentUser.id.uuid;

  const { listingType, transactionProcessAlias, unitType } = publicData;
  if (!(listingType && transactionProcessAlias && unitType)) {
    // Listing should always contain listingType, transactionProcessAlias and unitType)
    return (
      <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} invalidListing />
    );
  }
  const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
  const isBooking = isBookingProcess(processName);
  const isPurchase = isPurchaseProcess(processName);
  const processType = isBooking ? 'booking' : isPurchase ? 'purchase' : 'inquiry';

  const currentAuthor = authorAvailable ? currentListing.author : null;
  const ensuredAuthor = ensureUser(currentAuthor);
  const noPayoutDetailsSetWithOwnListing =
    isOwnListing && (processType !== 'inquiry' && !currentUser?.attributes?.stripeConnected);
  const payoutDetailsWarning = noPayoutDetailsSetWithOwnListing ? (
    <div>
      <FormattedMessage id="ListingPage.payoutDetailsWarning" values={{ processType }} />
      <NamedLink name="StripePayoutPage">
        <FormattedMessage id="ListingPage.payoutDetailsWarningLink" />
      </NamedLink>
    </div>
  ) : null;

  // When user is banned or deleted the listing is also deleted.
  // Because listing can be never showed with banned or deleted user we don't have to provide
  // banned or deleted display names for the function
  const authorDisplayName = userDisplayNameAsString(ensuredAuthor, '');

  const { formattedPrice } = priceData(price, config.currency, intl);

  const commonParams = { params, history, routes: routeConfiguration };
  const onContactUser = handleContactUser({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    location,
    setInitialValues,
    setInquiryModalOpen,
  });
  // Note: this is for inquiry state in booking and purchase processes. Inquiry process is handled through handleSubmit.
  const onSubmitInquiry = handleSubmitInquiry({
    ...commonParams,
    getListing,
    onSendInquiry,
    setInquiryModalOpen,
  });
  const onSubmit = handleSubmit({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    getListing,
    onInitializeCardPaymentData,
  });

  const handleOrderSubmit = values => {
    const isCurrentlyClosed = currentListing.attributes.state === LISTING_STATE_CLOSED;
    if (isOwnListing || isCurrentlyClosed) {
      window.scrollTo(0, 0);
    } else {
      onSubmit(values);
    }
  };

  const facebookImages = listingImages(currentListing, 'facebook');
  const twitterImages = listingImages(currentListing, 'twitter');
  const schemaImages = listingImages(
    currentListing,
    `${config.layout.listingImage.variantPrefix}-2x`
  ).map(img => img.url);
  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'ListingPage.schemaTitle' },
    { title, price: formattedPrice, marketplaceName }
  );
  // You could add reviews, sku, etc. into page schema
  // Read more about product schema
  // https://developers.google.com/search/docs/advanced/structured-data/product
  const productURL = `${config.marketplaceRootURL}${location.pathname}${location.search}${location.hash}`;
  const currentStock = currentListing.currentStock?.attributes?.quantity || 0;
  const schemaAvailability = !currentListing.currentStock
    ? null
    : currentStock > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const availabilityMaybe = schemaAvailability ? { availability: schemaAvailability } : {};

  const handleViewPhotosClick = e => {
    // Stop event from bubbling up to prevent image click handler
    // trying to open the carousel as well.
    e.stopPropagation();
    setImageCarouselOpen(true);
  };

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      author={authorDisplayName}
      description={description}
      facebookImages={facebookImages}
      twitterImages={twitterImages}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'Product',
        description: description,
        name: schemaTitle,
        image: schemaImages,
        offers: {
          '@type': 'Offer',
          url: productURL,
          ...priceForSchemaMaybe(price, intl),
          ...availabilityMaybe,
        },
      }}
    >
      <LayoutSingleColumn className={css.pageRoot} topbar={topbar} footer={<FooterContainer />}>
        <SectionHero
          title={title}
          listing={currentListing}
          isOwnListing={isOwnListing}
          currentUser={currentUser}
          editParams={{
            id: listingId.uuid,
            slug: listingSlug,
            type: listingPathParamType,
            tab: listingTab,
          }}
          imageCarouselOpen={imageCarouselOpen}
          onImageCarouselClose={() => setImageCarouselOpen(false)}
          handleViewPhotosClick={handleViewPhotosClick}
          onManageDisableScrolling={onManageDisableScrolling}
          noPayoutDetailsSetWithOwnListing={noPayoutDetailsSetWithOwnListing}
        />
        <div className={css.contentWrapperForHeroLayout}>
          <div className={css.mainColumnForHeroLayout}>
            <div className={css.mobileHeading}>
              <H4 as="h1" className={css.orderPanelTitle}>
                <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
              </H4>
            </div>
            <SectionTextMaybe text={description} showAsIngress />

            <CustomListingFields
              publicData={publicData}
              metadata={metadata}
              listingFieldConfigs={listingConfig.listingFields}
              categoryConfiguration={config.categoryConfiguration}
              intl={intl}
            />

            <SectionMapMaybe
              geolocation={geolocation}
              publicData={publicData}
              listingId={currentListing.id}
              mapsConfig={config.maps}
            />
            <SectionReviews reviews={reviews} fetchReviewsError={fetchReviewsError} />
            <SectionAuthorMaybe
              title={title}
              listing={currentListing}
              authorDisplayName={authorDisplayName}
              onContactUser={onContactUser}
              isInquiryModalOpen={isAuthenticated && inquiryModalOpen}
              onCloseInquiryModal={() => setInquiryModalOpen(false)}
              sendInquiryError={sendInquiryError}
              sendInquiryInProgress={sendInquiryInProgress}
              onSubmitInquiry={onSubmitInquiry}
              currentUser={currentUser}
              onManageDisableScrolling={onManageDisableScrolling}
            />
          </div>
          <div className={css.orderColumnForHeroLayout}>
            <OrderPanel
              className={css.orderPanel}
              listing={currentListing}
              isOwnListing={isOwnListing}
              onSubmit={handleOrderSubmit}
              authorLink={
                <NamedLink
                  className={css.authorNameLink}
                  name="ListingPage"
                  params={params}
                  to={{ hash: '#author' }}
                >
                  {authorDisplayName}
                </NamedLink>
              }
              title={<FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />}
              titleDesktop={
                <H4 as="h1" className={css.orderPanelTitle}>
                  <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
                </H4>
              }
              payoutDetailsWarning={payoutDetailsWarning}
              author={ensuredAuthor}
              onManageDisableScrolling={onManageDisableScrolling}
              onFetchTransactionLineItems={onFetchTransactionLineItems}
              onContactUser={onContactUser}
              monthlyTimeSlots={monthlyTimeSlots}
              onFetchTimeSlots={onFetchTimeSlots}
              lineItems={lineItems}
              fetchLineItemsInProgress={fetchLineItemsInProgress}
              fetchLineItemsError={fetchLineItemsError}
              validListingTypes={config.listing.listingTypes}
              marketplaceCurrency={config.currency}
              dayCountAvailableForBooking={config.stripe.dayCountAvailableForBooking}
              marketplaceName={config.marketplaceName}
            />
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

ListingPageComponent.defaultProps = {
  currentUser: null,
  inquiryModalOpenForListingId: null,
  showListingError: null,
  reviews: [],
  fetchReviewsError: null,
  monthlyTimeSlots: null,
  sendInquiryError: null,
  lineItems: null,
  fetchLineItemsError: null,
};

ListingPageComponent.propTypes = {
  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
  // from useLocation
  location: shape({
    search: string,
  }).isRequired,

  // from useIntl
  intl: intlShape.isRequired,

  // from useConfiguration
  config: object.isRequired,
  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,

  params: shape({
    id: string.isRequired,
    slug: string,
    variant: oneOf([LISTING_PAGE_DRAFT_VARIANT, LISTING_PAGE_PENDING_APPROVAL_VARIANT]),
  }).isRequired,

  isAuthenticated: bool.isRequired,
  currentUser: propTypes.currentUser,
  getListing: func.isRequired,
  getOwnListing: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  scrollingDisabled: bool.isRequired,
  inquiryModalOpenForListingId: string,
  showListingError: propTypes.error,
  callSetInitialValues: func.isRequired,
  reviews: arrayOf(propTypes.review),
  fetchReviewsError: propTypes.error,
  monthlyTimeSlots: object,
  // monthlyTimeSlots could be something like:
  // monthlyTimeSlots: {
  //   '2019-11': {
  //     timeSlots: [],
  //     fetchTimeSlotsInProgress: false,
  //     fetchTimeSlotsError: null,
  //   }
  // }
  sendInquiryInProgress: bool.isRequired,
  sendInquiryError: propTypes.error,
  onSendInquiry: func.isRequired,
  onInitializeCardPaymentData: func.isRequired,
  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,
};

const EnhancedListingPage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  const showListingError = props.showListingError;
  const isVariant = props.params?.variant?.length > 0;
  const currentUser = props.currentUser;
  if (isForbiddenError(showListingError) && !isVariant && !currentUser) {
    // This can happen if private marketplace mode is active
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);
  const hasUserPendingApprovalError = isErrorUserPendingApproval(showListingError);

  if ((isPrivateMarketplace && isUnauthorizedUser) || hasUserPendingApprovalError) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (
    (hasNoViewingRights && isForbiddenError(showListingError)) ||
    isErrorNoViewingPermission(showListingError)
  ) {
    // If the user has no viewing rights, fetching anything but their own listings
    // will return a 403 error. If that happens, redirect to NoAccessPage.
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  }

  return (
    <ListingPageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      location={location}
      showOwnListingsOnly={hasNoViewingRights}
      {...props}
    />
  );
};

const mapStateToProps = state => {
  const { isAuthenticated } = state.auth;
  const {
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    sendInquiryInProgress,
    sendInquiryError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    inquiryModalOpenForListingId,
  } = state.ListingPage;
  const { currentUser } = state.user;

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

  return {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    scrollingDisabled: isScrollingDisabled(state),
    inquiryModalOpenForListingId,
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    sendInquiryInProgress,
    sendInquiryError,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
  onFetchTransactionLineItems: params => dispatch(fetchTransactionLineItems(params)),
  onSendInquiry: (listing, message) => dispatch(sendInquiry(listing, message)),
  onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
  onFetchTimeSlots: (listingId, start, end, timeZone) =>
    dispatch(fetchTimeSlots(listingId, start, end, timeZone)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const ListingPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EnhancedListingPage);

export default ListingPage;
