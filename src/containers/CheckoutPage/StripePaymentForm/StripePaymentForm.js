/**
 * Note: This form is using card from Stripe Elements https://stripe.com/docs/stripe-js#elements
 * Card is not a Final Form field so it's not available trough Final Form.
 * It's also handled separately in handleSubmit function.
 */
import React, { Component } from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, injectIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { ensurePaymentMethodCard } from '../../../util/data';
import { getPropsForCustomTransactionFieldInputs } from '../../../util/fieldHelpers';
import { STRIPE_JS_LOADED_EVENT } from '../../../util/includeScripts';
import { PAYMENT_METHOD_CARD } from '../../../transactions/paymentMethods';
import {
  isDownloadProcess,
  isBookingProcess,
  getProcess,
  isStripePushPaymentMethod,
} from '../../../transactions/transaction';

import {
  Heading,
  Form,
  PrimaryButton,
  FieldCheckbox,
  FieldTextInput,
  IconSpinner,
  PaymentMethodPicker,
  StripePaymentAddress,
  CustomExtendedDataField,
} from '../../../components';

import ShippingDetails from '../ShippingDetails/ShippingDetails';

import css from './StripePaymentForm.module.css';

/**
 * Resolve translated label (and optional hint) for a checkout payment method option.
 * Message keys follow StripePaymentForm.paymentMethod.{methodId}[.hint].
 * Catalog / availability live in paymentMethods.js.
 *
 * Card is special: PaymentMethodPicker owns saved/new-card UI and its own copy, so
 * card is filtered out of additionalPaymentOptions and has no StripePaymentForm.paymentMethod.card key.
 *
 * @param {Object} intl - react-intl object
 * @param {{ value: string }} option - checkout payment method option
 * @returns {{ value: string, label: string, hint?: string }}
 */
const withPaymentMethodMessages = (intl, option) => {
  const methodId = option.value;
  const labelId = `StripePaymentForm.paymentMethod.${methodId}`;
  const hintId = `StripePaymentForm.paymentMethod.${methodId}.hint`;
  const label = Object.prototype.hasOwnProperty.call(intl.messages, labelId)
    ? intl.formatMessage({ id: labelId })
    : methodId;
  const hint = Object.prototype.hasOwnProperty.call(intl.messages, hintId)
    ? intl.formatMessage({ id: hintId })
    : undefined;
  return hint ? { value: methodId, label, hint } : { value: methodId, label };
};

const isStripePushPaymentForProcess = (
  processName,
  checkoutPaymentMethod = PAYMENT_METHOD_CARD
) => {
  if (!processName) {
    return false;
  }
  return isStripePushPaymentMethod(getProcess(processName), checkoutPaymentMethod);
};

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

const CARD_MENU_VALUES = ['defaultCard', 'replaceCard', 'onetimeCardPayment'];

/**
 * Checkout wrapper around PaymentMethodPicker: maps catalog method (card/ideal/…)
 * to card UX mode (defaultCard/replaceCard/onetimeCardPayment), and shows the
 * Card Element or push-method hint as needed.
 */
