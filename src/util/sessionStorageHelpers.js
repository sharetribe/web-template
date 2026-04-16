import { isEmpty } from '../util/common';
import { types as sdkTypes } from '../util/sdkLoader';
import { isAfterDate } from '../util/dates';

export const REFERRAL_ID_SESSION_STORAGE_KEY = 'referralSource';
const HOUR_IN_MS = 60 * 60 * 1000;

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
 * Returns true if the given referral params are already stored in session storage
 * with matching keys and values.
 *
 * @param {Object} storedData - Data currently in session storage - consist of sources and expiresAt params
 * @param {Object} urlReferralParams - Filtered referral params from the current URL
 * @returns {boolean}
 */
const isReferralDataStored = (storedData, urlReferralParams) => {
  if (storedData == null || storedData?.sources == null) {
    return false;
  }

  const urlReferralKeys = Object.keys(urlReferralParams);
  const storedDataKeys = Object.keys(storedData?.sources);

  // Check if urlReferralParams' ID + key are already stored in session storage
  if (urlReferralKeys.length !== storedDataKeys.length) {
    return false;
  }

  for (let i = 0; i < urlReferralKeys.length; i++) {
    const urlReferralKey = urlReferralKeys[i];
    const storedDataKey = storedDataKeys[i];

    // If any key or value doesn't match, the stored data differs from the URL referral
    if (
      urlReferralKey !== storedDataKey ||
      urlReferralParams[urlReferralKey] != storedData.sources[storedDataKey]
    ) {
      return false;
    }
  }

  return true;
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
    userType.referralSources ? Object.keys(userType.referralSources) : []
  );
  return Object.fromEntries(
    Object.entries(referralData).filter(([key]) => validReferralSources.includes(key))
  );
};

/**
 * Stores filtered referral data to session storage with a 1-hour expiry.
 *
 * Skips storage if the same data is already stored and has not expired. If the
 * stored data has expired, it is overwritten with a fresh 1-hour expiry.
 *
 *
 * @param {Object} referralData - Filtered referral params to store
 * @param {boolean} clearOnExpiry - Indicates if automatic clearing should happen after expiry
 */
export const storeReferralDataToSession = (referralData, clearOnExpiry) => {
  const storedData = getStoredReferralDataFromSession();

  // Don't store the referral ID if it has already been stored and hasn't expired
  if (!isReferralDataStored(storedData, referralData) || isReferralDataExpired(storedData)) {
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser && window?.sessionStorage) {
      // Convert referral ID values to strings before storing, this is because
      // parse() parses the ID value into a number
      const sources = Object.fromEntries(
        Object.entries(referralData).map(([k, v]) => [k, typeof v === 'number' ? v.toString() : v])
      );

      const data = {
        sources,
        expiresAt: new Date(Date.now() + HOUR_IN_MS),
      };

      const replacer = function(k, v) {
        if (this[k] instanceof Date) {
          return { date: v, _serializedType: 'SerializableDate' };
        }
        return sdkTypes.replacer(k, v);
      };

      const storableData = JSON.stringify(data, replacer);
      window.sessionStorage.setItem(REFERRAL_ID_SESSION_STORAGE_KEY, storableData);
      if (clearOnExpiry) {
        window.setTimeout(() => clearReferralDataIfExpired(), HOUR_IN_MS);
      }
    }
  }
};

/**
 * Retrieves and deserializes referral data from session storage.
 *
 * @returns {Object} Stored referral data or empty object if session storage is unavailable or no data is stored
 */
export const getStoredReferralDataFromSession = () => {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && window?.sessionStorage) {
    const retrievedReferralData = window.sessionStorage.getItem(REFERRAL_ID_SESSION_STORAGE_KEY);

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
 * Removes referral data from session storage
 */
export const clearStoredReferralDataInSession = () => {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser && window?.sessionStorage) {
    window.sessionStorage.removeItem(REFERRAL_ID_SESSION_STORAGE_KEY);
  }
};

/**
 * Returns the subset of stored referral data that is valid for the given user type. Returns an empty object if there is no stored data, the data
 * has expired, or none of the stored keys match the user type's referral sources.
 *
 * @param {Object} userTypeConfig - Config object for the selected user type
 * @param {Object} userTypeConfig.referralSources - Map of valid referral sources for this type
 * @returns {Object} Referral key/value pairs to store in the user's private data
 */
export const pickReferralData = userTypeConfig => {
  const referralData = getStoredReferralDataFromSession();

  // Keys configured as valid referral sources for this user type
  const validReferralSources = userTypeConfig?.referralSources;

  if (!validReferralSources || !referralData?.sources || isReferralDataExpired(referralData))
    return {};

  // Only return entries whose keys are present in the user type's referral source config,
  // removing any unrecognised keys from referralSources
  const entries = Object.entries(referralData.sources).filter(
    ([key]) => key in validReferralSources
  );
  return Object.fromEntries(entries);
};

/**
 * Clears referral data from session storage if it has expired.
 *
 * Called on every page load (src/index.js) to ensure stale referral data does
 * not persist across hard refreshes or cross-domain navigation within the same tab.
 */
export const clearReferralDataIfExpired = () => {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && window.sessionStorage) {
    const referralData = getStoredReferralDataFromSession();

    // Referral data has expired, clear it from session storage
    if (referralData != null && isReferralDataExpired(referralData)) {
      clearStoredReferralDataInSession();
    }
  }
};
