///////////////////////////////////////////////////////////////////////////
// User config handler: hosted userTypes + userFields                    //
///////////////////////////////////////////////////////////////////////////

import {
  configIssue,
  validBoolean,
  validEnumString,
  validHelpText,
  validLabel,
  validNumberConfig,
  validPlaceholderMessage,
  validRequiredMessage,
  validSchemaOptions,
  union,
  mergeDefaultTypesAndFieldsForDebugging,
} from '../config.shared';
import { EXTENDED_DATA_SCHEMA_TYPES } from '../../util/types';

// Letters, numbers, dashes, underscores — no spaces (hosted userTypes asset id pattern).
const USER_TYPE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

// User field keys: must start with a letter; letters, numbers, underscores only (no dashes).
// Keep in sync with the hosted user-fields.json key pattern.
const USER_FIELD_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

// Built-in / reserved keys the hosted user-fields asset forbids (and referralSource_* prefix for referral params).
const RESERVED_USER_FIELD_KEYS = ['userType', 'phoneNumber', 'terms'];

/**
 * Whether a user type id matches the hosted userTypes asset pattern.
 * @param {*} id
 * @returns {boolean}
 */
export const isValidUserTypeId = id => typeof id === 'string' && USER_TYPE_ID_PATTERN.test(id);

/**
 * Whether a user type label is a non-empty string (required on hosted user types).
 * @param {*} label
 * @returns {boolean}
 */
export const isValidUserTypeLabel = label => typeof label === 'string' && label.trim().length >= 1;

/**
 * Whether a user field key matches the hosted userFields asset pattern.
 * @param {*} key
 * @returns {boolean}
 */
export const isValidUserFieldKey = key =>
  typeof key === 'string' && USER_FIELD_KEY_PATTERN.test(key);

/**
 * Whether a user field key is reserved (exact built-in keys or `referralSource_` prefix).
 * @param {string} key
 * @returns {boolean}
 */
export const isReservedUserFieldKey = key =>
  typeof key === 'string' &&
  (RESERVED_USER_FIELD_KEYS.includes(key) || key.startsWith('referralSource_'));

////////////////////////////////
// Validate user fields config //
////////////////////////////////

const quoteIds = ids => (ids || []).map(id => `"${id}"`).join(', ');

const unknownIdsReason = (label, ids) => {
  if (!Array.isArray(ids)) {
    return `${label} must be an array`;
  }
  if (ids.length === 0) {
    return `${label} is empty`;
  }
  return `unknown ${label}: ${quoteIds(ids)}`;
};

/**
 * Validate userTypeConfig against user types currently in use.
 * When no types are passed (null/undefined), limits are cleared.
 * @param {Object} userTypeConfig
 * @param {Array|null} [userTypesInUse]
 * @returns {[boolean, Object, string|undefined]}
 */
const validUserTypesForUserConfig = (userTypeConfig, userTypesInUse = null) => {
  const { limitToUserTypeIds, userTypeIds } = userTypeConfig;

  // When no user types are in use, fields by default cannot be limited to a subset of types
  if (!userTypesInUse) {
    return [
      true,
      {
        userTypeConfig: {
          limitToUserTypeIds: false,
        },
      },
    ];
  }

  const isArray = Array.isArray(userTypeIds);
  const validatedUserTypes = isArray ? userTypeIds.filter(ut => userTypesInUse?.includes(ut)) : [];
  const unknownUserTypeIds = isArray ? userTypeIds.filter(ut => !userTypesInUse?.includes(ut)) : [];

  // If a field is limited to user type ids, it has to have at least one valid type
  const hasValidUserTypes = validatedUserTypes.length > 0;
  const isValid = hasValidUserTypes || !limitToUserTypeIds;

  const validValue = hasValidUserTypes
    ? {
        userTypeConfig: {
          limitToUserTypeIds,
          userTypeIds: validatedUserTypes,
        },
      }
    : {
        userTypeConfig: {
          limitToUserTypeIds: false,
        },
      };
  const reason = isValid
    ? undefined
    : unknownIdsReason('user type id(s)', isArray ? unknownUserTypeIds : userTypeIds);
  return [isValid, validValue, reason];
};

const validUserShowConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }

  // Validate: label, displayInProfile.
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidDisplayInProfile, displayInProfile] = validBoolean(
    'displayInProfile',
    config.displayInProfile,
    true
  );
  const [isValidUnselectedOptions, unselectedOptions] = validBoolean(
    'unselectedOptions',
    config.unselectedOptions,
    true
  );

  const isValid = isValidLabel && isValidDisplayInProfile && isValidUnselectedOptions;
  const validValue = {
    showConfig: {
      ...label,
      ...displayInProfile,
      ...unselectedOptions,
    },
  };
  return [isValid, validValue];
};

const validUserSaveConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // Validate: label, placeholderMessage, required, displayInSignUp, requiredMessage
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidPlaceholder, placeholderMessage] = validPlaceholderMessage(
    config.placeholderMessage
  );

  // At this point, all user fields are required by default, and shown in signup by default.
  const [isValidIsRequired, isRequired] = validBoolean('isRequired', config.isRequired, true);
  const [isValidDisplayInSignUp, displayInSignUp] = validBoolean(
    'displayInSignUp',
    config.displayInSignUp,
    true
  );
  const [isValidRequiredMessage, requiredMessage] = validRequiredMessage(config.requiredMessage);

  const isValid =
    isValidLabel &&
    isValidPlaceholder &&
    isValidIsRequired &&
    isValidDisplayInSignUp &&
    isValidRequiredMessage;
  const validValue = {
    saveConfig: {
      ...label,
      ...placeholderMessage,
      ...isRequired,
      ...displayInSignUp,
      ...requiredMessage,
    },
  };
  return [isValid, validValue];
};

/**
 * Validate user types: non-empty label, id pattern, unique ids (keep first).
 * @param {Array} userTypes
 * @param {Array} issues
 * @returns {Array}
 */
const validUserTypes = (userTypes, issues) => {
  const seenIds = new Set();

  return (userTypes || []).reduce((acc, config) => {
    if (!config) {
      return acc;
    }

    const { userType, label } = config;

    if (!isValidUserTypeLabel(label)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'USER_TYPE_MISSING_OR_EMPTY_LABEL',
          message: `A user type is missing a label (id: "${userType}"). This user type was dropped.`,
        })
      );
      return acc;
    }

    if (!isValidUserTypeId(userType)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'USER_TYPE_INVALID_ID',
          message: `User type id "${userType}" is invalid. Use only letters, numbers, dashes, or underscores. This user type was dropped.`,
        })
      );
      return acc;
    }

    if (seenIds.has(userType)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'USER_TYPE_DUPLICATE_ID',
          message: `User type id "${userType}" is used more than once. This duplicate user type was dropped.`,
        })
      );
      return acc;
    }

    seenIds.add(userType);
    return [...acc, config];
  }, []);
};

/**
 * Validate user field configs; drop invalid entries and push warn issues.
 * @param {Array} userFields
 * @param {Array} userTypesInUse
 * @param {Array} issues
 * @returns {Array}
 */
const validUserFields = (userFields, userTypesInUse, issues) => {
  const fields = (userFields || []).filter(Boolean);
  const seenKeys = new Set();
  const scopeOptions = ['public', 'private', 'protected', 'metadata'];

  return fields.reduce((acc, data) => {
    const { key, schemaType } = data;

    if (!isValidUserFieldKey(key)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'USER_FIELD_INVALID_KEY',
          message: `User field key "${key}" is invalid. Keys must start with a letter and use only letters, numbers, or underscores. This field was dropped.`,
        })
      );
      return acc;
    }

    if (isReservedUserFieldKey(key)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'USER_FIELD_RESERVED_KEY',
          message: `User field key "${key}" conflicts with a built-in or reserved key (userType, phoneNumber, terms, or referralSource_*). This field was dropped.`,
        })
      );
      return acc;
    }

    if (seenKeys.has(key)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'USER_FIELD_DUPLICATE_KEY',
          message: `User field key "${key}" is used more than once. This duplicate field was dropped.`,
        })
      );
      return acc;
    }

    const validationData = Object.entries(data).reduce(
      (innerAcc, entry) => {
        const [name, value] = entry;

        const [isValid, prop, reason] =
          name === 'key'
            ? [true, { key }]
            : name === 'label'
            ? validLabel(value)
            : name === 'scope'
            ? validEnumString('scope', value, scopeOptions, 'public')
            : name === 'schemaType'
            ? validEnumString('schemaType', value, EXTENDED_DATA_SCHEMA_TYPES)
            : name === 'enumOptions'
            ? validSchemaOptions(value, schemaType)
            : name === 'numberConfig'
            ? validNumberConfig(value, schemaType)
            : name === 'showConfig'
            ? validUserShowConfig(value)
            : name === 'userTypeConfig'
            ? validUserTypesForUserConfig(value, userTypesInUse)
            : name === 'saveConfig'
            ? validUserSaveConfig(value)
            : name === 'helpText'
            ? validHelpText(value)
            : [true, { [name]: value }];

        const hasFoundValid = !(innerAcc.isValid === false || isValid === false);
        if (isValid === false) {
          const reasonMaybe = reason ? `: ${reason}` : '';
          issues.push(
            configIssue({
              level: 'warn',
              code: 'USER_FIELD_UNSUPPORTED',
              message: `User field "${key}" has an unsupported configuration (${name})${reasonMaybe}. This field was dropped.`,
            })
          );
        }

        return { config: { ...innerAcc.config, ...prop }, isValid: hasFoundValid };
      },
      { config: {}, isValid: true }
    );

    if (validationData.isValid) {
      seenKeys.add(key);
      return [...acc, validationData.config];
    }
    return acc;
  }, []);
};

