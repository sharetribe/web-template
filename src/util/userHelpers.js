import { EXTENDED_DATA_SCHEMA_TYPES } from './types';
import { getFieldValue } from './fieldHelpers';

/**
 * Get the namespaced attribute key based on the specified extended data scope and attribute key
 * @param {*} scope extended data scope
 * @param {*} key attribute key in extended data
 * @returns a string containing the namespace prefix and the attribute name
 */
const getNamespacedKey = (scope, key) => {
  const namespacePrefix = scope === 'public' ? `pub_` : scope === 'protected' ? 'prot_' : `priv_`;

  return `${namespacePrefix}${key}`;
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
 * @param {Object} userFieldConfigs an extended data configurtions for user fields.
 * @returns Array of picked extended data fields from submitted data.
 */
export const pickUserFieldsData = (data, targetScope, targetUserType, userFieldConfigs) => {
  return userFieldConfigs.reduce((fields, field) => {
    const { key, userTypeConfig, scope = 'public', schemaType } = field || {};
    const namespacedKey = getNamespacedKey(scope, key);

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
 * @param {Object} userFieldConfigs an extended data configurtions for user fields.
 * @returns Array of picked extended data fields
 */
export const initialValuesForUserFields = (data, targetScope, targetUserType, userFieldConfigs) => {
  return userFieldConfigs.reduce((fields, field) => {
    const { key, userTypeConfig, scope = 'public', schemaType } = field || {};
    const namespacedKey = getNamespacedKey(scope, key);

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
 * @param {*} userType User type to restrict fields to (optional)
 * @returns an array of props for CustomExtendedDataField: key, name, fieldConfig, defaultRequiredMessage
 */

export const getPropsForCustomUserFieldInputs = (userFieldsConfig, intl, userType = null) => {
  return userFieldsConfig.reduce((pickedFields, fieldConfig) => {
    const { key, userTypeConfig, schemaType, scope } = fieldConfig || {};
    const namespacedKey = getNamespacedKey(scope, key);

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isTargetUserType =
      !userTypeConfig?.limitToUserTypeIds || userTypeConfig?.userTypeIds?.includes(userType);
    const isProviderScope = ['public', 'private', 'protected'].includes(scope);

    return isKnownSchemaType && isTargetUserType && isProviderScope
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
  }, []);
};
