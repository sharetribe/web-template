import React from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import {
  createCurrentUser,
  createImage,
  createListing,
  createTransaction,
  createUser,
  fakeIntl,
} from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getDefaultConfiguration,
} from '../../util/testHelpers';

import { getOrderParams } from './CheckoutPageWithPayment';

// ---------------------------------------------------------------------------
// Unit tests for the exported getOrderParams helper (deterministic part).
// ---------------------------------------------------------------------------
describe('getOrderParams avShippingType', () => {
  const base = {
    listing: { id: { uuid: 'l1' }, attributes: { publicData: {} } },
    orderData: { deliveryMethod: 'shipping', avShippingType: 'nacionalEstandar', quantity: 1 },
  };

  test('puts avShippingType in both top-level and protectedData', () => {
    const params = getOrderParams(base, {}, {}, { listing: { listingTypes: [] } });
    expect(params.avShippingType).toBe('nacionalEstandar');
    expect(params.protectedData.avShippingType).toBe('nacionalEstandar');
  });

  test('omits avShippingType when not selected (pickup orders unaffected)', () => {
    const pickup = {
      listing: { id: { uuid: 'l1' }, attributes: { publicData: {} } },
      orderData: { deliveryMethod: 'pickup', quantity: 1 },
    };
    const params = getOrderParams(pickup, {}, {}, { listing: { listingTypes: [] } });
    expect(params.avShippingType).toBeUndefined();
    expect(params.protectedData.avShippingType).toBeUndefined();
  });

  test("defaults deliveryMethod to 'shipping' for a purchase listing when unset", () => {
    const noDelivery = {
      listing: {
        id: { uuid: 'l1' },
        attributes: { publicData: { transactionProcessAlias: 'default-purchase/release-1' } },
      },
      orderData: { quantity: 1 },
    };
    const params = getOrderParams(noDelivery, {}, {}, { listing: { listingTypes: [] } });
    expect(params.deliveryMethod).toBe('shipping');
    expect(params.protectedData.deliveryMethod).toBe('shipping');
  });

  test("maps the 'none' deliveryMethod sentinel to 'shipping' for a purchase listing", () => {
    const noneDelivery = {
      listing: {
        id: { uuid: 'l1' },
        attributes: { publicData: { transactionProcessAlias: 'default-purchase/release-1' } },
      },
      orderData: { deliveryMethod: 'none', quantity: 1 },
    };
    const params = getOrderParams(noneDelivery, {}, {}, { listing: { listingTypes: [] } });
    expect(params.deliveryMethod).toBe('shipping');
  });

  test('keeps an explicit pickup deliveryMethod for a purchase listing', () => {
    const pickup = {
      listing: {
        id: { uuid: 'l1' },
        attributes: { publicData: { transactionProcessAlias: 'default-purchase/release-1' } },
      },
      orderData: { deliveryMethod: 'pickup', quantity: 1 },
    };
    const params = getOrderParams(pickup, {}, {}, { listing: { listingTypes: [] } });
    expect(params.deliveryMethod).toBe('pickup');
  });
});

// ---------------------------------------------------------------------------
// Behavioral tests for the selector + payment gate. The price grid ships
// unpriced, so we mock configAVShipping to surface a priced delivery type.
// ---------------------------------------------------------------------------
// configAVShipping is CommonJS; automock yields jest.fn() exports whose
// implementation we set per-test (named-import interop returns undefined
// otherwise). The price grid ships unpriced, so this is how we surface a type.
jest.mock('../../config/configAVShipping');
// eslint-disable-next-line import/first
import * as configAVShipping from '../../config/configAVShipping';
// eslint-disable-next-line import/first
import CheckoutPageWithPayment from './CheckoutPageWithPayment';

const { Money } = sdkTypes;
const { screen, fireEvent } = testingLibrary;
const noop = () => null;

