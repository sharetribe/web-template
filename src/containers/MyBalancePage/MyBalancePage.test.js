import React from 'react';
import '@testing-library/jest-dom';
import Decimal from 'decimal.js';

import { types as sdkTypes } from '../../util/sdkLoader';
import { LINE_ITEM_ITEM, LINE_ITEM_PROVIDER_COMMISSION } from '../../util/types';
import {
  createUser,
  createCurrentUser,
  createListing,
  createTransaction,
} from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { getProcess } from '../../transactions/transaction';

import MyBalancePage from './MyBalancePage';
import reducer, { loadTransactionsThunk, fetchSummaryThunk } from './MyBalancePage.duck';

const { Money } = sdkTypes;
const { screen, waitFor } = testingLibrary;

const purchaseTransitions = getProcess('default-purchase')?.transitions;

describe('MyBalancePage', () => {
  const provider = createUser('provider');
  const customer = createUser('customer');
  const currentUser = createCurrentUser('provider-user-id');
  const listing = createListing('listing1', {
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
      unitPrice: new Money(-100, 'USD'),
      lineTotal: new Money(-100, 'USD'),
      reversal: false,
    },
  ];

  const baseState = {
    MyBalancePage: {
      fetchInProgress: false,
      fetchError: null,
      pagination: null,
      transactionRefs: [],
      summaryFetchInProgress: false,
      completedTotalAmount: 0,
      pendingTotalAmount: 0,
      cancelledCount: 0,
      currency: null,
    },
    marketplaceData: { entities: {} },
    user: {
      currentUser,
      currentUserHasListings: false,
      sendVerificationEmailInProgress: false,
    },
  };

  it('renders page heading', async () => {
    render(<MyBalancePage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('MyBalancePage.heading')).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    render(<MyBalancePage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('MyBalancePage.noResults')).toBeInTheDocument();
    });
  });

  it('renders transaction list', async () => {
    const sale1 = createTransaction({
      id: 'sale1',
      lastTransition: purchaseTransitions.CONFIRM_PAYMENT,
      customer,
      provider,
      listing,
      lastTransitionedAt: new Date(Date.UTC(2023, 0, 15)),
      lineItems,
    });

    const initialState = {
      ...baseState,
      MyBalancePage: {
        ...baseState.MyBalancePage,
        pagination: { page: 1, perPage: 10, totalItems: 1, totalPages: 1 },
        transactionRefs: [{ id: sale1.id, type: sale1.type }],
      },
      marketplaceData: {
        entities: {
          transaction: { sale1 },
          user: { customer, provider },
          listing: { listing1: listing },
        },
      },
    };

    render(<MyBalancePage />, { initialState });

    await waitFor(() => {
      const items = screen.queryAllByRole('link', { name: /listing1/i });
      expect(items).toHaveLength(1);
    });
  });

  it('renders loading spinner', async () => {
    const initialState = {
      ...baseState,
      MyBalancePage: {
        ...baseState.MyBalancePage,
        fetchInProgress: true,
      },
    };

    const { container } = render(<MyBalancePage />, { initialState });

    await waitFor(() => {
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('renders error state', async () => {
    const initialState = {
      ...baseState,
      MyBalancePage: {
        ...baseState.MyBalancePage,
        fetchError: { type: 'error', name: 'test', message: 'test error' },
      },
    };

    render(<MyBalancePage />, { initialState });

    await waitFor(() => {
      expect(screen.getByText('MyBalancePage.loadingError')).toBeInTheDocument();
    });
  });

  it('renders balance summary cards', async () => {
    const initialState = {
      ...baseState,
      MyBalancePage: {
        ...baseState.MyBalancePage,
        completedTotalAmount: 5000,
        pendingTotalAmount: 1000,
        cancelledCount: 2,
        currency: 'USD',
      },
    };

    render(<MyBalancePage />, { initialState });

    await waitFor(() => {
      expect(screen.getByText('BalanceSummary.totalEarnings')).toBeInTheDocument();
      expect(screen.getByText('BalanceSummary.pending')).toBeInTheDocument();
      expect(screen.getByText('BalanceSummary.cancelled')).toBeInTheDocument();
    });
  });
});

describe('MyBalancePage reducer', () => {
  it('returns initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      fetchInProgress: false,
      fetchError: null,
      pagination: null,
      transactionRefs: [],
      summaryFetchInProgress: false,
      completedTotalAmount: 0,
      pendingTotalAmount: 0,
      cancelledCount: 0,
      currentMonthCompletedAmount: 0,
      currentMonthPendingAmount: 0,
      currentMonthCancelledCount: 0,
      currency: null,
      summaryLoaded: false,
    });
  });

  it('handles pending state for transactions', () => {
    const state = reducer(undefined, { type: loadTransactionsThunk.pending.type });
    expect(state.fetchInProgress).toBe(true);
    expect(state.fetchError).toBeNull();
  });

  it('handles fulfilled state for transactions', () => {
    const action = {
      type: loadTransactionsThunk.fulfilled.type,
      payload: {
        data: {
          data: [{ id: { uuid: 'tx1' }, type: 'transaction' }],
          meta: { page: 1, totalPages: 1, totalItems: 1, perPage: 10 },
        },
      },
    };
    const state = reducer(undefined, action);
    expect(state.fetchInProgress).toBe(false);
    expect(state.transactionRefs).toHaveLength(1);
    expect(state.pagination).toEqual(action.payload.data.meta);
  });

  it('handles rejected state for transactions', () => {
    const error = { type: 'error', name: 'test', message: 'fail' };
    const state = reducer(undefined, {
      type: loadTransactionsThunk.rejected.type,
      payload: error,
    });
    expect(state.fetchInProgress).toBe(false);
    expect(state.fetchError).toEqual(error);
  });

  it('handles fulfilled state for summary', () => {
    const action = {
      type: fetchSummaryThunk.fulfilled.type,
      payload: {
        completedTotalAmount: 5000,
        pendingTotalAmount: 1000,
        cancelledCount: 3,
        currency: 'USD',
      },
    };
    const state = reducer(undefined, action);
    expect(state.summaryFetchInProgress).toBe(false);
    expect(state.completedTotalAmount).toBe(5000);
    expect(state.pendingTotalAmount).toBe(1000);
    expect(state.cancelledCount).toBe(3);
    expect(state.currency).toBe('USD');
  });
});
