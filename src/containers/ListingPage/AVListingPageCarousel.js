import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import classNames from 'classnames';

// Utils
import { FormattedMessage } from '../../util/reactIntl';
import { LISTING_STATE_CLOSED, propTypes } from '../../util/types';
import { OFFER, REQUEST } from '../../transactions/transaction';

// Global ducks (for Redux actions and thunks)
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

// Shared components
import {
  H2,
  H4,
  Page,
  Modal,
  NamedLink,
  OrderPanel,
  LayoutSingleColumn,
  AvatarMedium,
  SecondaryButton,
  IconChat,
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
  handleContactUser,
  handleSubmitInquiry,
  handleNavigateToMakeOfferPage,
  handleNavigateToRequestQuotePage,
  handleSubmit,
  priceForSchemaMaybe,
  getDerivedRenderData,
} from './ListingPage.shared';
import Notifications from './Notifications/Notifications';
import SectionReviews from './SectionReviews';
import SectionGallery from './SectionGallery';
import InquiryForm from './InquiryForm/InquiryForm';
import AVListingDetails from './AVListingDetails/AVListingDetails';
import ListingPageAccessWrapper from './ListingPageAccessWrapper';

import css from './ListingPage.module.css';
import avCss from './AVListingPageCarousel.module.css';

const MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE = 16;
const INQUIRY_MODAL_CONTACT_LINK = 'avInquiryModalContactUserLink';

// Locale-aware relative time ("hace 4 meses" / "4 months ago") for the publication date.
const RELATIVE_UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];
const formatRelativeTime = (date, locale) => {
  if (!date) return null;
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale || 'es', { numeric: 'auto' });
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return rtf.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return rtf.format(Math.round(seconds / 60), 'minute');
};

