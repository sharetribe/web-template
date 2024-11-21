import React from 'react';
import { convertMoneyToNumber, formatMoney } from '../../util/currency';
import { timestampToDate } from '../../util/dates';
import { FormattedMessage } from '../../util/reactIntl';
import {
  createResourceLocatorString,
  findRouteByRouteName,
  pathByRouteName,
} from '../../util/routes';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  createSlug,
} from '../../util/urlHelpers';
import { hasPermissionToInitiateTransactions, isUserAuthorized } from '../../util/userHelpers';

import { LayoutSingleColumn, Page } from '../../components';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { getProcess } from '../../transactions/transaction';
import { getTransactionTypeData } from '../CheckoutPage/CheckoutPageTransactionHelpers';
import css from './ListingPage.module.css';
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

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
export const priceForSchemaMaybe = (price, intl) => {
  try {
    const schemaPrice = convertMoneyToNumber(price);
    return schemaPrice
      ? {
          price: intl.formatNumber(schemaPrice, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          priceCurrency: price.currency,
        }
      : {};
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

/**
 * Handle order submit from OrderPanel.
 *
 * @param {Object} parameters all the info needed to redirect user to CheckoutPage.
 */
export const handleSubmit = parameters => values => {
  const {
    history,
    params,
    currentUser,
    getListing,
    callSetInitialValues,
    onInitializeCardPaymentData,
    routes,
  } = parameters;

  const listingId = new UUID(params.id);
  const listing = getListing(listingId);

  const {
    bookingDates,
    bookingStartTime,
    bookingEndTime,
    bookingStartDate, // not relevant (omit)
    bookingEndDate, // not relevant (omit)
    quantity: quantityRaw,
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
  const quantity = Number.parseInt(quantityRaw, 10);
  const quantityMaybe = Number.isInteger(quantity) ? { quantity } : {};
  const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};

  const initialValues = {
    listing,
    orderData: {
      ...bookingMaybe,
      ...quantityMaybe,
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

export const handleSubmitCheckoutPageWithInquiry = props => values => {
  const {
    history,
    config,
    routes,
    pageData,
    processName,
    onInquiryWithoutPayment,
    onSubmitCallback,
    onCreateSellerListing,
  } = props;

  const { message, offerPrice } = values;
  const { listingType, transactionProcessAlias, unitType, location } =
    pageData?.listing?.attributes?.publicData || {};

  const process = processName ? getProcess(processName) : null;
  const transitions = process.transitions;
  const transition = transitions.INQUIRE_WITHOUT_PAYMENT;

  // These are the inquiry parameters for the (one and only) transition
  const inquiryParams = {
    listingId: pageData?.listing?.id,
    protectedData: {
      inquiryMessage: message,
      offerPrice: {
        currency: offerPrice.currency,
        amount: offerPrice.amount,
      },
      ...getTransactionTypeData(listingType, unitType, config),
    },
  };

  // This makes a single transition directly to the API endpoint
  // (unlike in the payment-related processes, where call is proxied through the server to make privileged transition)
  onInquiryWithoutPayment(inquiryParams, transactionProcessAlias, transition)
    .then(transactionId => {
      // setSubmitting(false);
      onSubmitCallback();
      const { title, geolocation } = pageData?.listing.attributes || {};
      const createParams = {
        title: title,
        description: message,
        geolocation: geolocation,
        price: new Money(offerPrice.amount, offerPrice.currency),
        availabilityPlan: {
          entries: [],
          timezone: 'Etc/UTC',
          type: 'availability-plan/time',
        },
        publicData: {
          isOffer: true,
          transactionProcessAlias: 'default-purchase/release-1',
          listingType: 'booking',
          unitType: 'item',
          linkedListing: pageData?.listing?.id.uuid,
        },
      };
      const queryParams = {
        expand: true,
        include: ['author', 'images', 'currentStock'],
      };
      onCreateSellerListing(createParams, queryParams);
      // {
      //   "id": { "_sdkType": "UUID", "uuid": "673c3d86-527a-4ace-80d9-b27794060205" },
      //   "type": "listing",
      //   "attributes": {
      //     "title": "test3",
      //     "description": "dsadddd",
      //     "publicData": {
      //       "location": { "address": "Berlin, Germany", "building": "" },
      //       "listingType": "progetto",
      //       "project_type": "di-persona",
      //       "selectedDate": "Thu Nov 21 2024 00:00:00 GMT+0800 (Malaysia Time)",
      //       "selectedOption": "Alla data",
      //       "transactionProcessAlias": "default-inquiry/release-1",
      //       "unitType": "inquiry"
      //     },
      //     "deleted": false,
      //     "geolocation": { "_sdkType": "LatLng", "lat": 52.520008, "lng": 13.404954 },
      //     "state": "published",
      //     "price": { "_sdkType": "Money", "amount": 2200, "currency": "EUR" },
      //     "createdAt": "2024-11-19T07:25:58.225Z",
      //     "availabilityPlan": {
      //       "type": "availability-plan/time",
      //       "timezone": "Etc/UTC"
      //     },
      //     "metadata": {}
      //   },
      //   "images": [
      //     {
      //       "id": {
      //         "_sdkType": "UUID",
      //         "uuid": "673c3d97-5a46-44b4-bdde-ad36ff900ccc"
      //       },
      //       "type": "image",
      //       "attributes": {
      //         "variants": {
      //           "listing-card-6x": {
      //             "height": 1800,
      //             "width": 2400,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&crop=edges&fit=crop&h=1800&w=2400&s=a11e31a563883de4fdecd154b3ef46ec",
      //             "name": "listing-card-6x"
      //           },
      //           "scaled-small": {
      //             "height": 167,
      //             "width": 320,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&fit=clip&h=320&w=320&s=553d195d5ed727615a8bae97237f8963",
      //             "name": "scaled-small"
      //           },
      //           "square-small2x": {
      //             "height": 480,
      //             "width": 480,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&crop=edges&fit=crop&h=480&w=480&s=b85a4fc135355e345e883196f1aeef51",
      //             "name": "square-small2x"
      //           },
      //           "facebook": {
      //             "height": 630,
      //             "width": 1200,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&crop=edges&fit=crop&h=630&w=1200&s=07e02cecb7a9b35d9685d15d84620fa2",
      //             "name": "facebook"
      //           },
      //           "scaled-medium": {
      //             "height": 392,
      //             "width": 750,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&fit=clip&h=750&w=750&s=8cd266b4655e6fe0bb1ec8dd4d395fca",
      //             "name": "scaled-medium"
      //           },
      //           "twitter": {
      //             "height": 314,
      //             "width": 600,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&crop=edges&fit=crop&h=314&w=600&s=f4cd9fb81439b6f76fb7cc1f50d4c275",
      //             "name": "twitter"
      //           },
      //           "listing-card": {
      //             "height": 300,
      //             "width": 400,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&crop=edges&fit=crop&h=300&w=400&s=4748fd06f61336ef8ef0ae5a3f311f19",
      //             "name": "listing-card"
      //           },
      //           "square-small": {
      //             "height": 240,
      //             "width": 240,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&crop=edges&fit=crop&h=240&w=240&s=5f0cd73b5c6377e7f4137afe893d43aa",
      //             "name": "square-small"
      //           },
      //           "scaled-xlarge": {
      //             "height": 1256,
      //             "width": 2400,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&fit=clip&h=2400&w=2400&s=35a549771d79b3f5a8b9ffa03fb93128",
      //             "name": "scaled-xlarge"
      //           },
      //           "listing-card-4x": {
      //             "height": 1200,
      //             "width": 1600,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&crop=edges&fit=crop&h=1200&w=1600&s=51ba91bf845432590e6faadf5399976e",
      //             "name": "listing-card-4x"
      //           },
      //           "scaled-large": {
      //             "height": 535,
      //             "width": 1024,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&fit=clip&h=1024&w=1024&s=f39a23c534dbea51126bc79696e12334",
      //             "name": "scaled-large"
      //           },
      //           "listing-card-2x": {
      //             "height": 600,
      //             "width": 800,
      //             "url": "https://sharetribe.imgix.net/6707c4bd-9f34-4d22-a80e-87e6700f05da/673c3d97-5a46-44b4-bdde-ad36ff900ccc?auto=format&crop=edges&fit=crop&h=600&w=800&s=98a3499eb97ee4683eefc1b16ff0828e",
      //             "name": "listing-card-2x"
      //           }
      //         }
      //       }
      //     }
      //   ],
      //   "author": {
      //     "id": {
      //       "_sdkType": "UUID",
      //       "uuid": "673ad700-b867-4119-a643-58748ef923e0"
      //     },
      //     "type": "user",
      //     "attributes": {
      //       "profile": {
      //         "abbreviatedName": "ap",
      //         "displayName": "av p",
      //         "bio": null,
      //         "publicData": {
      //           "interesse": ["inserzionista", "professionista"],
      //           "userType": "utente"
      //         },
      //         "metadata": {}
      //       },
      //       "banned": false,
      //       "deleted": false,
      //       "createdAt": "2024-11-18T05:56:17.199Z",
      //       "state": "active"
      //     },
      //     "profileImage": null
      //   },
      //   "currentStock": null
      // }

      const orderDetailsPath = pathByRouteName('OrderDetailsPage', routes, {
        id: transactionId.uuid,
      });
      history.push(orderDetailsPath);
    })
    .catch(err => {
      console.error(err);
      // setSubmitting(false);
    });
};

export const handleCustomSubmit = parameters => values => {
  const {
    history,
    params,
    currentUser,
    callSetInitialValues,
    onInitializeCardPaymentData,
    routes,
    listing,
  } = parameters;

  const listingId = new UUID(params.id);
  const {
    bookingDates,
    bookingStartTime,
    bookingEndTime,
    bookingStartDate, // not relevant (omit)
    bookingEndDate, // not relevant (omit)
    quantity: quantityRaw,
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
  const quantity = Number.parseInt(quantityRaw, 10);
  const quantityMaybe = Number.isInteger(quantity) ? { quantity } : {};
  const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};

  const initialValues = {
    listing,
    orderData: {
      ...bookingMaybe,
      ...quantityMaybe,
      ...deliveryMethodMaybe,
      ...otherOrderData,
    },
    confirmPaymentError: null,
  };

  console.log(initialValues);
  const saveToSessionStorage = !currentUser;

  // Customize checkout page state with current listing and selected orderData
  const { setInitialValues } = findRouteByRouteName('CheckoutPage', routes);

  callSetInitialValues(setInitialValues, initialValues, saveToSessionStorage);

  // Clear previous Stripe errors from store if there is any
  onInitializeCardPaymentData();

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
