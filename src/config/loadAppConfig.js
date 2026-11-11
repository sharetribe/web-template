/**
 * Helps splitting the app config into a separate code chunk for better performance.
 *
 * Loads built-in defaults + mergeConfig as one async webpack chunk, in parallel
 * with hosted-asset fetch.
 *
 * @returns {Promise<{ defaultConfig: Object, mergeConfig: Function }>}
 */
export const loadAppConfig = () =>
  Promise.all([
    import(/* webpackChunkName: "appConfig" */ './configDefault'),
    import(/* webpackChunkName: "appConfig" */ './mergeConfig'),
  ]).then(([defaultsMod, mergeMod]) => ({
    defaultConfig: defaultsMod.default,
    mergeConfig: mergeMod.mergeConfig,
  }));