export const ListingPageComponent = props => {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(
    props.inquiryModalOpenForListingId === props.params.id
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    reviews = [],
    fetchReviewsError,
    sendInquiryInProgress,
    sendInquiryError,
    history,
    callSetInitialValues,
    onSendInquiry,
    onInitializeCardPaymentData,
    config,
    routeConfiguration,
    showOwnListingsOnly,
    ...restOfProps
  } = props;

  const derivedData = getDerivedRenderData({
    rawParams,
    getListing,
    getOwnListing,
    showOwnListingsOnly,
    currentUser,
    config,
    intl,
    location,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE,
    longWordClassName: css.longWord,
    payoutDetailsWarningClassName: css.payoutDetailsWarning,
  });
  const {
    listingConfig,
    listingId,
    isVariant,
    currentListing,
    listingSlug,
    params,
    listingPathParamType,
    listingTab,
    description,
    price,
    title,
    publicData,
    isOwnListing,
    showListingImage,
    processType,
    ensuredAuthor,
    payoutDetailsWarning,
    authorDisplayName,
    schemaTitle,
    facebookImages,
    twitterImages,
    schemaImages,
    productURL,
    availabilityMaybe,
    richTitle,
    noIndexMaybe,
    hasInvalidListingData,
  } = derivedData;

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

  if (hasInvalidListingData) {
    // Listing should always contain listingType, transactionProcessAlias and unitType)
    return (
      <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} invalidListing />
    );
  }
  const unitType = publicData.unitType;
  const isNegotiation = processType === 'negotiation';

  const commonParams = { params, history, routes: routeConfiguration };
  const onContactUser = handleContactUser({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    setInitialValues,
    location,
    setInquiryModalOpen,
  });
  const onSubmitInquiry = handleSubmitInquiry({
    ...commonParams,
    getListing,
    onSendInquiry,
    setInquiryModalOpen,
  });

  const handleOrderSubmit = values => {
    const isCurrentlyClosed = currentListing.attributes.state === LISTING_STATE_CLOSED;
    if (isOwnListing || isCurrentlyClosed) {
      window.scrollTo(0, 0);
    } else if (isNegotiation && unitType === REQUEST) {
      const onNavigateToMakeOfferPage = handleNavigateToMakeOfferPage({
        ...commonParams,
        getListing,
      });
      onNavigateToMakeOfferPage(values);
    } else if (isNegotiation && unitType === OFFER) {
      const onNavigateToRequestQuotePage = handleNavigateToRequestQuotePage({
        ...commonParams,
        getListing,
      });
      onNavigateToRequestQuotePage(values);
    } else {
      const onSubmit = handleSubmit({
        ...commonParams,
        currentUser,
        callSetInitialValues,
        getListing,
        onInitializeCardPaymentData,
      });
      onSubmit(values);
    }
  };

  const authorId = ensuredAuthor?.id?.uuid;
  const publishedRelative = formatRelativeTime(currentListing?.attributes?.createdAt, intl.locale);

  const orderTitle = <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />;

  const chatButton = (
    <SecondaryButton type="button" className={avCss.chatButton} onClick={() => onContactUser()}>
      <IconChat className={avCss.chatIcon} />
      <FormattedMessage id="ListingPage.chat" />
    </SecondaryButton>
  );

  // Rendered twice: inside the order panel (right column on desktop; inside the
  // modal on mobile) and inline below the gallery on mobile — so on mobile the
  // details are visible both below the image gallery and in the order modal.
  const renderListingDetails = () => (
    <AVListingDetails
      publicData={publicData}
      listingFieldConfigs={listingConfig.listingFields}
      categoryConfiguration={config.categoryConfiguration}
      description={description}
    />
  );

  const authorLine = (
    <div className={avCss.authorLine}>
      {authorId ? (
        <NamedLink className={avCss.authorLink} name="ProfilePage" params={{ id: authorId }}>
          <AvatarMedium user={ensuredAuthor} className={avCss.authorAvatar} disableProfileLink />
          <span className={avCss.authorName}>{authorDisplayName}</span>
        </NamedLink>
      ) : (
        <span className={avCss.authorName}>{authorDisplayName}</span>
      )}
      {publishedRelative ? (
        <span className={avCss.publishDate}>
          <FormattedMessage
            id="ListingPage.publishedRelative"
            values={{ relative: publishedRelative }}
          />
        </span>
      ) : null}
    </div>
  );

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      author={authorDisplayName}
      description={description}
      facebookImages={facebookImages}
      twitterImages={twitterImages}
      {...noIndexMaybe}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'Product',
        description: description,
        name: schemaTitle,
        image: schemaImages,
        offers: {
          '@type': 'Offer',
          url: productURL,
          ...priceForSchemaMaybe(price),
          ...availabilityMaybe,
        },
      }}
    >
      <LayoutSingleColumn className={css.pageRoot} topbar={topbar} footer={<FooterContainer />}>
        <div className={avCss.contentWrapper}>
          <div className={avCss.galleryColumn}>
            <div className={avCss.galleryBlock}>
              <Notifications
                mounted={mounted}
                listing={currentListing}
                isOwnListing={isOwnListing}
                currentUser={currentUser}
                className={css.actionBarForProductLayout}
                editParams={{
                  id: listingId.uuid,
                  slug: listingSlug,
                  type: listingPathParamType,
                  tab: listingTab,
                }}
              />
              {showListingImage && (
                <SectionGallery
                  listing={currentListing}
                  variantPrefix={config.layout.listingImage.variantPrefix}
                  thumbnailPosition="left"
                />
              )}
            </div>

            {/* Title + details shown beside the image on tablet (and below it on
                mobile); on desktop these live in the order panel instead. */}
            <div className={avCss.infoBlock}>
              <H2 as="h1" className={classNames(css.orderPanelTitle, avCss.infoTitle)}>
                {orderTitle}
              </H2>
              {renderListingDetails()}
            </div>
          </div>

          {/* Full-width row below the gallery/order-panel grid on desktop — keeps
              reviews out of the sticky gallery's containing block so the gallery
              can never end up "stuck" over reviews scrolling past it (see
              .reviewsBlock in AVListingPageCarousel.module.css). */}
          <div className={avCss.reviewsBlock}>
            <SectionReviews reviews={reviews} fetchReviewsError={fetchReviewsError} />
          </div>

          <div className={avCss.detailsColumn}>
            <OrderPanel
              className={classNames(css.productOrderPanel, avCss.orderPanel, {
                [css.imagesEnabled]: showListingImage,
              })}
              listing={currentListing}
              isOwnListing={isOwnListing}
              onSubmit={handleOrderSubmit}
              authorLink={
                <NamedLink
                  className={css.authorNameLink}
                  name={isVariant ? 'ListingPageVariant' : 'ListingPage'}
                  params={params}
                  to={{ hash: '#author' }}
                >
                  {authorDisplayName}
                </NamedLink>
              }
              title={orderTitle}
              titleDesktop={
                <H4 as="h1" className={css.orderPanelTitle}>
                  {orderTitle}
                </H4>
              }
              payoutDetailsWarning={payoutDetailsWarning}
              author={ensuredAuthor}
              onManageDisableScrolling={onManageDisableScrolling}
              onContactUser={onContactUser}
              hideAuthor
              detailsSlot={renderListingDetails()}
              secondaryCtaButton={chatButton}
              footerSlot={authorLine}
              {...restOfProps}
              validListingTypes={config.listing.listingTypes}
              marketplaceCurrency={config.currency}
              dayCountAvailableForBooking={config.stripe.dayCountAvailableForBooking}
              marketplaceName={config.marketplaceName}
              showListingImage={showListingImage}
            />
          </div>
        </div>

        <Modal
          id="AVListingPage.inquiry"
          contentClassName={css.inquiryModalContent}
          isOpen={isAuthenticated && inquiryModalOpen}
          onClose={() => setInquiryModalOpen(false)}
          usePortal
          onManageDisableScrolling={onManageDisableScrolling}
          focusElementId={INQUIRY_MODAL_CONTACT_LINK}
        >
          <InquiryForm
            className={css.inquiryForm}
            submitButtonWrapperClassName={css.inquirySubmitButtonWrapper}
            listingTitle={title}
            authorDisplayName={authorDisplayName}
            sendInquiryError={sendInquiryError}
            onSubmit={onSubmitInquiry}
            inProgress={sendInquiryInProgress}
          />
        </Modal>
      </LayoutSingleColumn>
    </Page>
  );
};

