import { denormalizeAssetData } from '../util/data';
import * as log from '../util/log';
import { storableError } from '../util/errors';

// Pick paths from entries of appCdnAssets config (in configDefault.js)
const pickHostedConfigPaths = (assetEntries, excludeAssetNames) => {
  // E.g. allPaths = ['any/foo.json', 'any/bar.json']
  return assetEntries.reduce((pickedPaths, [name, path]) => {
    if (excludeAssetNames.includes(name)) {
      return pickedPaths;
    }
    return [...pickedPaths, path];
  }, []);
};
const getFirstAssetData = response => response?.data?.data[0]?.attributes?.data;
const getMultiAssetData = response => response?.data?.data;
const getMultiAssetIncluded = response => response?.data?.included;
const findJSONAsset = (assets, absolutePath) =>
  assets.find(a => a.type === 'jsonAsset' && a.attributes.assetPath === absolutePath);
const getAbsolutePath = path => (path.charAt(0) !== '/' ? `/${path}` : path);

const getGoogleAnalyticsId = (configAssets, path) => {
  if (!configAssets || !path) {
    return null;
  }
  const configAssetsData = getMultiAssetData(configAssets);
  const jsonAsset = findJSONAsset(configAssetsData, getAbsolutePath(path));
  const { enabled, measurementId } = jsonAsset?.attributes?.data?.googleAnalytics || {};
  return enabled ? measurementId : null;
};

// ================ Action types ================ //

export const ASSETS_REQUEST = 'app/assets/REQUEST';
export const ASSETS_SUCCESS = 'app/assets/SUCCESS';
export const ASSETS_ERROR = 'app/assets/ERROR';

export const PAGE_ASSETS_REQUEST = 'app/assets/PAGE_ASSETS_REQUEST';
export const PAGE_ASSETS_SUCCESS = 'app/assets/PAGE_ASSETS_SUCCESS';
export const PAGE_ASSETS_ERROR = 'app/assets/PAGE_ASSETS_ERROR';

// ================ Reducer ================ //

const initialState = {
  // List of app-wide assets that should be fetched and their path in Asset API.
  // appAssets: { assetName: 'path/to/asset.json' }
  appAssets: {},
  pageAssetsData: null,
  currentPageAssets: [],
  // Current version of the saved asset.
  // Typically, the version that is returned by the "latest" alias.
  version: null,
  inProgress: false,
  error: null,
};

