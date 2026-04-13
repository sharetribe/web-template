import { isEmpty } from '../util/common';
import { types as sdkTypes } from '../util/sdkLoader';
import { isAfterDate } from '../util/dates';

export const REFERRAL_ID_SESSION_STORAGE_KEY = 'referralSource';
const HOUR_IN_MS = 60 * 60 * 1000;

const isReferralDataExpired = referralData => {
  return isAfterDate(new Date(), referralData.expiresAt);
};

const isReferralDataStored = (storedData, urlReferralParams) => {
  if (storedData == null || storedData?.sources == null) {
    return false;
  }

  // Sort entries before comparing so that insertion order doesn't affect the result.
  const sortedURLReferralParams = Object.fromEntries(Object.entries(urlReferralParams).sort());
  const sortedStoredDataParams = Object.fromEntries(Object.entries(storedData?.sources).sort());
  return JSON.stringify(sortedURLReferralParams) === JSON.stringify(sortedStoredDataParams);
};

export const filterValidReferralData = (referralData, userTypes) => {
  const validReferralSources = userTypes.flatMap(userType =>
    userType.referralSources
      ? userType.referralSources.map(referralSource => referralSource.label)
      : []
  );
  return Object.fromEntries(
    Object.entries(referralData).filter(([key]) => validReferralSources.includes(key))
  );
};

export const storeReferralDataToSession = (referralData, clearOnExpiry) => {
  const storedData = getStoredReferralDataFromSession();

  // Don't store the referral ID if it has already been stored and hasn't expired
  if (!isReferralDataStored(storedData, referralData) || isReferralDataExpired(storedData)) {
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser && window?.sessionStorage) {
      const data = {
        sources: referralData,
        expiresAt: new Date(Date.now() + HOUR_IN_MS),
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
      window.sessionStorage.setItem(REFERRAL_ID_SESSION_STORAGE_KEY, storableData);
      if (clearOnExpiry) {
        window.setTimeout(() => clearReferralDataIfExpired(), HOUR_IN_MS);
      }
    }
  }
};

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

export const clearStoredReferralDataInSession = () => {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser && window?.sessionStorage) {
    window.sessionStorage.removeItem(REFERRAL_ID_SESSION_STORAGE_KEY);
  }
};

export const pickReferralData = userTypeConfig => {
  const referralData = getStoredReferralDataFromSession();

  // Keys configured as valid referral sources for this user type
  const validReferralSources = userTypeConfig?.referralSources;

  if (!validReferralSources || !referralData?.sources || isReferralDataExpired(referralData))
    return {};

  // Only return entries whose keys are present in the user type's referral source config,
  // removing any unrecognised keys from referralSources
  const entries = Object.entries(referralData.sources).filter(([key]) =>
    validReferralSources.some(validReferralSource => validReferralSource.label === key)
  );
  return Object.fromEntries(entries);
};

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
