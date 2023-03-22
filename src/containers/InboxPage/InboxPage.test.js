import React from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import { LINE_ITEM_ITEM, LINE_ITEM_PROVIDER_COMMISSION } from '../../util/types';
import {
  createUser,
  createCurrentUser,
  createListing,
  fakeIntl,
  createTransaction,
} from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  getProcess,
} from '../../transactions/transaction';

import { getStateData } from './InboxPage.stateData';
import { InboxPageComponent, InboxItem } from './InboxPage';

const { Money } = sdkTypes;
const { screen, within } = testingLibrary;
const noop = () => null;

const transitions = getProcess('default-purchase')?.transitions;

describe('InboxPage', () => {
  const provider = createUser('provider-user-id');
  const customer = createUser('customer-user-id');
  const currentUserProvider = createCurrentUser('provider-user-id');
  const currentUserCustomer = createCurrentUser('customer-user-id');
  const listing = createListing('ItemX', {
    publicData: {
      listingType: 'sell-bikes',
      transactionProcessAlias: 'default-purchase',
      unitType: 'item',
    },
  });

  const lineItems = [
    {
      code: LINE_ITEM_ITEM,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(1),
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(1000, 'USD'),
      reversal: false,
    },
    {
      code: LINE_ITEM_PROVIDER_COMMISSION,
      includeFor: ['provider'],
      unitPrice: new Money(100 * -1, 'USD'),
      lineTotal: new Money(100 * -1, 'USD'),
      reversal: false,
    },
  ];

  const ordersProps = {
    location: { search: '' },
    history: {
      push: () => console.log('HistoryPush called'),
    },
    params: {
      tab: 'orders',
    },
    authInProgress: false,
    currentUser: currentUserProvider,
    currentUserHasListings: false,
    isAuthenticated: false,
    fetchInProgress: false,
    onLogout: noop,
    onManageDisableScrolling: noop,
    transactions: [
      createTransaction({
        id: 'order-1',
        lastTransition: transitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2017, 0, 15)),
        lineItems,
      }),
      createTransaction({
        id: 'order-2',
        lastTransition: transitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2016, 0, 15)),
        lineItems,
      }),
    ],
    intl: fakeIntl,
    scrollingDisabled: false,
    sendVerificationEmailInProgress: false,
    onResendVerificationEmail: noop,
  };

  const salesProps = {
    location: { search: '' },
    history: {
      push: () => console.log('HistoryPush called'),
    },
    params: {
      tab: 'sales',
    },
    authInProgress: false,
    currentUser: currentUserCustomer,
    currentUserHasListings: false,
    isAuthenticated: false,
    fetchInProgress: false,
    onLogout: noop,
    onManageDisableScrolling: noop,
    transactions: [
      createTransaction({
        id: 'sale-1',
        lastTransition: transitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2017, 0, 15)),
        lineItems,
      }),
      createTransaction({
        id: 'sale-2',
        lastTransition: transitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2016, 0, 15)),
        lineItems,
      }),
    ],
    intl: fakeIntl,
    scrollingDisabled: false,
    sendVerificationEmailInProgress: false,
    onResendVerificationEmail: noop,
  };

  test('InboxPageComponent has tabs and inbox items for orders', () => {
    render(<InboxPageComponent {...ordersProps} />);

    // Has links to orders and sales tabs
    const ordersTabTitle = screen.getByRole('link', { name: 'InboxPage.ordersTabTitle' });
    expect(ordersTabTitle).toBeInTheDocument();
    expect(ordersTabTitle.getAttribute('href')).toContain('/inbox/orders');

    const salesTabTitle = screen.getByRole('link', { name: 'InboxPage.salesTabTitle' });
    expect(salesTabTitle).toBeInTheDocument();
    expect(salesTabTitle.getAttribute('href')).toContain('/inbox/sales');

    // Has 2 items
    const items = screen.queryAllByRole('link', { name: /ItemX/i });
    expect(items).toHaveLength(2);

    const item1 = items[0];
    expect(item1.getAttribute('href')).toContain('/order/order-1');
    const status1 = within(item1).getByText('InboxPage.default-purchase.purchased.status');
    expect(status1).toBeInTheDocument();

    const item2 = items[1];
    expect(item2.getAttribute('href')).toContain('/order/order-2');
    const status2 = within(item2).getByText('InboxPage.default-purchase.purchased.status');
    expect(status2).toBeInTheDocument();
  });

  // This is quite small component what comes to rendered HTML
  // For now, we rely on snapshot-testing and checking quantity.
  test('InboxItem matches snapshot of order', () => {
    const stateDataOrder = getStateData({
      transaction: ordersProps.transactions[0],
      transactionRole: TX_TRANSITION_ACTOR_CUSTOMER,
    });

    const tree = render(
      <InboxItem
        tx={ordersProps.transactions[0]}
        transactionRole={TX_TRANSITION_ACTOR_CUSTOMER}
        intl={fakeIntl}
        stateData={stateDataOrder}
        isBooking={false}
        stockType="multipleItems"
      />
    );
    expect(tree.asFragment().firstChild).toMatchSnapshot();
    expect(screen.getByText('InboxPage.quantity')).toBeInTheDocument();
  });

  test('InboxPageComponent has tabs and inbox items for sales', () => {
    render(<InboxPageComponent {...salesProps} />);

    // Has links to orders and sales tabs
    const ordersTabTitle = screen.getByRole('link', { name: 'InboxPage.ordersTabTitle' });
    expect(ordersTabTitle).toBeInTheDocument();
    expect(ordersTabTitle.getAttribute('href')).toContain('/inbox/orders');

    const salesTabTitle = screen.getByRole('link', { name: 'InboxPage.salesTabTitle' });
    expect(salesTabTitle).toBeInTheDocument();
    expect(salesTabTitle.getAttribute('href')).toContain('/inbox/sales');

    // Has 2 items
    const items = screen.queryAllByRole('link', { name: /ItemX/i });
    expect(items).toHaveLength(2);

    const item1 = items[0];
    expect(item1.getAttribute('href')).toContain('/sale/sale-1');
    const status1 = within(item1).getByText('InboxPage.default-purchase.purchased.status');
    expect(status1).toBeInTheDocument();

    const item2 = items[1];
    expect(item2.getAttribute('href')).toContain('/sale/sale-2');
    const status2 = within(item2).getByText('InboxPage.default-purchase.purchased.status');
    expect(status2).toBeInTheDocument();
  });

  // This is quite small component what comes to rendered HTML
  // For now, we rely on snapshot-testing and checking quantity.
  test('InboxItem matches snapshot of sales', () => {
    const stateDataOrder = getStateData({
      transaction: salesProps.transactions[0],
      transactionRole: TX_TRANSITION_ACTOR_PROVIDER,
    });

    const tree = render(
      <InboxItem
        tx={salesProps.transactions[0]}
        transactionRole={TX_TRANSITION_ACTOR_PROVIDER}
        intl={fakeIntl}
        stateData={stateDataOrder}
        isBooking={false}
        stockType="oneItem"
      />
    );
    expect(tree.asFragment().firstChild).toMatchSnapshot();
    expect(screen.queryByText('InboxPage.quantity')).not.toBeInTheDocument();
  });
});
