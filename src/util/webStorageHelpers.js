import { isEmpty } from './common';
import { types as sdkTypes } from './sdkLoader';
import { isAfterDate } from './dates';

const REFERRAL_ID_STORAGE_KEY = 'referralSource';
const REFERRAL_SOURCE_DATA_PREFIX = 'referralSource_';
const DAY_MS = 864e5; // milliseconds in a 24h
const EXPIRATION_DURATION_90D = 90 * DAY_MS;

/**
 * Returns true if the referral data's expiry timestamp has passed.
 *
 * @param {Object} referralData
 * @returns {boolean}
 */
const isReferralDataExpired = referralData => {
  return isAfterDate(new Date(), referralData.expiresAt);
};

/**
 * Returns true if the given referral params are already stored in local storage
 * with matching keys and values.
 *
 * @param {Object} storedData - Data currently in local storage - consist of sources and expiresAt params
 * @param {Object} urlReferralParams - Filtered referral params from the current URL
 * @returns {boolean}
 */
const isReferralDataStored = (storedData, urlReferralParams) => {
  if (storedData == null || storedData?.sources == null) {
    return false;
  }

  // Sort entries before comparing so that insertion order doesn't affect the result.
  const sortedURLReferralParams = Object.fromEntries(Object.entries(urlReferralParams).sort());
  const sortedStoredDataParams = Object.fromEntries(Object.entries(storedData?.sources).sort());
  return JSON.stringify(sortedURLReferralParams) === JSON.stringify(sortedStoredDataParams);
};

/**
 * Filters referral params down to only those whose keys match a referral source
 * configured on any user type.
 *
 * @param {Object} referralData - Parsed query parameters from the signup URL
 * @param {Array} userTypes - User type config
 * @returns {Object} Filtered referral params
 */
export const filterValidReferralData = (referralData, userTypes) => {
  const validReferralSources = userTypes.flatMap(userType =>
    userType.referralSources
      ? userType.referralSources.map(referralSource => referralSource.parameter)
      : []
  );
  return Object.fromEntries(
    Object.entries(referralData).filter(([key]) => validReferralSources.includes(key))
  );
};

/**
 * Stores filtered referral data to local storage with a 90-day expiry.
 *
 * Skips storage if the same data is already stored and has not expired. If the
 * stored data has expired, it is overwritten with a fresh 90-day expiry.
 *
 *
 * @param {Object} referralData - Filtered referral params to store
 */
export const storeReferralData = referralData => {
  const storedData = getStoredReferralData();

  // Don't store the referral ID if it has already been stored and hasn't expired
  if (!isReferralDataStored(storedData, referralData) || isReferralDataExpired(storedData)) {
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser && window?.localStorage) {
      const data = {
        sources: referralData,
        expiresAt: new Date(Date.now() + EXPIRATION_DURATION_90D),
      };

      const replacer = function(k, v) {
        if (this[k] instanceof Date) {
          return { date: v, _serializedType: 'SerializableDate' };
        }
        if (typeof v === 'number') {
          return v.toString();
        }
        return sdkTypes.replacer(k, v);
      };

      const storableData = JSON.stringify(data, replacer);
      window.localStorage.setItem(REFERRAL_ID_STORAGE_KEY, storableData);
    }
  }
};

/**
 * Retrieves and deserializes referral data from local storage.
 *
 * @returns {Object} Stored referral data or empty object if local storage is unavailable or no data is stored
 */
export const getStoredReferralData = () => {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && window?.localStorage) {
    const retrievedReferralData = window.localStorage.getItem(REFERRAL_ID_STORAGE_KEY);

    const reviver = (k, v) => {
      if (v && typeof v === 'object' && v._serializedType === 'SerializableDate') {
        // Dates are expected to be stored as:
        // { date: new Date(), _serializedType: 'SerializableDate' }
        return new Date(v.date);
      }
      return sdkTypes.reviver(k, v);
    };

    const referralSource = retrievedReferralData ? JSON.parse(retrievedReferralData, reviver) : {};
    return referralSource;
  }

  return {};
};

/**
 * Removes referral data from local storage
 */
export const clearStoredReferralData = () => {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser && window?.localStorage) {
    window.localStorage.removeItem(REFERRAL_ID_STORAGE_KEY);
  }
};

/**
 * Returns the subset of stored referral data, prefixed with 'referralSource_', that
 * is valid for the given user type. Returns an empty object if there is no stored
 * data, the data has expired, or none of the stored keys match the user type's
 * referral sources.
 *
 * @param {Object} userTypeConfig - Config object for the selected user type
 * @param {Object} userTypeConfig.referralSources - Map of valid referral sources for this type
 * @returns {Object} Referral key/value pairs to store in the user's private data
 */
export const pickReferralData = userTypeConfig => {
  const referralData = getStoredReferralData();

  // Keys configured as valid referral sources for this user type
  const validReferralSources = userTypeConfig?.referralSources;

  if (!validReferralSources || !referralData?.sources || isReferralDataExpired(referralData))
    return {};

  // Only return entries whose keys are present in the user type's referral source config,
  // removing any unrecognised keys from referralSources
  const entries = Object.entries(referralData.sources).filter(([key]) =>
    validReferralSources.some(validReferralSource => validReferralSource.parameter === key)
  );
  return Object.fromEntries(
    entries.map(([key, value]) => [`${REFERRAL_SOURCE_DATA_PREFIX}${key}`, value])
  );
};

/**
 * Clears referral data from local storage if it has expired.
 *
 * Called on every page load (src/index.js) to ensure stale referral data does
 * not persist across hard refreshes or cross-domain navigation within the same tab.
 */
export const clearReferralDataIfExpired = () => {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && window.localStorage) {
    const referralData = getStoredReferralData();

    // Referral data has expired, clear it from local storage
    if (referralData != null && isReferralDataExpired(referralData)) {
      clearStoredReferralData();
    }
  }
};
