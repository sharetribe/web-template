import React, { act } from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LINE_ITEM_DAY,
  LINE_ITEM_HOUR,
  LINE_ITEM_ITEM,
  LINE_ITEM_PROVIDER_COMMISSION,
} from '../../util/types';
import {
  createUser,
  createCurrentUser,
  createListing,
  fakeIntl,
  createTransaction,
  createBooking,
  createMessage,
} from '../../util/testData';
import {
  getHostedConfiguration,
  getRouteConfiguration,
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';

import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  getProcess,
} from '../../transactions/transaction';

import { getStateData } from './TransactionPage.stateData';
import { TransactionPageComponent } from './TransactionPage';

const { Money, UUID } = sdkTypes;
const { screen, waitFor, within } = testingLibrary;
const noop = () => null;

const bookingTransitions = getProcess('default-booking')?.transitions;
const purchaseTransitions = getProcess('default-purchase')?.transitions;

describe('TransactionPage', () => {
  const lineItemUnitTypeItem = {
    code: LINE_ITEM_ITEM,
    includeFor: ['customer', 'provider'],
    quantity: new Decimal(1),
    unitPrice: new Money(1000, 'USD'),
    lineTotal: new Money(1000, 'USD'),
    reversal: false,
  };
  const lineItemUnitTypeItemReversal = {
    code: LINE_ITEM_ITEM,
    includeFor: ['customer', 'provider'],
    quantity: new Decimal(1),
    unitPrice: new Money(1000 * -1, 'USD'),
    lineTotal: new Money(1000 * -1, 'USD'),
    reversal: true,
  };
  const lineItemProviderCommission = {
    code: LINE_ITEM_PROVIDER_COMMISSION,
    includeFor: ['provider'],
    unitPrice: new Money(100 * -1, 'USD'),
    lineTotal: new Money(100 * -1, 'USD'),
    reversal: false,
  };
  const lineItemProviderCommissionReversal = {
    code: LINE_ITEM_PROVIDER_COMMISSION,
    includeFor: ['provider'],
    unitPrice: new Money(100, 'USD'),
    lineTotal: new Money(100, 'USD'),
    reversal: true,
  };

  const providerId = 'provider';
  const customerId = 'customer';
  const provider = createUser(providerId);
  const customer = createUser(customerId);

  const panelBaseProps = {
    currentUser: createCurrentUser(providerId),
    transactionRole: TX_TRANSITION_ACTOR_PROVIDER,
    totalMessagePages: 1,
    oldestMessagePageFetched: 1,
    fetchTransactionError: null,
    history: {
      push: noop,
    },
    location: {
      search: null,
    },
    intl: fakeIntl,
    messages: [
      createMessage('msg1', {}, { sender: provider }),
      createMessage('msg2', {}, { sender: customer }),
    ],
    params: {
      id: 'tx-id',
    },
    scrollingDisabled: false,
    sendMessageInProgress: false,
    fetchLineItemsInProgress: false,
    fetchMessagesInProgress: false,
    onManageDisableScrolling: noop,
    onSendMessage: noop,
    onSendReview: noop,
    onShowMoreMessages: noop,
    onTransition: noop,
    onFetchTimeSlots: noop,
    callSetInitialValues: noop,
    onInitializeCardPaymentData: noop,
    onFetchTransactionLineItems: noop,
    nextTransitions: null,
    monthlyTimeSlots: {},
    //transaction,
    //lineItems,
  };

  // PURCHASE SALE
  describe('default-purchase process with "item" (Sale)', () => {
    const processName = 'default-purchase';
    const process = getProcess(processName);

    const purchases = Object.keys(purchaseTransitions).map(trKey => {
      const isReversal = process.isRefunded(purchaseTransitions[trKey]);
      const isReceived = process.isCompleted(purchaseTransitions[trKey]);
      const lineItemsMaybe =
        trKey == 'INQUIRE'
          ? []
          : isReversal
          ? [
              lineItemUnitTypeItem,
              lineItemUnitTypeItemReversal,
              lineItemProviderCommission,
              lineItemProviderCommissionReversal,
            ]
          : [lineItemUnitTypeItem, lineItemProviderCommission];
      return {
        tr: purchaseTransitions[trKey],
        tx: createTransaction({
          id: `id-purchase-${trKey}-sale`,
          customer,
          provider,
          listing: createListing('listing-item', {
            publicData: {
              listingType: 'sell-bikes',
              transactionProcessAlias: 'default-purchase/release-1',
              unitType: 'item',
            },
          }),
          processName,
          lastTransition: purchaseTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
        isReversal,
        isReceived,
      };
    });

    test.each(purchases)('check purchase: $tr', async ({ tr, tx, isReversal, isReceived }) => {
      const transactionRole = TX_TRANSITION_ACTOR_PROVIDER;

      const stateData = getStateData(
        {
          transaction: tx,
          transactionRole,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        process
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(providerId),
        transaction: tx,
        transactionRole,
        params: {
          id: tx.id?.uuid,
        },
      };
      await act(async () => {
        render(<TransactionPageComponent {...props} />);
      });

      const state = stateData.processState;
      const providerTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
      expect(screen.getByText(providerTitle)).toBeInTheDocument();

      expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

      // Order breakdown
      const expectedLength = tr !== 'transition/inquire' ? 2 : 0;
      expect(
        screen.queryAllByText(`TransactionPanel.${processName}.orderBreakdownTitle`)
      ).toHaveLength(expectedLength);
      expect(screen.queryAllByText('OrderBreakdown.baseUnitQuantity')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('OrderBreakdown.subTotal')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('$10.00')).toHaveLength(expectedLength * 2);

      // Order breakdown: refund?
      const expectedLengthReversal = isReversal ? 2 : 0;
      expect(screen.queryAllByText('OrderBreakdown.refund')).toHaveLength(expectedLengthReversal);
      expect(screen.queryAllByText('-$10.00')).toHaveLength(expectedLengthReversal);

      // Order breakdown: commission
      expect(screen.queryAllByText('OrderBreakdown.commission')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('-$1.00')).toHaveLength(expectedLength);

      // Order breakdown: commission refund?
      expect(screen.queryAllByText('OrderBreakdown.refundProviderFee')).toHaveLength(
        expectedLengthReversal
      );

      // Order breakdown: total (with multiple translation keys)
      const total = isReversal
        ? 'OrderBreakdown.providerTotalRefunded'
        : isReceived
        ? 'OrderBreakdown.providerTotalReceived'
        : 'OrderBreakdown.providerTotalDefault';
      const expectedTotal = isReversal ? expectedLengthReversal : expectedLength;
      expect(screen.queryAllByText(total)).toHaveLength(expectedTotal);

      // A note about commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commissionFeeNote')).toHaveLength(
        expectedLength
      );

      // Activity feed (here we just check the heading)
      expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

      // Listing's title (side card)
      expect(screen.getByText('listing-item title')).toBeInTheDocument();

      // Primary action button
      // E.g.
      // TransactionPage.default-purchase.provider.transition-mark-delivered.actionButton
      // TransactionPage.leaveReview.actionButton (twice)
      const primaryButtonText = stateData.primaryButtonProps?.buttonText || 'no-button';
      // length == 2 => mobile & desktop are rendered separately
      const expectedLengthPrimary = stateData.primaryButtonProps?.buttonText ? 2 : 0;
      expect(screen.queryAllByText(primaryButtonText)).toHaveLength(expectedLengthPrimary);

      // Messaging
      const sendMsg = screen.getByPlaceholderText('TransactionPanel.sendMessagePlaceholder');
      expect(sendMsg).toBeInTheDocument();
      const sendMsgButton = screen.queryByRole('button', { name: 'SendMessageForm.sendMessage' });
      expect(sendMsgButton).toBeInTheDocument();
    });
  });

  // PURCHASE ORDER
  describe('default-purchase process with "item" (Order)', () => {
    const processName = 'default-purchase';
    const process = getProcess(processName);

    // { EXPIRE_PAYMENT: purchaseTransitions.EXPIRE_PAYMENT }
    const purchases = Object.keys(purchaseTransitions).map(trKey => {
      const isReversal = process.isRefunded(purchaseTransitions[trKey]);
      const isReceived = process.isCompleted(purchaseTransitions[trKey]);
      const lineItemsMaybe =
        trKey == 'INQUIRE'
          ? []
          : isReversal
          ? [
              lineItemUnitTypeItem,
              lineItemUnitTypeItemReversal,
              lineItemProviderCommission,
              lineItemProviderCommissionReversal,
            ]
          : [lineItemUnitTypeItem, lineItemProviderCommission];
      return {
        tr: purchaseTransitions[trKey],
        tx: createTransaction({
          id: `id-purchase-${trKey}-order`,
          customer,
          provider,
          listing: createListing('listing-item', {
            publicData: {
              listingType: 'sell-bikes',
              transactionProcessAlias: 'default-purchase/release-1',
              unitType: 'item',
            },
          }),
          processName,
          lastTransition: purchaseTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
        isReversal,
        isReceived,
      };
    });

    test.each(purchases)('check purchase: $tr', async ({ tr, tx, isReversal, isReceived }) => {
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const isInquiry = tr === 'transition/inquire';

      const stateData = getStateData(
        {
          transaction: tx,
          transactionRole,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        process
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(customerId),
        transaction: tx,
        transactionRole,
        params: {
          id: tx.id?.uuid,
        },
      };

      await act(async () => {
        render(<TransactionPageComponent {...props} />);
      });

      const state = stateData.processState;
      const providerTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
      expect(screen.getByText(providerTitle)).toBeInTheDocument();

      expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

      // Order breakdown
      const expectedLength = isInquiry ? 0 : 2;
      expect(
        screen.queryAllByText(`TransactionPanel.${processName}.orderBreakdownTitle`)
      ).toHaveLength(expectedLength);
      expect(screen.queryAllByText('OrderBreakdown.baseUnitQuantity')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('OrderBreakdown.subTotal')).toHaveLength(
        isReversal ? expectedLength : 0
      );
      expect(screen.queryAllByText('$10.00')).toHaveLength(
        isReversal ? expectedLength * 3 : expectedLength * 2
      ); // base, subtotal, total

      // Order breakdown: refund?
      const expectedLengthReversal = isReversal ? 2 : 0;
      expect(screen.queryAllByText('OrderBreakdown.refund')).toHaveLength(expectedLengthReversal);
      expect(screen.queryAllByText('-$10.00')).toHaveLength(expectedLengthReversal);

      // Order breakdown: commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commission')).toHaveLength(0);
      expect(screen.queryAllByText('-$1.00')).toHaveLength(0);

      // Order breakdown: commission refund? (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.refundProviderFee')).toHaveLength(0);

      // Order breakdown: total (with multiple translation keys)
      const total = 'OrderBreakdown.total';
      const expectedTotal = isReversal ? expectedLengthReversal : expectedLength;
      expect(screen.queryAllByText(total)).toHaveLength(expectedTotal);

      // A note about commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commissionFeeNote')).toHaveLength(0);

      // Activity feed (here we just check the heading)
      expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

      // Listing's title (side card)
      // NOTE: OrderPanel is codes-plitted and "test.each" don't work with async setup

      expect(screen.queryAllByText('listing-item title')).toHaveLength(isInquiry ? 0 : 1);

      // Primary action button
      // E.g.
      // TransactionPage.default-purchase.customer.transition-mark-received-from-purchased.actionButton
      // TransactionPage.default-purchase.customer.transition-mark-received.actionButton
      // TransactionPage.leaveReview.actionButton (twice)
      const primaryButtonText = stateData.primaryButtonProps?.buttonText || 'no-button';
      // length == 2 => mobile & desktop are rendered separately
      const expectedLengthPrimary = stateData.primaryButtonProps?.buttonText ? 2 : 0;
      expect(screen.queryAllByText(primaryButtonText)).toHaveLength(expectedLengthPrimary);

      // Messaging
      const sendMsg = screen.getByPlaceholderText('TransactionPanel.sendMessagePlaceholder');
      expect(sendMsg).toBeInTheDocument();
      const sendMsgButton = screen.queryByRole('button', { name: 'SendMessageForm.sendMessage' });
      expect(sendMsgButton).toBeInTheDocument();
    });
  });

  // BOOKING SALE
  describe('default-booking process with "day" (Sale)', () => {
    const processName = 'default-booking';
    const process = getProcess(processName);
    const lineItemUnitTypeDay = {
      code: LINE_ITEM_DAY,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(1), // 1 day
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(1000, 'USD'),
      reversal: false,
    };
    const lineItemUnitTypeDayReversal = {
      code: LINE_ITEM_DAY,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(1), // 1 day
      unitPrice: new Money(1000 * -1, 'USD'),
      lineTotal: new Money(1000 * -1, 'USD'),
      reversal: true,
    };

    const bookings = Object.keys(bookingTransitions).map(trKey => {
      const isReversal = process.isRefunded(bookingTransitions[trKey]);
      const isReceived = process.isCompleted(bookingTransitions[trKey]);
      const lineItemsMaybe =
        trKey == 'INQUIRE'
          ? []
          : isReversal
          ? [
              lineItemUnitTypeDay,
              lineItemUnitTypeDayReversal,
              lineItemProviderCommission,
              lineItemProviderCommissionReversal,
            ]
          : [lineItemUnitTypeDay, lineItemProviderCommission];
      return {
        tr: bookingTransitions[trKey],
        tx: createTransaction({
          id: `id-booking-${trKey}-sale`,
          customer,
          provider,
          listing: createListing('listing-item', {
            publicData: {
              listingType: 'rent-bikes',
              transactionProcessAlias: 'default-booking/release-1',
              unitType: 'day',
            },
          }),
          booking: createBooking('booking-id', {
            start: new Date(Date.UTC(2022, 5, 14)),
            end: new Date(Date.UTC(2022, 5, 15)),
          }),
          processName,
          lastTransition: bookingTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
        isReversal,
        isReceived,
      };
    });

    test.each(bookings)('check booking: $tr', async ({ tr, tx, isReversal, isReceived }) => {
      const transactionRole = TX_TRANSITION_ACTOR_PROVIDER;
      const isInquiry = tr === 'transition/inquire';

      const stateData = getStateData(
        {
          transaction: tx,
          transactionRole,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        process
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(providerId),
        transaction: tx,
        transactionRole,
        params: {
          id: tx.id?.uuid,
        },
      };

      await act(async () => {
        render(<TransactionPageComponent {...props} />);
      });

      const state = stateData.processState;
      const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
      expect(screen.getByText(txTitle)).toBeInTheDocument();

      expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

      // Order breakdown
      const expectedLength = isInquiry ? 0 : 2;
      expect(
        screen.queryAllByText(`TransactionPanel.${processName}.orderBreakdownTitle`)
      ).toHaveLength(expectedLength);

      expect(screen.queryAllByText('OrderBreakdown.bookingStart')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('Tuesday')).toHaveLength(expectedLength * 2);
      expect(screen.queryAllByText('Jun 14')).toHaveLength(expectedLength * 2);
      expect(screen.queryAllByText('OrderBreakdown.bookingEnd')).toHaveLength(expectedLength);
      //expect(screen.queryAllByText('Tuesday')).toHaveLength(expectedLength);
      //expect(screen.queryAllByText('Jun 14')).toHaveLength(expectedLength);

      expect(screen.queryAllByText('OrderBreakdown.baseUnitDay')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('OrderBreakdown.subTotal')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('$10.00')).toHaveLength(expectedLength * 2);

      // Order breakdown: refund?
      const expectedLengthReversal = isReversal ? 2 : 0;
      expect(screen.queryAllByText('OrderBreakdown.refund')).toHaveLength(expectedLengthReversal);
      expect(screen.queryAllByText('-$10.00')).toHaveLength(expectedLengthReversal);

      // Order breakdown: commission
      expect(screen.queryAllByText('OrderBreakdown.commission')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('-$1.00')).toHaveLength(expectedLength);

      // Order breakdown: commission refund?
      expect(screen.queryAllByText('OrderBreakdown.refundProviderFee')).toHaveLength(
        expectedLengthReversal
      );

      // Order breakdown: total (with multiple translation keys)
      const total = isReversal
        ? 'OrderBreakdown.providerTotalRefunded'
        : isReceived
        ? 'OrderBreakdown.providerTotalReceived'
        : 'OrderBreakdown.providerTotalDefault';
      const expectedTotal = isReversal ? expectedLengthReversal : expectedLength;
      expect(screen.queryAllByText(total)).toHaveLength(expectedTotal);
      expect(screen.queryAllByText('$9.00')).toHaveLength(expectedTotal);

      // A note about commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commissionFeeNote')).toHaveLength(
        expectedLength
      );

      // Activity feed (here we just check the heading)
      expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

      // Listing's title (side card)
      expect(screen.getByText('listing-item title')).toBeInTheDocument();

      // Primary action button
      // E.g.
      // TransactionPage.default-purchase.provider.transition-mark-delivered.actionButton
      // TransactionPage.leaveReview.actionButton (twice)
      const primaryButtonText = stateData.primaryButtonProps?.buttonText || 'no-button';
      // length == 2 => mobile & desktop are rendered separately
      const expectedLengthPrimary = stateData.primaryButtonProps?.buttonText ? 2 : 0;
      expect(screen.queryAllByText(primaryButtonText)).toHaveLength(expectedLengthPrimary);

      // Messaging
      const sendMsg = screen.getByPlaceholderText('TransactionPanel.sendMessagePlaceholder');
      expect(sendMsg).toBeInTheDocument();
      const sendMsgButton = screen.queryByRole('button', { name: 'SendMessageForm.sendMessage' });
      expect(sendMsgButton).toBeInTheDocument();
    });
  });

  // BOOKING ORDER
  describe('default-booking process with "day" (Order)', () => {
    const processName = 'default-booking';
    const process = getProcess(processName);
    const lineItemUnitTypeDay = {
      code: LINE_ITEM_DAY,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(1), // 1 day
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(1000, 'USD'),
      reversal: false,
    };
    const lineItemUnitTypeDayReversal = {
      code: LINE_ITEM_DAY,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(1), // 1 day
      unitPrice: new Money(1000 * -1, 'USD'),
      lineTotal: new Money(1000 * -1, 'USD'),
      reversal: true,
    };

    const bookings = Object.keys(bookingTransitions).map(trKey => {
      const isReversal = process.isRefunded(bookingTransitions[trKey]);
      const isReceived = process.isCompleted(bookingTransitions[trKey]);
      const lineItemsMaybe =
        trKey == 'INQUIRE'
          ? []
          : isReversal
          ? [
              lineItemUnitTypeDay,
              lineItemUnitTypeDayReversal,
              lineItemProviderCommission,
              lineItemProviderCommissionReversal,
            ]
          : [lineItemUnitTypeDay, lineItemProviderCommission];
      return {
        tr: bookingTransitions[trKey],
        tx: createTransaction({
          id: `id-booking-${trKey}-order`,
          customer,
          provider,
          listing: createListing('listing-item', {
            publicData: {
              listingType: 'rent-bikes',
              transactionProcessAlias: 'default-booking/release-1',
              unitType: 'day',
            },
          }),
          booking: createBooking('booking-id', {
            start: new Date(Date.UTC(2022, 5, 14)),
            end: new Date(Date.UTC(2022, 5, 15)),
          }),
          processName,
          lastTransition: bookingTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
        isReversal,
        isReceived,
      };
    });

    test.each(bookings)('check booking: $tr', async ({ tr, tx, isReversal, isReceived }) => {
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const isInquiry = tr === 'transition/inquire';

      const stateData = getStateData(
        {
          transaction: tx,
          transactionRole,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        process
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(customerId),
        transaction: tx,
        transactionRole,
        params: {
          id: tx.id?.uuid,
        },
      };

      await act(async () => {
        render(<TransactionPageComponent {...props} />);
      });

      const state = stateData.processState;
      const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
      expect(screen.getByText(txTitle)).toBeInTheDocument();

      expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

      // Order breakdown
      const expectedLength = isInquiry ? 0 : 2;
      expect(
        screen.queryAllByText(`TransactionPanel.${processName}.orderBreakdownTitle`)
      ).toHaveLength(expectedLength);

      expect(screen.queryAllByText('OrderBreakdown.bookingStart')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('Tuesday')).toHaveLength(expectedLength * 2);
      expect(screen.queryAllByText('Jun 14')).toHaveLength(expectedLength * 2);
      expect(screen.queryAllByText('OrderBreakdown.bookingEnd')).toHaveLength(expectedLength);
      //expect(screen.queryAllByText('Tuesday')).toHaveLength(expectedLength);
      //expect(screen.queryAllByText('Jun 14')).toHaveLength(expectedLength);

      expect(screen.queryAllByText('OrderBreakdown.baseUnitDay')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('OrderBreakdown.subTotal')).toHaveLength(
        isReversal ? expectedLength : 0
      );
      expect(screen.queryAllByText('$10.00')).toHaveLength(
        isReversal ? expectedLength * 3 : expectedLength * 2
      ); // base, subtotal, total

      // Order breakdown: refund?
      const expectedLengthReversal = isReversal ? 2 : 0;
      expect(screen.queryAllByText('OrderBreakdown.refund')).toHaveLength(expectedLengthReversal);
      expect(screen.queryAllByText('-$10.00')).toHaveLength(expectedLengthReversal);

      // Order breakdown: commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commission')).toHaveLength(0);
      expect(screen.queryAllByText('-$1.00')).toHaveLength(0);

      // Order breakdown: commission refund? (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.refundProviderFee')).toHaveLength(0);

      // Order breakdown: total (with multiple translation keys)
      const total = 'OrderBreakdown.total';
      const expectedTotal = isReversal ? expectedLengthReversal : expectedLength;
      expect(screen.queryAllByText(total)).toHaveLength(expectedTotal);

      // A note about commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commissionFeeNote')).toHaveLength(0);

      // Activity feed (here we just check the heading)
      expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

      // Listing's title (side card)
      // NOTE: OrderPanel is codes-plitted and "test.each" don't work with async setup
      expect(screen.queryAllByText('listing-item title')).toHaveLength(isInquiry ? 0 : 1);

      // Primary action button
      // E.g.
      // TransactionPage.default-purchase.provider.transition-mark-delivered.actionButton
      // TransactionPage.leaveReview.actionButton (twice)
      const primaryButtonText = stateData.primaryButtonProps?.buttonText || 'no-button';
      // length == 2 => mobile & desktop are rendered separately
      const expectedLengthPrimary = stateData.primaryButtonProps?.buttonText ? 2 : 0;
      expect(screen.queryAllByText(primaryButtonText)).toHaveLength(expectedLengthPrimary);

      // Messaging
      const sendMsg = screen.getByPlaceholderText('TransactionPanel.sendMessagePlaceholder');
      expect(sendMsg).toBeInTheDocument();
      const sendMsgButton = screen.queryByRole('button', { name: 'SendMessageForm.sendMessage' });
      expect(sendMsgButton).toBeInTheDocument();
    });
  });

  // BOOKING SALE (hour)
  describe('default-booking process with "hour" (Sale)', () => {
    const processName = 'default-booking';
    const process = getProcess(processName);
    const lineItemUnitTypeHour = {
      code: LINE_ITEM_HOUR,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(3), // 3 hours
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(3000, 'USD'),
      reversal: false,
    };
    const lineItemUnitTypeHourReversal = {
      code: LINE_ITEM_HOUR,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(3), // 3 hours
      unitPrice: new Money(1000 * -1, 'USD'),
      lineTotal: new Money(3000 * -1, 'USD'),
      reversal: true,
    };

    const bookings = Object.keys(bookingTransitions).map(trKey => {
      const isReversal = process.isRefunded(bookingTransitions[trKey]);
      const isReceived = process.isCompleted(bookingTransitions[trKey]);
      const lineItemsMaybe =
        trKey == 'INQUIRE'
          ? []
          : isReversal
          ? [
              lineItemUnitTypeHour,
              lineItemUnitTypeHourReversal,
              lineItemProviderCommission,
              lineItemProviderCommissionReversal,
            ]
          : [lineItemUnitTypeHour, lineItemProviderCommission];
      return {
        tr: bookingTransitions[trKey],
        tx: createTransaction({
          id: `id-booking-${trKey}-sale`,
          customer,
          provider,
          listing: createListing('listing-item', {
            publicData: {
              listingType: 'rent-bikes',
              transactionProcessAlias: 'default-booking/release-1',
              unitType: 'hour',
            },
          }),
          booking: createBooking('booking-id', {
            start: new Date(Date.UTC(2022, 5, 14, 10, 0, 0)),
            end: new Date(Date.UTC(2022, 5, 14, 13, 0, 0)),
          }),
          processName,
          lastTransition: bookingTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
        isReversal,
        isReceived,
      };
    });

    test.each(bookings)('check booking: $tr', async ({ tr, tx, isReversal, isReceived }) => {
      const transactionRole = TX_TRANSITION_ACTOR_PROVIDER;
      const isInquiry = tr === 'transition/inquire';

      const stateData = getStateData(
        {
          transaction: tx,
          transactionRole,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        process
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(providerId),
        transaction: tx,
        transactionRole,
        params: {
          id: tx.id?.uuid,
        },
      };

      await act(async () => {
        render(<TransactionPageComponent {...props} />);
      });

      const state = stateData.processState;
      const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
      expect(screen.getByText(txTitle)).toBeInTheDocument();

      expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

      // Order breakdown
      const expectedLength = isInquiry ? 0 : 2;
      expect(
        screen.queryAllByText(`TransactionPanel.${processName}.orderBreakdownTitle`)
      ).toHaveLength(expectedLength);

      expect(screen.queryAllByText('OrderBreakdown.bookingStart')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('Tue 10:00 AM')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('Tue 1:00 PM')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('Jun 14')).toHaveLength(expectedLength * 2);
      expect(screen.queryAllByText('OrderBreakdown.bookingEnd')).toHaveLength(expectedLength);

      expect(screen.queryAllByText('OrderBreakdown.baseUnitHour')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('OrderBreakdown.subTotal')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('$30.00')).toHaveLength(expectedLength * 2);

      // Order breakdown: refund?
      const expectedLengthReversal = isReversal ? 2 : 0;
      expect(screen.queryAllByText('OrderBreakdown.refund')).toHaveLength(expectedLengthReversal);
      expect(screen.queryAllByText('-$30.00')).toHaveLength(expectedLengthReversal);

      // Order breakdown: commission
      expect(screen.queryAllByText('OrderBreakdown.commission')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('-$1.00')).toHaveLength(expectedLength);

      // Order breakdown: commission refund?
      expect(screen.queryAllByText('OrderBreakdown.refundProviderFee')).toHaveLength(
        expectedLengthReversal
      );

      // Order breakdown: total (with multiple translation keys)
      const total = isReversal
        ? 'OrderBreakdown.providerTotalRefunded'
        : isReceived
        ? 'OrderBreakdown.providerTotalReceived'
        : 'OrderBreakdown.providerTotalDefault';
      const expectedTotal = isReversal ? expectedLengthReversal : expectedLength;
      expect(screen.queryAllByText(total)).toHaveLength(expectedTotal);
      expect(screen.queryAllByText('$9.00')).toHaveLength(expectedTotal);

      // A note about commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commissionFeeNote')).toHaveLength(
        expectedLength
      );

      // Activity feed (here we just check the heading)
      expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

      // Listing's title (side card)
      expect(screen.getByText('listing-item title')).toBeInTheDocument();

      // Primary action button
      // E.g.
      // TransactionPage.default-purchase.provider.transition-mark-delivered.actionButton
      // TransactionPage.leaveReview.actionButton (twice)
      const primaryButtonText = stateData.primaryButtonProps?.buttonText || 'no-button';
      // length == 2 => mobile & desktop are rendered separately
      const expectedLengthPrimary = stateData.primaryButtonProps?.buttonText ? 2 : 0;
      expect(screen.queryAllByText(primaryButtonText)).toHaveLength(expectedLengthPrimary);

      // Messaging
      const sendMsg = screen.getByPlaceholderText('TransactionPanel.sendMessagePlaceholder');
      expect(sendMsg).toBeInTheDocument();
      const sendMsgButton = screen.queryByRole('button', { name: 'SendMessageForm.sendMessage' });
      expect(sendMsgButton).toBeInTheDocument();
    });
  });

  // BOOKING SALE (hour)
  describe('default-booking process with "hour" (Order)', () => {
    const processName = 'default-booking';
    const process = getProcess(processName);
    const lineItemUnitTypeHour = {
      code: LINE_ITEM_HOUR,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(3), // 3 hours
      unitPrice: new Money(1000, 'USD'),
      lineTotal: new Money(3000, 'USD'),
      reversal: false,
    };
    const lineItemUnitTypeHourReversal = {
      code: LINE_ITEM_HOUR,
      includeFor: ['customer', 'provider'],
      quantity: new Decimal(3), // 3 hours
      unitPrice: new Money(1000 * -1, 'USD'),
      lineTotal: new Money(3000 * -1, 'USD'),
      reversal: true,
    };

    const bookings = Object.keys(bookingTransitions).map(trKey => {
      const isReversal = process.isRefunded(bookingTransitions[trKey]);
      const isReceived = process.isCompleted(bookingTransitions[trKey]);
      const lineItemsMaybe =
        trKey == 'INQUIRE'
          ? []
          : isReversal
          ? [
              lineItemUnitTypeHour,
              lineItemUnitTypeHourReversal,
              lineItemProviderCommission,
              lineItemProviderCommissionReversal,
            ]
          : [lineItemUnitTypeHour, lineItemProviderCommission];
      return {
        tr: bookingTransitions[trKey],
        tx: createTransaction({
          id: `id-booking-${trKey}-order`,
          customer,
          provider,
          listing: createListing('listing-item', {
            publicData: {
              listingType: 'rent-bikes',
              transactionProcessAlias: 'default-booking/release-1',
              unitType: 'hour',
            },
          }),
          booking: createBooking('booking-id', {
            start: new Date(Date.UTC(2022, 5, 14, 10, 0, 0)),
            end: new Date(Date.UTC(2022, 5, 14, 13, 0, 0)),
          }),
          processName,
          lastTransition: bookingTransitions[trKey],
          lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
          lineItems: lineItemsMaybe,
        }),
        isReversal,
        isReceived,
      };
    });

    test.each(bookings)('check purchase: $tr', async ({ tr, tx, isReversal, isReceived }) => {
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const isInquiry = tr === 'transition/inquire';

      const stateData = getStateData(
        {
          transaction: tx,
          transactionRole,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        process
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(customerId),
        transaction: tx,
        transactionRole,
        params: {
          id: tx.id?.uuid,
        },
      };

      await act(async () => {
        render(<TransactionPageComponent {...props} />);
      });

      const state = stateData.processState;
      const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
      expect(screen.getByText(txTitle)).toBeInTheDocument();

      expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

      // Order breakdown
      const expectedLength = isInquiry ? 0 : 2;
      expect(
        screen.queryAllByText(`TransactionPanel.${processName}.orderBreakdownTitle`)
      ).toHaveLength(expectedLength);

      expect(screen.queryAllByText('OrderBreakdown.bookingStart')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('Tue 10:00 AM')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('Tue 1:00 PM')).toHaveLength(expectedLength);
      expect(screen.queryAllByText('Jun 14')).toHaveLength(expectedLength * 2);
      expect(screen.queryAllByText('OrderBreakdown.bookingEnd')).toHaveLength(expectedLength);

      expect(screen.queryAllByText('OrderBreakdown.baseUnitHour')).toHaveLength(expectedLength);
      // expect(screen.queryAllByText('OrderBreakdown.subTotal')).toHaveLength(expectedLength);
      // expect(screen.queryAllByText('OrderBreakdown.subTotal')).toHaveLength(
      //   isReversal ? expectedLength : 0
      // );
      // expect(screen.queryAllByText('$30.00')).toHaveLength(
      //   isReversal ? expectedLength * 3 : expectedLength * 2
      // ); // base, subtotal, total

      // Order breakdown: refund?
      const expectedLengthReversal = isReversal ? 2 : 0;
      expect(screen.queryAllByText('OrderBreakdown.refund')).toHaveLength(expectedLengthReversal);
      expect(screen.queryAllByText('-$30.00')).toHaveLength(expectedLengthReversal);

      // Order breakdown: commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commission')).toHaveLength(0);
      expect(screen.queryAllByText('-$1.00')).toHaveLength(0);

      // Order breakdown: commission refund? (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.refundProviderFee')).toHaveLength(0);

      // Order breakdown: total (with multiple translation keys)
      const total = 'OrderBreakdown.total';
      const expectedTotal = isReversal ? expectedLengthReversal : expectedLength;
      expect(screen.queryAllByText(total)).toHaveLength(expectedTotal);

      // A note about commission (customer should no see this)
      expect(screen.queryAllByText('OrderBreakdown.commissionFeeNote')).toHaveLength(0);

      // Activity feed (here we just check the heading)
      expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

      // Listing's title (side card)
      // NOTE: OrderPanel is codes-plitted and "test.each" don't work with async setup
      expect(screen.queryAllByText('listing-item title')).toHaveLength(isInquiry ? 0 : 1);

      // Primary action button
      // E.g.
      // TransactionPage.default-purchase.provider.transition-mark-delivered.actionButton
      // TransactionPage.leaveReview.actionButton (twice)
      const primaryButtonText = stateData.primaryButtonProps?.buttonText || 'no-button';
      // length == 2 => mobile & desktop are rendered separately
      const expectedLengthPrimary = stateData.primaryButtonProps?.buttonText ? 2 : 0;
      expect(screen.queryAllByText(primaryButtonText)).toHaveLength(expectedLengthPrimary);

      // Messaging
      const sendMsg = screen.getByPlaceholderText('TransactionPanel.sendMessagePlaceholder');
      expect(sendMsg).toBeInTheDocument();
      const sendMsgButton = screen.queryByRole('button', { name: 'SendMessageForm.sendMessage' });
      expect(sendMsgButton).toBeInTheDocument();
    });
  });

  // With OrderPanel
  // NOTE: OrderPanel is code-splitted away. Due to async nature, it can't be tested with "test.each()"
  describe('Transaction process with OrderPanel', () => {
    const createInquiry = (processName, unitType, lastTransition) =>
      createTransaction({
        id: `id-${processName}-inquiry-order`,
        customer,
        provider,
        listing: createListing('listing-item', {
          publicData: {
            listingType: `${processName}-bikes`,
            transactionProcessAlias: `${processName}/release-1`,
            unitType,
          },
        }),
        processName,
        lastTransition,
        lastTransitionedAt: new Date(Date.UTC(2022, 0, 15)),
        lineItems: [],
      });

    it('Inquiry with OrderPanel - hour unit', async () => {
      const config = getHostedConfiguration();
      const routeConfiguration = getRouteConfiguration(config.layout);
      const processName = 'default-booking';
      const bookingInquiry = createInquiry(processName, 'hour', bookingTransitions.INQUIRE);
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const nextTransitions = [
        {
          id: new UUID('next-transition'),
          type: 'processTransition',
          attributes: {
            name: 'transition/request-payment-after-inquiry',
            actor: [transactionRole],
            actions: [],
            params: {},
          },
        },
      ];

      const stateData = getStateData(
        {
          transaction: bookingInquiry,
          transactionRole,
          nextTransitions,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        getProcess(processName)
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(customerId),
        transaction: bookingInquiry,
        transactionRole,
        nextTransitions,
        params: {
          id: bookingInquiry.id?.uuid,
        },
        lineItems: [],
        monthlyTimeSlots: {
          ['2022-06']: {
            fetchTimeSlotsError: null,
            fetchTimeSlotsInProgress: false,
            timeSlots: [],
          },
        },
      };

      const { getByText, getAllByText } = render(<TransactionPageComponent {...props} />, {
        config,
        routeConfiguration,
      });

      await waitFor(() => {
        const state = stateData.processState;
        const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
        expect(screen.getByText(txTitle)).toBeInTheDocument();

        expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

        // Activity feed (here we just check the heading)
        expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

        // Listing's title (side card)
        expect(getAllByText('listing-item title')).toHaveLength(2);
        // Default unit price is $55
        expect(getAllByText('$55.00')).toHaveLength(2);
        expect(getAllByText('OrderPanel.perUnit')).toHaveLength(2);

        // BookingTimeForm inputs
        expect(getByText('BookingTimeForm.bookingStartTitle')).toBeInTheDocument();
        expect(getByText('FieldDateAndTimeInput.startTime')).toBeInTheDocument();
        expect(getByText('FieldDateAndTimeInput.endTime')).toBeInTheDocument();
        expect(getByText('BookingTimeForm.requestToBook')).toBeInTheDocument();
      });
    });

    it('Inquiry with restricted view rights should not show OrderPanel - hour unit', async () => {
      const config = {
        ...getHostedConfiguration(),
        accessControl: { marketplace: { private: true } },
      };

      const routeConfiguration = getRouteConfiguration(config.layout);
      const processName = 'default-booking';
      const bookingInquiry = createInquiry(processName, 'hour', bookingTransitions.INQUIRE);
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const nextTransitions = [
        {
          id: new UUID('next-transition'),
          type: 'processTransition',
          attributes: {
            name: 'transition/request-payment-after-inquiry',
            actor: [transactionRole],
            actions: [],
            params: {},
          },
        },
      ];

      const stateData = getStateData(
        {
          transaction: bookingInquiry,
          transactionRole,
          nextTransitions,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        getProcess(processName)
      );

      const currentUser = createCurrentUser(customerId);
      currentUser.effectivePermissionSet.attributes.read = 'permissions/deny';

      const props = {
        ...panelBaseProps,
        currentUser,
        transaction: bookingInquiry,
        transactionRole,
        nextTransitions,
        params: {
          id: bookingInquiry.id?.uuid,
        },
        lineItems: [],
      };

      const { getAllByText } = render(<TransactionPageComponent {...props} />, {
        config,
        routeConfiguration,
      });

      await waitFor(() => {
        const state = stateData.processState;
        const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
        expect(screen.getByText(txTitle)).toBeInTheDocument();

        expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

        // Activity feed (here we just check the heading)
        expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

        // Show listing's title only (side card)
        expect(getAllByText('listing-item title')).toHaveLength(1);

        // Don't show listing pricing
        expect(screen.queryByText('$55.00')).toBeNull();
        expect(screen.queryByText('OrderPanel.perUnit')).toBeNull();

        // Don't show BookingTimeForm inputs
        expect(screen.queryByText('BookingTimeForm.bookingStartTitle')).toBeNull();
        expect(screen.queryByText('FieldDateAndTimeInput.startTime')).toBeNull();
        expect(screen.queryByText('FieldDateAndTimeInput.endTime')).toBeNull();
        expect(screen.queryByText('BookingTimeForm.requestToBook')).toBeNull();
      });
    });

    it('Inquiry with OrderPanel - day unit', async () => {
      const config = getHostedConfiguration();
      const routeConfiguration = getRouteConfiguration(config.layout);
      const processName = 'default-booking';
      const bookingInquiry = createInquiry(processName, 'day', bookingTransitions.INQUIRE);
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const nextTransitions = [
        {
          id: new UUID('next-transition'),
          type: 'processTransition',
          attributes: {
            name: 'transition/request-payment-after-inquiry',
            actor: [transactionRole],
            actions: [],
            params: {},
          },
        },
      ];

      const stateData = getStateData(
        {
          transaction: bookingInquiry,
          transactionRole,
          nextTransitions,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        getProcess(processName)
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(customerId),
        transaction: bookingInquiry,
        transactionRole,
        nextTransitions,
        params: {
          id: bookingInquiry.id?.uuid,
        },
        lineItems: [],
        monthlyTimeSlots: {
          ['2022-06']: {
            fetchTimeSlotsError: null,
            fetchTimeSlotsInProgress: false,
            timeSlots: [],
          },
        },
      };

      const { getByText, getAllByText } = render(<TransactionPageComponent {...props} />, {
        config,
        routeConfiguration,
      });

      await waitFor(() => {
        const state = stateData.processState;
        const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
        expect(screen.getByText(txTitle)).toBeInTheDocument();

        expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

        // Activity feed (here we just check the heading)
        expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

        // Listing's title (side card)
        expect(getAllByText('listing-item title')).toHaveLength(2);
        // Default unit price is $55
        expect(getAllByText('$55.00')).toHaveLength(2);
        expect(getAllByText('OrderPanel.perUnit')).toHaveLength(2);

        // BookingTimeForm inputs
        expect(getByText('BookingDatesForm.bookingStartTitle')).toBeInTheDocument();
        expect(getByText('BookingDatesForm.bookingEndTitle')).toBeInTheDocument();
        expect(getByText('BookingDatesForm.requestToBook')).toBeInTheDocument();
      });
    });

    it('Inquiry with restricted view rights should not show OrderPanel - day unit', async () => {
      const config = {
        ...getHostedConfiguration(),
        accessControl: { marketplace: { private: true } },
      };

      const routeConfiguration = getRouteConfiguration(config.layout);
      const processName = 'default-booking';
      const bookingInquiry = createInquiry(processName, 'day', bookingTransitions.INQUIRE);
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const nextTransitions = [
        {
          id: new UUID('next-transition'),
          type: 'processTransition',
          attributes: {
            name: 'transition/request-payment-after-inquiry',
            actor: [transactionRole],
            actions: [],
            params: {},
          },
        },
      ];

      const stateData = getStateData(
        {
          transaction: bookingInquiry,
          transactionRole,
          nextTransitions,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        getProcess(processName)
      );

      const currentUser = createCurrentUser(customerId);
      currentUser.effectivePermissionSet.attributes.read = 'permissions/deny';

      const props = {
        ...panelBaseProps,
        currentUser,
        transaction: bookingInquiry,
        transactionRole,
        nextTransitions,
        params: {
          id: bookingInquiry.id?.uuid,
        },
        lineItems: [],
      };

      const { getAllByText } = render(<TransactionPageComponent {...props} />, {
        config,
        routeConfiguration,
      });

      await waitFor(() => {
        const state = stateData.processState;
        const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
        expect(screen.getByText(txTitle)).toBeInTheDocument();

        expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

        // Activity feed (here we just check the heading)
        expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

        // Show listing's title only (side card)
        expect(getAllByText('listing-item title')).toHaveLength(1);

        // Don't show listing pricing
        expect(screen.queryByText('$55.00')).toBeNull();
        expect(screen.queryByText('OrderPanel.perUnit')).toBeNull();

        // Don't show BookingDatesForm inputs
        expect(screen.queryByText('BookingDatesForm.bookingStartTitle')).toBeNull();
        expect(screen.queryByText('BookingDatesForm.bookingEndTitle')).toBeNull();
        expect(screen.queryByText('BookingDatesForm.requestToBook')).toBeNull();
      });
    });

    it('Inquiry with OrderPanel - item unit', async () => {
      const config = getHostedConfiguration();
      const routeConfiguration = getRouteConfiguration(config.layout);
      const processName = 'default-purchase';
      const inquiry = createInquiry(processName, 'item', purchaseTransitions.INQUIRE);
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const nextTransitions = [
        {
          id: new UUID('next-transition'),
          type: 'processTransition',
          attributes: {
            name: 'transition/request-payment-after-inquiry',
            actor: [transactionRole],
            actions: [],
            params: {},
          },
        },
      ];

      const stateData = getStateData(
        {
          transaction: inquiry,
          transactionRole,
          nextTransitions,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        getProcess(processName)
      );

      const props = {
        ...panelBaseProps,
        currentUser: createCurrentUser(customerId),
        transaction: inquiry,
        transactionRole,
        nextTransitions,
        params: {
          id: inquiry.id?.uuid,
        },
        lineItems: [],
        monthlyTimeSlots: {
          ['2022-06']: {
            fetchTimeSlotsError: null,
            fetchTimeSlotsInProgress: false,
            timeSlots: [],
          },
        },
      };

      const { getByText, getAllByText } = render(<TransactionPageComponent {...props} />, {
        config,
        routeConfiguration,
      });

      await waitFor(() => {
        const state = stateData.processState;
        const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
        expect(screen.getByText(txTitle)).toBeInTheDocument();

        expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

        // Activity feed (here we just check the heading)
        expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

        // Listing's title (side card)
        expect(getAllByText('listing-item title')).toHaveLength(2);
        // Default unit price is $55
        expect(getAllByText('$55.00')).toHaveLength(2);
        expect(getAllByText('OrderPanel.perUnit')).toHaveLength(2);

        // Order purchase CTA
        expect(getByText('OrderPanel.ctaButtonMessagePurchase')).toBeInTheDocument();
      });
    });

    it('Inquiry with restricted view rights should not show OrderPanel - item unit', async () => {
      const config = {
        ...getHostedConfiguration(),
        accessControl: { marketplace: { private: true } },
      };

      const routeConfiguration = getRouteConfiguration(config.layout);
      const processName = 'default-purchase';
      const inquiry = createInquiry(processName, 'item', purchaseTransitions.INQUIRE);
      const transactionRole = TX_TRANSITION_ACTOR_CUSTOMER;
      const nextTransitions = [
        {
          id: new UUID('next-transition'),
          type: 'processTransition',
          attributes: {
            name: 'transition/request-payment-after-inquiry',
            actor: [transactionRole],
            actions: [],
            params: {},
          },
        },
      ];

      const stateData = getStateData(
        {
          transaction: inquiry,
          transactionRole,
          nextTransitions,
          intl: fakeIntl,
          transitionInProgress: false,
          transitionError: null,
          onTransition: noop,
          sendReviewInProgress: false,
          sendReviewError: null,
          onOpenReviewModal: noop,
        },
        getProcess(processName)
      );

      const currentUser = createCurrentUser(customerId);
      currentUser.effectivePermissionSet.attributes.read = 'permissions/deny';

      const props = {
        ...panelBaseProps,
        currentUser,
        transaction: inquiry,
        transactionRole,
        nextTransitions,
        params: {
          id: inquiry.id?.uuid,
        },
        lineItems: [],
      };

      const { getAllByText } = render(<TransactionPageComponent {...props} />, {
        config,
        routeConfiguration,
      });

      await waitFor(() => {
        const state = stateData.processState;
        const txTitle = `TransactionPage.${processName}.${transactionRole}.${state}.title`;
        expect(screen.getByText(txTitle)).toBeInTheDocument();

        expect(screen.getByText('TransactionPage.listingTitleMobile')).toBeInTheDocument();

        // Activity feed (here we just check the heading)
        expect(screen.getByText('TransactionPanel.activityHeading')).toBeInTheDocument();

        // Show listing's title only (side card)
        expect(getAllByText('listing-item title')).toHaveLength(1);

        // Don't show listing pricing
        expect(screen.queryByText('$55.00')).toBeNull();
        expect(screen.queryByText('OrderPanel.perUnit')).toBeNull();

        // Don't show order purchase CTA
        expect(screen.queryByText('OrderPanel.ctaButtonMessagePurchase')).toBeNull();
      });
    });
  });
});
