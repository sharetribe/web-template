////////////////////////////////////////////////////////////////////
// Maps config handler: hosted configs + built-in defaults
////////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

const MAP_PROVIDERS = ['mapbox', 'googleMaps'];
// See https://docs.mapbox.com/api/accounts/tokens/#token-format
const MAPBOX_ACCESS_TOKEN_PATTERN = /^pk\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+$/;
const GOOGLE_MAPS_API_KEY_MAX_LENGTH = 255;
const isTestEnvironment = process.env.NODE_ENV === 'test';

/**
 * Whether a hosted Mapbox public access token has a valid format (`pk.*.*`).
 * @param {string} token
 * @returns {boolean}
 */
export const isValidMapboxAccessToken = token =>
  typeof token === 'string' && MAPBOX_ACCESS_TOKEN_PATTERN.test(token);

/**
 * Whether a hosted Google Maps API key is usable (non-empty, ≤255).
 * @param {string} key
 * @returns {boolean}
 */
export const isValidGoogleMapsApiKey = key =>
  typeof key === 'string' && key.length >= 1 && key.length <= GOOGLE_MAPS_API_KEY_MAX_LENGTH;

/**
 * Merge hosted maps config with built-in maps defaults.
 * Hosted provider / tokens take priority when present; search, fuzzy, and other
 * built-in keys always come from defaults (hosted maps asset does not override them).
 *
 * Hosted field names differ from app config:
 * - provider → mapProvider
 * - googleMapsApiKey → googleMapsAPIKey
 *
 * @param {Object} hostedMapsConfig data from the maps hosted asset (normalized)
 * @param {Object} defaultMapsConfig built-in defaults from defaultMaps.js
 * @returns {Object}
 */
export const mergeMapsConfig = (hostedMapsConfig, defaultMapsConfig = {}) => {
  const { mapProvider, mapboxAccessToken, googleMapsAPIKey, ...restOfDefault } = defaultMapsConfig;
  const mapProviderPicked = hostedMapsConfig?.provider || mapProvider;
  const mapboxAccessTokenPicked = hostedMapsConfig?.mapboxAccessToken || mapboxAccessToken;
  const googleMapsAPIKeyPicked = hostedMapsConfig?.googleMapsApiKey || googleMapsAPIKey;

  const hasApiAccess =
    mapProviderPicked === 'googleMaps' ? !!googleMapsAPIKeyPicked : !!mapboxAccessTokenPicked;
  if (!hasApiAccess && !isTestEnvironment) {
    console.error(
      `The access tokens are not in place for the selected map provider (${mapProviderPicked})`
    );
  }

  return {
    ...restOfDefault,
    mapProvider: mapProviderPicked,
    mapboxAccessToken: mapboxAccessTokenPicked,
    googleMapsAPIKey: googleMapsAPIKeyPicked,
  };
};

/**
 * Shape the hosted maps asset only (not built-in defaults).
 * Picks known fields and trims token strings; returns {} if the slice is missing/invalid.
 *
 * @param {Object} hostedSlices values keyed by mapsConfig.assetKeys (`maps`)
 * @returns {Object} partial hosted maps input for validate
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.maps;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }

  const provider = typeof hostedSlice.provider === 'string' ? hostedSlice.provider : undefined;
  const mapboxAccessToken =
    typeof hostedSlice.mapboxAccessToken === 'string'
      ? hostedSlice.mapboxAccessToken.trim()
      : undefined;
  const googleMapsApiKey =
    typeof hostedSlice.googleMapsApiKey === 'string'
      ? hostedSlice.googleMapsApiKey.trim()
      : undefined;

  return {
    ...(provider ? { provider } : {}),
    ...(mapboxAccessToken ? { mapboxAccessToken } : {}),
    ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
  };
};

/**
 * Validate the normalized hosted maps slice only — does not read or check built-ins.
 * Drops invalid provider; for a valid selected provider, keeps its token or warns if
 * missing/invalid. Gaps may be filled in resolve from built-in defaults
 * (e.g. env vars in defaultMaps.js). search/fuzzy always come from defaultMaps.js.
 *
 * @param {Object} normalized output of normalize
 * @returns {{ value: Object, issues: Array }} sanitized hosted slice + configIssues
 */
const validate = normalized => {
  const issues = [];
  const value = {};
  const { provider, mapboxAccessToken, googleMapsApiKey } = normalized || {};

  if (provider) {
    if (!MAP_PROVIDERS.includes(provider)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'MAPS_UNSUPPORTED_PROVIDER',
          message: `Map provider "${provider}" is not supported. Use "mapbox" or "googleMaps". Using the built-in default instead, if one is set.`,
        })
      );
    } else {
      value.provider = provider;
    }
  }

  if (value.provider === 'mapbox') {
    if (isValidMapboxAccessToken(mapboxAccessToken)) {
      value.mapboxAccessToken = mapboxAccessToken;
    } else {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'MAPS_INVALID_MAPBOX_ACCESS_TOKEN',
          message:
            'The Mapbox access token is missing or invalid (it should look like pk.…). Using the built-in default instead, if one is set.',
        })
      );
    }
  }

  if (value.provider === 'googleMaps') {
    if (isValidGoogleMapsApiKey(googleMapsApiKey)) {
      value.googleMapsApiKey = googleMapsApiKey;
    } else {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'MAPS_INVALID_GOOGLE_MAPS_API_KEY',
          message:
            'The Google Maps API key is missing or invalid. Using the built-in default instead, if one is set.',
        })
      );
    }
  }

  return { value, issues };
};

/**
 * Build final `config.maps`: prefer validated hosted values; fill gaps from built-ins
 * (often env vars from defaultMaps.js). Always copies search/fuzzy from built-ins
 * (hosted maps does not supply those).
 *
 * @param {Object} validated sanitized hosted slice from validate (`value`)
 * @param {Object} defaults full defaultConfigs (uses `defaults.maps`)
 * @returns {Object} app-config maps object
 */
const resolve = (validated, defaults) => mergeMapsConfig(validated, defaults?.maps);

/**
 * Config handler for the `maps` app-config key.
 *
 * - id / assetKeys: `maps`
 * - Hosted: provider, mapboxAccessToken, googleMapsApiKey
 * - Built-ins also supply search + fuzzy (not overridden by hosted asset)
 */
export const mapsConfig = {
  id: 'maps',
  assetKeys: ['maps'],
  normalize,
  validate,
  resolve,
};
