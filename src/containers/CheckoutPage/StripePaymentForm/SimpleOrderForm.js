import React, { Component } from 'react';
import { bool, func, object, shape, string } from 'prop-types';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import {
  FormattedMessage,
  injectIntl,
  intlShape,
} from '../../../util/reactIntl';

import {
  Heading,
  Form,
  PrimaryButton,
  //Ine
  //FieldTextInput,
  //Fin ine
} from '../../../components';

import ShippingDetails from '../ShippingDetails/ShippingDetails';

import css from './StripePaymentForm.module.css';

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
 */
class SimpleOrderForm extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
    this.handleSubmit = this.handleSubmit.bind(this);
    this.orderForm = this.orderForm.bind(this);
    this.finalFormAPI = null;
  }

  handleSubmit(values) {
    const { onSubmit, inProgress, formId } = this.props;
    const { initialMessage } = values;

    if (inProgress) {
      // Already submitting or card value incomplete/invalid
      return;
    }

    const params = {
      message: initialMessage ? initialMessage.trim() : null,
      formId,
      formValues: values,
    };
    onSubmit(params);
  }

  orderForm(formRenderProps) {
    const {
      className,
      rootClassName,
      inProgress: submitInProgress,
      formId,
      authorDisplayName,
      showInitialMessageInput,
      intl,
      initiateOrderError,
      invalid,
      handleSubmit,
      form: formApi,
      listingLocation,
      askShippingDetails,
      showPickUplocation,
      totalPrice,
      locale,
      isBooking,
      isFuzzyLocation,
    } = formRenderProps;

    this.finalFormAPI = formApi;

    const submitDisabled = invalid || submitInProgress;
    const classes = classNames(rootClassName || css.root, className);

    // Note: totalPrice might not be available initially
    // when speculateTransaction call is in progress.
    const totalPriceMaybe = totalPrice || '';

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

    const isBookingYesNo = isBooking ? 'yes' : 'no';
    const trackSubmitApplication = () => {
      console.log('ConfirmApplication'); // Log para verificar
      if (typeof fbq !== 'undefined') {
        fbq('track', 'ConfirmApplication');
      } else {
        console.error('Meta Pixel no está definido');
      }
    };
    return (
      <Form
        className={classes}
        onSubmit={handleSubmit}
        enforcePagePreloadFor="OrderDetailsPage"
      >
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

        {initiateOrderError ? (
          <span className={css.errorMessage}>{initiateOrderError.message}</span>
        ) : null}
                  {/* Ine
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
          Fin Ine
          
          </div>
        ) : null}*/}
        <div className={css.submitContainer}>
          <PrimaryButton
            onClick={trackSubmitApplication}
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
          >
            <FormattedMessage
              id="StripePaymentForm.submitPaymentInfo"
              values={{
                totalPrice: totalPriceMaybe,
                isBooking: isBookingYesNo,
              }}
            />
          </PrimaryButton>
          <p className={css.paymentInfo}>
          </p>
        </div>
      </Form>
    );
  }

  render() {
    const { onSubmit, ...rest } = this.props;
    return (
      <FinalForm
        onSubmit={this.handleSubmit}
        {...rest}
        render={this.orderForm}
      />
    );
  }
}

SimpleOrderForm.defaultProps = {
  className: null,
  rootClassName: null,
  inProgress: false,
  loadingData: false,
  showInitialMessageInput: true,
  initiateOrderError: null,
  askShippingDetails: false,
  showPickUplocation: false,
  listingLocation: null,
  totalPrice: null,
  isFuzzyLocation: false,
};

SimpleOrderForm.propTypes = {
  className: string,
  rootClassName: string,
  inProgress: bool,
  loadingData: bool,
  initiateOrderError: object,
  formId: string.isRequired,
  onSubmit: func.isRequired,
  authorDisplayName: string.isRequired,
  showInitialMessageInput: bool,
  askShippingDetails: bool,
  showPickUplocation: bool,
  listingLocation: shape({
    address: string.isRequired,
    building: string,
  }),
  totalPrice: string,
  locale: string.isRequired,
  isBooking: bool.isRequired,
  isFuzzyLocation: bool,

  // from injectIntl
  intl: intlShape.isRequired,
};

export default injectIntl(SimpleOrderForm);