import { LOCATION_CHANGED } from '../ducks/routing.duck';

// Create a Redux middleware from the given analytics handlers. Each
// handler should have the following methods:
//
// - trackPageView(canonicalPath, previousPath): called when the URL is changed
export const createMiddleware = handlers => store => next => action => {
  const { type, payload } = action;

  if (type === LOCATION_CHANGED) {
    const previousPath = store?.getState()?.routing?.currentCanonicalPath;
    const { canonicalPath } = payload;
    handlers.forEach(handler => {
      handler.trackPageView(canonicalPath, previousPath);
    });
  }

  next(action);
};