/**
 * The AV redesigned ListingPage (carousel layout).
 *
 * @component
 * @param {Object} props - see ListingPageCarousel for the full prop contract; this
 *   container reuses the same Redux wiring and shared data helpers.
 * @returns {JSX.Element} listing page component
 */
const ListingPage = props => {
  const dispatch = useDispatch();
  const store = useStore();

  const { isAuthenticated } = useSelector(state => state.auth);
  const {
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    timeSlotsForDate,
    sendInquiryInProgress,
    sendInquiryError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    inquiryModalOpenForListingId,
  } = useSelector(state => state.ListingPage);
  const currentUser = useSelector(state => state.user?.currentUser);
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const getListing = useCallback(
    id => {
      const state = store.getState();
      const ref = { id, type: 'listing' };
      const listings = getMarketplaceEntities(state, [ref]);
      return listings.length === 1 ? listings[0] : null;
    },
    [store]
  );
  const getOwnListing = useCallback(
    id => {
      const state = store.getState();
      const ref = { id, type: 'ownListing' };
      const listings = getMarketplaceEntities(state, [ref]);
      return listings.length === 1 ? listings[0] : null;
    },
    [store]
  );

  const onManageDisableScrolling = useCallback(
    (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    [dispatch]
  );
  const callSetInitialValues = useCallback(
    (setInitialValuesFn, values, saveToSessionStorage) =>
      dispatch(setInitialValuesFn(values, saveToSessionStorage)),
    [dispatch]
  );
  const onFetchTransactionLineItems = useCallback(
    params => dispatch(fetchTransactionLineItems(params)),
    [dispatch]
  );
  const onSendInquiry = useCallback((listing, message) => dispatch(sendInquiry(listing, message)), [
    dispatch,
  ]);
  const onInitializeCardPaymentData = useCallback(() => dispatch(initializeCardPaymentData()), [
    dispatch,
  ]);
  const onFetchTimeSlots = useCallback(
    (listingId, start, end, timeZone, options) =>
      dispatch(fetchTimeSlots(listingId, start, end, timeZone, options)),
    [dispatch]
  );

  return (
    <ListingPageAccessWrapper
      {...props}
      PageComponent={ListingPageComponent}
      isAuthenticated={isAuthenticated}
      currentUser={currentUser}
      getListing={getListing}
      getOwnListing={getOwnListing}
      scrollingDisabled={scrollingDisabled}
      inquiryModalOpenForListingId={inquiryModalOpenForListingId}
      showListingError={showListingError}
      reviews={reviews}
      fetchReviewsError={fetchReviewsError}
      monthlyTimeSlots={monthlyTimeSlots}
      timeSlotsForDate={timeSlotsForDate}
      lineItems={lineItems}
      fetchLineItemsInProgress={fetchLineItemsInProgress}
      fetchLineItemsError={fetchLineItemsError}
      sendInquiryInProgress={sendInquiryInProgress}
      sendInquiryError={sendInquiryError}
      onManageDisableScrolling={onManageDisableScrolling}
      callSetInitialValues={callSetInitialValues}
      onFetchTransactionLineItems={onFetchTransactionLineItems}
      onSendInquiry={onSendInquiry}
      onInitializeCardPaymentData={onInitializeCardPaymentData}
      onFetchTimeSlots={onFetchTimeSlots}
    />
  );
};

export default ListingPage;
