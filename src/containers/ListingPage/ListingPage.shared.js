import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { types as sdkTypes } from '../../util/sdkLoader';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import { convertMoneyToNumber, formatMoney } from '../../util/currency';
import { timestampToDate } from '../../util/dates';
import { hasPermissionToInitiateTransactions, isUserAuthorized } from '../../util/userHelpers';
import { showErrorToast } from '../../util/toast'; // [SKYFARER]

import {
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  createSlug,
} from '../../util/urlHelpers';

import { Page, LayoutSingleColumn } from '../../components';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ListingPage.module.css';
import { rescheduleGoogleEvent, rescheduleRequest } from '../../util/api'; // [SKYFARER]

/**
 * This file contains shared functions from each ListingPage variants.
 */

const { UUID } = sdkTypes;

/**
 * Helper to get formattedPrice and priceTitle for SectionHeading component.
 * @param {Money} price listing's price
 * @param {String} marketplaceCurrency currency of the price (e.g. 'USD')
 * @param {Object} intl React Intl instance
 * @returns Object literal containing formattedPrice and priceTitle
 */
export const priceData = (price, marketplaceCurrency, intl) => {
  if (price && price.currency === marketplaceCurrency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: `(${price.currency})`,
      priceTitle: `Unsupported currency (${price.currency})`,
    };
  }
  return {};
};

/**
 * Converts Money object to number, which is needed for the search schema (for Google etc.)
 *
 * @param {Money} price
 * @returns {Money|null}
 */
export const priceForSchemaMaybe = price => {
  try {
    const schemaPrice = convertMoneyToNumber(price);
    return {
      price: schemaPrice.toFixed(2),
      priceCurrency: price.currency,
    };
  } catch (e) {
    return {};
  }
};

/**
 * Get category's label.
 *
 * @param {Array} categories array of category objects (key & label)
 * @param {String} value selected category value
 * @returns label for the selected value
 */
export const categoryLabel = (categories, value) => {
  const cat = categories.find(c => c.key === value);
  return cat ? cat.label : value;
};

/**
 * Filter listing images with correct custom image variant name.
 * Used for facebook, twitter and page schema images.
 *
 * @param {Listing} listing
 * @param {String} variantName
 * @returns correct image variant specified by variantName parameter.
 */
export const listingImages = (listing, variantName) =>
  (listing.images || [])
    .map(image => {
      const variants = image.attributes.variants;
      const variant = variants ? variants[variantName] : null;

      // deprecated
      // for backwards combatility only
      const sizes = image.attributes.sizes;
      const size = sizes ? sizes.find(i => i.name === variantName) : null;

      return variant || size;
    })
    .filter(variant => variant != null);

/**
 * Callback for the "contact" button on ListingPage to open inquiry modal.
 *
 * @param {Object} parameters all the info needed to open inquiry modal.
 */
export const handleContactUser = parameters => () => {
  const {
    history,
    params,
    currentUser,
    callSetInitialValues,
    location,
    routes,
    setInitialValues,
    setInquiryModalOpen,
  } = parameters;

  if (!currentUser) {
    const state = { from: `${location.pathname}${location.search}${location.hash}` };

    // We need to log in before showing the modal, but first we need to ensure
    // that modal does open when user is redirected back to this listingpage
    callSetInitialValues(setInitialValues, { inquiryModalOpenForListingId: params.id });

    // signup and return back to listingPage.
    history.push(createResourceLocatorString('SignupPage', routes, {}, {}), state);
  } else if (!isUserAuthorized(currentUser)) {
    // A user in pending-approval state can't contact the author (the same applies for a banned user)
    const pathParams = { missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL };
    history.push(createResourceLocatorString('NoAccessPage', routes, pathParams, {}));
  } else if (!hasPermissionToInitiateTransactions(currentUser)) {
    // A user in pending-approval state can't contact the author (the same applies for a banned user)
    const pathParams = { missingAccessRight: NO_ACCESS_PAGE_INITIATE_TRANSACTIONS };
    history.push(createResourceLocatorString('NoAccessPage', routes, pathParams, {}));
  } else {
    setInquiryModalOpen(true);
  }
};

/**
 * Callback for the inquiry modal to submit aka create inquiry transaction on ListingPage.
 * Note: this is for booking and purchase processes. Inquiry process is handled through handleSubmit.
 *
 * @param {Object} parameters all the info needed to create inquiry.
 */
