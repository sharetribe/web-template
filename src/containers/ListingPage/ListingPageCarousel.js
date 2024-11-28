import { array, arrayOf, bool, func, object, oneOf, shape, string } from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { compose } from 'redux';

// Contexts
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
// Utils
import {
  isBookingProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../../transactions/transaction';
import {
  ensureListing,
  ensureOwnListing,
  ensureUser,
  userDisplayNameAsString,
} from '../../util/data';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
} from '../../util/errors.js';
import { FormattedMessage, intlShape, useIntl } from '../../util/reactIntl';
import { richText } from '../../util/richText';
import { types as sdkTypes } from '../../util/sdkLoader';
import { LISTING_STATE_CLOSED, LISTING_STATE_PENDING_APPROVAL, propTypes } from '../../util/types';
import {
  createSlug,
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
} from '../../util/urlHelpers';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers.js';

// Global ducks (for Redux actions and thunks)
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';

// Shared components
import {
  AvatarMedium,
  H4,
  LayoutSingleColumn,
  Modal,
  NamedLink,
  NamedRedirect,
  OrderPanel,
  Page,
} from '../../components';

// Related components and modules
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';
import TopbarContainer from '../TopbarContainer/TopbarContainer';

import {
  createSellerListing,
  fetchTimeSlots,
  fetchTransactionLineItems,
  getListingsOffeListingById,
  sendInquiry,
  setInitialValues,
} from './ListingPage.duck';

import ActionBarMaybe from './ActionBarMaybe';
import {
  ErrorPage,
  handleContactUser,
  handleSubmit,
  handleSubmitCheckoutPageWithInquiry,
  handleSubmitInquiry,
  listingImages,
  LoadingPage,
  priceData,
  priceForSchemaMaybe,
} from './ListingPage.shared';
import SectionMapMaybe from './SectionMapMaybe';
import SectionTextMaybe from './SectionTextMaybe';

import { initiateInquiryWithoutPayment } from '../CheckoutPage/CheckoutPage.duck.js';
import { onSubmitCallback, STORAGE_KEY } from '../CheckoutPage/CheckoutPage.js';
import { handlePageData } from '../CheckoutPage/CheckoutPageSessionHelpers.js';
import CustomInquiryForm from './CustomInquiryForm/CustomInquiryForm.js';
import css from './ListingPage.module.css';

import moment from 'moment';
import dateSVG from '../../assets/date.svg';
import locationSVG from '../../assets/location.svg';
import { MIN_LENGTH_FOR_LONG_WORDS } from '../ProfilePage/ProfilePage.js';
import SectionGallery from './SectionGallery.js';
import SectionOfferListingsMaybe from './SectionOfferListingsMaybe.js';

const MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE = 16;

const { UUID } = sdkTypes;