///////////////////////////////////////
// Restructure hosted user config //
///////////////////////////////////////

const restructureUserTypes = (hostedUserTypes = []) => {
  return hostedUserTypes.map(userType => {
    const { id, ...rest } = userType;
    return { userType: id, ...rest };
  });
};

const restructureUserFields = hostedUserFields => {
  return (
    hostedUserFields?.map(userField => {
      const {
        key,
        scope,
        schemaType,
        enumOptions,
        label,
        showConfig = {},
        saveConfig = {},
        userTypeConfig = {},
        ...rest
      } = userField;
      const defaultLabel = label || key;
      const enumOptionsMaybe = ['enum', 'multi-enum'].includes(schemaType) ? { enumOptions } : {};
      const { required: isRequired, ...restSaveConfig } = saveConfig;

      return key
        ? {
            key,
            scope,
            schemaType,
            ...enumOptionsMaybe,
            showConfig: {
              ...showConfig,
              label: showConfig.label || defaultLabel,
            },
            saveConfig: {
              ...restSaveConfig,
              isRequired,
              label: saveConfig.label || defaultLabel,
            },
            userTypeConfig,
            ...rest,
          }
        : null;
    }) || []
  );
};

/**
 * Shape hosted userTypes + userFields assets (not built-in defaults).
 * @param {Object} hostedSlices values keyed by userConfig.assetKeys
 * @returns {Object}
 */
const normalize = hostedSlices => {
  const userTypesRaw = hostedSlices?.userTypes?.userTypes;
  const userFieldsRaw = hostedSlices?.userFields?.userFields;

  return {
    userTypes: Array.isArray(userTypesRaw) ? restructureUserTypes(userTypesRaw) : [],
    userFields: Array.isArray(userFieldsRaw) ? restructureUserFields(userFieldsRaw) : [],
  };
};

/**
 * Validate normalized hosted user types/fields.
 * @param {Object} normalized output of normalize
 * @returns {{ value: Object, issues: Array }}
 */
const validate = normalized => {
  const issues = [];
  const rawTypes = Array.isArray(normalized?.userTypes) ? normalized.userTypes : [];
  const rawFields = Array.isArray(normalized?.userFields)
    ? normalized.userFields.filter(Boolean)
    : [];

  const userTypes = validUserTypes(rawTypes, issues);
  const userTypesInUse = userTypes.map(ut => `${ut.userType}`);
  const userFields = validUserFields(rawFields, userTypesInUse, issues);

  return {
    value: { userTypes, userFields },
    issues,
  };
};

/**
 * Build final `config.user`: prefer validated hosted types/fields; optionally union
 * with built-ins when debugging merge is enabled.
 *
 * @param {Object} validated sanitized hosted slice from validate (`value`)
 * @param {Object} defaults full defaultConfigs (uses `defaults.user`)
 * @returns {Object} app-config user object
 */
const resolve = (validated, defaults) => {
  const { userTypes: defaultUserTypes = [], userFields: defaultUserFields = [] } =
    defaults?.user || {};

  const hostedUserTypes = Array.isArray(validated?.userTypes) ? validated.userTypes : [];
  const hostedUserFields = Array.isArray(validated?.userFields) ? validated.userFields : [];

  // When debugging, include default configs by passing 'true' here.
  // Otherwise, use user types/fields from hosted assets only (no built-in fallback).
  const shouldMerge = mergeDefaultTypesAndFieldsForDebugging(false);
  const userTypes = shouldMerge
    ? union(hostedUserTypes, defaultUserTypes, 'userType')
    : hostedUserTypes;
  const userFields = shouldMerge
    ? union(hostedUserFields, defaultUserFields, 'key')
    : hostedUserFields;

  return { userTypes, userFields };
};

/**
 * Config handler for the `user` app-config key.
 *
 * - id: `user`
 * - assetKeys: `userTypes`, `userFields`
 */
export const userConfig = {
  id: 'user',
  assetKeys: ['userTypes', 'userFields'],
  normalize,
  validate,
  resolve,
};
