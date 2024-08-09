import { EXTENDED_DATA_SCHEMA_TYPES } from './types';
import { getFieldValue } from './fieldHelpers';

/**
 * Get the namespaced attribute key based on the specified extended data scope and attribute key
 * @param {*} scope extended data scope
 * @param {*} key attribute key in extended data
 * @returns a string containing the namespace prefix and the attribute name
 */
export const addScopePrefix = (scope, key) => {
  const scopeFnMap = {
    private: k => `priv_${k}`,
    protected: k => `prot_${k}`,
    public: k => `pub_${k}`,
    meta: k => `meta_${k}`,
  };

  const validKey = key.replace(/\s/g, '_');
  const keyScoper = scopeFnMap[scope];

  return !!keyScoper ? keyScoper(validKey) : validKey;
};

/**
 * Pick extended data fields from given form data.
 * Picking is based on extended data configuration for the user and target scope and user type.
 *
 * This expects submit data to be namespaced (e.g. 'pub_') and it returns the field without that namespace.
 * This function is used when form submit values are restructured for the actual API endpoint.
 *
 * Note: This returns null for those fields that are managed by configuration, but don't match target user type.
 *       These might exists if user swaps between user types before saving the user.
 *
 * @param {Object} data values to look through against userConfig.js and util/configHelpers.js
 * @param {String} targetScope Check that the scope of extended data the config matches
 * @param {String} targetUserType Check that the extended data is relevant for this user type.
 * @param {Object} userFieldConfigs Extended data configurations for user fields.
 * @returns Array of picked extended data fields from submitted data.
 */
export const pickUserFieldsData = (data, targetScope, targetUserType, userFieldConfigs) => {
  return userFieldConfigs.reduce((fields, field) => {
    const { key, userTypeConfig, scope = 'public', schemaType } = field || {};
    const namespacedKey = addScopePrefix(scope, key);

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isTargetScope = scope === targetScope;
    const isTargetUserType =
      !userTypeConfig.limitToUserTypeIds || userTypeConfig.userTypeIds.includes(targetUserType);

    if (isKnownSchemaType && isTargetScope && isTargetUserType) {
      const fieldValue = getFieldValue(data, namespacedKey);
      return { ...fields, [key]: fieldValue };
    } else if (isKnownSchemaType && isTargetScope && !isTargetUserType) {
      // Note: this clears extra custom fields
      // These might exists if user swaps between user types before saving the user.
      return { ...fields, [key]: null };
    }
    return fields;
  }, {});
};

/**
 * Pick extended data fields from given extended data of the user entity.
 * Picking is based on extended data configuration for the user and target scope and user type.
 *
 * This returns namespaced (e.g. 'pub_') initial values for the form.
 *
 * @param {Object} data extended data values to look through against userConfig.js and util/configHelpers.js
 * @param {String} targetScope Check that the scope of extended data the config matches
 * @param {String} targetUserType Check that the extended data is relevant for this user type.
 * @param {Object} userFieldConfigs Extended data configurations for user fields.
 * @returns Array of picked extended data fields
 */
export const initialValuesForUserFields = (data, targetScope, targetUserType, userFieldConfigs) => {
  return userFieldConfigs.reduce((fields, field) => {
    const { key, userTypeConfig, scope = 'public', schemaType } = field || {};
    const namespacedKey = addScopePrefix(scope, key);

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isTargetScope = scope === targetScope;
    const isTargetUserType =
      !userTypeConfig?.limitToUserTypeIds || userTypeConfig?.userTypeIds?.includes(targetUserType);

    if (isKnownSchemaType && isTargetScope && isTargetUserType) {
      const fieldValue = getFieldValue(data, key);
      return { ...fields, [namespacedKey]: fieldValue };
    }
    return fields;
  }, {});
};

/**
 * Returns props for custom user fields
 * @param {*} userFieldsConfig Configuration for user fields
 * @param {*} intl
 * @param {*} userType User type to restrict fields to. If none is passed,
 * only user fields applying to all user types are returned.
 * @param {*} isSignup Optional flag to determine whether the target context
 * is a signup form. Defaults to true.
 * @returns an array of props for CustomExtendedDataField: key, name,
 * fieldConfig, defaultRequiredMessage
 */
export const getPropsForCustomUserFieldInputs = (
  userFieldsConfig,
  intl,
  userType = null,
  isSignup = true
) => {
  return (
    userFieldsConfig?.reduce((pickedFields, fieldConfig) => {
      const { key, userTypeConfig, schemaType, scope, saveConfig = {} } = fieldConfig || {};
      const namespacedKey = addScopePrefix(scope, key);
      const showField = isSignup ? saveConfig.displayInSignUp : true;

      const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
      const isTargetUserType =
        !userTypeConfig?.limitToUserTypeIds || userTypeConfig?.userTypeIds?.includes(userType);
      const isUserScope = ['public', 'private', 'protected'].includes(scope);

      return isKnownSchemaType && isTargetUserType && isUserScope && showField
        ? [
            ...pickedFields,
            {
              key: namespacedKey,
              name: namespacedKey,
              fieldConfig: fieldConfig,
              defaultRequiredMessage: intl.formatMessage({
                id: 'CustomExtendedDataField.required',
              }),
            },
          ]
        : pickedFields;
    }, []) || []
  );
};

/**
 * Check if currentUser has permission to post listings.
 *
 * @param {Object} currentUser API entity
 * @returns {Boolean} true if currentUser has permission to post listings.
 */
export const hasPermissionToPostListings = currentUser => {
  if (currentUser?.id && !currentUser?.effectivePermissionSet?.id) {
    console.warn(
      '"effectivePermissionSet" relationship is not defined or included to the fetched currentUser entity.'
    );
  }
  return currentUser?.effectivePermissionSet?.attributes?.postListings === 'permission/allow';
};

/**
 * Check if currentUser has been approved to gain access.
 * I.e. they are not in 'pendig-approval' or 'banned' state.
 *
 * If the user is in 'pending-approval' state, they don't have right to post listings and initiate transactions.
 * User's in 'active' state, they might have right to post listings and initiate transactions. It can be verified by passing permissionsToCheck map.
 *
 * @param {Object} currentUser API entity. It must have effectivePermissionSet included.
 * @param {Object} [permissionsToCheck] E.g. { postListings: true }
 * @returns {Boolean} true if currentUser has been approved (state is 'active'). If the _permissionsToCheck_ map is given, those are also checked.
 */
export const isUserAuthorized = (currentUser, permissionsToCheck) => {
  const { postListings } = permissionsToCheck || {};
  const isActive = currentUser?.attributes?.state === 'active';
  return permissionsToCheck && postListings
    ? isActive && hasPermissionToPostListings(currentUser)
    : isActive;
};
