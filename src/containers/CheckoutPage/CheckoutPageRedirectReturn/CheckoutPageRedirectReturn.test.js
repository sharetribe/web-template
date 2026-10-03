import React from 'react';
import '@testing-library/jest-dom';

import { createListing, createTransaction, createUser } from '../../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getDefaultConfiguration,
} from '../../../util/testHelpers';
import { getProcess } from '../../../transactions/transaction';

import CheckoutPageRedirectReturn from './CheckoutPageRedirectReturn';
import {
  resolveStripeInstance,
  resumeCheckoutAfterStripeRedirect,
} from './CheckoutPageRedirectReturn.helpers';
import { storeData } from '../CheckoutPageSessionHelpers';

const { waitFor } = testingLibrary;
const noop = () => null;
const STORAGE_KEY = 'CheckoutPage';

const mockHistory = {
  action: 'POP',
  location: { pathname: '/l/listing1/listing1/checkout/return', search: '' },
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => mockHistory,
  };
});

const routeConfiguration = [
  {
    path: '/',
    name: 'LandingPage',
    component: props => <div />,
  },
  {
    path: '/l/:slug/:id/checkout',
    name: 'CheckoutPage',
    component: props => <div />,
  },
  {
    path: '/l/:slug/:id/checkout/return',
    name: 'CheckoutRedirectReturnPage',
    component: props => <div />,
  },
  {
    path: '/order/:id',
    name: 'OrderDetailsPage',
    component: props => <div />,
    setInitialValues: noop,
  },
];

const defaultReturnProps = {
  params: { id: 'listing1', slug: 'listing1' },
  pageData: {},
  setPageData: noop,
  isDataLoaded: true,
  processName: null,
  onConfirmPayment: noop,
  onRetrievePaymentIntent: noop,
  scrollingDisabled: false,
};

describe('CheckoutPageRedirectReturn.helpers', () => {
  afterEach(() => {
    delete window.Stripe;
  });

  it('resolveStripeInstance returns Stripe when window.Stripe exists', () => {
    const stripeMock = { retrievePaymentIntent: noop };
    window.Stripe = jest.fn(() => stripeMock);
    expect(resolveStripeInstance('pk_test')).toBe(stripeMock);
    expect(window.Stripe).toHaveBeenCalledWith('pk_test');
  });

  it('resumeCheckoutAfterStripeRedirect retrieves PI and confirms payment', async () => {
    const process = getProcess('default-purchase');
    const transaction = createTransaction({
      id: 'tx-return-1',
      lastTransition: process.transitions.REQUEST_PAYMENT,
      transitions: [],
    });
    const pageData = {
      orderData: { quantity: 1 },
      listing: createListing('listing1', {}, { author: createUser('author') }),
      transaction,
    };
    const onRetrievePaymentIntent = jest.fn(() =>
      Promise.resolve({ paymentIntent: { status: 'succeeded', id: 'pi_1' } })
    );
    const confirmedOrder = { ...transaction, attributes: { ...transaction.attributes } };
    const onConfirmPayment = jest.fn(() => Promise.resolve(confirmedOrder));
    const setPageData = jest.fn();

    const result = await resumeCheckoutAfterStripeRedirect({
      pageData,
      stripe: {},
      process,
      onConfirmPayment,
      onRetrievePaymentIntent,
      stripePaymentIntentClientSecretFromRedirect: 'pi_secret',
      sessionStorageKey: STORAGE_KEY,
      setPageData,
    });

    expect(onRetrievePaymentIntent).toHaveBeenCalledWith({
      stripe: {},
      stripePaymentIntentClientSecret: 'pi_secret',
    });
    expect(onConfirmPayment).toHaveBeenCalled();
    expect(result).toBe(confirmedOrder);
  });

  it('resumeCheckoutAfterStripeRedirect rejects unexpected PaymentIntent status', async () => {
    const process = getProcess('default-purchase');
    const transaction = createTransaction({
      id: 'tx-return-2',
      lastTransition: process.transitions.REQUEST_PAYMENT,
      transitions: [],
    });
    const pageData = {
      orderData: {},
      listing: createListing('listing1', {}, { author: createUser('author') }),
      transaction,
    };

    await expect(
      resumeCheckoutAfterStripeRedirect({
        pageData,
        stripe: {},
        process,
        onConfirmPayment: jest.fn(),
        onRetrievePaymentIntent: jest.fn(() =>
          Promise.resolve({ paymentIntent: { status: 'requires_payment_method' } })
        ),
        stripePaymentIntentClientSecretFromRedirect: 'pi_secret_fail',
        sessionStorageKey: STORAGE_KEY,
        setPageData: jest.fn(),
      })
    ).rejects.toMatchObject({ redirectPaymentStatus: 'requires_payment_method' });
  });
});

