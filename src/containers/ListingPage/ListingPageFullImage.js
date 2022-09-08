import React, { useState } from 'react';
import { array, arrayOf, bool, func, shape, string, oneOf, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, intlShape, useIntl } from '../../util/reactIntl';
import { findOptionsForSelectFilter } from '../../util/search';
import {
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_CLOSED,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  propTypes,
} from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
} from '../../util/urlHelpers';
import { convertMoneyToNumber } from '../../util/currency';
import {
  ensureListing,
  ensureOwnListing,
  ensureUser,
  userDisplayNameAsString,
} from '../../util/data';
import { richText } from '../../util/richText';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

import {
  Page,
  NamedLink,
  NamedRedirect,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  OrderPanel,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import {
  sendEnquiry,
  setInitialValues,
  fetchTimeSlots,
  fetchTransactionLineItems,
} from './ListingPage.duck';

import {
  LoadingPage,
  ErrorPage,
  priceData,
  categoryLabel,
  listingImages,
  handleContactUser,
  handleSubmitEnquiry,
  handleSubmit,
} from './ListingPage.shared';
import ActionBarMaybe from './ActionBarMaybe';
import SectionHeading from './SectionHeading';
import SectionTextMaybe from './SectionTextMaybe';
import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import SectionReviews from './SectionReviews';
import SectionAuthorMaybe from './SectionAuthorMaybe';
import SectionMapMaybe from './SectionMapMaybe';
import SectionGallery from './SectionGallery';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE = 16;

const { UUID } = sdkTypes;

export const ListingPageComponent = props => {
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(
    props.enquiryModalOpenForListingId === props.params.id
  );

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
    sendEnquiryInProgress,
    sendEnquiryError,
    monthlyTimeSlots,
    onFetchTimeSlots,
    listingConfig: listingConfigProp,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    history,
    callSetInitialValues,
    onSendEnquiry,
    onInitializeCardPaymentData,
    config,
    routeConfiguration,
  } = props;

  // prop override makes testing a bit easier
  // TODO: improve this when updating test setup
  const listingConfig = listingConfigProp || config.listing;
  const listingId = new UUID(rawParams.id);
  const isPendingApprovalVariant = rawParams.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
  const isDraftVariant = rawParams.variant === LISTING_PAGE_DRAFT_VARIANT;
  const currentListing =
    isPendingApprovalVariant || isDraftVariant
      ? ensureOwnListing(getOwnListing(listingId))
      : ensureListing(getListing(listingId));

  const listingSlug = rawParams.slug || createSlug(currentListing.attributes.title || '');
  const params = { slug: listingSlug, ...rawParams };

  const listingType = isDraftVariant ? LISTING_PAGE_PARAM_TYPE_DRAFT : LISTING_PAGE_PARAM_TYPE_EDIT;
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
    return <NotFoundPage />;
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
  const showContactUser = authorAvailable && (!currentUser || (currentUser && !isOwnListing));

  const currentAuthor = authorAvailable ? currentListing.author : null;
  const ensuredAuthor = ensureUser(currentAuthor);

  // When user is banned or deleted the listing is also deleted.
  // Because listing can be never showed with banned or deleted user we don't have to provide
  // banned or deleted display names for the function
  const authorDisplayName = userDisplayNameAsString(ensuredAuthor, '');

  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);

  const commonParams = { params, history, routes: routeConfiguration };
  const onContactUser = handleContactUser({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    location,
    setInitialValues,
    setEnquiryModalOpen,
  });
  const onSubmitEnquiry = handleSubmitEnquiry({
    ...commonParams,
    getListing,
    onSendEnquiry,
    setEnquiryModalOpen,
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
  const siteTitle = config.siteTitle;
  const schemaTitle = intl.formatMessage(
    { id: 'ListingPage.schemaTitle' },
    { title, price: formattedPrice, siteTitle }
  );
  // You could add reviews, sku, etc. into page schema
  // Read more about product schema
  // https://developers.google.com/search/docs/advanced/structured-data/product
  const productURL = `${config.canonicalRootURL}${location.pathname}${location.search}${location.hash}`;
  const brand = currentListing?.attributes?.publicData?.brand;
  const brandMaybe = brand ? { brand: { '@type': 'Brand', name: brand } } : {};
  const schemaPriceNumber = intl.formatNumber(convertMoneyToNumber(price), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const currentStock = currentListing.currentStock?.attributes?.quantity || 0;
  const schemaAvailability =
    currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  const formatOptionValue = option => `${option}`.toLowerCase().replace(/\s/g, '_');
  const optionEntities = options => options.map(o => ({ key: formatOptionValue(o), label: o }));

  // TODO: category is custom field. We probably should not support this?
  const categoryOptions = findOptionsForSelectFilter('category', listingConfig.listingExtendedData);
  const category = publicData?.category ? (
    <span>
      {categoryLabel(optionEntities(categoryOptions), publicData.category)}
      <span className={css.separator}>•</span>
    </span>
  ) : null;

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      author={authorDisplayName}
      contentType="website"
      description={description}
      facebookImages={facebookImages}
      twitterImages={twitterImages}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'Product',
        description: description,
        name: schemaTitle,
        image: schemaImages,
        ...brandMaybe,
        offers: {
          '@type': 'Offer',
          url: productURL,
          priceCurrency: price.currency,
          price: schemaPriceNumber,
          availability: schemaAvailability,
        },
      }}
    >
      <LayoutSingleColumn className={css.pageRoot}>
        <LayoutWrapperTopbar>{topbar}</LayoutWrapperTopbar>
        <LayoutWrapperMain>
          <div className={css.contentWrapperForProductLayout}>
            <div className={css.mainColumnForProductLayout}>
              {currentListing.id ? (
                <ActionBarMaybe
                  className={css.actionBarForProductLayout}
                  isOwnListing={isOwnListing}
                  listing={currentListing}
                  editParams={{
                    id: listingId.uuid,
                    slug: listingSlug,
                    type: listingType,
                    tab: listingTab,
                  }}
                />
              ) : null}
              <SectionGallery
                listing={currentListing}
                variantPrefix={config.layout.listingImage.variantPrefix}
              />
              <div className={css.productMobileHeading}>
                <SectionHeading
                  priceTitle={priceTitle}
                  formattedPrice={formattedPrice}
                  richTitle={richTitle}
                  unitType={publicData?.unitType}
                  category={category}
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
                  showContactUser={showContactUser}
                  onContactUser={onContactUser}
                />
              </div>
              <SectionTextMaybe
                text={description}
                heading={intl.formatMessage(
                  { id: 'ListingPage.descriptionTitle' },
                  { listingTitle: richTitle }
                )}
              />
              <SectionDetailsMaybe
                publicData={publicData}
                metadata={metadata}
                listingConfig={listingConfig}
                intl={intl}
              />
              {listingConfig.listingExtendedData.reduce((pickedElements, config) => {
                const { key, schemaOptions, scope = 'public' } = config;
                const value =
                  scope === 'public'
                    ? publicData[key]
                    : scope === 'metadata'
                    ? metadata[key]
                    : null;
                const hasValue = value !== null;
                return hasValue && config.schemaType === SCHEMA_TYPE_MULTI_ENUM
                  ? [
                      ...pickedElements,
                      <SectionMultiEnumMaybe
                        key={key}
                        heading={config?.listingPageConfig?.label}
                        options={optionEntities(schemaOptions)}
                        selectedOptions={value}
                      />,
                    ]
                  : hasValue && config.schemaType === SCHEMA_TYPE_TEXT
                  ? [
                      ...pickedElements,
                      <SectionTextMaybe
                        key={key}
                        heading={config?.listingPageConfig?.label}
                        text={value}
                      />,
                    ]
                  : pickedElements;
              }, [])}

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
                isEnquiryModalOpen={isAuthenticated && enquiryModalOpen}
                onCloseEnquiryModal={() => setEnquiryModalOpen(false)}
                sendEnquiryError={sendEnquiryError}
                sendEnquiryInProgress={sendEnquiryInProgress}
                onSubmitEnquiry={onSubmitEnquiry}
                currentUser={currentUser}
                onManageDisableScrolling={onManageDisableScrolling}
              />
            </div>
            <div className={css.orderColumnForProductLayout}>
              <OrderPanel
                className={css.productOrderPanel}
                listing={currentListing}
                isOwnListing={isOwnListing}
                onSubmit={handleOrderSubmit}
                title={
                  <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
                }
                author={ensuredAuthor}
                onManageDisableScrolling={onManageDisableScrolling}
                onContactUser={onContactUser}
                monthlyTimeSlots={monthlyTimeSlots}
                onFetchTimeSlots={onFetchTimeSlots}
                onFetchTransactionLineItems={onFetchTransactionLineItems}
                lineItems={lineItems}
                fetchLineItemsInProgress={fetchLineItemsInProgress}
                fetchLineItemsError={fetchLineItemsError}
                marketplaceCurrency={config.currency}
                dayCountAvailableForBooking={config.stripe.dayCountAvailableForBooking}
              />
            </div>
          </div>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

ListingPageComponent.defaultProps = {
  currentUser: null,
  enquiryModalOpenForListingId: null,
  showListingError: null,
  reviews: [],
  fetchReviewsError: null,
  monthlyTimeSlots: null,
  sendEnquiryError: null,
  listingConfig: null,
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
  enquiryModalOpenForListingId: string,
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
  sendEnquiryInProgress: bool.isRequired,
  sendEnquiryError: propTypes.error,
  onSendEnquiry: func.isRequired,
  onInitializeCardPaymentData: func.isRequired,
  listingConfig: object,
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

  return (
    <ListingPageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      location={location}
      {...props}
    />
  );
};

const mapStateToProps = state => {
  const { isAuthenticated } = state.Auth;
  const {
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    sendEnquiryInProgress,
    sendEnquiryError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    enquiryModalOpenForListingId,
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
    enquiryModalOpenForListingId,
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    sendEnquiryInProgress,
    sendEnquiryError,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
  onFetchTransactionLineItems: params => dispatch(fetchTransactionLineItems(params)),
  onSendEnquiry: (listing, message) => dispatch(sendEnquiry(listing, message)),
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
