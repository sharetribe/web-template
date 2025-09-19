/**
 * Note: This form is using card from Stripe Elements https://stripe.com/docs/stripe-js#elements
 * Card is not a Final Form field so it's not available trough Final Form.
 * It's also handled separately in handleSubmit function.
 */
import React, { useState, useRef } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import { FormattedMessage, injectIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { ensurePaymentMethodCard } from '../../../util/data';

import {
  Heading,
  Form,
  PrimaryButton,
  FieldCheckbox,
  FieldTextInput,
  IconSpinner,
  SavedCardDetails,
  StripePaymentAddress,
} from '../../../components';

import ShippingDetails from '../ShippingDetails/ShippingDetails';
import AddressForm from '../../../components/AddressForm/AddressForm';

import css from './StripePaymentForm.module.css';

const ADDR_ENABLED = process.env.REACT_APP_CHECKOUT_ADDR_ENABLED === 'true';

/**
 * Translate a Stripe API error object.
 *
 * To keep up with possible keys from the Stripe API, see:
 *
 * https://stripe.com/docs/api#errors
 *
 * Note that at least at moment, the above link doesn't list all the
 * error codes that the API returns.
 *
 * @param {Object} intl - react-intl object from injectIntl
 * @param {Object} stripeError - error object from Stripe API
 *
 * @return {String} translation message for the specific Stripe error,
 * or the given error message (not translated) if the specific error
 * type/code is not defined in the translations
 *
 */
const stripeErrorTranslation = (intl, stripeError) => {
  const { message, code, type } = stripeError;

  if (!code || !type) {
    // Not a proper Stripe error object
    return intl.formatMessage({ id: 'StripePaymentForm.genericError' });
  }

  const translationId =
    type === 'validation_error'
      ? `StripePaymentForm.stripe.validation_error.${code}`
      : `StripePaymentForm.stripe.${type}`;

  return intl.formatMessage({
    id: translationId,
    defaultMessage: message,
  });
};

const stripeElementsOptions = {
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css?family=Inter',
    },
  ],
};

// card (being a Stripe Elements component), can have own styling passed to it.
// However, its internal width-calculation seems to break if font-size is too big
// compared to component's own width.
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const cardStyles = {
  base: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", Helvetica, Arial, sans-serif',
    fontSize: isMobile ? '14px' : '16px',
    fontSmoothing: 'antialiased',
    lineHeight: '24px',
    letterSpacing: '-0.1px',
    color: '#4A4A4A',
    '::placeholder': {
      color: '#B2B2B2',
    },
  },
};

const OneTimePaymentWithCardElement = props => {
  const {
    cardClasses,
    formId,
    hasCardError,
    error,
    label,
    intl,
    marketplaceName,
  } = props;
  const stripe = useStripe();
  const elements = useElements();
  
  const labelText =
    label || intl.formatMessage({ id: 'StripePaymentForm.saveAfterOnetimePayment' });
  
  console.log('[StripeForm] render start');
  
  if (!stripe || !elements) {
    return <div>Initializing payment form…</div>;
  }
  
  return (
    <React.Fragment>
      <label className={css.paymentLabel} htmlFor={`${formId}-card`}>
        <FormattedMessage id="StripePaymentForm.paymentCardDetails" />
      </label>
      <div className={cardClasses}>
        <CardElement
          id={`${formId}-card`}
          onReady={() => console.log('[StripeForm] CardElement ready')}
          onChange={(e) => console.log('[StripeForm] change', {complete: e.complete, empty: e.empty})}
        />
      </div>
      {hasCardError ? <span className={css.error}>{error}</span> : null}
      <div className={css.saveForLaterUse}>
        <FieldCheckbox
          className={css.saveForLaterUseCheckbox}
          textClassName={css.saveForLaterUseLabel}
          id="saveAfterOnetimePayment"
          name="saveAfterOnetimePayment"
          label={labelText}
          value="saveAfterOnetimePayment"
          useSuccessColor
        />
        <span className={css.saveForLaterUseLegalInfo}>
          <FormattedMessage
            id="StripePaymentForm.saveforLaterUseLegalInfo"
            values={{ marketplaceName }}
          />
        </span>
      </div>
    </React.Fragment>
  );
};

