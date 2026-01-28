/**
 * Common JavaScript utilities
 *
 * This module provides general-purpose utility functions that can replace lodash functions
 * or provide commonly needed JavaScript operations.
 */

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
