import React, { act } from 'react';
import '@testing-library/jest-dom';

import configureStore from '../../store';
import { types as sdkTypes } from '../../util/sdkLoader';
import { createCurrentUser, createListing, createTransaction } from '../../util/testData';
import {
  getHostedConfiguration,
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';
import { fireEvent } from '@testing-library/react';

import MakeOfferPage from './MakeOfferPage';

import reducer, { loadData, setInitialState, setInitialValues } from './MakeOfferPage.duck';
import { storableError } from '../../util/errors';

const { UUID } = sdkTypes;

const { screen } = testingLibrary;
const noop = () => null;

// Suppress console.error during tests to avoid noise from expected error cases
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

const logger = actions => () => {
  return next => action => {
    actions.push(action);
    // Call the next dispatch method in the middleware chain.
    return next(action);
  };
};

const listingId = 'listing-id';
const transactionId = 'transaction-id';

const getInitialState = () => {
  const currentUser = createCurrentUser('current-user');
  const listing = createListing(listingId, {
    publicData: {
      transactionProcessAlias: 'default-negotiation/release-1',
    },
  });
  const transaction = createTransaction(transactionId, {
    customer: currentUser,
    listing: listing,
  });

  return {
    MakeOfferPage: {
      listingId: listing.id,
      showListingInProgress: false,
      showListingError: null,
      transaction: transaction,
      makeOfferInProgress: false,
      makeOfferError: null,
      showTransactionInProgress: false,
      showTransactionError: null,
    },
    user: {
      currentUser,
      currentUserHasOrders: false,
      sendVerificationEmailInProgress: false,
    },
    marketplaceData: {
      entities: {
        listing: {
          [listingId]: { ...listing, relationships: { author: currentUser } },
        },
        transaction: {
          [transactionId]: transaction,
        },
      },
    },
  };
};

describe('MakeOfferPage', () => {
  const config = getHostedConfiguration();

  beforeEach(() => {
    // Mock window.matchMedia for components that use it
    window.matchMedia = jest.fn(() => ({
      matches: true,
      addEventListener: noop,
      removeEventListener: noop,
    }));
  });

  const commonProps = {
    params: { id: listingId },
    location: { search: '' },
    scrollingDisabled: false,
  };

  it('Check that listing information is shown correctly', async () => {
    await act(async () => {
      render(<MakeOfferPage {...commonProps} />, {
        initialState: getInitialState(),
        config,
      });
    });

    // Check that the listing title is rendered
    expect(screen.getByText('listing-id title')).toBeInTheDocument();

    // Check that the quote input field is present
    expect(screen.getByLabelText(/MakeOfferPage\.quoteLabel/)).toBeInTheDocument();

    // Check that the message textarea is present
    expect(screen.getByLabelText(/MakeOfferPage\.defaultMessageLabel/)).toBeInTheDocument();

    // Check that the submit button is present
    expect(
      screen.getByRole('button', { name: /MakeOfferPage\.submitButtonText/ })
    ).toBeInTheDocument();

    // Check that the page renders without errors (basic smoke test)
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('Check that numerical input can be written into quote input', async () => {
    await act(async () => {
      render(<MakeOfferPage {...commonProps} />, {
        initialState: getInitialState(),
        config,
      });
    });

    // Find the quote input field
    const quoteInput = screen.getByLabelText(/MakeOfferPage\.quoteLabel/);
    expect(quoteInput).toBeInTheDocument();

    // Test that we can type numerical input using fireEvent
    await act(async () => {
      fireEvent.change(quoteInput, { target: { value: '100.50' } });
    });

    // Verify the input value was set
    expect(quoteInput.value).toBe('100.50');
  });
});

describe('Duck', () => {
  const config = {
    ...getHostedConfiguration(),
    accessControl: {
      marketplace: {
        private: false,
      },
    },
    listing: {
      listingTypes: [
        {
          listingType: 'rent-bicycles-daily',
          transactionType: {
            process: 'default-negotiation/release-1',
            alias: 'default-negotiation/release-1',
            unitType: 'line-item/night',
          },
        },
      ],
    },
  };

  describe('reducer', () => {
    it('should return the initial state', () => {
      expect(reducer(undefined, {})).toEqual({
        listingId: null,
        showListingInProgress: false,
        showListingError: null,
        transaction: null,
        makeOfferInProgress: false,
        makeOfferError: null,
        showTransactionInProgress: false,
        showTransactionError: null,
      });
    });

    it('should handle setInitialState', () => {
      const previousState = {
        listingId: 'some-id',
        showListingInProgress: true,
        showListingError: 'some error',
        transaction: { id: 'transaction-id' },
        makeOfferInProgress: true,
        makeOfferError: 'make offer error',
        showTransactionInProgress: true,
        showTransactionError: 'transaction error',
      };

      expect(reducer(previousState, setInitialState())).toEqual({
        listingId: null,
        showListingInProgress: false,
        showListingError: null,
        transaction: null,
        makeOfferInProgress: false,
        makeOfferError: null,
        showTransactionInProgress: false,
        showTransactionError: null,
      });
    });

    it('should handle setInitialValues', () => {
      const previousState = {
        listingId: 'old-id',
        showListingInProgress: false,
        showListingError: null,
        transaction: null,
        makeOfferInProgress: false,
        makeOfferError: null,
        showTransactionInProgress: false,
        showTransactionError: null,
      };

      const action = setInitialValues({ listingId: 'new-listing-id' });
      expect(reducer(previousState, action)).toEqual({
        listingId: 'new-listing-id',
        showListingInProgress: false,
        showListingError: null,
        transaction: null,
        makeOfferInProgress: false,
        makeOfferError: null,
        showTransactionInProgress: false,
        showTransactionError: null,
      });
    });

    it('should handle showListingThunk.pending', () => {
      const previousState = {
        listingId: null,
        showListingInProgress: false,
        showListingError: 'old error',
      };

      const action = {
        type: 'MakeOfferPage/showListing/pending',
        meta: { arg: { listingId: 'new-listing-id' } },
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        listingId: 'new-listing-id',
        showListingInProgress: true,
        showListingError: null,
      });
    });

    it('should handle showListingThunk.fulfilled', () => {
      const previousState = {
        listingId: 'listing-id',
        showListingInProgress: true,
        showListingError: null,
      };

      const action = {
        type: 'MakeOfferPage/showListing/fulfilled',
        payload: { id: 'listing-id' },
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        showListingInProgress: false,
      });
    });

    it('should handle showListingThunk.rejected', () => {
      const previousState = {
        listingId: 'listing-id',
        showListingInProgress: true,
        showListingError: null,
      };

      const error = storableError(new Error('Listing not found'));
      const action = {
        type: 'MakeOfferPage/showListing/rejected',
        payload: error,
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        showListingError: error,
        showListingInProgress: false,
      });
    });

    it('should handle showTransactionThunk.pending', () => {
      const previousState = {
        transaction: null,
        showTransactionInProgress: false,
        showTransactionError: 'old error',
      };

      const action = {
        type: 'MakeOfferPage/showTransaction/pending',
        meta: { arg: { transactionId: 'transaction-id' } },
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        transaction: 'transaction-id',
        showTransactionInProgress: true,
        showTransactionError: null,
      });
    });

    it('should handle showTransactionThunk.fulfilled', () => {
      const previousState = {
        showTransactionInProgress: true,
        showTransactionError: null,
      };

      const action = {
        type: 'MakeOfferPage/showTransaction/fulfilled',
        payload: { id: 'transaction-id' },
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        showTransactionInProgress: false,
      });
    });

    it('should handle showTransactionThunk.rejected', () => {
      const previousState = {
        showTransactionInProgress: true,
        showTransactionError: null,
      };

      const error = storableError(new Error('Transaction not found'));
      const action = {
        type: 'MakeOfferPage/showTransaction/rejected',
        payload: error,
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        showTransactionError: error,
        showTransactionInProgress: false,
      });
    });

    it('should handle makeOfferThunk.pending', () => {
      const previousState = {
        makeOfferInProgress: false,
        makeOfferError: 'old error',
      };

      const action = {
        type: 'MakeOfferPage/makeOffer/pending',
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        makeOfferInProgress: true,
        makeOfferError: null,
      });
    });

    it('should handle makeOfferThunk.fulfilled', () => {
      const previousState = {
        makeOfferInProgress: true,
        makeOfferError: null,
        transaction: null,
      };

      const action = {
        type: 'MakeOfferPage/makeOffer/fulfilled',
        payload: { id: 'transaction-id' },
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        transaction: { id: 'transaction-id' },
        makeOfferInProgress: false,
      });
    });

    it('should handle makeOfferThunk.rejected', () => {
      const previousState = {
        makeOfferInProgress: true,
        makeOfferError: null,
      };

      const error = storableError(new Error('Make offer error'));
      const action = {
        type: 'MakeOfferPage/makeOffer/rejected',
        payload: error,
      };

      expect(reducer(previousState, action)).toEqual({
        ...previousState,
        makeOfferError: error,
        makeOfferInProgress: false,
      });
    });
  });

  describe('loadData', () => {
    // Shared parameters for loadData tests
    const fakeResponse = resource => ({ data: { data: resource, include: [] } });
    const sdkFn = response => jest.fn(() => Promise.resolve(response));
    const errorSdkFn = error => jest.fn(() => Promise.reject(error));

    it('loadData() for listing page loads listing data', () => {
      const initialState = getInitialState();
      const { currentUser } = initialState.user;
      const listing = initialState.marketplaceData.entities.listing[listingId];

      const testInitialState = {
        ...initialState,
        user: { currentUser },
        auth: { isAuthenticated: true },
      };

      const sdk = {
        currentUser: { show: sdkFn(fakeResponse(currentUser)) },
        listings: { show: sdkFn(fakeResponse(listing)) },
        ownListings: { show: sdkFn(fakeResponse(listing)) },
        authInfo: sdkFn({}),
      };

      let actions = [];
      const store = configureStore({
        initialState: testInitialState,
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      return loadData({ id: listingId }, null, config)(dispatch, getState, sdk).then(data => {
        const relevantActions = actions.filter(
          action => !action.type.startsWith('user/fetchCurrentUser/')
        );

        expect(relevantActions[0]).toEqual(setInitialState());
        expect(
          relevantActions.some(action => action.type === 'MakeOfferPage/showListing/pending')
        ).toBe(true);
        expect(relevantActions.some(action => action.type === 'marketplaceData/addEntities')).toBe(
          true
        );
        expect(
          relevantActions.some(action => action.type === 'MakeOfferPage/showListing/fulfilled')
        ).toBe(true);
      });
    });

    it('loadData() for transaction page loads transaction data', () => {
      const initialState = getInitialState();
      const { currentUser } = initialState.user;
      const transaction = initialState.marketplaceData.entities.transaction[transactionId];

      const testInitialState = {
        ...initialState,
        user: { currentUser },
        auth: { isAuthenticated: true },
      };

      const sdk = {
        currentUser: { show: sdkFn(fakeResponse(currentUser)) },
        transactions: { show: sdkFn(fakeResponse(transaction)) },
        authInfo: sdkFn({}),
      };

      let actions = [];
      const store = configureStore({
        initialState: testInitialState,
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      return loadData({ id: listingId }, `?transactionId=${transactionId}`, config)(
        dispatch,
        getState,
        sdk
      ).then(data => {
        const relevantActions = actions.filter(
          action => !action.type.startsWith('user/fetchCurrentUser/')
        );
        expect(relevantActions[0]).toEqual(setInitialState());
        expect(
          relevantActions.some(action => action.type === 'MakeOfferPage/showTransaction/pending')
        ).toBe(true);
        expect(relevantActions.some(action => action.type === 'marketplaceData/addEntities')).toBe(
          true
        );
        expect(
          relevantActions.some(action => action.type === 'MakeOfferPage/showTransaction/fulfilled')
        ).toBe(true);
      });
    });

    it('loadData() for unauthorized user in private marketplace does not load data', () => {
      const initialState = getInitialState();
      const currentUser = createCurrentUser('unauthorized-user');
      currentUser.attributes.state = 'pending-approval'; // Unauthorized user

      const testInitialState = {
        ...initialState,
        user: { currentUser },
        auth: { isAuthenticated: true },
      };

      const privateConfig = {
        ...config,
        accessControl: {
          marketplace: {
            private: true,
          },
        },
      };

      const sdk = {
        currentUser: { show: sdkFn(fakeResponse(currentUser)) },
        authInfo: sdkFn({}),
      };

      let actions = [];
      const store = configureStore({
        initialState: testInitialState,
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      return loadData({ id: listingId }, null, privateConfig)(dispatch, getState, sdk).then(
        data => {
          const relevantActions = actions.filter(
            action => !action.type.startsWith('user/fetchCurrentUser/')
          );

          expect(relevantActions[0]).toEqual(setInitialState());
          // Check that no data loading actions are dispatched
          expect(
            relevantActions.some(action => action.type === 'MakeOfferPage/showListing/pending')
          ).toBe(false);
          expect(
            relevantActions.some(action => action.type === 'MakeOfferPage/showTransaction/pending')
          ).toBe(false);
        }
      );
    });

    it('loadData() for user with no viewing rights loads own listing data', () => {
      const initialState = getInitialState();
      const { currentUser } = initialState.user;
      currentUser.effectivePermissionSet.attributes.read = 'permission/deny';
      const listing = initialState.marketplaceData.entities.listing[listingId];

      const testInitialState = {
        ...initialState,
        user: { currentUser },
        auth: { isAuthenticated: true },
      };

      const sdk = {
        currentUser: { show: sdkFn(fakeResponse(currentUser)) },
        ownListings: { show: sdkFn(fakeResponse(listing)) },
        authInfo: sdkFn({}),
      };

      let actions = [];
      const store = configureStore({
        initialState: testInitialState,
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      return loadData({ id: listingId }, null, config)(dispatch, getState, sdk).then(data => {
        const relevantActions = actions.filter(
          action => !action.type.startsWith('user/fetchCurrentUser/')
        );

        expect(relevantActions[0]).toEqual(setInitialState());
        expect(
          relevantActions.some(action => action.type === 'MakeOfferPage/showListing/pending')
        ).toBe(true);
        expect(relevantActions.some(action => action.type === 'marketplaceData/addEntities')).toBe(
          true
        );
        expect(
          relevantActions.some(action => action.type === 'MakeOfferPage/showListing/fulfilled')
        ).toBe(true);
      });
    });
  });
});
