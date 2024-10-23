import { extractYouTubeID } from './string';

/**
 * By default, React DOM escapes any values embedded in JSX before rendering them,
 * but sometimes it is necessary to sanitize the user-generated content of received entities.
 * If you use this data in component props without any sanitization or encoding,
 * it might create XSS vulnerabilities.
 *
 * You should especially consider how you are using extended data inside the app.
 */

const ESCAPE_TEXT_REGEXP = /[<>]/g;
const ESCAPE_TEXT_REPLACEMENTS = {
  //fullwidth lesser-than character
  '<': '\uff1c',
  //fullwidth greater-than character
  '>': '\uff1e',
};

// An example how you could sanitize text content.
// This swaps some coding related characters to less dangerous ones
const sanitizeText = str =>
  str == null
    ? str
    : typeof str === 'string'
    ? str.replace(ESCAPE_TEXT_REGEXP, ch => ESCAPE_TEXT_REPLACEMENTS[ch])
    : '';

// Enum and multi-enum work with predefined option configuration
const sanitizeEnum = (str, options) => (options.map(o => `${o.option}`).includes(str) ? str : null);
const sanitizeMultiEnum = (arr, options) =>
  Array.isArray(arr)
    ? arr.reduce((ret, value) => {
        const enumValue = sanitizeEnum(value, options);
        return enumValue ? [...ret, enumValue] : ret;
      }, [])
    : [];
const sanitizeLong = lng => (lng == null || typeof lng === 'number' ? lng : null);
const sanitizeBoolean = bool => (bool == null || typeof bool === 'boolean' ? bool : null);

const sanitizeYoutubeVideoUrl = url => {
  const sanitizedUrl = sanitizeUrl(url);
  const videoID = extractYouTubeID(sanitizedUrl);
  return videoID ? `https://www.youtube.com/watch?v=${videoID}` : null;
};

