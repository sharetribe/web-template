import React from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import {
  createUser,
  createCurrentUser,
  createListing,
  fakeIntl,
  createTransaction,
} from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getDefaultConfiguration,
} from '../../util/testHelpers';

import { CheckoutPageComponent } from './CheckoutPage';
import checkoutPageReducer, { SET_INITIAL_VALUES, setInitialValues } from './CheckoutPage.duck';

const { Money } = sdkTypes;
const { screen } = testingLibrary;
const noop = () => null;

const routeConfiguration = [
  {
    path: '/',
    name: 'LandingPage',
    component: props => <div />,
  },
  {
    path: '/about',
    name: 'AboutPage',
    component: props => <div />,
  },
];

describe('CheckoutPage', () => {
  beforeEach(() => {
    // This is not defined by default on test env. AuthenticationPage needs it.
    window.matchMedia = jest.fn(() => ({
      matches: true,
      addEventListener: noop,
      removeEventListener: noop,
    }));

    window.Stripe = jest.fn(() => ({
      elements: () => ({
        create: () => ({
          mount: noop,
          unmount: noop,
          update: noop,
          addEventListener: noop,
          removeEventListener: noop,
        }),
      }),
    }));
  });

  afterAll(() => {
    // Remove window.scrollTo
    jest.clearAllMocks();
  });

  const lineItems = [
    {
      code: 'line-item/item',
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(2),
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(2000, 'USD'),
      reversal: false,
    },
    {
      code: 'line-item/provider-commission',
      includeFor: ['provider'],
      unitPrice: new Money(-100, 'USD'),
      lineTotal: new Money(-100, 'USD'),
      reversal: false,
    },
  ];
  const commonProps = {
    dispatch: noop,
    history: { push: noop, action: 'PUSH' },
    intl: fakeIntl,
    currentUser: createCurrentUser('currentUser'),
    params: { id: 'listing1', slug: 'listing1' },
    sendOrderRequest: noop,
    fetchStripeCustomer: noop,
    stripeCustomerFetched: true,
    fetchSpeculatedTransaction: noop,
    speculateTransactionInProgress: false,
    scrollingDisabled: false,
    onConfirmPayment: noop,
    onConfirmCardPayment: noop,
    onInitiateOrder: noop,
    onRetrievePaymentIntent: noop,
    onSavePaymentMethod: noop,
    onSendMessage: noop,
    confirmCardPaymentInProgress: false,
    config: getDefaultConfiguration(),
    routeConfiguration,
  };

  test('Check that purchase has relevant info', () => {
    const listing = createListing(
      'listing1',
      { publicData: { transactionProcessAlias: 'default-purchase', unitType: 'item' } },
      { author: createUser('author') }
    );

    const shippingFeeLineItem = [
      {
        code: 'line-item/shipping-fee',
        includeFor: ['customer', 'provider'],
        unitPrice: new Money(500, 'USD'),
        quantity: new Decimal(1),
        lineTotal: new Money(500, 'USD'),
        reversal: false,
      },
    ];
    const props = {
      ...commonProps,
      orderData: { quantity: 2, deliveryMethod: 'shipping' },
      listing,
      speculatedTransaction: createTransaction({
        id: 'tx1',
        lineItems: lineItems.concat(shippingFeeLineItem),
        total: new Money(2500, 'USD'),
      }),
    };

    render(<CheckoutPageComponent {...props} />);

    const purchaseTitle = 'CheckoutPage.default-purchase.title';
    expect(screen.getByRole('heading', { name: purchaseTitle })).toBeInTheDocument();
    const orderBreakdownTitle = 'CheckoutPage.default-purchase.orderBreakdown';
    expect(screen.getByRole('heading', { name: orderBreakdownTitle })).toBeInTheDocument();
    // These are rendered twice (mobile & desktop)
    expect(screen.getAllByText('OrderBreakdown.baseUnitQuantity')).toHaveLength(2);
    expect(screen.getAllByText('OrderBreakdown.shippingFee')).toHaveLength(2);
    expect(screen.getAllByText('OrderBreakdown.total')).toHaveLength(2);

    const getTextbox = name => screen.getByRole('textbox', { name });

    const shippingHeading = 'ShippingDetails.title';
    expect(screen.getByRole('heading', { name: shippingHeading })).toBeInTheDocument();
    expect(getTextbox('ShippingDetails.recipientNameLabel')).toBeInTheDocument();
    expect(getTextbox('ShippingDetails.recipientPhoneNumberLabel')).toBeInTheDocument();
    expect(getTextbox('ShippingDetails.addressLine1Label')).toBeInTheDocument();
    expect(getTextbox('ShippingDetails.addressLine2Label')).toBeInTheDocument();
    expect(getTextbox('ShippingDetails.postalCodeLabel')).toBeInTheDocument();
    expect(getTextbox('ShippingDetails.cityLabel')).toBeInTheDocument();
    expect(getTextbox('ShippingDetails.stateLabel')).toBeInTheDocument();

    const paymentHeading = 'StripePaymentForm.paymentHeading';
    expect(screen.getByRole('heading', { name: paymentHeading })).toBeInTheDocument();

    const billingDetails = 'StripePaymentForm.billingDetails';
    expect(screen.getByRole('heading', { name: billingDetails })).toBeInTheDocument();
    expect(getTextbox('StripePaymentForm.billingDetailsNameLabel')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.addressLine1Label')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.addressLine2Label')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.postalCodeLabel')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.cityLabel')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.stateLabel')).toBeInTheDocument();
    expect(getTextbox('StripePaymentForm.messageLabel')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'StripePaymentForm.submitPaymentInfo' })
    ).toBeInTheDocument();
  });

  test('Check that booking has relevant info', () => {
    const listing = createListing(
      'listing1',
      { publicData: { transactionProcessAlias: 'default-booking', unitType: 'day' } },
      { author: createUser('author') }
    );

    const props = {
      ...commonProps,
      orderData: { quantity: 2 },
      listing,
      speculatedTransaction: createTransaction({
        id: 'tx1',
        lineItems,
        total: new Money(2500, 'USD'),
      }),
    };
    render(<CheckoutPageComponent {...props} />);

    const bookingTitle = 'CheckoutPage.default-booking.title';
    expect(screen.getByRole('heading', { name: bookingTitle })).toBeInTheDocument();
    const orderBreakdownTitle = 'CheckoutPage.default-booking.orderBreakdown';
    expect(screen.getByRole('heading', { name: orderBreakdownTitle })).toBeInTheDocument();

    // These are rendered twice (mobile & desktop)
    expect(screen.getAllByText('OrderBreakdown.baseUnitQuantity')).toHaveLength(2);
    expect(screen.queryAllByText('OrderBreakdown.shippingFee')).toHaveLength(0);
    expect(screen.getAllByText('OrderBreakdown.total')).toHaveLength(2);

    const getTextbox = name => screen.getByRole('textbox', { name });

    const paymentHeading = 'StripePaymentForm.paymentHeading';
    expect(screen.getByRole('heading', { name: paymentHeading })).toBeInTheDocument();

    const billingDetails = 'StripePaymentForm.billingDetails';
    expect(screen.getByRole('heading', { name: billingDetails })).toBeInTheDocument();
    expect(getTextbox('StripePaymentForm.billingDetailsNameLabel')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.addressLine1Label')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.addressLine2Label')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.postalCodeLabel')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.cityLabel')).toBeInTheDocument();
    expect(getTextbox('StripePaymentAddress.stateLabel')).toBeInTheDocument();
    expect(getTextbox('StripePaymentForm.messageLabel')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'StripePaymentForm.submitPaymentInfo' })
    ).toBeInTheDocument();
  });

  describe('Duck', () => {
    it('ActionCreator: setInitialValues(initialValues)', () => {
      const listing = createListing(
        '00000000-0000-0000-0000-000000000000',
        {},
        {
          author: createUser('author1'),
        }
      );
      const orderData = { quantity: 3, deliveryMethod: 'shipping' };
      const expectedAction = {
        type: SET_INITIAL_VALUES,
        payload: { listing, orderData },
      };

      expect(setInitialValues({ listing, orderData })).toEqual(expectedAction);
    });

    describe('Reducer', () => {
      const initialValues = {
        initiateOrderError: null,
        listing: null,
        orderData: null,
        stripeCustomerFetched: false,
        speculateTransactionError: null,
        speculateTransactionInProgress: false,
        speculatedTransaction: null,
        transaction: null,
        confirmPaymentError: null,
      };

      it('should return the initial state', () => {
        expect(checkoutPageReducer(undefined, {})).toEqual(initialValues);
      });

      it('should handle SET_INITIAL_VALUES', () => {
        const listing = createListing(
          '00000000-0000-0000-0000-000000000000',
          {},
          {
            author: createUser('author1'),
          }
        );
        const orderData = { quantity: 3, deliveryMethod: 'shipping' };
        const payload = { listing, orderData };
        const expected = { ...initialValues, ...payload };
        expect(checkoutPageReducer({}, { type: SET_INITIAL_VALUES, payload })).toEqual(expected);
      });
    });
  });
});
