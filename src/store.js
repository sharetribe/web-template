import { configureStore as configureStoreReduxToolkit } from '@reduxjs/toolkit';
import createReducer from './reducers';
import * as analytics from './analytics/analytics';
import appSettings from './config/settings';

/**
 * Create a new store with the given initial state.
 * This adds default middleware (Redux Thunk) and analytics middleware from props.
 * Redux devTools are enabled in dev mode.
 */
export default function configureStore({
  initialState = {},
  sdk = null,
  analyticsHandlers = [],
  extraMiddlewares = [],
}) {
  const store = configureStoreReduxToolkit({
    reducer: createReducer(),
    preloadedState: initialState,
    middleware: getDefaultMiddleware => {
      const middlewares = getDefaultMiddleware({
        thunk: {
          extraArgument: sdk,
        },
        // Note: we do save class-based objects like UUIDs, Money, LatLng, LatLngBounds, Dates and Decimals to the store
        serializableCheck: false,
      }).prepend(analytics.createAnalyticsListenerMiddleware(analyticsHandlers).middleware);

      return middlewares.concat(extraMiddlewares);
    },
    devTools: appSettings.dev && typeof window === 'object',
  });

  return store;
}