const PaymentMethodSelector = props => {
  const {
    cardClasses,
    formId,
    changePaymentMethod,
    defaultPaymentMethod,
    hasCardError,
    error,
    paymentMethod,
    intl,
    marketplaceName,
  } = props;
  const last4Digits = defaultPaymentMethod.attributes.card.last4Digits;
  const labelText = intl.formatMessage(
    { id: 'StripePaymentForm.replaceAfterOnetimePayment' },
    { last4Digits }
  );

  return (
    <React.Fragment>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="StripePaymentForm.payWithHeading" />
      </Heading>
      <SavedCardDetails
        className={css.paymentMethodSelector}
        card={defaultPaymentMethod.attributes.card}
        onChange={changePaymentMethod}
      />
      {paymentMethod === 'replaceCard' ? (
        <OneTimePaymentWithCardElement
          cardClasses={cardClasses}
          formId={formId}
          hasCardError={hasCardError}
          error={error}
          label={labelText}
          intl={intl}
          marketplaceName={marketplaceName}
        />
      ) : null}
    </React.Fragment>
  );
};

const getPaymentMethod = (selectedPaymentMethod, hasDefaultPaymentMethod) => {
  return selectedPaymentMethod == null && hasDefaultPaymentMethod
    ? 'defaultCard'
    : selectedPaymentMethod == null
    ? 'onetimeCardPayment'
    : selectedPaymentMethod;
};

// Should we show onetime payment fields and does StripeElements card need attention
const checkOnetimePaymentFields = (
  cardValueValid,
  selectedPaymentMethod,
  hasDefaultPaymentMethod,
  hasHandledCardPayment
) => {
  const useDefaultPaymentMethod =
    selectedPaymentMethod === 'defaultCard' && hasDefaultPaymentMethod;
  // Billing details are known if we have already handled card payment or existing default payment method is used.
  const billingDetailsKnown = hasHandledCardPayment || useDefaultPaymentMethod;

  // If onetime payment is used, check that the StripeElements card has valid value.
  const oneTimePaymentMethods = ['onetimeCardPayment', 'replaceCard'];
  const useOnetimePaymentMethod = oneTimePaymentMethods.includes(selectedPaymentMethod);
  const onetimePaymentNeedsAttention =
    !billingDetailsKnown && !(useOnetimePaymentMethod && cardValueValid);

  return {
    onetimePaymentNeedsAttention,
    showOnetimePaymentFields: useOnetimePaymentMethod,
  };
};

const LocationOrShippingDetails = props => {
  const {
    askShippingDetails,
    showPickUplocation,
    listingLocation,
    formApi,
    locale,
    isBooking,
    isFuzzyLocation,
    intl,
  } = props;

  const locationDetails = listingLocation?.building
    ? `${listingLocation.building}, ${listingLocation.address}`
    : listingLocation?.address
    ? listingLocation.address
    : intl.formatMessage({ id: 'StripePaymentForm.locationUnknown' });

  return askShippingDetails ? (
    <ShippingDetails intl={intl} formApi={formApi} locale={locale} />
  ) : !isBooking && showPickUplocation ? (
    <div className={css.locationWrapper}>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="StripePaymentForm.pickupDetailsTitle" />
      </Heading>
      <p className={css.locationDetails}>{locationDetails}</p>
    </div>
  ) : isBooking && !isFuzzyLocation ? (
    <div className={css.locationWrapper}>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="StripePaymentForm.locationDetailsTitle" />
      </Heading>
      <p className={css.locationDetails}>{locationDetails}</p>
    </div>
  ) : null;
};

const initialState = {
  error: null,
  cardValueValid: false,
  // The mode can be 'onetimePayment', 'defaultCard', or 'replaceCard'
  // Check SavedCardDetails component for more information
  paymentMethod: null,
};