describe('CheckoutPageWithPayment AV shipping selector', () => {
  beforeEach(() => {
    configAVShipping.getAvailableDeliveryTypes.mockReturnValue([
      'nacionalExpress',
      'nacionalEstandar',
    ]);
    configAVShipping.getShippingPrice.mockReturnValue(9900);
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

  const lineItems = [
    {
      code: 'line-item/item',
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(1),
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(1000, 'USD'),
      reversal: false,
    },
  ];

  const listing = createListing(
    'listing1',
    {
      publicData: {
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
        avPackageSize: 'M',
      },
    },
    { author: createUser('author'), images: [createImage('first-image')] }
  );

  const baseProps = {
    dispatch: noop,
    history: { push: noop, action: 'PUSH' },
    intl: fakeIntl,
    currentUser: createCurrentUser('currentUser'),
    params: { id: 'listing1', slug: 'listing1' },
    fetchStripeCustomer: noop,
    stripeCustomerFetched: true,
    speculateTransactionInProgress: false,
    scrollingDisabled: false,
    onConfirmPayment: noop,
    onConfirmCardPayment: noop,
    onInitiateOrder: noop,
    onRetrievePaymentIntent: noop,
    onSavePaymentMethod: noop,
    config: getDefaultConfiguration(),
    routeConfiguration: [{ path: '/', name: 'LandingPage', component: () => <div /> }],
    processName: 'default-purchase',
    listingTitle: listing.attributes.title,
    title: 'CheckoutPage.default-purchase.title',
    speculatedTransaction: createTransaction({
      id: 'tx1',
      lineItems,
      total: new Money(1000, 'USD'),
    }),
  };

  const shippingPageData = {
    orderData: { quantity: 1, deliveryMethod: 'shipping' },
    listing,
  };

  it('renders the delivery-type selector for a shipping purchase', () => {
    render(
      <CheckoutPageWithPayment
        {...baseProps}
        pageData={shippingPageData}
        setPageData={noop}
        fetchSpeculatedTransaction={noop}
      />
    );
    expect(screen.getByText('AVShippingTypeSelector.legend')).toBeInTheDocument();
  });

  it('renders the selector for a purchase even when deliveryMethod is unset', () => {
    render(
      <CheckoutPageWithPayment
        {...baseProps}
        pageData={{ orderData: { quantity: 1 }, listing }}
        setPageData={noop}
        fetchSpeculatedTransaction={noop}
      />
    );
    expect(screen.getByText('AVShippingTypeSelector.legend')).toBeInTheDocument();
  });

  it("renders the selector for a purchase when deliveryMethod is the 'none' sentinel", () => {
    render(
      <CheckoutPageWithPayment
        {...baseProps}
        pageData={{ orderData: { quantity: 1, deliveryMethod: 'none' }, listing }}
        setPageData={noop}
        fetchSpeculatedTransaction={noop}
      />
    );
    expect(screen.getByText('AVShippingTypeSelector.legend')).toBeInTheDocument();
  });

  it('hides the payment form until a delivery type is selected', () => {
    render(
      <CheckoutPageWithPayment
        {...baseProps}
        pageData={shippingPageData}
        setPageData={noop}
        fetchSpeculatedTransaction={noop}
      />
    );
    // Payment heading lives inside StripePaymentForm, which is gated.
    expect(
      screen.queryByRole('heading', { name: 'StripePaymentForm.paymentHeading' })
    ).not.toBeInTheDocument();
  });

  it('shows the payment form once a type is pre-selected', () => {
    render(
      <CheckoutPageWithPayment
        {...baseProps}
        pageData={{
          ...shippingPageData,
          orderData: { ...shippingPageData.orderData, avShippingType: 'nacionalEstandar' },
        }}
        setPageData={noop}
        fetchSpeculatedTransaction={noop}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'StripePaymentForm.paymentHeading' })
    ).toBeInTheDocument();
  });

  it('persists the choice and re-speculates when a type is selected', () => {
    const setPageData = jest.fn();
    const fetchSpeculatedTransaction = jest.fn();
    render(
      <CheckoutPageWithPayment
        {...baseProps}
        pageData={shippingPageData}
        setPageData={setPageData}
        fetchSpeculatedTransaction={fetchSpeculatedTransaction}
      />
    );
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);

    expect(setPageData).toHaveBeenCalledTimes(1);
    const nextPageData = setPageData.mock.calls[0][0];
    expect(nextPageData.orderData.avShippingType).toBe('nacionalExpress');
    // Re-speculation fires with the new type in the orderParams.
    expect(fetchSpeculatedTransaction).toHaveBeenCalledTimes(1);
    expect(fetchSpeculatedTransaction.mock.calls[0][0].avShippingType).toBe('nacionalExpress');
  });

  it('does not render the selector or gate payment for pickup orders', () => {
    render(
      <CheckoutPageWithPayment
        {...baseProps}
        pageData={{ orderData: { quantity: 1, deliveryMethod: 'pickup' }, listing }}
        setPageData={noop}
        fetchSpeculatedTransaction={noop}
      />
    );
    expect(screen.queryByText('AVShippingTypeSelector.legend')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'StripePaymentForm.paymentHeading' })
    ).toBeInTheDocument();
  });
});
