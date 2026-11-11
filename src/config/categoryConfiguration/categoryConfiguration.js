///////////////////////////////////////////////////////////////////////////
// Category configuration handler: hosted categories + built-in defaults //
///////////////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

const MAX_CATEGORY_DEPTH = 3;
// Letters, numbers, dashes, underscores — no spaces (hosted categories asset).
const CATEGORY_ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

/**
 * Whether a category id matches the hosted categories asset pattern.
 * @param {*} id
 * @returns {boolean}
 */
export const isValidCategoryId = id => typeof id === 'string' && CATEGORY_ID_PATTERN.test(id);

/**
 * Whether a category name is a non-empty string (required on hosted categories).
 * @param {*} name
 * @returns {boolean}
 */
export const isValidCategoryName = name => typeof name === 'string' && name.trim().length >= 1;

/**
 * Walk the category tree depth-first; `iterator(depth, childResults)` aggregates.
 * @param {Object} category
 * @param {Function} iterator
 * @param {number} [depth]
 * @returns {*}
 */
const depthFirstSearch = (category, iterator, depth = 0) => {
  const { subcategories = [] } = category;
  return iterator(depth, subcategories.map(cat => depthFirstSearch(cat, iterator, depth + 1)));
};

/** Pick maximum depth from subcategory results, or the current depth. */
const getMaxDepth = (depth, subcategories) =>
  subcategories.length ? Math.max(...subcategories) : depth;

const createArray = length => [...Array(length)].fill(null).map((_, i) => i + 1);

/**
 * Sanitize one level of subcategory nodes (name, id, nested subcategories only).
 * @param {Array} subcategories
 * @returns {Array}
 */
const sanitizeSubcategories = subcategories => {
  if (!subcategories || !Array.isArray(subcategories)) {
    return [];
  }
  return subcategories.map(({ name, id, subcategories: nested }) => ({
    name,
    id,
    subcategories: sanitizeSubcategories(nested),
  }));
};

/**
 * Sanitize a category tree array to the known shape.
 * @param {Array} categories
 * @returns {Array}
 */
export const sanitizeCategoryTree = categories => {
  if (!Array.isArray(categories)) {
    return [];
  }
  return categories.map(({ name, id, subcategories }) => ({
    name,
    id,
    subcategories: sanitizeSubcategories(subcategories),
  }));
};

/**
 * Build category specs used by search filters and listing fields.
 * Listing categories use public data keys categoryLevel1..3 (up to three levels);
 * those keys are indexed for search. Do not change the `categoryLevel` prefix.
 *
 * @param {Array} categories category tree
 * @returns {{ key: string, scope: string, categoryLevelKeys: Array<string>, categories: Array }}
 */
export const getBuiltInCategorySpecs = (categories = []) => {
  // Keep categoryLevel1..3 — those public data keys are on the search index.
  const key = 'categoryLevel';
  const maxDepth = depthFirstSearch({ subcategories: categories }, getMaxDepth);
  const categoryLevelKeys = createArray(maxDepth).map(i => `${key}${i}`);

  return { key, scope: 'public', categoryLevelKeys, categories };
};

/**
 * Shape the hosted categories asset only (not built-in defaults).
 * Expects `{ categories: [...] }`; returns {} if the slice is missing/invalid.
 *
 * @param {Object} hostedSlices values keyed by categoryConfigurationConfig.assetKeys (`categories`)
 * @returns {Object} partial hosted input for validate
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.categories;
  if (!isPlainObject(hostedSlice) || !Array.isArray(hostedSlice.categories)) {
    return {};
  }
  return { categories: hostedSlice.categories };
};

/**
 * Keep nodes with non-empty name, valid id, and unique id among siblings;
 * drop others (and their subtrees), recording warns. Same id under different
 * parents is allowed.
 * @param {Array} categories
 * @param {Array} issues
 * @returns {Array}
 */
const filterValidCategoryNodes = (categories, issues) => {
  if (!Array.isArray(categories)) {
    return [];
  }
  const seenIds = new Set();
  return categories.reduce((kept, category) => {
    if (!isValidCategoryName(category.name)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'CATEGORY_MISSING_OR_EMPTY_NAME',
          message: `A category is missing a name (id: "${category.id}"). This category and its subcategories were dropped.`,
        })
      );
      return kept;
    }
    if (!isValidCategoryId(category.id)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'CATEGORY_INVALID_ID',
          message: `Category id "${category.id}" is invalid. Use only letters, numbers, dashes, or underscores. This category and its subcategories were dropped.`,
        })
      );
      return kept;
    }
    if (seenIds.has(category.id)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'CATEGORY_DUPLICATE_SIBLING_ID',
          message: `Category id "${category.id}" is used more than once at the same level. This category and its subcategories were dropped.`,
        })
      );
      return kept;
    }
    seenIds.add(category.id);
    return [
      ...kept,
      {
        ...category,
        subcategories: filterValidCategoryNodes(category.subcategories, issues),
      },
    ];
  }, []);
};

/**
 * Validate the normalized hosted categories slice only — does not read or check built-ins.
 * Sanitizes the tree to known fields; drops nodes with missing/empty name, invalid id,
 * or duplicate id among siblings (warn; first occurrence kept).
 * Warns if depth exceeds categoryLevel1..3 (search index).
 * Omitted hosted categories may be filled in resolve from built-in defaults
 * (defaultCategoryConfiguration.js), if the customizer set them.
 *
 * @param {Object} normalized output of normalize
 * @returns {{ value: Object, issues: Array }} sanitized hosted slice + configIssues
 */
const validate = normalized => {
  if (!Array.isArray(normalized?.categories)) {
    return { value: {}, issues: [] };
  }

  const issues = [];
  const categories = filterValidCategoryNodes(sanitizeCategoryTree(normalized.categories), issues);
  const depth = depthFirstSearch({ subcategories: categories }, getMaxDepth);

  if (depth > MAX_CATEGORY_DEPTH) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'CATEGORY_TREE_TOO_DEEP',
        message: `The category tree is ${depth} levels deep, but search only supports ${MAX_CATEGORY_DEPTH} levels. Deeper categories will not filter correctly.`,
      })
    );
  }

  return { value: { categories }, issues };
};

/**
 * Build final `config.categoryConfiguration`: prefer validated hosted categories;
 * fill from built-ins when hosted categories were omitted. Always derives key, scope,
 * and categoryLevelKeys from the resulting tree.
 *
 * @param {Object} validated sanitized hosted slice from validate (`value`)
 * @param {Object} defaults full defaultConfigs (uses `defaults.categoryConfiguration`)
 * @returns {Object} app-config categoryConfiguration object
 */
const resolve = (validated, defaults) => {
  const categories = Array.isArray(validated?.categories)
    ? validated.categories
    : defaults?.categoryConfiguration?.categories || [];
  return getBuiltInCategorySpecs(categories);
};

/**
 * Config handler for the `categoryConfiguration` app-config key.
 *
 * - id: `categoryConfiguration` (final app config key)
 * - assetKeys: `categories` (hosted listing-categories.json)
 */
export const categoryConfigurationConfig = {
  id: 'categoryConfiguration',
  assetKeys: ['categories'],
  normalize,
  validate,
  resolve,
};