/**
 * Payment form that asks for credit card info using Stripe Elements.
 *
 * When the card is valid and the user submits the form, a request is
 * sent to the Stripe API to handle payment. `stripe.confirmCardPayment`
 * may ask more details from cardholder if 3D security steps are needed.
 *
 * See: https://stripe.com/docs/payments/payment-intents
 *      https://stripe.com/docs/elements
 *
 * @component
 * @param {Object} props
 * @param {string} props.className - The class name for the payment form
 * @param {string} props.rootClassName - The root class that overrides the default class for the payment form
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {boolean} props.loadingData - Whether the data is loading
 * @param {propTypes.error} props.initiateOrderError - The error that occurs when initiating the order
 * @param {propTypes.error} props.confirmCardPaymentError - The error that occurs when confirming the card payment
 * @param {propTypes.error} props.confirmPaymentError - The error that occurs when confirming the payment
 * @param {string} props.formId - The form ID
 * @param {Function} props.onSubmit - The function to call when the form is submitted
 * @param {string} props.authorDisplayName - The author display name
 * @param {boolean} props.showInitialMessageInput - Whether to show the initial message input
 * @param {string} props.stripePublishableKey - The Stripe publishable key
 * @param {Function} props.onStripeInitialized - The function to call when Stripe is initialized
 * @param {boolean} props.hasHandledCardPayment - Whether the card payment has been handled
 * @param {Object} props.defaultPaymentMethod - The default payment method
 * @param {boolean} props.askShippingDetails - Whether to ask for shipping details
 * @param {boolean} props.showPickUplocation - Whether to show the pickup location
 * @param {string} props.totalPrice - The total price
 * @param {string} props.locale - The locale
 * @param {Object} props.listingLocation - The listing location
 * @param {Object} props.listingLocation.building - The building
 * @param {Object} props.listingLocation.address - The address
 * @param {boolean} props.isBooking - Whether the booking is in progress
 * @param {boolean} props.isFuzzyLocation - Whether the location is fuzzy
 * @param {Object} props.intl - The intl object
 */
