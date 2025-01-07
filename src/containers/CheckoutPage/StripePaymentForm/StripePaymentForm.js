/**
 * Note: This form is using card from Stripe Elements https://stripe.com/docs/stripe-js#elements
 * Card is not a Final Form field so it's not available trough Final Form.
 * It's also handled separately in handleSubmit function.
 */
import React, { Component } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

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

import css from './StripePaymentForm.module.css';

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
    handleStripeElementRef,
    hasCardError,
    error,
    label,
    intl,
    marketplaceName,
  } = props;
  const labelText =
    label || intl.formatMessage({ id: 'StripePaymentForm.saveAfterOnetimePayment' });
  return (
    <React.Fragment>
      <label className={css.paymentLabel} htmlFor={`${formId}-card`}>
        <FormattedMessage id="StripePaymentForm.paymentCardDetails" />
      </label>
      <div className={cardClasses} id={`${formId}-card`} ref={handleStripeElementRef} />
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
    handleStripeElementRef,
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
          handleStripeElementRef={handleStripeElementRef}
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
class StripePaymentForm extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
    this.updateBillingDetailsToMatchShippingAddress = this.updateBillingDetailsToMatchShippingAddress.bind(
      this
    );
    this.handleCardValueChange = this.handleCardValueChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.paymentForm = this.paymentForm.bind(this);
    this.initializeStripeElement = this.initializeStripeElement.bind(this);
    this.handleStripeElementRef = this.handleStripeElementRef.bind(this);
    this.changePaymentMethod = this.changePaymentMethod.bind(this);
    this.finalFormAPI = null;
    this.cardContainer = null;
  }

  componentDidMount() {
    if (!window.Stripe) {
      throw new Error('Stripe must be loaded for StripePaymentForm');
    }

    const publishableKey = this.props.stripePublishableKey;
    if (publishableKey) {
      const {
        onStripeInitialized,
        hasHandledCardPayment,
        defaultPaymentMethod,
        loadingData,
      } = this.props;
      this.stripe = window.Stripe(publishableKey);
      onStripeInitialized(this.stripe);

      if (!(hasHandledCardPayment || defaultPaymentMethod || loadingData)) {
        this.initializeStripeElement();
      }
    }
  }

  componentWillUnmount() {
    if (this.card) {
      this.card.removeEventListener('change', this.handleCardValueChange);
      this.card.unmount();
      this.card = null;
    }
  }

  initializeStripeElement(element) {
    const elements = this.stripe.elements(stripeElementsOptions);

    if (!this.card) {
      this.card = elements.create('card', { style: cardStyles });
      this.card.mount(element || this.cardContainer);
      this.card.addEventListener('change', this.handleCardValueChange);
      // EventListener is the only way to simulate breakpoints with Stripe.
      window.addEventListener('resize', () => {
        if (this.card) {
          if (window.innerWidth < 768) {
            this.card.update({ style: { base: { fontSize: '14px', lineHeight: '24px' } } });
          } else {
            this.card.update({ style: { base: { fontSize: '18px', lineHeight: '24px' } } });
          }
        }
      });
    }
  }

  updateBillingDetailsToMatchShippingAddress(shouldFill) {
    const formApi = this.finalFormAPI;
    const values = formApi.getState()?.values || {};
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

  changePaymentMethod(changedTo) {
    if (this.card && changedTo === 'defaultCard') {
      this.card.removeEventListener('change', this.handleCardValueChange);
      this.card.unmount();
      this.card = null;
      this.setState({ cardValueValid: false });
    }
    this.setState({ paymentMethod: changedTo });
    if (changedTo === 'defaultCard' && this.finalFormAPI) {
      this.finalFormAPI.change('sameAddressCheckbox', undefined);
    } else if (changedTo === 'replaceCard' && this.finalFormAPI) {
      this.finalFormAPI.change('sameAddressCheckbox', ['sameAddress']);
      this.updateBillingDetailsToMatchShippingAddress(true);
    }
  }

  handleStripeElementRef(el) {
    this.cardContainer = el;
    if (this.stripe && el) {
      this.initializeStripeElement(el);
    }
  }

  handleCardValueChange(event) {
    const { intl } = this.props;
    const { error, complete } = event;

    const postalCode = event.value.postalCode;
    if (this.finalFormAPI) {
      this.finalFormAPI.change('postal', postalCode);
    }

    this.setState(prevState => {
      return {
        error: error ? stripeErrorTranslation(intl, error) : null,
        cardValueValid: complete,
      };
    });
  }
  handleSubmit(values) {
    const {
      onSubmit,
      inProgress,
      formId,
      hasHandledCardPayment,
      defaultPaymentMethod,
    } = this.props;
    const { initialMessage } = values;
    const { cardValueValid, paymentMethod } = this.state;
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

    const params = {
      message: initialMessage ? initialMessage.trim() : null,
      card: this.card,
      formId,
      formValues: values,
      paymentMethod: getPaymentMethod(
        paymentMethod,
        ensurePaymentMethodCard(defaultPaymentMethod).id
      ),
    };
    onSubmit(params);
  }

  paymentForm(formRenderProps) {
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

    this.finalFormAPI = formApi;

    const ensuredDefaultPaymentMethod = ensurePaymentMethodCard(defaultPaymentMethod);
    const billingDetailsNeeded = !(hasHandledCardPayment || confirmPaymentError);

    const { cardValueValid, paymentMethod } = this.state;
    const hasDefaultPaymentMethod = ensuredDefaultPaymentMethod.id;
    const selectedPaymentMethod = getPaymentMethod(paymentMethod, hasDefaultPaymentMethod);
    const { onetimePaymentNeedsAttention, showOnetimePaymentFields } = checkOnetimePaymentFields(
      cardValueValid,
      selectedPaymentMethod,
      hasDefaultPaymentMethod,
      hasHandledCardPayment
    );

    const submitDisabled = invalid || onetimePaymentNeedsAttention || submitInProgress;
    const hasCardError = this.state.error && !submitInProgress;
    const hasPaymentErrors = confirmCardPaymentError || confirmPaymentError;
    const classes = classNames(rootClassName || css.root, className);
    const cardClasses = classNames(css.card, {
      [css.cardSuccess]: this.state.cardValueValid,
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
        card={this.card}
        locale={locale}
      />
    );

    const hasStripeKey = stripePublishableKey;

    const handleSameAddressCheckbox = event => {
      const checked = event.target.checked;
      this.updateBillingDetailsToMatchShippingAddress(checked);
    };
    const isBookingYesNo = isBooking ? 'yes' : 'no';

    return hasStripeKey ? (
      <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="OrderDetailsPage">
        <LocationOrShippingDetails
          askShippingDetails={askShippingDetails}
          showPickUplocation={showPickUplocation}
          listingLocation={listingLocation}
          isBooking={isBooking}
          isFuzzyLocation={isFuzzyLocation}
          formApi={formApi}
          locale={locale}
          intl={intl}
        />

        {billingDetailsNeeded && !loadingData ? (
          <React.Fragment>
            {hasDefaultPaymentMethod ? (
              <PaymentMethodSelector
                cardClasses={cardClasses}
                formId={formId}
                defaultPaymentMethod={ensuredDefaultPaymentMethod}
                changePaymentMethod={this.changePaymentMethod}
                handleStripeElementRef={this.handleStripeElementRef}
                hasCardError={hasCardError}
                error={this.state.error}
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
                  handleStripeElementRef={this.handleStripeElementRef}
                  hasCardError={hasCardError}
                  error={this.state.error}
                  intl={intl}
                  marketplaceName={marketplaceName}
                />
              </React.Fragment>
            )}

            {showOnetimePaymentFields ? (
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
  }

  render() {
    const { onSubmit, ...rest } = this.props;
    return <FinalForm onSubmit={this.handleSubmit} {...rest} render={this.paymentForm} />;
  }
}

export default injectIntl(StripePaymentForm);
