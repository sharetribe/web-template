/**
 * Check if the object's type is relevant.
 * @param {Object} obj - The object to check
 * @param {Array<string>} types - The types to check against
 * @returns {boolean} - True if the object's type is relevant, false otherwise
 */
const isObjectOfTypes = (obj, types) => {
  // Check if the object's type is relevant.
  // https://ultimatecourses.com/blog/understanding-javascript-types-and-reliable-type-checking
  const objectType = Object.prototype.toString.call(obj);
  return types.includes(objectType);
};

/**
 * Check if the object is a plain object (not a function, array, date, etc.).
 * @param {Object} obj - The object to check
 * @returns {boolean} - True if the object is a plain object, false otherwise
 */
exports.isPlainObject = obj => isObjectOfTypes(obj, ['[object Object]']);

/**
 * Check if the object is a function.
 * @param {Object} obj - The object to check
 * @returns {boolean} - True if the object is a function, false otherwise
 */
exports.isFunction = obj => isObjectOfTypes(obj, ['[object Function]']);
