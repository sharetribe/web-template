import React, { useState } from 'react';
import {
  arrayOf,
  bool,
  func,
  object,
  oneOfType,
  shape,
  string,
} from 'prop-types';

// Import contexts and util modules
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { pathByRouteName } from '../../util/routes';
import {
  propTypes,
  LINE_ITEM_HOUR,
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
} from '../../util/types';
import { ensureTransaction } from '../../util/data';
import { createSlug } from '../../util/urlHelpers';
import { isTransactionInitiateListingNotFoundError } from '../../util/errors';
import {
  getProcess,
  isBookingProcessAlias,
} from '../../transactions/transaction';

// Import shared components
import { H3, H4, NamedLink, OrderBreakdown, Page } from '../../components';

import {
  bookingDatesMaybe,
  getBillingDetails,
  getFormattedTotalPrice,
  getShippingDetailsMaybe,
  getTransactionTypeData,
  processCheckoutWithoutPayment,
  setOrderPageInitialValues,
} from './CheckoutPageTransactionHelpers.js';
import { getErrorMessages } from './ErrorMessages';

import CustomTopbar from './CustomTopbar';
import SimpleOrderForm from './StripePaymentForm/SimpleOrderForm';
import DetailsSideCard from './DetailsSideCard';
import MobileListingImage from './MobileListingImage';
import MobileOrderBreakdown from './MobileOrderBreakdown';

import css from './CheckoutPage.module.css';

/**
 * Construct orderParams object using pageData from session storage, shipping details, and optional payment params.
 * Note: This is used for both speculate transition and real transition
 *       - Speculate transition is called, when the the component is mounted. It's used to test if the data can go through the API validation
 *       - Real transition is made, when the user submits the OrderForm.
 *
 * @param {Object} pageData data that's saved to session storage.
 * @param {Object} shippingDetails shipping address if applicable.
 * @param {Object} config app-wide configs. This contains hosted configs too.
 * @returns orderParams.
 */
const getOrderParams = (pageData, shippingDetails, config) => {
  const quantity = pageData.orderData?.quantity;
  const quantityMaybe = quantity ? { quantity } : {};
  const deliveryMethod = pageData.orderData?.deliveryMethod;
  const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};
  const hasHelmetFee = pageData.orderData?.helmetFee?.length > 0;

  const { listingType, unitType } =
    pageData?.listing?.attributes?.publicData || {};
  const protectedDataMaybe = {
    protectedData: {
      ...getTransactionTypeData(listingType, unitType, config),
      ...deliveryMethodMaybe,
      ...shippingDetails,
    },
  };

  // These are the order parameters for the first payment-related transition
  // which is either initiate-transition or initiate-transition-after-enquiry
  const orderParams = {
    listingId: pageData?.listing?.id,
    ...deliveryMethodMaybe,
    ...quantityMaybe,
    hasHelmetFee,
    ...bookingDatesMaybe(pageData.orderData?.bookingDates),
    ...protectedDataMaybe,
  };
  return orderParams;
};

const fetchSpeculatedTransactionIfNeeded = (
  orderParams,
  pageData,
  fetchSpeculatedTransaction
) => {
  const tx = pageData ? pageData.transaction : null;
  const pageDataListing = pageData.listing;
  const processName =
    tx?.attributes?.processName ||
    pageDataListing?.attributes?.publicData?.transactionProcessAlias?.split(
      '/'
    )[0];
  const process = processName ? getProcess(processName) : null;

  // If transaction has passed payment-pending state, speculated tx is not needed.
  const shouldFetchSpeculatedTransaction =
    !!pageData?.listing?.id && !!pageData.orderData && !!process;

  if (shouldFetchSpeculatedTransaction) {
    const processAlias =
      pageData.listing.attributes.publicData?.transactionProcessAlias;
    const transactionId = tx ? tx.id : null;
    const isInquiryInPaymentProcess =
      tx?.attributes?.lastTransition === process.transitions.INQUIRE;

    const requestTransition = isInquiryInPaymentProcess
      ? process.transitions.REQUEST_PAYMENT_AFTER_INQUIRY
      : process.transitions.REQUEST_PAYMENT;
    const isPrivileged = process.isPrivileged(requestTransition);

    fetchSpeculatedTransaction(
      orderParams,
      processAlias,
      transactionId,
      requestTransition,
      isPrivileged
    );
  }
};


/**
 * Load initial data for the page
 *
 * Since the data for the checkout is not passed in the URL (there
 * might be lots of options in the future), we must pass in the data
 * some other way. Currently the ListingPage sets the initial data
 * for the CheckoutPage's Redux store.
 *
 * For some cases (e.g. a refresh in the CheckoutPage), the Redux
 * store is empty. To handle that case, we store the received data
 * to window.sessionStorage and read it from there if no props from
 * the store exist.
 *
 * This function also sets of fetching the speculative transaction
 * based on this initial data.
 */