// URL sanitizer. This code is adapted from
// https://github.com/braintree/sanitize-url/
// <sanitizeUrl>
const INVALID_PROTOCOL_REGEXP = /^([^\w]*)(javascript|data|vbscript)/im;
const HTML_ENTITIES_REGEXP = /&#(\w+)(^\w|;)?/g;
const CTRL_CHARACTERS_REGEXP = /[\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/gim;
const URL_SCHEME_REGEXP = /^([^:]+):/gm;
const RELATIVE_FIRST_CHARACTERS = ['.', '/'];

function isRelativeUrlWithoutProtocol(url) {
  return RELATIVE_FIRST_CHARACTERS.indexOf(url[0]) > -1;
}

// adapted from https://stackoverflow.com/a/29824550/2601552
function decodeHtmlCharacters(str) {
  return str.replace(HTML_ENTITIES_REGEXP, (match, dec) => {
    return String.fromCharCode(dec);
  });
}

export function sanitizeUrl(url) {
  const sanitizedUrl = decodeHtmlCharacters(url || '')
    .replace(CTRL_CHARACTERS_REGEXP, '')
    .trim();

  if (!sanitizedUrl) {
    return 'about:blank';
  }

  if (isRelativeUrlWithoutProtocol(sanitizedUrl)) {
    return sanitizedUrl;
  }

  const urlSchemeParseResults = sanitizedUrl.match(URL_SCHEME_REGEXP);

  if (!urlSchemeParseResults) {
    return sanitizedUrl;
  }

  const urlScheme = urlSchemeParseResults[0];

  if (INVALID_PROTOCOL_REGEXP.test(urlScheme)) {
    return 'about:blank';
  }

  return sanitizedUrl;
}
// </sanitizeUrl>

/**
 * Sanitize user entity.
 * If you add public data, you should probably sanitize it here.
 * By default, React DOM escapes any values embedded in JSX before rendering them,
 * but if you use this data on props, it might create XSS vulnerabilities
 * E.g. you should sanitize and encode URI if you are creating links from public data.
 */
export const sanitizeUser = (entity, config = {}) => {
  const { attributes, ...restEntity } = entity || {};
  const { profile, ...restAttributes } = attributes || {};
  const { bio, displayName, abbreviatedName, publicData = {}, metadata = {}, ...restProfile } =
    profile || {};

  const sanitizePublicData = publicData => {
    // TODO: If you add public data, you should probably sanitize it here.
    const sanitizedConfiguredPublicData = sanitizeConfiguredPublicData(publicData, config);
    return publicData ? { publicData: sanitizedConfiguredPublicData } : {};
  };
  const sanitizeMetadata = metadata => {
    // TODO: If you add user-generated metadata through Integration API,
    // you should probably sanitize it here.
    return metadata ? { metadata } : {};
  };

  const profileMaybe = profile
    ? {
        profile: {
          abbreviatedName: sanitizeText(abbreviatedName),
          displayName: sanitizeText(displayName),
          bio: sanitizeText(bio),
          ...sanitizePublicData(publicData),
          ...sanitizeMetadata(metadata),
          ...restProfile,
        },
      }
    : {};
  const attributesMaybe = attributes ? { attributes: { ...profileMaybe, ...restAttributes } } : {};

  return { ...attributesMaybe, ...restEntity };
};

/**
 * Sanitize extended data against configuration (against schemaType)
 * @param {any} value Any JSON value
 * @param {object} config containing "schemaType"
 * @returns sanitized value or null
 */
const sanitizedExtendedDataFields = (value, config) => {
  const { schemaType, enumOptions } = config;
  const sanitized =
    schemaType === 'text'
      ? sanitizeText(value)
      : schemaType === 'enum'
      ? sanitizeEnum(value, enumOptions)
      : schemaType === 'multi-enum'
      ? sanitizeMultiEnum(value, enumOptions)
      : schemaType === 'long'
      ? sanitizeLong(value)
      : schemaType === 'boolean'
      ? sanitizeBoolean(value)
      : schemaType === 'youtubeVideoUrl'
      ? sanitizeYoutubeVideoUrl(value)
      : null;

  return sanitized;
};

/**
 * Some of the public data is configurable. This validates that data against the given config.
 * (The config paramter contains listingFields config.)
 *
 * NOTE: this does not handle nested JSON-like objects or other extra data,
 * but there's handling for string type content ('<' & '>' characters are replaced with full-width ones).
 *
 * @param {object} publicData
 * @param {*} config
 * @returns
 */
const sanitizeConfiguredPublicData = (publicData, config = {}) => {
  // The publicData could be null (e.g. for banned user)
  const publicDataObj = publicData || {};
  return Object.entries(publicDataObj).reduce((sanitized, entry) => {
    const [key, value] = entry;
    const foundListingFieldConfig = config?.listingFields?.find(d => d.key === key);
    const foundUserFieldConfig = config?.userFields?.find(d => d.key === key);
    const knownKeysWithString = ['listingType', 'transactionProcessAlias', 'unitType', 'userType'];
    const sanitizedValue = knownKeysWithString.includes(key)
      ? sanitizeText(value)
      : foundListingFieldConfig
      ? sanitizedExtendedDataFields(value, foundListingFieldConfig)
      : foundUserFieldConfig
      ? sanitizedExtendedDataFields(value, foundUserFieldConfig)
      : typeof value === 'string'
      ? sanitizeText(value)
      : value;

    return {
      ...sanitized,
      [key]: sanitizedValue,
    };
  }, {});
};

/**
 * Sanitize listing entity.
 * If you add public data, you should probably sanitize it here.
 * By default, React DOM escapes any values embedded in JSX before rendering them,
 * but if you use this data on props, it might create XSS vulnerabilities
 * E.g. you should sanitize and encode URI if you are creating links from public data.
 */
export const sanitizeListing = (entity, config = {}) => {
  const { attributes, ...restEntity } = entity;
  const { title, description, publicData, ...restAttributes } = attributes || {};

  const sanitizeLocation = location => {
    const { address, building } = location || {};
    return { address: sanitizeText(address), building: sanitizeText(building) };
  };

  const sanitizePublicData = publicData => {
    // Here's an example how you could sanitize location and rules from publicData:
    // TODO: If you add public data, you should probably sanitize it here.
    const { location, ...restPublicData } = publicData || {};
    const locationMaybe = location ? { location: sanitizeLocation(location) } : {};
    const sanitizedConfiguredPublicData = sanitizeConfiguredPublicData(restPublicData, config);

    return publicData ? { publicData: { ...locationMaybe, ...sanitizedConfiguredPublicData } } : {};
  };

  const attributesMaybe = attributes
    ? {
        attributes: {
          title: sanitizeText(title),
          description: sanitizeText(description),
          ...sanitizePublicData(publicData),
          ...restAttributes,
        },
      }
    : {};

  return { ...attributesMaybe, ...restEntity };
};

/**
 * Sanitize entities if needed.
 * Remember to add your own sanitization rules for your extended data
 */
export const sanitizeEntity = (entity, config) => {
  const { type } = entity;
  switch (type) {
    case 'listing':
      return sanitizeListing(entity, config);
    case 'user':
      return sanitizeUser(entity, config);
    default:
      return entity;
  }
};
