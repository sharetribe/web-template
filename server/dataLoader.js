const url = require('url');
const log = require('./log');

exports.loadData = function(requestUrl, sdk, appInfo) {
  const { matchPathname, configureStore, routeConfiguration, config, fetchAppAssets } = appInfo;
  const { pathname, query } = url.parse(requestUrl);
  const matchedRoutes = matchPathname(pathname, routeConfiguration());

  let translations = {};
  const store = configureStore({}, sdk);

  const dataLoadingCalls = matchedRoutes.reduce((calls, match) => {
    const { route, params } = match;
    if (typeof route.loadData === 'function' && !route.auth) {
      calls.push(store.dispatch(route.loadData(params, query)));
    }
    return calls;
  }, []);

  return store
    .dispatch(fetchAppAssets(config.appCdnAssets))
    .then(fetchedAssets => {
      translations = fetchedAssets?.translations?.data || {};
      return Promise.all(dataLoadingCalls);
    })
    .then(() => {
      return { preloadedState: store.getState(), translations };
    })
    .catch(e => {
      log.error(e, 'server-side-data-load-failed');

      // Call to loadData failed, let client handle the data loading errors.
      // (It might be recoverable error like lost connection.)
      // Return "empty" store.
      return store.getState();
    });
};