export const loadInitialData = ({
  pageData,
  fetchSpeculatedTransaction,
  config,
}) => {
  // Fetch speculated transaction for showing price in order breakdown
  // NOTE: if unit type is line-item/item, quantity needs to be added.
  // The way to pass it to checkout page is through pageData.orderData
  const shippingDetails = {};
  const orderParams = getOrderParams(pageData, shippingDetails, config);

  fetchSpeculatedTransactionIfNeeded(
    orderParams,
    pageData,
    fetchSpeculatedTransaction
  );
};

const handleSubmit = (values, process, props, submitting, setSubmitting) => {
  if (submitting) {
    return;
  }
  setSubmitting(true);
  console.log({ values });

  const {
    history,
    config,
    routeConfiguration,
    speculatedTransaction,
    currentUser,
    dispatch,
    onInitiateOrder,
    // Ine
    onSendMessage,
    //fin ine
    onSubmitCallback,
    pageData,
    setPageData,
    sessionStorageKey,
  } = props;
  const { message, formValues } = values;

  const requestPaymentParams = {
    pageData,
    speculatedTransaction,
    billingDetails: getBillingDetails(formValues),
    message,
    process,
    onInitiateOrder,
    //Ine
    onSendMessage,
    //fin Ine
    sessionStorageKey,
    setPageData,
  };

  const shippingDetails = getShippingDetailsMaybe(formValues);

  // These are the order parameters for the first payment-related transition
  // which is either initiate-transition or initiate-transition-after-enquiry
  const orderParams = getOrderParams(pageData, shippingDetails, config);

  // There are multiple XHR calls that needs to be made against the
  // Sharetribe Marketplace API on checkout with payments
  processCheckoutWithoutPayment(orderParams, requestPaymentParams)
    .then(response => {
      const { orderId, messageSuccess } = response;
      setSubmitting(false);

      const initialMessageFailedToTransaction = messageSuccess ? null : orderId;
      const orderDetailsPath = pathByRouteName(
        'OrderDetailsPage',
        routeConfiguration,
        {
          id: orderId.uuid,
        }
      );
      const initialValues = {
        initialMessageFailedToTransaction,
      };

      setOrderPageInitialValues(initialValues, routeConfiguration, dispatch);
      onSubmitCallback();
      history.push(orderDetailsPath);
    })
    .catch(err => {
      console.error(err);
      setSubmitting(false);
    });
};