export const ListingPageComponent = props => {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(
    props.inquiryModalOpenForListingId === props.params.id
  );

  const [customInquiryModalOpen, setCustomInquiryModalOpen] = useState(false);

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
    onInquiryWithoutPayment,
    onCreateSellerListing,
    offerListingItems,
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

  const {
    listingType,
    transactionProcessAlias,
    unitType,
    project_type,
    flex_price,
    selectedDate,
  } = publicData;

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
    <span className={css.payoutDetailsWarning}>
      <FormattedMessage id="ListingPage.payoutDetailsWarning" values={{ processType }} />
      <NamedLink name="StripePayoutPage">
        <FormattedMessage id="ListingPage.payoutDetailsWarningLink" />
      </NamedLink>
    </span>
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
  const orderData = { deliveryMethod: 'none' };
  const transaction = null;
  const initialData = { orderData, listing: currentListing, transaction };
  const pageData = handlePageData(initialData, STORAGE_KEY, history);

  const handleInquiryFormSubmit = handleSubmitCheckoutPageWithInquiry({
    ...commonParams,
    config,
    processName,
    pageData,
    onInquiryWithoutPayment,
    onSubmitCallback,
    onCreateSellerListing,
  });

  const displayDate = selectedDate ? moment(selectedDate).format('dddd, MMMM Do YYYY') : null;
  const descriptionWithLinks = richText(description, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
  });

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
        <div className={css.contentWrapperForProductLayout}>
          <div className={css.mainColumnForProductLayout}>
            {currentListing.id && noPayoutDetailsSetWithOwnListing ? (
              <ActionBarMaybe
                className={css.actionBarForProductLayout}
                isOwnListing={isOwnListing}
                listing={currentListing}
                showNoPayoutDetailsSet={noPayoutDetailsSetWithOwnListing}
                currentUser={currentUser}
              />
            ) : null}
            {currentListing.id ? (
              <ActionBarMaybe
                className={css.actionBarForProductLayout}
                isOwnListing={isOwnListing}
                listing={currentListing}
                currentUser={currentUser}
                editParams={{
                  id: listingId.uuid,
                  slug: listingSlug,
                  type: listingPathParamType,
                  tab: listingTab,
                }}
              />
            ) : null}
            {/* <div className={css.mobileHeading}>
              <H4 as="h1" className={css.orderPanelTitle}>
                <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
              </H4>
            </div> */}
            <SectionTextMaybe text={title} showAsIngress />
            {/* <SectionTextMaybe text={description} showAsIngress /> */}

            <div className={css.author}>
              <AvatarMedium user={ensuredAuthor} className={css.providerAvatar} />
              <span className={css.providerNameLinked}>
                <FormattedMessage
                  id="OrderPanel.author"
                  values={{
                    name: (
                      <NamedLink
                        className={css.authorNameLink}
                        name="ListingPage"
                        params={params}
                        to={{ hash: '#author' }}
                      >
                        {authorDisplayName}
                      </NamedLink>
                    ),
                  }}
                />
              </span>
              <span className={css.providerNamePlain}>
                <FormattedMessage id="OrderPanel.author" values={{ name: authorDisplayName }} />
              </span>
            </div>

            {/* <CustomListingFields
              publicData={publicData}
              metadata={metadata}
              listingFieldConfigs={listingConfig.listingFields}
              categoryConfiguration={config.categoryConfiguration}
              intl={intl}
            /> */}

            {project_type && project_type === 'online' ? (
              <div className={css.projectTypeContent}>
                <div>
                  <img src={locationSVG} />
                </div>
                <div>
                  <div className={css.projectTypeTopic}>
                    <FormattedMessage id="ListingPage.ListingPageCarousel.working" />
                  </div>
                  <div className={css.projectTypeTitle}>{project_type}</div>
                </div>
              </div>
            ) : (
              <div>
                <div className={css.projectTypeContent}>
                  <div>
                    <img src={locationSVG} />
                  </div>
                  <div>
                    <div className={css.projectTypeTopic}>
                      <FormattedMessage id="ListingPage.ListingPageCarousel.working" />
                    </div>
                    <div className={css.projectTypeTitle}>{project_type}</div>
                  </div>
                </div>
              </div>
            )}

            {displayDate ? (
              <div className={css.projectTypeContent}>
                <div>
                  <img src={dateSVG} />
                </div>
                <div>
                  <div className={css.projectTypeTopic}>
                    <FormattedMessage id="ListingPage.ListingPageCarousel.date" />
                  </div>
                  <div className={css.projectTypeTitle}>{displayDate}</div>
                </div>
              </div>
            ) : null}

            {project_type && project_type !== 'online' ? (
              <SectionMapMaybe
                geolocation={geolocation}
                publicData={publicData}
                listingId={currentListing.id}
                mapsConfig={config.maps}
              />
            ) : null}

            <div className={css.marginContent}>
              <H4>
                <FormattedMessage id="ListingPage.ListingPageCarousel.detailsTitle" />
              </H4>
              <p className={css.bio}>{descriptionWithLinks}</p>
            </div>

            <SectionGallery
              listing={currentListing}
              variantPrefix={config.layout.listingImage.variantPrefix}
            />

            {/* <SectionReviews reviews={reviews} fetchReviewsError={fetchReviewsError} /> */}
            {/* <SectionAuthorMaybe
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
            /> */}

            {offerListingItems &&
              Array.isArray(offerListingItems) &&
              offerListingItems.length > 0 ? (
              <SectionOfferListingsMaybe
                listings={offerListingItems}
                intl={intl}
                onInitializeCardPaymentData={onInitializeCardPaymentData}
                currentUser={currentUser}
                callSetInitialValues={callSetInitialValues}
                getListing={getListing}
                isOwnListing={isOwnListing}
              />
            ) : <H4>
              <FormattedMessage
                id="ListingPage.SectionOfferListingsMaybe.title"
                values={{
                  value: <span style={{ fontWeight: 'bold' }}>0</span>,
                }}
              />
            </H4>}
          </div>
          <div className={css.orderColumnForProductLayout}>
            <OrderPanel
              className={css.productOrderPanel}
              listing={currentListing}
              currentUser={currentUser}
              routes={routeConfiguration}
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
              onContactUser={onContactUser}
              monthlyTimeSlots={monthlyTimeSlots}
              onFetchTimeSlots={onFetchTimeSlots}
              onFetchTransactionLineItems={onFetchTransactionLineItems}
              lineItems={lineItems}
              fetchLineItemsInProgress={fetchLineItemsInProgress}
              fetchLineItemsError={fetchLineItemsError}
              validListingTypes={config.listing.listingTypes}
              marketplaceCurrency={config.currency}
              dayCountAvailableForBooking={config.stripe.dayCountAvailableForBooking}
              marketplaceName={config.marketplaceName}
              setInquiryModalOpen={setCustomInquiryModalOpen}
            />
          </div>
          <Modal
            id="ListingPage.inquiry"
            contentClassName={css.inquiryModalContent}
            isOpen={isAuthenticated && customInquiryModalOpen}
            onClose={() => setCustomInquiryModalOpen(false)}
            usePortal
            onManageDisableScrolling={onManageDisableScrolling}
          >
            <CustomInquiryForm
              className={css.inquiryForm}
              submitButtonWrapperClassName={css.inquirySubmitButtonWrapper}
              listingTitle={title}
              authorDisplayName={authorDisplayName}
              sendInquiryError={sendInquiryError}
              onSubmit={handleInquiryFormSubmit}
              inProgress={sendInquiryInProgress}
              marketplaceCurrency={config.currency}
              offerPrice={price}
              flex_price={Array.isArray(flex_price) && flex_price.length > 0}
              listing={currentListing}
            />
          </Modal>
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
    offerListingItems: stateOfferListingItems,
    listingOfferEntities,
    id: listingId,
  } = state.ListingPage;

  const { currentUser } = state.user;

  const offerListingItems =
    stateOfferListingItems && listingOfferEntities
      ? getListingsOffeListingById(listingOfferEntities, stateOfferListingItems)
      : null;



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
    offerListingItems,
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
  onInquiryWithoutPayment: (params, processAlias, transitionName) =>
    dispatch(initiateInquiryWithoutPayment(params, processAlias, transitionName)),
  onCreateSellerListing: (createParams, queryParams) =>
    dispatch(createSellerListing(createParams, queryParams)),
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