describe('CheckoutPageRedirectReturn', () => {
  beforeEach(() => {
    mockHistory.push.mockClear();
    mockHistory.replace.mockClear();
    mockHistory.action = 'POP';
    mockHistory.location = {
      pathname: '/l/listing1/listing1/checkout/return',
      search: '',
    };
    window.matchMedia = jest.fn(() => ({
      matches: true,
      addEventListener: noop,
      removeEventListener: noop,
    }));
    window.Stripe = jest.fn(() => ({}));
  });

  afterEach(() => {
    window.sessionStorage.clear();
    delete window.Stripe;
    jest.clearAllMocks();
  });

  it('renders a spinner while processing the return', () => {
    const { container } = render(<CheckoutPageRedirectReturn {...defaultReturnProps} />, {
      config: getDefaultConfiguration(),
      routeConfiguration,
      initialState: {
        ui: { disableScrollRequests: [] },
        user: { currentUser: null },
        stripe: {},
        CheckoutPage: {},
      },
    });

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('replaces to CheckoutPage with failed state when return params are missing', async () => {
    render(<CheckoutPageRedirectReturn {...defaultReturnProps} />, {
      config: getDefaultConfiguration(),
      routeConfiguration,
      initialState: {
        ui: { disableScrollRequests: [] },
        user: { currentUser: null },
        stripe: {},
        CheckoutPage: {},
      },
    });

    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith({
        pathname: '/l/listing1/listing1/checkout',
        state: { redirectPaymentStatusError: 'failed' },
      });
    });
  });

  it('replaces to CheckoutPage when Stripe reports redirect_status=failed', async () => {
    mockHistory.location = {
      pathname: '/l/listing1/listing1/checkout/return',
      search: '?redirect_status=failed&payment_intent_client_secret=sec_failed',
    };

    const listing = createListing(
      'listing1',
      { publicData: { transactionProcessAlias: 'default-purchase/release-1', unitType: 'item' } },
      { author: createUser('author') }
    );
    const process = getProcess('default-purchase');
    const transaction = createTransaction({
      id: 'tx-failed-return',
      lastTransition: process.transitions.REQUEST_PAYMENT,
      transitions: [],
    });
    storeData({ quantity: 1 }, listing, transaction, STORAGE_KEY);

    render(
      <CheckoutPageRedirectReturn
        {...defaultReturnProps}
        pageData={{ orderData: { quantity: 1 }, listing, transaction }}
        processName="default-purchase"
      />,
      {
        config: getDefaultConfiguration(),
        routeConfiguration,
        initialState: {
          ui: { disableScrollRequests: [] },
          user: { currentUser: null },
          stripe: {},
          CheckoutPage: {},
        },
      }
    );

    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith({
        pathname: '/l/listing1/listing1/checkout',
        state: { redirectPaymentStatusError: 'failed' },
      });
    });
  });

  it('replaces to CheckoutPage when Stripe reports redirect_status=canceled', async () => {
    mockHistory.location = {
      pathname: '/l/listing1/listing1/checkout/return',
      search: '?redirect_status=canceled&payment_intent_client_secret=sec_canceled',
    };

    render(<CheckoutPageRedirectReturn {...defaultReturnProps} />, {
      config: getDefaultConfiguration(),
      routeConfiguration,
      initialState: {
        ui: { disableScrollRequests: [] },
        user: { currentUser: null },
        stripe: {},
        CheckoutPage: {},
      },
    });

    await waitFor(() => {
      expect(mockHistory.replace).toHaveBeenCalledWith({
        pathname: '/l/listing1/listing1/checkout',
        state: { redirectPaymentStatusError: 'canceled' },
      });
    });
  });
});
