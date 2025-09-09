import { configureStore as configureStoreReduxToolkit } from '@reduxjs/toolkit';
import createReducer from './reducers';
import * as analytics from './analytics/analytics';
import appSettings from './config/settings';

/**
 * Create a new store with the given initial state.
 * This adds default middleware (Redux Thunk) and analytics middleware from props.
 * Redux devTools are enabled in dev mode.
 */
export default function configureStore(initialState = {}, sdk = null, analyticsHandlers = []) {
  const store = configureStoreReduxToolkit({
    reducer: createReducer(),
    preloadedState: initialState,
    middleware: getDefaultMiddleware => {
      const middlewares = getDefaultMiddleware({
        thunk: {
          extraArgument: sdk,
        },
      }).prepend(analytics.createAnalyticsListenerMiddleware(analyticsHandlers).middleware);

      return middlewares;
    },
    devTools: appSettings.dev && typeof window === 'object',
  });

  return store;
}
