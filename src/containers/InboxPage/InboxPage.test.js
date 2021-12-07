import React from 'react';
import Decimal from 'decimal.js';

import { renderShallow, renderDeep } from '../../util/test-helpers';
import {
  fakeIntl,
  createCurrentUser,
  createUser,
  createListing,
  createTransaction,
} from '../../util/test-data';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  getProcess,
} from '../../util/transaction';
import { LINE_ITEM_ITEM, LINE_ITEM_PROVIDER_COMMISSION } from '../../util/types';

import { getStateData } from './InboxPage.stateData';
import { InboxPageComponent, InboxItem } from './InboxPage';

const { Money } = sdkTypes;
const noop = () => null;
const transitions = getProcess('flex-product-default-process')?.transitions;

describe('InboxPage', () => {
  it('matches snapshot', () => {
    const provider = createUser('provider-user-id');
    const customer = createUser('customer-user-id');
    const currentUserProvider = createCurrentUser('provider-user-id');
    const currentUserCustomer = createCurrentUser('customer-user-id');
    const listing = createListing('ItemX', {
      publicData: { transactionProcessAlias: 'flex-product-default-process', unitType: 'item' },
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

    const ordersTree = renderShallow(<InboxPageComponent {...ordersProps} />);
    expect(ordersTree).toMatchSnapshot();

    const stateDataOrder = getStateData({
      transaction: ordersProps.transactions[0],
      transactionRole: TX_TRANSITION_ACTOR_CUSTOMER,
    });

    // Deeply render one InboxItem
    const orderItem = renderDeep(
      <InboxItem
        tx={ordersProps.transactions[0]}
        transactionRole={TX_TRANSITION_ACTOR_CUSTOMER}
        intl={fakeIntl}
        stateData={stateDataOrder}
      />
    );
    expect(orderItem).toMatchSnapshot();

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

    const salesTree = renderShallow(<InboxPageComponent {...salesProps} />);
    expect(salesTree).toMatchSnapshot();

    const stateDataSale = getStateData({
      transaction: salesProps.transactions[0],
      transactionRole: TX_TRANSITION_ACTOR_PROVIDER,
    });

    // Deeply render one InboxItem
    const saleItem = renderDeep(
      <InboxItem
        type="sale"
        tx={salesProps.transactions[0]}
        transactionRole={TX_TRANSITION_ACTOR_PROVIDER}
        intl={fakeIntl}
        stateData={stateDataSale}
      />
    );
    expect(saleItem).toMatchSnapshot();
  });
});