export const handleSubmitInquiry = parameters => values => {
  const { history, params, getListing, onSendInquiry, routes, setInquiryModalOpen } = parameters;
  const listingId = new UUID(params.id);
  const listing = getListing(listingId);
  const { message } = values;

  onSendInquiry(listing, message.trim())
    .then(txId => {
      setInquiryModalOpen(false);

      // Redirect to OrderDetailsPage
      history.push(createResourceLocatorString('OrderDetailsPage', routes, { id: txId.uuid }, {}));
    })
    .catch(() => {
      // Ignore, error handling in duck file
    });
};

/* If the user is not logged in, 
we redirect them to the signup page, and otherwise we toggle the listing id in their favorites list.*/ 

export const handleToggleFavorites = parameters => (isFavorite, listingId) => {
  const { currentUser, routes, location, history } = parameters;

  // Use safe fallback for current location
  const currentLocation = location ? location.pathname : '/';
  const search = location?.search || '';
  const hash = location?.hash || '';

  // Redirect unauthenticated users to signup
  if (!currentUser) {
    const state = { from: currentLocation + search + hash };
    history.push(
      createResourceLocatorString('SignupPage', routes, {}, {}),
      state
    );
    return;
  }

  // Extract favorites safely
  const { params, onUpdateFavorites } = parameters;
  const profile = currentUser.attributes?.profile || {};
  const favorites = profile.privateData?.favorites || [];

  // Resolve a valid listing ID
  let resolvedListingId = null;

  if (listingId) {
    resolvedListingId = listingId;
  } else if (params?.id) {
    resolvedListingId = params.id;
  }

  if (!resolvedListingId) {
    console.error('❌ handleToggleFavorites: No valid listing ID found.', { listingId, params });
    return;
  }

  /*console.log('✅ handleToggleFavorites called with:', {
    currentUserId: currentUser.id?.uuid || currentUser.id,
    resolvedListingId,
    isFavorite,
    favorites,
  });*/

  let updatedFavorites;
  if (isFavorite) {
    // Remove from favorites
    updatedFavorites = favorites.filter(f => f !== resolvedListingId);
  } else {
    // Add to favorites (avoid duplicates)
    updatedFavorites = [...new Set([...favorites, resolvedListingId])];
  }

  const payload = {
    privateData: {
      favorites: updatedFavorites,
    },
  };

  onUpdateFavorites(payload);
};




/**
 * Handle order submit from OrderPanel.
 *
 * @param {Object} parameters all the info needed to redirect user to CheckoutPage.
 */
