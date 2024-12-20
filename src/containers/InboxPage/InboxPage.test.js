import React from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LINE_ITEM_DAY,
  LINE_ITEM_HOUR,
  LINE_ITEM_ITEM,
  LINE_ITEM_NIGHT,
  LINE_ITEM_PROVIDER_COMMISSION,
} from '../../util/types';
import {
  createUser,
  createCurrentUser,
  createListing,
  fakeIntl,
  createTransaction,
  createBooking,
} from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  getProcess,
} from '../../transactions/transaction';

import { getStateData } from './InboxPage.stateData';
import InboxPage, { InboxItem } from './InboxPage';

const { Money } = sdkTypes;
const { screen, waitFor, within } = testingLibrary;
const noop = () => null;

const bookingTransitions = getProcess('default-booking')?.transitions;
const purchaseTransitions = getProcess('default-purchase')?.transitions;
const inquiryTransitions = getProcess('default-inquiry')?.transitions;

describe('InboxPage', () => {
  const provider = createUser('provider');
  const customer = createUser('customer');
  const listing = createListing('listing1', {
    publicData: {
      listingType: 'sell-bikes',
      transactionProcessAlias: 'default-purchase',
      unitType: 'item',
    },
  });
  const booking = createBooking('booking1', {
    start: new Date(Date.UTC(2023, 5, 14)),
    end: new Date(Date.UTC(2023, 5, 16)),
  });
  const lineItemUnitTypeItem = {
    code: LINE_ITEM_ITEM,
    includeFor: ['customer', 'provider'],
    quantity: new Decimal(1),
    unitPrice: new Money(1000, 'USD'),
    lineTotal: new Money(1000, 'USD'),
    reversal: false,
  };
  const lineItemProviderCommission = {
    code: LINE_ITEM_PROVIDER_COMMISSION,
    includeFor: ['provider'],
    unitPrice: new Money(100 * -1, 'USD'),
    lineTotal: new Money(100 * -1, 'USD'),
    reversal: false,
  };

  const lineItems = [lineItemUnitTypeItem, lineItemProviderCommission];

  describe('with initial state in store', () => {
    const currentUserProvider = createCurrentUser('provider-user-id');
    const currentUserCustomer = createCurrentUser('customer-user-id');

    // ORDERS
    it('has tabs and inbox items for orders on InboxPage', async () => {
      const order1 = createTransaction({
        id: 'order1',
        lastTransition: purchaseTransitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 0, 15)),
        lineItems,
        availabilityType: 'oneSeat',
      });
      const order2 = createTransaction({
        id: 'order2',
        lastTransition: bookingTransitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        booking,
        lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
        lineItems,
        availabilityType: 'oneSeat',
      });

      // We'll initialize the store with relevant data for Inbox
      const initialState = {
        InboxPage: {
          fetchInProgress: false,
          fetchOrdersOrSalesError: null,
          pagination: {
            page: 1,
            perPage: 1,
            totalItems: 2,
            totalPages: 2,
          },
          transactionRefs: [
            { id: order1.id, type: order1.type },
            { id: order2.id, type: order2.type },
          ],
        },
        marketplaceData: {
          entities: {
            booking: {
              booking1: booking,
            },
            transaction: {
              order1,
              order2,
            },
            user: {
              customer,
              provider,
            },
            listing: {
              listing1: listing,
            },
          },
        },
        user: {
          currentUser: currentUserProvider,
          currentUserHasListings: false,
          sendVerificationEmailInProgress: false,
        },
      };

      const ordersProps = {
        params: {
          tab: 'orders',
        },
        scrollingDisabled: false,
        onManageDisableScrolling: noop,
        sendVerificationEmailInProgress: false,
        onResendVerificationEmail: noop,
      };

      render(<InboxPage {...ordersProps} />, {
        initialState,
      });

      await waitFor(() => {
        // Has links to orders tab
        const ordersTabTitle = screen.getByRole('link', { name: 'InboxPage.ordersTabTitle' });
        expect(ordersTabTitle).toBeInTheDocument();
        expect(ordersTabTitle.getAttribute('href')).toContain('/inbox/orders');

        // Has links to sales tab
        const salesTabTitle = screen.getByRole('link', { name: 'InboxPage.salesTabTitle' });
        expect(salesTabTitle).toBeInTheDocument();
        expect(salesTabTitle.getAttribute('href')).toContain('/inbox/sales');

        // Has 2 items
        const items = screen.queryAllByRole('link', { name: /listing1/i });
        expect(items).toHaveLength(2);

        const item1 = items[0];
        expect(item1.getAttribute('href')).toContain('/order/order1');
        const status1 = within(item1).getByText('InboxPage.default-purchase.purchased.status');
        expect(status1).toBeInTheDocument();

        const item2 = items[1];
        expect(item2.getAttribute('href')).toContain('/order/order2');
        const status2 = within(item2).getByText('InboxPage.default-purchase.purchased.status');
        expect(status2).toBeInTheDocument();
      });
    });

    // SALES
    it('has tabs and inbox items for sales on InboxPage', async () => {
      const sale1 = createTransaction({
        id: 'sale1',
        lastTransition: purchaseTransitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        lastTransitionedAt: new Date(Date.UTC(2023, 0, 15)),
        lineItems,
      });
      const sale2 = createTransaction({
        id: 'sale2',
        lastTransition: bookingTransitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        booking,
        lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
        lineItems,
      });
      // We'll initialize the store with relevant data for Inbox
      const initialState = {
        InboxPage: {
          fetchInProgress: false,
          fetchOrdersOrSalesError: null,
          pagination: {
            page: 1,
            perPage: 1,
            totalItems: 2,
            totalPages: 2,
          },
          transactionRefs: [{ id: sale1.id, type: sale1.type }, { id: sale2.id, type: sale2.type }],
        },
        marketplaceData: {
          entities: {
            transaction: {
              sale1,
              sale2,
            },
            user: {
              customer,
              provider,
            },
            listing: {
              listing1: listing,
            },
          },
        },
        user: {
          currentUser: currentUserCustomer,
          currentUserHasListings: false,
          sendVerificationEmailInProgress: false,
        },
      };

      const salesProps = {
        params: {
          tab: 'sales',
        },
        scrollingDisabled: false,
        onManageDisableScrolling: noop,
        sendVerificationEmailInProgress: false,
        onResendVerificationEmail: noop,
      };

      render(<InboxPage {...salesProps} />, {
        initialState,
      });

      await waitFor(() => {
        // Has links to orders tab
        const ordersTabTitle = screen.getByRole('link', { name: 'InboxPage.ordersTabTitle' });
        expect(ordersTabTitle).toBeInTheDocument();
        expect(ordersTabTitle.getAttribute('href')).toContain('/inbox/orders');

        // Has links to sales tab
        const salesTabTitle = screen.getByRole('link', { name: 'InboxPage.salesTabTitle' });
        expect(salesTabTitle).toBeInTheDocument();
        expect(salesTabTitle.getAttribute('href')).toContain('/inbox/sales');

        // Has 2 items
        const items = screen.queryAllByRole('link', { name: /listing1/i });
        expect(items).toHaveLength(2);

        const item1 = items[0];
        expect(item1.getAttribute('href')).toContain('/sale/sale1');
        const status1 = within(item1).getByText('InboxPage.default-purchase.purchased.status');
        expect(status1).toBeInTheDocument();

        const item2 = items[1];
        expect(item2.getAttribute('href')).toContain('/sale/sale2');
        const status2 = within(item2).getByText('InboxPage.default-purchase.purchased.status');
        expect(status2).toBeInTheDocument();
      });
    });
  });

  describe('InboxItem: default-inquiry process with "inquiry" item', () => {
    const listingInquiryItem = createListing('listing1', {
      publicData: {
        listingType: 'inquire-bikes',
        transactionProcessAlias: 'default-inquiry',
        unitType: 'inquiry',
      },
    });

    const inquiries = Object.keys(inquiryTransitions).map(trKey => {
      const lineItemsMaybe = trKey !== 'INQUIRE_WITHOUT_PAYMENT' ? lineItems : [];
      return {
        tr: inquiryTransitions[trKey],
        tx: createTransaction({
          id: `id-inquiry-${trKey}-sale`,
          customer,
          provider,
          listing: listingInquiryItem,
          processName: 'default-inquiry',
          lastTransition: inquiryTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
      };
    });

    test.each(inquiries)('check inquiry: $tr', ({ tr, tx }) => {
      const transactionRole = TX_TRANSITION_ACTOR_PROVIDER;
      const stateDataOrder = getStateData({
        transaction: tx,
        transactionRole,
      });

      const tree = render(
        <InboxItem
          tx={tx}
          transactionRole={transactionRole}
          intl={fakeIntl}
          stateData={stateDataOrder}
          isBooking={false}
        />
      );
      expect(tree.asFragment().firstChild).toMatchSnapshot();
      const quantityFound = screen.queryAllByText('InboxPage.quantity');
      expect(quantityFound).toHaveLength(0);
    });
  });

  describe('InboxItem: default-purchase process with "item"', () => {
    const listingItem = createListing('listing1', {
      publicData: {
        listingType: 'sell-bikes',
        transactionProcessAlias: 'default-purchase',
        unitType: 'item',
      },
    });

    const purchases = Object.keys(purchaseTransitions).map(trKey => {
      const lineItemsMaybe = trKey !== 'INQUIRE' ? lineItems : [];
      return {
        tr: purchaseTransitions[trKey],
        tx: createTransaction({
          id: `id-purchase-${trKey}-sale`,
          customer,
          provider,
          listing: listingItem,
          processName: 'default-purchase',
          lastTransition: purchaseTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
      };
    });

    test.each(purchases)('check purchase: $tr', ({ tr, tx }) => {
      const transactionRole = TX_TRANSITION_ACTOR_PROVIDER;
      const stateDataOrder = getStateData({
        transaction: tx,
        transactionRole,
      });

      const tree = render(
        <InboxItem
          tx={tx}
          transactionRole={transactionRole}
          intl={fakeIntl}
          stateData={stateDataOrder}
          isBooking={false}
          stockType="multipleItems"
        />
      );
      expect(tree.asFragment().firstChild).toMatchSnapshot();
      const quantityFound = screen.queryAllByText('InboxPage.quantity');
      const expected = tr !== 'transition/inquire' ? 1 : 0;
      expect(quantityFound).toHaveLength(expected);
    });

    // This is quite small component what comes to rendered HTML
    // For now, we rely on snapshot-testing and checking quantity.
    it('InboxItem with stockType "oneItem" matches snapshot of purchase sale', () => {
      const sale = createTransaction({
        id: 'oneItem-sale',
        lastTransition: bookingTransitions.CONFIRM_PAYMENT,
        customer,
        provider,
        listing,
        booking,
        lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
        lineItems,
      });

      const stateDataOrder = getStateData({
        transaction: sale,
        transactionRole: TX_TRANSITION_ACTOR_PROVIDER,
      });

      const tree = render(
        <InboxItem
          tx={sale}
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

  describe('InboxItem: default-booking process with "day"', () => {
    const listingDay = createListing('listing-day', {
      publicData: {
        listingType: 'rent-bikes',
        transactionProcessAlias: 'default-booking',
        unitType: 'day',
      },
    });
    const lineItemUnitTypeDay = {
      code: LINE_ITEM_DAY,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(1), // 1 day
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(1000, 'USD'),
      reversal: false,
    };

    const bookings = Object.keys(bookingTransitions).map(trKey => {
      const lineItemsMaybe =
        trKey !== 'INQUIRE' ? [lineItemUnitTypeDay, lineItemProviderCommission] : [];
      return {
        tr: bookingTransitions[trKey],
        tx: createTransaction({
          id: `id-booking-${trKey}-sale`,
          customer,
          provider,
          listing: listingDay,
          booking: createBooking('booking-id', {
            start: new Date(Date.UTC(2022, 5, 14)),
            end: new Date(Date.UTC(2022, 5, 15)),
          }),
          processName: 'default-booking',
          lastTransition: bookingTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
      };
    });

    test.each(bookings)('check booking: $tr', ({ tr, tx }) => {
      const transactionRole = TX_TRANSITION_ACTOR_PROVIDER;
      const stateDataBooking = getStateData({
        transaction: tx,
        transactionRole,
      });

      const tree = render(
        <InboxItem
          tx={tx}
          transactionRole={transactionRole}
          intl={fakeIntl}
          stateData={stateDataBooking}
          isBooking={true}
        />
      );
      expect(tree.asFragment().firstChild).toMatchSnapshot();

      const quantityFound = screen.queryAllByText('Jun 14, 2022');
      const expected = tr !== 'transition/inquire' ? 1 : 0;
      expect(quantityFound).toHaveLength(expected);
    });
  });

  describe('InboxItem: default-booking process with "night"', () => {
    const listingNight = createListing('listing-night', {
      publicData: {
        listingType: 'rent-bikes',
        transactionProcessAlias: 'default-booking',
        unitType: 'night',
      },
    });

    const lineItemUnitTypeNight = {
      code: LINE_ITEM_NIGHT,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(2), // 2 nights
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(2000, 'USD'),
      reversal: false,
    };

    const bookings = Object.keys(bookingTransitions).map(trKey => {
      const lineItemsMaybe =
        trKey !== 'INQUIRE' ? [lineItemUnitTypeNight, lineItemProviderCommission] : [];
      return {
        tr: bookingTransitions[trKey],
        tx: createTransaction({
          id: `id-booking-${trKey}-order`,
          customer,
          provider,
          listing: listingNight,
          booking: createBooking('booking-id', {
            start: new Date(Date.UTC(2021, 5, 14)),
            end: new Date(Date.UTC(2021, 5, 16)),
          }),
          processName: 'default-booking',
          lastTransition: bookingTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
      };
    });

    test.each(bookings)('check booking: $tr', ({ tr, tx }) => {
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const stateDataBooking = getStateData({
        transaction: tx,
        transactionRole,
      });

      const tree = render(
        <InboxItem
          tx={tx}
          transactionRole={transactionRole}
          intl={fakeIntl}
          stateData={stateDataBooking}
          isBooking={true}
        />
      );

      const quantityFound = screen.queryAllByText('Jun 14 – 16');
      const expected = tr !== 'transition/inquire' ? 1 : 0;
      expect(quantityFound).toHaveLength(expected);
    });
  });

  describe('InboxItem: default-booking process with "hour"', () => {
    const listingHour = createListing('listing-hour', {
      publicData: {
        listingType: 'rent-bikes',
        transactionProcessAlias: 'default-booking',
        unitType: 'hour',
      },
    });

    const lineItemUnitTypeHour = {
      code: LINE_ITEM_HOUR,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(3), // 3 hours
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(3000, 'USD'),
      reversal: false,
    };

    const bookings = Object.keys(bookingTransitions).map(trKey => {
      const lineItemsMaybe =
        trKey !== 'INQUIRE' ? [lineItemUnitTypeHour, lineItemProviderCommission] : [];
      return {
        tr: bookingTransitions[trKey],
        tx: createTransaction({
          id: `id-booking-${trKey}-order`,
          customer,
          provider,
          listing: listingHour,
          booking: createBooking('booking-id', {
            start: new Date(Date.UTC(2022, 5, 14, 10, 0)),
            end: new Date(Date.UTC(2022, 5, 14, 13, 0)),
          }),
          processName: 'default-booking',
          lastTransition: bookingTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
      };
    });

    test.each(bookings)('check booking: $tr', ({ tr, tx }) => {
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const stateDataBooking = getStateData({
        transaction: tx,
        transactionRole,
      });

      const tree = render(
        <InboxItem
          tx={tx}
          transactionRole={transactionRole}
          intl={fakeIntl}
          stateData={stateDataBooking}
          isBooking={true}
        />
      );
      expect(tree.asFragment().firstChild).toMatchSnapshot();

      const quantityFound = screen.queryAllByText('Jun 14, 2022, 10:00 AM - 1:00 PM');
      const expected = tr !== 'transition/inquire' ? 1 : 0;
      expect(quantityFound).toHaveLength(expected);
    });
  });
});