function StripePaymentForm(props) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [state, setState] = useState(initialState);
  const finalFormAPI = useRef(null);

  console.log('[StripeForm] render start');

  const updateBillingDetailsToMatchShippingAddress = (shouldFill) => {
    const formApi = finalFormAPI.current;
    const values = formApi?.getState()?.values || {};
    if (formApi) {
      formApi.batch(() => {
        formApi.change('name', shouldFill ? values.recipientName : '');
        formApi.change('addressLine1', shouldFill ? values.recipientAddressLine1 : '');
        formApi.change('addressLine2', shouldFill ? values.recipientAddressLine2 : '');
        formApi.change('postal', shouldFill ? values.recipientPostal : '');
        formApi.change('city', shouldFill ? values.recipientCity : '');
        formApi.change('state', shouldFill ? values.recipientState : '');
        formApi.change('country', shouldFill ? values.recipientCountry : '');
      });
    }
  };

  const changePaymentMethod = (changedTo) => {
    setState(prev => ({ ...prev, paymentMethod: changedTo }));
    if (changedTo === 'defaultCard' && finalFormAPI.current) {
      finalFormAPI.current.change('sameAddressCheckbox', undefined);
    } else if (changedTo === 'replaceCard' && finalFormAPI.current) {
      finalFormAPI.current.change('sameAddressCheckbox', ['sameAddress']);
      updateBillingDetailsToMatchShippingAddress(true);
    }
  };

  const handleSubmit = async (values) => {
    const {
      onSubmit,
      inProgress,
      formId,
      hasHandledCardPayment,
      defaultPaymentMethod,
    } = props;
    const { initialMessage } = values;
    const { cardValueValid, paymentMethod } = state;
    const hasDefaultPaymentMethod = defaultPaymentMethod?.id;
    const selectedPaymentMethod = getPaymentMethod(paymentMethod, hasDefaultPaymentMethod);
    const { onetimePaymentNeedsAttention } = checkOnetimePaymentFields(
      cardValueValid,
      selectedPaymentMethod,
      hasDefaultPaymentMethod,
      hasHandledCardPayment
    );

    if (inProgress || onetimePaymentNeedsAttention) {
      // Already submitting or card value incomplete/invalid
      return;
    }

    if (!stripe || !elements) {
      console.warn('[StripeForm] Stripe/Elements not ready yet');
      return;
    }
    
    const card = elements.getElement(CardElement);
    if (!card) {
      console.error('[StripeForm] CardElement missing at submit');
      return;
    }

    const params = {
      message: initialMessage ? initialMessage.trim() : null,
      card: card,
      stripe: stripe,
      elements: elements,
      formId,
      formValues: values,
      paymentMethod: getPaymentMethod(
        paymentMethod,
        ensurePaymentMethodCard(defaultPaymentMethod).id
      ),
    };
    onSubmit(params);
  };

  const paymentForm = (formRenderProps) => {
    const {
      className,
      rootClassName,
      inProgress: submitInProgress,
      loadingData,
      formId,
      authorDisplayName,
      showInitialMessageInput,
      intl,
      initiateOrderError,
      confirmCardPaymentError,
      confirmPaymentError,
      invalid,
      handleSubmit,
      form: formApi,
      hasHandledCardPayment,
      defaultPaymentMethod,
      listingLocation,
      askShippingDetails,
      showPickUplocation,
      totalPrice,
      locale,
      stripePublishableKey,
      marketplaceName,
      isBooking,
      isFuzzyLocation,
      values,
    } = formRenderProps;

    finalFormAPI.current = formApi;

    const ensuredDefaultPaymentMethod = ensurePaymentMethodCard(defaultPaymentMethod);
    const billingDetailsNeeded = !(hasHandledCardPayment || confirmPaymentError);

    const { cardValueValid, paymentMethod } = state;
    const hasDefaultPaymentMethod = ensuredDefaultPaymentMethod.id;
    const selectedPaymentMethod = getPaymentMethod(paymentMethod, hasDefaultPaymentMethod);
    const { onetimePaymentNeedsAttention, showOnetimePaymentFields } = checkOnetimePaymentFields(
      cardValueValid,
      selectedPaymentMethod,
      hasDefaultPaymentMethod,
      hasHandledCardPayment
    );

    const submitDisabled = invalid || onetimePaymentNeedsAttention || submitInProgress;
    const hasCardError = state.error && !submitInProgress;
    const hasPaymentErrors = confirmCardPaymentError || confirmPaymentError;
    const classes = classNames(rootClassName || css.root, className);
    const cardClasses = classNames(css.card, {
      [css.cardSuccess]: state.cardValueValid,
      [css.cardError]: hasCardError,
    });

    // Note: totalPrice might not be available initially
    // when speculateTransaction call is in progress.
    const totalPriceMaybe = totalPrice || '';

    // TODO: confirmCardPayment can create all kinds of errors.
    // Currently, we provide translation support for one:
    // https://stripe.com/docs/error-codes
    const piAuthenticationFailure = 'payment_intent_authentication_failure';
    const paymentErrorMessage =
      confirmCardPaymentError && confirmCardPaymentError.code === piAuthenticationFailure
        ? intl.formatMessage({ id: 'StripePaymentForm.confirmCardPaymentError' })
        : confirmCardPaymentError
        ? confirmCardPaymentError.message
        : confirmPaymentError
        ? intl.formatMessage({ id: 'StripePaymentForm.confirmPaymentError' })
        : intl.formatMessage({ id: 'StripePaymentForm.genericError' });

    const billingDetailsNameLabel = intl.formatMessage({
      id: 'StripePaymentForm.billingDetailsNameLabel',
    });

    const billingDetailsNamePlaceholder = intl.formatMessage({
      id: 'StripePaymentForm.billingDetailsNamePlaceholder',
    });

    const messagePlaceholder = intl.formatMessage(
      { id: 'StripePaymentForm.messagePlaceholder' },
      { name: authorDisplayName }
    );

    const messageOptionalText = intl.formatMessage({
      id: 'StripePaymentForm.messageOptionalText',
    });

    const initialMessageLabel = intl.formatMessage(
      { id: 'StripePaymentForm.messageLabel' },
      { messageOptionalText: messageOptionalText }
    );

    // Asking billing address is recommended in PaymentIntent flow.
    // In CheckoutPage, we send name and email as billing details, but address only if it exists.
    const billingAddress = (
      <StripePaymentAddress
        intl={intl}
        form={formApi}
        fieldId={formId}
        card={null} // No longer using this.card
        locale={locale}
      />
    );

    const hasStripeKey = stripePublishableKey;

    const handleSameAddressCheckbox = event => {
      const checked = event.target.checked;
      updateBillingDetailsToMatchShippingAddress(checked);
    };
    const isBookingYesNo = isBooking ? 'yes' : 'no';

    return hasStripeKey ? (
      <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="OrderDetailsPage">
        {billingDetailsNeeded && !loadingData ? (
          <React.Fragment>
            {hasDefaultPaymentMethod ? (
              <PaymentMethodSelector
                cardClasses={cardClasses}
                formId={formId}
                defaultPaymentMethod={ensuredDefaultPaymentMethod}
                changePaymentMethod={changePaymentMethod}
                hasCardError={hasCardError}
                error={state.error}
                paymentMethod={selectedPaymentMethod}
                intl={intl}
                marketplaceName={marketplaceName}
              />
            ) : (
              <React.Fragment>
                <Heading as="h3" rootClassName={css.heading}>
                  <FormattedMessage id="StripePaymentForm.paymentHeading" />
                </Heading>
                <OneTimePaymentWithCardElement
                  cardClasses={cardClasses}
                  formId={formId}
                  hasCardError={hasCardError}
                  error={state.error}
                  intl={intl}
                  marketplaceName={marketplaceName}
                />
              </React.Fragment>
            )}

            {showOnetimePaymentFields ? (
              <React.Fragment>
                {!ADDR_ENABLED && (
                  <div className={css.billingDetails}>
                    <Heading as="h3" rootClassName={css.heading}>
                      <FormattedMessage id="StripePaymentForm.billingDetails" />
                    </Heading>

                    {askShippingDetails ? (
                      <FieldCheckbox
                        className={css.sameAddressCheckbox}
                        textClassName={css.sameAddressLabel}
                        id="sameAddressCheckbox"
                        name="sameAddressCheckbox"
                        label={intl.formatMessage({
                          id: 'StripePaymentForm.sameBillingAndShippingAddress',
                        })}
                        value="sameAddress"
                        useSuccessColor
                        onChange={handleSameAddressCheckbox}
                      />
                    ) : null}

                    <FieldTextInput
                      className={css.field}
                      type="text"
                      id="name"
                      name="name"
                      autoComplete="cc-name"
                      label={billingDetailsNameLabel}
                      placeholder={billingDetailsNamePlaceholder}
                    />

                    {billingAddress}

                  </div>
                )}

                {ADDR_ENABLED && (
                  <>
                    <div className="section">
                      <h3>Billing details</h3>
                      <AddressForm
                        namespace="billing"
                        disabled={false}
                        requiredFields={{ name: true, line1: true, city: true, state: true, postalCode: true }}
                        countryAfterZipForUSCA={true}
                      />
                    </div>

                    <div className="section">
                      <h3>Shipping details</h3>
                      <AddressForm
                        namespace="shipping"
                        disabled={false}
                        requiredFields={{ name: true, line1: true, city: true, state: true, postalCode: true }}
                        countryAfterZipForUSCA={true}
                      />
                    </div>
                  </>
                )}

                {!ADDR_ENABLED && (
                  <>
                    {/* Shipping Details Section */}
                  <div className={css.billingDetails}>
                    <Heading as="h3" rootClassName={css.heading}>
                      Shipping Details
                    </Heading>
                    <FieldTextInput
                      className={css.field}
                      type="text"
                      id="customerName"
                      name="customerName"
                      label="Full Name"
                      required
                    />
                    <FieldTextInput
                      className={css.field}
                      type="text"
                      id="customerStreet"
                      name="customerStreet"
                      label="Street *"
                      placeholder="123 Example Street"
                      required
                    />
                    <FieldTextInput
                      className={css.field}
                      type="text"
                      id="customerStreet2"
                      name="customerStreet2"
                      label="Street (line 2)"
                      placeholder="Apt 7"
                    />
                    <FieldTextInput
                      className={css.field}
                      type="text"
                      id="customerCity"
                      name="customerCity"
                      label="City"
                      required
                    />
                    <FieldTextInput
                      className={css.field}
                      type="text"
                      id="customerState"
                      name="customerState"
                      label="State"
                      required
                    />
                    <FieldTextInput
                      className={css.field}
                      type="text"
                      id="customerZip"
                      name="customerZip"
                      label="ZIP Code"
                      required
                    />
                    <FieldTextInput
                      className={css.field}
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      label="Email"
                      required
                      validate={value => (!value ? 'Required' : !/^\S+@\S+\.\S+$/.test(value) ? 'Invalid email' : undefined)}
                    />
                    <FieldTextInput
                      className={css.field}
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      label="Phone Number"
                      required
                      validate={value => (!value ? 'Required' : !/^\+?\d{7,15}$/.test(value) ? 'Invalid phone' : undefined)}
                    />
                  </div>
                  </>
                )}
              </React.Fragment>
            ) : null}
          </React.Fragment>
        ) : loadingData ? (
          <p className={css.spinner}>
            <IconSpinner />
          </p>
        ) : null}

        {initiateOrderError ? (
          <span className={css.errorMessage}>{initiateOrderError.message}</span>
        ) : null}
        {showInitialMessageInput ? (
          <div>
            <Heading as="h3" rootClassName={css.heading}>
              <FormattedMessage id="StripePaymentForm.messageHeading" />
            </Heading>

            <FieldTextInput
              type="textarea"
              id={`${formId}-message`}
              name="initialMessage"
              label={initialMessageLabel}
              placeholder={messagePlaceholder}
              className={css.message}
            />
          </div>
        ) : null}
        <div className={css.submitContainer}>
          {hasPaymentErrors ? (
            <span className={css.errorMessage}>{paymentErrorMessage}</span>
          ) : null}
          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
          >
            {billingDetailsNeeded ? (
              <FormattedMessage
                id="StripePaymentForm.submitPaymentInfo"
                values={{ totalPrice: totalPriceMaybe, isBooking: isBookingYesNo }}
              />
            ) : (
              <FormattedMessage
                id="StripePaymentForm.submitConfirmPaymentInfo"
                values={{ totalPrice: totalPriceMaybe, isBooking: isBookingYesNo }}
              />
            )}
          </PrimaryButton>
          <p className={css.paymentInfo}>
            <FormattedMessage
              id="StripePaymentForm.submitConfirmPaymentFinePrint"
              values={{ isBooking: isBookingYesNo, name: authorDisplayName }}
            />
          </p>
        </div>
      </Form>
    ) : (
      <div className={css.missingStripeKey}>
        <FormattedMessage id="StripePaymentForm.missingStripeKey" />
      </div>
    );
  };

  if (!stripe || !elements) {
    return <div>Initializing payment form…</div>;
  }

  // Add initialValues for shipping fields
  const initialValues = {
    customerName: '',
    customerStreet: '',
    customerStreet2: '',
    customerCity: '',
    customerState: '',
    customerZip: '',
    customerEmail: '',
    customerPhone: '',
    ...(props.initialValues || {})
  };

  return <FinalForm onSubmit={handleSubmit} initialValues={initialValues} {...props} render={paymentForm} />;
}

export default injectIntl(StripePaymentForm);