const PaymentMethodSelector = props => {
  const {
    cardClasses,
    formId,
    changeCardPaymentMode,
    defaultPaymentMethod,
    handleStripeElementRef,
    hasCardError,
    error,
    cardPaymentMode,
    intl,
    marketplaceName,
    checkoutPaymentOptions = [],
    checkoutPaymentMethod = PAYMENT_METHOD_CARD,
    onCheckoutPaymentMethodChange,
    paymentMethodHint,
  } = props;

  const hasDefaultPaymentMethod = !!defaultPaymentMethod?.id;
  const usesCardPayment = checkoutPaymentMethod === PAYMENT_METHOD_CARD;
  const additionalPaymentOptions = checkoutPaymentOptions.filter(
    option => option.value !== PAYMENT_METHOD_CARD
  );

  const handlePaymentMethodChange = value => {
    if (CARD_MENU_VALUES.includes(value)) {
      if (onCheckoutPaymentMethodChange) {
        onCheckoutPaymentMethodChange(PAYMENT_METHOD_CARD);
      }
      changeCardPaymentMode(value);
      return;
    }

    if (onCheckoutPaymentMethodChange) {
      onCheckoutPaymentMethodChange(value);
    }
    changeCardPaymentMode('onetimeCardPayment');
  };

  const selectedValue = (() => {
    if (!usesCardPayment) {
      return checkoutPaymentMethod;
    }
    if (!hasDefaultPaymentMethod) {
      return 'onetimeCardPayment';
    }
    if (cardPaymentMode === 'replaceCard') {
      return 'replaceCard';
    }
    return 'defaultCard';
  })();

  const showCardElement =
    usesCardPayment &&
    (cardPaymentMode === 'replaceCard' ||
      cardPaymentMode === 'onetimeCardPayment' ||
      !hasDefaultPaymentMethod);

  const last4Digits = defaultPaymentMethod?.attributes?.card?.last4Digits;
  const labelText = last4Digits
    ? intl.formatMessage({ id: 'StripePaymentForm.replaceAfterOnetimePayment' }, { last4Digits })
    : undefined;

  return (
    <React.Fragment>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="StripePaymentForm.payWithHeading" />
      </Heading>
      <div className={css.paymentMethodSelector}>
        <PaymentMethodPicker
          card={hasDefaultPaymentMethod ? defaultPaymentMethod.attributes.card : null}
          onChange={handlePaymentMethodChange}
          additionalPaymentOptions={additionalPaymentOptions}
          selectedValue={selectedValue}
        />
        {paymentMethodHint ? <p className={css.paymentMethodHint}>{paymentMethodHint}</p> : null}
      </div>
      {showCardElement ? (
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

const getCardPaymentMode = (cardPaymentMode, hasDefaultPaymentMethod) => {
  return cardPaymentMode == null && hasDefaultPaymentMethod
    ? 'defaultCard'
    : cardPaymentMode == null
    ? 'onetimeCardPayment'
    : cardPaymentMode;
};

// Should we show onetime payment fields and does StripeElements card need attention
const checkOnetimePaymentFields = (
  cardValueValid,
  cardPaymentMode,
  hasDefaultPaymentMethod,
  hasHandledCardPayment,
  isStripePushPayment = false
) => {
  if (isStripePushPayment) {
    return {
      onetimePaymentNeedsAttention: false,
      showOnetimePaymentFields: true,
    };
  }

  const useDefaultPaymentMethod = cardPaymentMode === 'defaultCard' && hasDefaultPaymentMethod;
  // Billing details are known if we have already handled card payment or existing default payment method is used.
  const billingDetailsKnown = hasHandledCardPayment || useDefaultPaymentMethod;

  // If onetime payment is used, check that the StripeElements card has valid value.
  const oneTimePaymentModes = ['onetimeCardPayment', 'replaceCard'];
  const useOnetimePaymentMode = oneTimePaymentModes.includes(cardPaymentMode);
  const onetimePaymentNeedsAttention =
    !billingDetailsKnown && !(useOnetimePaymentMode && cardValueValid);

  return {
    onetimePaymentNeedsAttention,
    showOnetimePaymentFields: useOnetimePaymentMode,
  };
};

const LocationOrShippingDetails = props => {
  const {
    askShippingDetails,
    showPickUpLocation,
    showLocation,
    listingLocation,
    formApi,
    locale,
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
  ) : showPickUpLocation ? (
    <div className={css.locationWrapper}>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="StripePaymentForm.pickupDetailsTitle" />
      </Heading>
      <p className={css.locationDetails}>{locationDetails}</p>
    </div>
  ) : showLocation && !isFuzzyLocation ? (
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
  // Card UX mode: 'onetimeCardPayment', 'defaultCard', or 'replaceCard'
  // Check PaymentMethodPicker component for more information
  cardPaymentMode: null,
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
 * @param {boolean} props.showPickUpLocation - Whether to show the pickup location
 * @param {boolean} props.showLocation - Whether to show the location address
 * @param {string} props.totalPrice - The total price
 * @param {string} props.locale - The locale
 * @param {Object} props.listingLocation - The listing location
 * @param {Object} props.listingLocation.building - The building
 * @param {Object} props.listingLocation.address - The address
 * @param {string} props.processName - The transaction process name
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
    this.changeCardPaymentMode = this.changeCardPaymentMode.bind(this);
    this.handleStripeJsLoadedEvent = this.handleStripeJsLoadedEvent.bind(this);
    this.finalFormAPI = null;
    this.cardContainer = null;
  }

  handleStripeJsLoadedEvent() {
    if (this.stripe || typeof window === 'undefined' || !window.Stripe) {
      return;
    }
    const publishableKey = this.props.stripePublishableKey;
    if (!publishableKey) {
      return;
    }

    window.removeEventListener(STRIPE_JS_LOADED_EVENT, this.handleStripeJsLoadedEvent);

    const {
      onStripeInitialized,
      hasHandledCardPayment,
      defaultPaymentMethod,
      loadingData,
      checkoutPaymentMethod,
    } = this.props;
    this.stripe = window.Stripe(publishableKey);
    onStripeInitialized(this.stripe);

    if (
      !(hasHandledCardPayment || defaultPaymentMethod || loadingData) &&
      checkoutPaymentMethod === PAYMENT_METHOD_CARD
    ) {
      this.initializeStripeElement();
    }
  }

  componentDidMount() {
    const publishableKey = this.props.stripePublishableKey;
    if (!publishableKey) {
      return;
    }

    window.addEventListener(STRIPE_JS_LOADED_EVENT, this.handleStripeJsLoadedEvent);
    this.handleStripeJsLoadedEvent();
  }

  componentDidUpdate(prevProps) {
    const {
      checkoutPaymentMethod,
      hasHandledCardPayment,
      defaultPaymentMethod,
      loadingData,
    } = this.props;

    const prevUsedCardPayment = prevProps.checkoutPaymentMethod === PAYMENT_METHOD_CARD;
    const usesCardPayment = checkoutPaymentMethod === PAYMENT_METHOD_CARD;
    if (!prevUsedCardPayment && usesCardPayment) {
      if (
        !(hasHandledCardPayment || defaultPaymentMethod || loadingData) &&
        !this.card &&
        this.cardContainer
      ) {
        this.initializeStripeElement();
      }
    }

    if (prevUsedCardPayment && !usesCardPayment && this.card) {
      this.card.removeEventListener('change', this.handleCardValueChange);
      this.card.unmount();
      this.card = null;
      this.setState({ cardValueValid: false, error: null });
    }
  }

  componentWillUnmount() {
    window.removeEventListener(STRIPE_JS_LOADED_EVENT, this.handleStripeJsLoadedEvent);
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

  changeCardPaymentMode(changedTo) {
    if (this.card && changedTo === 'defaultCard') {
      this.card.removeEventListener('change', this.handleCardValueChange);
      this.card.unmount();
      this.card = null;
      this.setState({ cardValueValid: false });
    }
    this.setState({ cardPaymentMode: changedTo });
    if (changedTo === 'defaultCard' && this.finalFormAPI) {
      this.finalFormAPI.change('sameAddressCheckbox', undefined);
    } else if (
      (changedTo === 'replaceCard' || changedTo === 'onetimeCardPayment') &&
      this.finalFormAPI
    ) {
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
      checkoutPaymentMethod = PAYMENT_METHOD_CARD,
      processName,
    } = this.props;
    const { initialMessage } = values;
    const { cardValueValid, cardPaymentMode } = this.state;
    const hasDefaultPaymentMethod = defaultPaymentMethod?.id;
    const selectedCardPaymentMode = getCardPaymentMode(cardPaymentMode, hasDefaultPaymentMethod);
    const isStripePushPayment = isStripePushPaymentForProcess(processName, checkoutPaymentMethod);
    const { onetimePaymentNeedsAttention } = checkOnetimePaymentFields(
      isStripePushPayment ? true : cardValueValid,
      selectedCardPaymentMode,
      hasDefaultPaymentMethod,
      hasHandledCardPayment,
      isStripePushPayment
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
      cardPaymentMode: getCardPaymentMode(
        cardPaymentMode,
        ensurePaymentMethodCard(defaultPaymentMethod).id
      ),
      checkoutPaymentMethod: this.props.checkoutPaymentMethod || PAYMENT_METHOD_CARD,
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
      providerDisplayName,
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
      showLocation,
      showPickUpLocation,
      totalPrice,
      locale,
      stripePublishableKey,
      marketplaceName,
      processName,
      isFuzzyLocation,
      transactionFieldConfigs = [],
      showTransactionFields,
      values,
      checkoutPaymentOptions = [],
      checkoutPaymentMethod,
      onCheckoutPaymentMethodChange,
    } = formRenderProps;

    this.finalFormAPI = formApi;
    const hasTransactionFieldConfigs = transactionFieldConfigs.length > 0;
    const transactionFieldsProps = getPropsForCustomTransactionFieldInputs(
      transactionFieldConfigs,
      true
    );

    const ensuredDefaultPaymentMethod = ensurePaymentMethodCard(defaultPaymentMethod);
    const billingDetailsNeeded = !(hasHandledCardPayment || confirmPaymentError);

    const { cardValueValid, cardPaymentMode } = this.state;
    const hasDefaultPaymentMethod = ensuredDefaultPaymentMethod.id;
    const selectedCardPaymentMode = getCardPaymentMode(cardPaymentMode, hasDefaultPaymentMethod);
    const isStripePushPayment = isStripePushPaymentForProcess(processName, checkoutPaymentMethod);
    const { onetimePaymentNeedsAttention, showOnetimePaymentFields } = checkOnetimePaymentFields(
      cardValueValid,
      selectedCardPaymentMode,
      hasDefaultPaymentMethod,
      hasHandledCardPayment,
      isStripePushPayment
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
      { name: providerDisplayName }
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

    const isBooking = isBookingProcess(processName);
    const isDownload = isDownloadProcess(processName);
    const isBookingYesNo = isBooking ? 'yes' : 'no';

    const showAdditionalInfoHeading =
      showInitialMessageInput || (hasTransactionFieldConfigs && showTransactionFields);

    const availableCheckoutPaymentOptions = (checkoutPaymentOptions.length > 0
      ? checkoutPaymentOptions
      : [{ value: PAYMENT_METHOD_CARD }]
    ).map(option => withPaymentMethodMessages(intl, option));
    const selectedCheckoutPaymentOption =
      availableCheckoutPaymentOptions.find(option => option.value === checkoutPaymentMethod) || {};
    // Card Element / saved-card UI. Push vs pull (process transitions) is separate —
    // see isStripePushPaymentMethod / isStripePushPaymentForProcess.
    const usesCardPayment = checkoutPaymentMethod === PAYMENT_METHOD_CARD;
    const paymentMethodHint = selectedCheckoutPaymentOption.hint;
    // Saved card and/or multiple checkout methods → unified dropdown selector.
    const showUnifiedPaymentMethodSelector =
      hasDefaultPaymentMethod || availableCheckoutPaymentOptions.length > 1;

    return hasStripeKey ? (
      <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="OrderDetailsPage">
        <LocationOrShippingDetails
          askShippingDetails={askShippingDetails}
          showPickUpLocation={showPickUpLocation}
          showLocation={showLocation}
          listingLocation={listingLocation}
          isFuzzyLocation={isFuzzyLocation}
          formApi={formApi}
          locale={locale}
          intl={intl}
        />

        {billingDetailsNeeded && !loadingData ? (
          <React.Fragment>
            {showUnifiedPaymentMethodSelector ? (
              <PaymentMethodSelector
                cardClasses={cardClasses}
                formId={formId}
                defaultPaymentMethod={hasDefaultPaymentMethod ? ensuredDefaultPaymentMethod : null}
                changeCardPaymentMode={this.changeCardPaymentMode}
                handleStripeElementRef={this.handleStripeElementRef}
                hasCardError={hasCardError}
                error={this.state.error}
                cardPaymentMode={selectedCardPaymentMode}
                intl={intl}
                marketplaceName={marketplaceName}
                checkoutPaymentOptions={availableCheckoutPaymentOptions}
                checkoutPaymentMethod={checkoutPaymentMethod}
                onCheckoutPaymentMethodChange={onCheckoutPaymentMethodChange}
                paymentMethodHint={paymentMethodHint}
              />
            ) : usesCardPayment ? (
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
            ) : null}

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

        {showAdditionalInfoHeading ? (
          <Heading as="h3" rootClassName={css.heading}>
            <FormattedMessage id="StripePaymentForm.messageHeading" />
          </Heading>
        ) : null}
        {hasTransactionFieldConfigs && showTransactionFields ? (
          <div className={css.transactionFieldsContainer}>
            {transactionFieldsProps.map(({ key, ...fieldProps }) => (
              <CustomExtendedDataField key={key} {...fieldProps} formId={formId} />
            ))}
          </div>
        ) : null}
        {showInitialMessageInput ? (
          <div>
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
          {!isDownload && (
            <p className={css.paymentInfo}>
              <FormattedMessage
                id="StripePaymentForm.submitConfirmPaymentFinePrint"
                values={{ isBooking: isBookingYesNo, name: providerDisplayName }}
              />
            </p>
          )}
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
    return (
      <FinalForm
        onSubmit={this.handleSubmit}
        mutators={{ ...arrayMutators }}
        {...rest}
        render={this.paymentForm}
      />
    );
  }
}

export default injectIntl(StripePaymentForm);
