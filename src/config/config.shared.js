/**
 * Shared helpers for config handlers (normalize / validate / structured issues).
 * Domain-specific validators can move here from configHelpers.js as handlers land.
 */

import { sanitizeText } from '../util/sanitize';

/**
 * True for non-null plain objects (not arrays).
 * @param {*} value
 * @returns {boolean}
 */
export const isPlainObject = value =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

/**
 * True when value is a string with at least one character.
 * @param {*} value
 * @returns {boolean}
 */
export const isNonEmptyString = value => typeof value === 'string' && value.length > 0;

/**
 * Structured config issue for buildAppConfig / handler validate().
 * @param {Object} params
 * @param {'error' | 'warn'} params.level
 * @param {string} params.code
 * @param {string} params.message
 * @returns {{ level: string, code: string, message: string }}
 */
export const configIssue = ({ level, code, message }) => ({
  level,
  code,
  message,
});

/**
 * Validate enum type strings (if default value is given, value is considered optional).
 * @returns {[boolean, Object]}
 */
export const validEnumString = (key, value, options, defaultOption) => {
  const isUndefined = typeof value === 'undefined';
  const isValidValue = options.includes(value);
  const isValid = (typeof defaultOption !== 'undefined' && isUndefined) || isValidValue;
  const valueMaybe = isValid ? { [key]: value || defaultOption } : {};
  return [isValid, valueMaybe];
};

/**
 * Validate boolean values (if default value is given, value is considered optional).
 * @returns {[boolean, Object]}
 */
export const validBoolean = (key, value, defaultValue) => {
  const isUndefined = typeof value === 'undefined';
  const isBoolean = typeof value == 'boolean';
  const isValid = (typeof defaultValue !== 'undefined' && isUndefined) || isBoolean;

  const validValue = isBoolean ? { [key]: value } : isValid ? { [key]: defaultValue } : {};
  return [isValid, validValue];
};

/**
 * @returns {[boolean, Object]}
 */
export const validLabel = label => {
  const isValid = typeof label === 'string';
  const labelMaybe = isValid ? { label } : {};
  return [isValid, labelMaybe];
};

/**
 * @returns {[boolean, Object]}
 */
export const validHelpText = helpText => {
  const isValid = typeof helpText === 'string';
  const helpTextMaybe = isValid ? { helpText: sanitizeText(helpText) } : {};
  return [isValid, helpTextMaybe];
};

/**
 * @returns {[boolean, Object]}
 */
export const validKey = (key, allKeys) => {
  const isUniqueKey = allKeys.indexOf(key) === allKeys.lastIndexOf(key);
  return [isUniqueKey, { key }];
};

const isStringType = str => typeof str === 'string';
const pickOptionShapes = o => isStringType(o.option) && isStringType(o.label);

/**
 * Validate enumOptions for enum / multi-enum schema types.
 * @returns {[boolean, Object]}
 */
export const validSchemaOptions = (enumOptions, schemaType) => {
  const isUndefined = typeof enumOptions === 'undefined';
  const isArray = Array.isArray(enumOptions);
  const arrayContainsOptionShapes = isArray
    ? enumOptions.filter(pickOptionShapes).length === enumOptions.length
    : false;
  const isEnumSchemaType = ['enum', 'multi-enum'].includes(schemaType);
  const shouldHaveSchemaOptions = isEnumSchemaType && !isUndefined && enumOptions.length > 0;

  const isValid = !isEnumSchemaType || (shouldHaveSchemaOptions && arrayContainsOptionShapes);

  const schemaOptionsMaybe =
    isEnumSchemaType && isArray ? { enumOptions } : isEnumSchemaType ? { enumOptions: [] } : {};

  return [isValid, schemaOptionsMaybe];
};

/**
 * numberConfig for schema type `long`.
 * @returns {[boolean, Object]}
 */
export const validNumberConfig = (config, schemaType) => {
  const shouldHaveNumberConfig = schemaType === 'long';

  if (!shouldHaveNumberConfig) {
    // A field might have an obsolete numberConfig that no longer
    // matches the field's schema type. If that is the case, return
    // a valid result and remove the obsolete number config
    return [true, {}];
  }

  const { minimum, maximum } = config;
  const integerConfig = { minimum, maximum, step: 1 };

  // Check if both minimum and maximum are integers
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum)) {
    return [false, integerConfig];
  }

  // Ensure both values are within the safe integer range
  if (
    minimum < Number.MIN_SAFE_INTEGER ||
    minimum > Number.MAX_SAFE_INTEGER ||
    maximum < Number.MIN_SAFE_INTEGER ||
    maximum > Number.MAX_SAFE_INTEGER
  ) {
    return [false, integerConfig];
  }

  // Check that the maximum is greater than the minimum
  if (maximum <= minimum) {
    return [false, integerConfig];
  }
  return [true, integerConfig];
};

/**
 * @returns {[boolean, Object]}
 */
export const validPlaceholderMessage = placeholderMessage => {
  const isUndefined = typeof placeholderMessage === 'undefined';
  const isString = typeof placeholderMessage === 'string';
  const isValid = isUndefined || isString;
  const validValue = isValid ? { placeholderMessage } : {};
  return [isValid, validValue];
};

/**
 * @returns {[boolean, Object]}
 */
export const validRequiredMessage = requiredMessage => {
  const isUndefined = typeof requiredMessage === 'undefined';
  const isString = typeof requiredMessage === 'string';
  const isValid = isUndefined || isString;
  const validValue = isValid ? { requiredMessage } : {};
  return [isValid, validValue];
};

/**
 * Merge 2 arrays and pick only unique objects according to "key" property.
 * Prefers objects from the second array when keys clash.
 * @param {Array} arr1
 * @param {Array} arr2
 * @param {string} key
 * @returns {Array}
 */
export const union = (arr1, arr2, key) => {
  const all = [...arr1, ...arr2];
  const map = new Map(all.map(obj => [obj[key], obj]));
  return [...map.values()];
};

/**
 * For debugging, merge and overwrite with local default types/fields.
 * Off in production by default.
 * @param {boolean} isDebugging
 * @returns {boolean}
 */
export const mergeDefaultTypesAndFieldsForDebugging = isDebugging => {
  const isDev = process.env.NODE_ENV === 'development';
  return isDebugging && isDev;
};