export const CheckoutPageWithoutPayment = props => {
  const [submitting, setSubmitting] = useState(false);
  // Initialized stripe library is saved to state - if it's needed at some point here too.

  const {
    scrollingDisabled,
    speculateTransactionError,
    speculatedTransaction: speculatedTransactionMaybe,
    initiateOrderError,
    intl,
    currentUser,
    pageData,
    processName,
    listingTitle,
    title,
    config,
  } = props;

  // Since the listing data is already given from the ListingPage
  // and stored to handle refreshes, it might not have the possible
  // deleted or closed information in it. If the transaction
  // initiate or the speculative initiate fail due to the listing
  // being deleted or closed, we should dig the information from the
  // errors and not the listing data.
  const listingNotFound =
    isTransactionInitiateListingNotFoundError(speculateTransactionError) ||
    isTransactionInitiateListingNotFoundError(initiateOrderError);

  const { listing, transaction, orderData } = pageData;
  const existingTransaction = ensureTransaction(transaction);
  const speculatedTransaction = ensureTransaction(
    speculatedTransactionMaybe,
    {},
    null
  );

  // If existing transaction has line-items, it has gone through one of the request-payment transitions.
  // Otherwise, we try to rely on speculatedTransaction for order breakdown data.
  const tx =
    existingTransaction?.attributes?.lineItems?.length > 0
      ? existingTransaction
      : speculatedTransaction;
  const timeZone = listing?.attributes?.availabilityPlan?.timezone;
  const transactionProcessAlias =
    listing?.attributes?.publicData?.transactionProcessAlias;
  const unitType = listing?.attributes?.publicData?.unitType;
  const lineItemUnitType = `line-item/${unitType}`;
  const dateType =
    lineItemUnitType === LINE_ITEM_HOUR ? DATE_TYPE_DATETIME : DATE_TYPE_DATE;
  const txBookingMaybe = tx?.booking?.id
    ? { booking: tx.booking, dateType, timeZone }
    : {};

  // Show breakdown only when (speculated?) transaction is loaded
  // (i.e. it has an id and lineItems)
  const breakdown =
    tx.id && tx.attributes.lineItems?.length > 0 ? (
      <OrderBreakdown
        className={css.orderBreakdown}
        userRole="customer"
        transaction={tx}
        {...txBookingMaybe}
        currency={config.currency}
        marketplaceName={config.marketplaceName}
      />
    ) : null;

  const totalPrice =
    tx?.attributes?.lineItems?.length > 0
      ? getFormattedTotalPrice(tx, intl)
      : null;

  const process = processName ? getProcess(processName) : null;
  const transitions = process.transitions;

  // Allow showing page when currentUser is still being downloaded,
  // but show payment form only when user info is loaded.
  const showPaymentForm = !!(
    currentUser &&
    !listingNotFound &&
    !initiateOrderError &&
    !speculateTransactionError
  );

  const firstImage = listing?.images?.length > 0 ? listing.images[0] : null;

  const listingLink = (
    <NamedLink
      name="ListingPage"
      params={{ id: listing?.id?.uuid, slug: createSlug(listingTitle) }}
    >
      <FormattedMessage id="CheckoutPage.errorlistingLinkText" />
    </NamedLink>
  );

  const errorMessages = getErrorMessages(
    listingNotFound,
    initiateOrderError,
    null,
    null,
    speculateTransactionError,
    listingLink
  );

  const txTransitions = existingTransaction?.attributes?.transitions || [];
  const hasInquireTransition = txTransitions.find(
    tr => tr.transition === transitions.INQUIRE
  );
  const showInitialMessageInput = !hasInquireTransition;

  // Get first and last name of the current user and use it in the StripePaymentForm to autofill the name field
  const userName = currentUser?.attributes?.profile
    ? `${currentUser.attributes.profile.firstName} ${currentUser.attributes.profile.lastName}`
    : null;

  // If your marketplace works mostly in one country you can use initial values to select country automatically
  // e.g. {country: 'FI'}

  const initalValuesForStripePayment = {
    name: userName,
    recipientName: userName,
  };
  const askShippingDetails = orderData?.deliveryMethod === 'shipping';

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <CustomTopbar intl={intl} />
      <div className={css.contentContainer}>
        <MobileListingImage
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
        />
        <div className={css.orderFormContainer}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              {title}
            </H3>
            <H4 as="h2" className={css.detailsHeadingMobile}>
              <FormattedMessage
                id="CheckoutPage.listingTitle"
                values={{ listingTitle }}
              />
            </H4>
          </div>

          <MobileOrderBreakdown
            speculateTransactionErrorMessage={
              errorMessages.speculateTransactionErrorMessage
            }
            breakdown={breakdown}
          />

          <section className={css.paymentContainer}>
            {errorMessages.initiateOrderErrorMessage}
            {errorMessages.listingNotFoundErrorMessage}
            {errorMessages.speculateErrorMessage}
            {errorMessages.paymentExpiredMessage}

            {showPaymentForm ? (
              <SimpleOrderForm
                className={css.paymentForm}
                onSubmit={values =>
                  handleSubmit(
                    values,
                    process,
                    props,
                    submitting,
                    setSubmitting
                  )
                }
                inProgress={submitting}
                formId="CheckoutPagePaymentForm"
                authorDisplayName={
                  listing?.author?.attributes?.profile?.displayName
                }
                showInitialMessageInput={showInitialMessageInput}
                initialValues={initalValuesForStripePayment}
                initiateOrderError={initiateOrderError}
                askShippingDetails={askShippingDetails}
                showPickUplocation={orderData?.deliveryMethod === 'pickup'}
                listingLocation={listing?.attributes?.publicData?.location}
                totalPrice={totalPrice}
                locale={config.localization.locale}
                marketplaceName={config.marketplaceName}
                isBooking={isBookingProcessAlias(transactionProcessAlias)}
                isFuzzyLocation={config.maps.fuzzy.enabled}
              />
            ) : null}
          </section>
        </div>

        <DetailsSideCard
          listing={listing}
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
          speculateTransactionErrorMessage={
            errorMessages.speculateTransactionErrorMessage
          }
          isInquiryProcess={false}
          processName={processName}
          breakdown={breakdown}
          intl={intl}
        />
      </div>
    </Page>
  );
};

CheckoutPageWithoutPayment.defaultProps = {
  initiateOrderError: null,
  confirmPaymentError: null,
  listing: null,
  orderData: {},
  speculateTransactionError: null,
  speculatedTransaction: null,
  transaction: null,
  currentUser: null,
};

CheckoutPageWithoutPayment.propTypes = {
  scrollingDisabled: bool.isRequired,
  listing: propTypes.listing,
  orderData: object,
  fetchSpeculatedTransaction: func.isRequired,
  speculateTransactionInProgress: bool.isRequired,
  speculateTransactionError: propTypes.error,
  speculatedTransaction: propTypes.transaction,
  transaction: propTypes.transaction,
  currentUser: propTypes.currentUser,
  params: shape({
    id: string,
    slug: string,
  }).isRequired,
  onInitiateOrder: func.isRequired,
  // Ine
  onSendMessage: func.isRequired,
  // Fin Ine
  initiateOrderError: propTypes.error,

  // from connect
  dispatch: func.isRequired,

  // from useIntl
  intl: intlShape.isRequired,

  // from useConfiguration
  config: object.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,

  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
};

export default CheckoutPageWithoutPayment;

