/**
 * Common JavaScript utilities
 *
 * This module provides general-purpose utility functions that can replace lodash functions
 * or provide commonly needed JavaScript operations.
 */

/**
 * Checks if a value is an empty object or array.
 * Returns true if the value is an object or array with no enumerable properties.
 *
 * @param {*} obj - The value to check
 * @returns {boolean} Returns true if the value is an empty object or array, false otherwise
 *
 * @example
 * isEmpty({}) // true
 * isEmpty([]) // true
 * isEmpty({ a: 1 }) // false
 * isEmpty([1, 2]) // false
 * isEmpty(null) // true
 * isEmpty(undefined) // true
 */
export const isEmpty = obj =>
  [Object, Array].includes((obj || {}).constructor) && !Object.entries(obj || {}).length;

/**
 * Creates an object composed of the own enumerable property paths of object that are not omitted.
 * This is a modern JavaScript replacement for lodash's omit function.
 *
 * @param {Object} obj - The source object
 * @param {string|string[]} keys - The property paths to omit (can be a single key or an array of keys)
 * @returns {Object} Returns the new object
 *
 * @example
 * omit({ a: 1, b: 2, c: 3 }, 'a') // { b: 2, c: 3 }
 * omit({ a: 1, b: 2, c: 3 }, ['a', 'c']) // { b: 2 }
 */
export const omit = (obj, keys) => {
  const keysToRemove = Array.isArray(keys) ? keys : [keys];
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keysToRemove.includes(key)));
};

/**
 * Creates an object composed of the picked object properties.
 * This is a modern JavaScript replacement for lodash's pick function.
 *
 * @param {Object} obj - The source object
 * @param {string|string[]} keys - The property paths to pick (can be a single key or an array of keys)
 * @returns {Object} Returns the new object with only the picked properties
 *
 * @example
 * pick({ a: 1, b: 2, c: 3 }, 'a') // { a: 1 }
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // { a: 1, c: 3 }
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'd']) // { a: 1 }
 */
export const pick = (obj, keys) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  const keysToPick = Array.isArray(keys) ? keys : [keys];
  return Object.fromEntries(Object.entries(obj).filter(([key]) => keysToPick.includes(key)));
};

/**
 * Creates an object composed of the object properties predicate returns truthy for.
 * This is a modern JavaScript replacement for lodash's pickBy function.
 *
 * @param {Object} obj - The source object
 * @param {Function} predicate - The function invoked per property. Receives (value, key) arguments.
 * @returns {Object} Returns the new object with only the properties that pass the predicate
 *
 * @example
 * pickBy({ a: 1, b: 2, c: 0 }, value => value > 0) // { a: 1, b: 2 }
 * pickBy({ a: 1, b: 'hello', c: null }, (value, key) => key !== 'c') // { a: 1, b: 'hello' }
 * pickBy({ a: 1, b: 2, c: 3 }, () => true) // { a: 1, b: 2, c: 3 }
 */
export const pickBy = (obj, predicate) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  if (typeof predicate !== 'function') {
    return {};
  }
  return Object.fromEntries(Object.entries(obj).filter(([key, value]) => predicate(value, key)));
};
