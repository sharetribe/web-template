import Cookies from 'js-cookie';

import { isEmpty } from '../../util/common';
import { pickUserFieldsData, addScopePrefix } from '../../util/userHelpers';

/**
 * Filters out configured user-field entries, returning only the remaining key/value pairs.
 *
 * The signup and IdP confirm flows destructure a set of known identity fields from the form submit
 * values and handles the remaining fields as `protectedData`.
 * This helper picks those key/value pairs that are not configured as user fields.
 *
 * @param {Object} values - submit values from the form
 * @param {Array<{ scope: string, key: string }>} userFieldConfigs - Configured user field definitions.
 * @returns {Object} Remaining key/value pairs (non-user-field entries).
 */
export const getNonUserFieldParams = (values, userFieldConfigs) => {
  const userFieldKeys = userFieldConfigs.map(({ scope, key }) => addScopePrefix(scope, key));

  return Object.entries(values).reduce((picked, [key, value]) => {
    const isUserFieldKey = userFieldKeys.includes(key);

    return isUserFieldKey
      ? picked
      : {
          ...picked,
          [key]: value,
        };
  }, {});
};

/**
 * Builds extended data (public/private/protected) for the created currentUser entity.
 *
 * Returns an empty object when no extended data is provided.
 *
 * @param {Object} submitValues - Unhandled form submit values
 * @param {string} userType - The user type
 * @param {Array} userFields - User field configurations
 * @returns {{ publicData: Object, privateData: Object, protectedData: Object } | {}}
 */
export const getExtendedDataMaybe = (submitValues, userType, userFields) => {
  return !isEmpty(submitValues)
    ? {
        publicData: {
          userType,
          ...pickUserFieldsData(submitValues, 'public', userType, userFields),
        },
        privateData: {
          ...pickUserFieldsData(submitValues, 'private', userType, userFields),
        },
        protectedData: {
          ...pickUserFieldsData(submitValues, 'protected', userType, userFields),
          // If the form has any additional values, pass them forward as user's protected data
          ...getNonUserFieldParams(submitValues, userFields),
        },
      }
    : {};
};

/**
 * Creates a submit handler for the signup form.
 * I.e. the handler dispatches the signup thunk action.
 *
 * @param {Object} params
 * @param {Function} params.submitSignup
 * @param {Array} params.userFields
 * @returns {(values: Object) => void}
 */
export const getHandleSubmitSignup = ({ submitSignup, userFields }) => values => {
  const { userType, email, password, fname, lname, displayName, ...rest } = values;
  const displayNameMaybe = displayName ? { displayName: displayName.trim() } : {};

  const submitParams = {
    email,
    password,
    firstName: fname.trim(),
    lastName: lname.trim(),
    ...displayNameMaybe,
    ...getExtendedDataMaybe(rest, userType, userFields),
  };

  submitSignup(submitParams);
};

/**
 * Creates a submit handler for confirming signup data after SSO.
 * I.e. the handler dispatches the signupWithIdp thunk action.
 *
 * @param {Object} params
 * @param {Object} params.authInfo
 * @param {Function} params.submitSingupWithIdp
 * @param {Array} params.userFields
 * @returns {(values: Object) => void}
 */
export const getHandleSubmitConfirm = ({ authInfo, submitSingupWithIdp, userFields }) => values => {
  const { idpToken, email, firstName, lastName, idpId } = authInfo;

  const {
    userType,
    email: newEmail,
    firstName: newFirstName,
    lastName: newLastName,
    displayName,
    ...rest
  } = values;

  const displayNameMaybe = displayName ? { displayName: displayName.trim() } : {};

  // Pass email, fistName or lastName to Marketplace API only if user has edited them
  // and they can't be fetched directly from idp provider (e.g. Facebook)
  const authParams = {
    ...(newEmail !== email && { email: newEmail }),
    ...(newFirstName !== firstName && { firstName: newFirstName }),
    ...(newLastName !== lastName && { lastName: newLastName }),
  };

  // Pass other values as extended data according to user field configuration
  const extendedDataMaybe = getExtendedDataMaybe(rest, userType, userFields, true);

  submitSingupWithIdp({
    idpToken,
    idpId,
    ...authParams,
    ...displayNameMaybe,
    ...extendedDataMaybe,
  });
};

/**
 * Reads authentication info persisted in `st-authinfo` cookie.
 *
 * @returns {Object | null}
 */
export const getAuthInfoFromCookies = () => {
  return Cookies.get('st-authinfo')
    ? JSON.parse(Cookies.get('st-authinfo').replace('j:', ''))
    : null;
};

/**
 * Reads authentication error persisted in `st-autherror` cookie.
 *
 * @returns {Object | null}
 */
export const getAuthErrorFromCookies = () => {
  return Cookies.get('st-autherror')
    ? JSON.parse(Cookies.get('st-autherror').replace('j:', ''))
    : null;
};
