/**
 * Note: This form is using card from Stripe Elements https://stripe.com/docs/stripe-js#elements
 * Card is not a Final Form field so it's not available trough Final Form.
 * It's also handled separately in handleSubmit function.
 */
import React, { Component } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';

import { Form, PrimaryButton, FieldTextInput, StripePaymentAddress, H4 } from '../../../components';

import css from './PaymentMethodsForm.module.css';

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
    return intl.formatMessage({ id: 'PaymentMethodsForm.genericError' });
  }

  const translationId =
    type === 'validation_error'
      ? `PaymentMethodsForm.stripe.validation_error.${code}`
      : `PaymentMethodsForm.stripe.${type}`;

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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter var", Helvetica, Arial, sans-serif',
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

const initialState = {
  error: null,
  cardValueValid: false,
};

/**
 * Payment methods form that asks for credit card info using Stripe Elements.
 *
 * When the card is valid and the user submits the form, a request is
 * sent to the Stripe API to handle card setup. `stripe.handleCardSetup`
 * may ask more details from cardholder if 3D security steps are needed.
 *
 * See: https://stripe.com/docs/payments/payment-intents
 *      https://stripe.com/docs/elements
 */
class PaymentMethodsForm extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
    this.handleCardValueChange = this.handleCardValueChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.paymentForm = this.paymentForm.bind(this);
    this.finalFormAPI = null;
    this.stripe = null;
  }

  componentDidMount() {
    if (!window.Stripe) {
      throw new Error('Stripe must be loaded for PaymentMethodsForm');
    }

    const publishableKey = this.props.config?.stripe?.publishableKey;
    if (publishableKey) {
      this.stripe = window.Stripe(publishableKey);

      const elements = this.stripe.elements(stripeElementsOptions);
      this.card = elements.create('card', { style: cardStyles });
      this.card.mount(this.cardContainer);
      this.card.addEventListener('change', this.handleCardValueChange);
      // EventListener is the only way to simulate breakpoints with Stripe.
      window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
          this.card.update({ style: { base: { fontSize: '14px', lineHeight: '24px' } } });
        } else {
          this.card.update({ style: { base: { fontSize: '18px', lineHeight: '24px' } } });
        }
      });
    }
  }
  componentWillUnmount() {
    if (this.card) {
      this.card.removeEventListener('change', this.handleCardValueChange);
      this.card.unmount();
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
    const { onSubmit, inProgress, formId } = this.props;
    const cardInputNeedsAttention = !this.state.cardValueValid;

    if (inProgress || cardInputNeedsAttention) {
      // Already submitting or card value incomplete/invalid
      return;
    }

    const params = {
      stripe: this.stripe,
      card: this.card,
      formId,
      formValues: values,
    };

    onSubmit(params);
  }

  paymentForm(formRenderProps) {
    const {
      className,
      rootClassName,
      inProgress: submitInProgress,
      formId,
      intl,
      invalid,
      handleSubmit,
      addPaymentMethodError,
      deletePaymentMethodError,
      createStripeCustomerError,
      handleCardSetupError,
      form,
      config,
    } = formRenderProps;

    this.finalFormAPI = form;
    const cardInputNeedsAttention = !this.state.cardValueValid;
    const submitDisabled = invalid || cardInputNeedsAttention || submitInProgress;
    const hasCardError = this.state.error && !submitInProgress;
    const classes = classNames(rootClassName || css.root, className);
    const cardClasses = classNames(css.card, {
      [css.cardSuccess]: this.state.cardValueValid,
      [css.cardError]: hasCardError,
    });

    const hasErrors =
      addPaymentMethodError ||
      deletePaymentMethodError ||
      createStripeCustomerError ||
      handleCardSetupError;

    const errorMessage = intl.formatMessage({ id: 'PaymentMethodsForm.genericError' });

    const billingDetailsNameLabel = intl.formatMessage({
      id: 'PaymentMethodsForm.billingDetailsNameLabel',
    });

    const billingDetailsNamePlaceholder = intl.formatMessage({
      id: 'PaymentMethodsForm.billingDetailsNamePlaceholder',
    });

    const infoText = intl.formatMessage(
      {
        id: 'PaymentMethodsForm.infoText',
      },
      { marketplaceName: config.marketplaceName }
    );

    // Stripe recommends asking billing address.
    // In PaymentMethodsForm, we send name and email as billing details, but address only if it exists.
    const billingAddress = (
      <StripePaymentAddress
        intl={intl}
        form={form}
        fieldId={formId}
        card={this.card}
        locale={config.localization.locale}
      />
    );

    const hasStripeKey = config.stripe.publishableKey;

    return hasStripeKey ? (
      <Form className={classes} onSubmit={handleSubmit}>
        <label className={css.paymentLabel} htmlFor={`${formId}-card`}>
          <FormattedMessage id="PaymentMethodsForm.paymentCardDetails" />
        </label>

        <div
          className={cardClasses}
          id={`${formId}-card`}
          ref={el => {
            this.cardContainer = el;
          }}
        />
        <div className={css.infoText}>{infoText}</div>
        {hasCardError ? <span className={css.error}>{this.state.error}</span> : null}
        <div className={css.paymentAddressField}>
          <H4 as="h3">
            <FormattedMessage id="PaymentMethodsForm.billingDetails" />
          </H4>

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

        <div className={css.submitContainer}>
          {hasErrors ? (
            <span className={css.errorMessage}>
              {hasErrors.message ? hasErrors.message : errorMessage}
            </span>
          ) : null}
          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
          >
            <FormattedMessage id="PaymentMethodsForm.submitPaymentInfo" />
          </PrimaryButton>
        </div>
      </Form>
    ) : (
      <div className={css.missingStripeKey}>
        <FormattedMessage id="PaymentMethodsForm.missingStripeKey" />
      </div>
    );
  }

  render() {
    const { onSubmit, ...rest } = this.props;
    return <FinalForm onSubmit={this.handleSubmit} {...rest} render={this.paymentForm} />;
  }
}

/**
 * PaymentMethodsForm
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form ID
 * @param {Function} props.onSubmit - The function to handle form submission
 * @param {propTypes.error} props.addPaymentMethodError - The add payment method error
 * @param {propTypes.error} props.deletePaymentMethodError - The delete payment method error
 * @param {propTypes.error} props.createStripeCustomerError - The create stripe customer error
 * @param {propTypes.error} props.handleCardSetupError - The handle card setup error
 * @returns {JSX.Element} EnhancedPaymentMethodsForm component
 */
const EnhancedPaymentMethodsForm = props => {
  const config = useConfiguration();
  const intl = useIntl();
  return <PaymentMethodsForm config={config} intl={intl} {...props} />;
};

export default EnhancedPaymentMethodsForm;
