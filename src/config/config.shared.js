/**
 * Shared helpers for config handlers (normalize / validate / structured issues).
 * Domain-specific validators can move here from configHelpers.js as handlers land.
 */

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