export const handleSubmit = parameters => async values => { // [SKYFARER MERGE: +async]
  const {
    history,
    params,
    currentUser,
    getListing,
    callSetInitialValues,
    onInitializeCardPaymentData,
    routes,
    sdk // [SKYFARER]
  } = parameters;
  const listingId = new UUID(params.id);
  const listing = getListing(listingId);

  const {
    bookingDates,
    bookingStartTime,
    bookingEndTime,
    bookingStartDate, // not relevant (omit)
    bookingEndDate, // not relevant (omit)
    priceVariantName, // relevant for bookings
    quantity: quantityRaw,
    seats: seatsRaw,
    deliveryMethod,
    ...otherOrderData
  } = values;

  const bookingMaybe = bookingDates
    ? {
        bookingDates: {
          bookingStart: bookingDates.startDate,
          bookingEnd: bookingDates.endDate,
        },
      }
    : bookingStartTime && bookingEndTime
    ? {
        bookingDates: {
          bookingStart: timestampToDate(bookingStartTime),
          bookingEnd: timestampToDate(bookingEndTime),
        },
      }
    : {};
  // priceVariantName is relevant for bookings
  const priceVariantNameMaybe = priceVariantName ? { priceVariantName } : {};
  const quantity = Number.parseInt(quantityRaw, 10);
  const quantityMaybe = Number.isInteger(quantity) ? { quantity } : {};
  const seats = Number.parseInt(seatsRaw, 10);
  const seatsMaybe = Number.isInteger(seats) ? { seats } : {};
  const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};

  const initialValues = {
    listing,
    orderData: {
      ...bookingMaybe,
      ...priceVariantNameMaybe,
      ...quantityMaybe,
      ...seatsMaybe,
      ...deliveryMethodMaybe,
      ...otherOrderData,
    },
    confirmPaymentError: null,
  };

  const saveToSessionStorage = !currentUser;

  // Customize checkout page state with current listing and selected orderData
  const { setInitialValues } = findRouteByRouteName('CheckoutPage', routes);

  callSetInitialValues(setInitialValues, initialValues, saveToSessionStorage);

  // Clear previous Stripe errors from store if there is any
  onInitializeCardPaymentData();

  // [SKYFARER]
  // Handle reschedule transition
  const queryParams = new URLSearchParams(window.location.search);
  const reschedule = queryParams.get('reschedule');
  const isProvider = currentUser?.id?.uuid === listing.author.id.uuid;
  const start = initialValues?.orderData?.bookingDates?.bookingStart;
  const end = initialValues?.orderData?.bookingDates?.bookingEnd;

  if (reschedule && !isProvider) {
    const { data: transaction } = await sdk.transactions.show({ id: new UUID(reschedule) });
    const request = transaction?.data?.attributes?.metadata?.rescheduleRequest;

    if (request) {
      showErrorToast('You have already requested a reschedule for this booking');
      return;
    }

    const result = await rescheduleRequest({ txId: reschedule, start, end });
    if (!result?.rescheduleRequest) {
      console.error(result);
      showErrorToast(result.data?.error || 'Error rescheduling booking');
      return;
    }

    return history.push(createResourceLocatorString('OrderDetailsPage', routes, { id: reschedule }, {}));
  }

  if (reschedule && isProvider) {
    try {
      const transition = 'transition/provider-reschedule';

      const { data: transaction } = await sdk.transactions.show({ id: new UUID(reschedule) });
      if (transaction?.data?.attributes?.metadata?.googleCalendarEventDetails) {
        try {
          rescheduleGoogleEvent({ txId: reschedule, startDateTimeOverride: start, endDateTimeOverride: end });
        } catch (error) {
          console.error(error);
          showErrorToast('Error rescheduling Google Calendar event: ' + error.message);
        }
      }

      const result = await sdk.transactions.transition({
        id: new UUID(reschedule),
        params: { bookingStart: start, bookingEnd: end },
        transition
      });

      if (result.status === 200) {
        history.push(createResourceLocatorString('SaleDetailsPage', routes, { id: reschedule }, {}));
      } else {
        console.error(result);
        showErrorToast(result.data?.data?.errors?.join(', ') || 'Error rescheduling booking');
      }
    } catch (error) {
      console.error(error);
      showErrorToast(error.message);
    }

    return;
  }
  // [/SKYFARER]

  // Redirect to CheckoutPage
  history.push(
    createResourceLocatorString(
      'CheckoutPage',
      routes,
      { id: listing.id.uuid, slug: createSlug(listing.attributes.title) },
      {}
    )
  );
};

/**
 * Create fallback views for the ListingPage: LoadingPage and ErrorPage.
 * The PlainPage is just a helper for them.
 */
const PlainPage = props => {
  const { title, topbar, scrollingDisabled, children } = props;
  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn topbar={topbar} footer={<FooterContainer />}>
        {children}
      </LayoutSingleColumn>
    </Page>
  );
};

export const ErrorPage = props => {
  const { topbar, scrollingDisabled, invalidListing, intl } = props;
  return (
    <PlainPage
      title={intl.formatMessage({
        id: 'ListingPage.errorLoadingListingTitle',
      })}
      topbar={topbar}
      scrollingDisabled={scrollingDisabled}
    >
      <p className={css.errorText}>
        {invalidListing ? (
          <FormattedMessage id="ListingPage.errorInvalidListingMessage" />
        ) : (
          <FormattedMessage id="ListingPage.errorLoadingListingMessage" />
        )}
      </p>
    </PlainPage>
  );
};

export const LoadingPage = props => {
  const { topbar, scrollingDisabled, intl } = props;
  return (
    <PlainPage
      title={intl.formatMessage({
        id: 'ListingPage.loadingListingTitle',
      })}
      topbar={topbar}
      scrollingDisabled={scrollingDisabled}
    >
      <p className={css.loadingText}>
        <FormattedMessage id="ListingPage.loadingListingMessage" />
      </p>
    </PlainPage>
  );
};
