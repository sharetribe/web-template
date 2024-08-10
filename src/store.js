// We create Redux store directly, instead of using any extra dependencies.
import { legacy_createStore as createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import createReducer from './reducers';
import * as analytics from './analytics/analytics';
import appSettings from './config/settings';

/**
 * Create a new store with the given initial state. Adds Redux
 * middleware and enhancers.
 */
export default function configureStore(initialState = {}, shareTribeSdk = null, greenStoqSdk = null, analyticsHandlers = []) {
  const middlewares = [
    thunk.withExtraArgument(
      {
        shareTribeSdk: shareTribeSdk,
        greenStoqSdk: greenStoqSdk
      }
    ),
    analytics.createMiddleware(analyticsHandlers)
  ];

  // Enable Redux Devtools in client side dev mode.
  const composeEnhancers =
    appSettings.dev && typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      : compose;

  const enhancer = composeEnhancers(applyMiddleware(...middlewares));

  const store = createStore(createReducer(), initialState, enhancer);

  return store;
}
