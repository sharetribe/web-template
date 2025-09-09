import { createListenerMiddleware } from '@reduxjs/toolkit';
import { locationChanged } from '../ducks/routing.duck';

// Create a Redux Toolkit listener middleware for analytics handlers. Each
// handler should have the following methods:
//
// - trackPageView(canonicalPath, previousPath): called when the URL is changed
export const createAnalyticsListenerMiddleware = handlers => {
  const listenerMiddleware = createListenerMiddleware();

  listenerMiddleware.startListening({
    actionCreator: locationChanged,
    effect: (action, listenerApi) => {
      const { canonicalPath } = action.payload;
      const previousPath = listenerApi.getOriginalState()?.routing?.currentCanonicalPath;

      handlers.forEach(handler => {
        handler.trackPageView(canonicalPath, previousPath);
      });
    },
  });

  return listenerMiddleware;
};

// Legacy export for backward compatibility
export const createMiddleware = createAnalyticsListenerMiddleware;