export default function assetReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case ASSETS_REQUEST:
      return { ...state, inProgress: true, error: null };
    case ASSETS_SUCCESS:
      return {
        ...state,
        appAssets: payload.assets,
        version: state.version || payload.version,
        googleAnalyticsId: payload.googleAnalyticsId,
        inProgress: false,
      };
    case ASSETS_ERROR:
      return { ...state, inProgress: false, error: payload };

    case PAGE_ASSETS_REQUEST:
      return { ...state, currentPageAssets: payload, inProgress: true, error: null };
    case PAGE_ASSETS_SUCCESS:
      return { ...state, pageAssetsData: payload, inProgress: false };
    case PAGE_ASSETS_ERROR:
      return { ...state, inProgress: false, error: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const appAssetsRequested = () => ({ type: ASSETS_REQUEST });
export const appAssetsSuccess = (assets, version, googleAnalyticsId) => ({
  type: ASSETS_SUCCESS,
  payload: { assets, version, googleAnalyticsId },
});
export const appAssetsError = error => ({
  type: ASSETS_ERROR,
  payload: error,
});

export const pageAssetsRequested = assetKeys => ({ type: PAGE_ASSETS_REQUEST, payload: assetKeys });
export const pageAssetsSuccess = assets => ({ type: PAGE_ASSETS_SUCCESS, payload: assets });
export const pageAssetsError = error => ({
  type: PAGE_ASSETS_ERROR,
  payload: error,
});

// ================ Thunks ================ //

export const fetchAppAssets = (assets, version) => (dispatch, getState, sdk) => {
  dispatch(appAssetsRequested());

  // App-wide assets include 2 content assets: translations for microcopy and footer
  const translationsPath = assets.translations;
  const footerPath = assets.footer;

  // The rest of the assets are considered as configurations
  const assetEntries = Object.entries(assets);
  const nonConfigAssets = ['translations', 'footer'];
  const configPaths = pickHostedConfigPaths(assetEntries, nonConfigAssets);

  // If version is given fetch assets by the version,
  // otherwise default to "latest" alias
  const fetchAssets = paths =>
    version
      ? sdk.assetsByVersion({ paths, version })
      : sdk.assetsByAlias({ paths, alias: 'latest' });

  const separateAssetFetches = [
    // This is a big file, better fetch it alone.
    // Then browser cache also comes into play.
    fetchAssets([translationsPath]),
    // Not a config, and potentially a big file.
    // It can benefit of browser cache when being a separate fetch.
    fetchAssets([footerPath]),
    // App configs
    fetchAssets(configPaths),
  ];

  return Promise.all(separateAssetFetches)
    .then(([translationAsset, footerAsset, configAssets]) => {
      const getVersionHash = response => response?.data?.meta?.version;
      const versionInTranslationsCall = getVersionHash(translationAsset);
      const versionInFooterCall = getVersionHash(footerAsset);
      const versionInConfigsCall = getVersionHash(configAssets);
      const hasSameVersions =
        versionInTranslationsCall === versionInFooterCall &&
        versionInFooterCall === versionInConfigsCall;

      // NOTE: making separate calls means that there might be version mismatch
      // when using 'latest' alias.
      // Since we only fetch translations and footer as a separate calls from configs,
      // there should not be major problems with this approach.
      // TODO: potentially show an error page or reload if version mismatch is detected.
      if (!version && !hasSameVersions) {
        console.warn("Asset versions between calls don't match.");
      }

      const googleAnalyticsId = getGoogleAnalyticsId(configAssets, assets.analytics);
      dispatch(appAssetsSuccess(assets, versionInTranslationsCall, googleAnalyticsId));

      // Returned value looks like this for a single asset with name: "translations":
      // {
      //    translations: {
      //      path: 'content/translations.json', // an example path in Asset Delivery API
      //      data, // translation key & value pairs
      //    },
      // }
      return assetEntries.reduce((collectedAssets, assetEntry, i) => {
        const [name, path] = assetEntry;

        if (nonConfigAssets.includes(name)) {
          // There are distinct calls for these assets
          const assetResponse = name === 'translations' ? translationAsset : footerAsset;
          return { ...collectedAssets, [name]: { path, data: getFirstAssetData(assetResponse) } };
        }

        // Other asset path are assumed to be config assets
        const fetchedConfigAssets = getMultiAssetData(configAssets);
        const jsonAsset = findJSONAsset(fetchedConfigAssets, getAbsolutePath(path));

        // branding.json config asset can contain image references,
        // which should be denormalized from "included" section of the response
        const data = denormalizeAssetData({
          data: jsonAsset?.attributes?.data,
          included: getMultiAssetIncluded(configAssets),
        });
        return { ...collectedAssets, [name]: { path, data } };
      }, {});
    })
    .catch(e => {
      log.error(e, 'app-asset-fetch-failed', { assets, version });
      dispatch(appAssetsError(storableError(e)));
    });
};

export const fetchPageAssets = (assets, hasFallback) => (dispatch, getState, sdk) => {
  const version = getState()?.hostedAssets?.version;
  if (typeof version === 'undefined') {
    throw new Error(
      'App-wide assets were not fetched first. Asset version missing from Redux store.'
    );
  }

  dispatch(pageAssetsRequested(Object.keys(assets)));

  // If version is given fetch assets by the version,
  // otherwise default to "latest" alias
  const fetchAssets = version
    ? assetPath => sdk.assetByVersion({ path: assetPath, version })
    : assetPath => sdk.assetByAlias({ path: assetPath, alias: 'latest' });

  const assetEntries = Object.entries(assets);
  const sdkAssets = assetEntries.map(([key, assetPath]) => fetchAssets(assetPath));

  return Promise.all(sdkAssets)
    .then(responses => {
      const hostedAssetsState = getState()?.hostedAssets;
      // These are fixed page assets that the app expects to be there. Keep fixed assets always in store.
      const { termsOfService, privacyPolicy, landingPage, ...rest } =
        hostedAssetsState?.pageAssetsData || {};
      const fixedPageAssets = { termsOfService, privacyPolicy, landingPage };
      // Avoid race condition, which might happen if automatic redirections try to fetch different assets
      // This could happen, when logged-in user clicks some signup link (AuthenticationPage fetches terms&privacy, LandingPage fetches its asset)
      const pickLatestPageAssetData = hostedAssetsState?.currentPageAssets.reduce(
        (collected, pa) => {
          const cmsPageData = rest[pa];
          return cmsPageData ? { ...collected, [pa]: cmsPageData } : collected;
        },
        {}
      );
      // Returned value looks like this for a single asset with name: "about-page":
      // {
      //    "about-page": {
      //      path: 'content/about-page.json', // an example path in Asset Delivery API
      //      data, // translation key & value pairs
      //    },
      //    // etc.
      // }
      // Note: we'll pick fixed page assets and the current page asset always.
      const pageAssets = assetEntries.reduce(
        (collectedAssets, assetEntry, i) => {
          const [name, path] = assetEntry;
          const assetData = denormalizeAssetData(responses[i].data);
          return { ...collectedAssets, [name]: { path, data: assetData } };
        },
        { ...fixedPageAssets, ...pickLatestPageAssetData }
      );
      dispatch(pageAssetsSuccess(pageAssets));
      return pageAssets;
    })
    .catch(e => {
      // If there's a fallback UI, something went wrong when fetching the "known asset" like landing-page.json.
      // If there's no fallback UI created, we assume that the page URL was mistyped for 404 errors.
      if (hasFallback || (!hasFallback && e.status === 404)) {
        log.error(e, 'page-asset-fetch-failed', { assets, version });
      }
      dispatch(pageAssetsError(storableError(e)));
    });
};
