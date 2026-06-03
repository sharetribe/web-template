import { stringify } from '../../../../../util/urlHelpers';

export const LOCAL_TOPBAR_DATA_PATH = '/static/data/top-bar.json';

export const defaultTopbarCategoryDropdowns = {
  menuLinksDropdown1: [
    { categoryPath: ['accesorios'], label: 'Ver Todo' },
    { categoryPath: ['accesorios'] },
  ],
  menuLinksDropdown2: [],
};

const normalizeCategoryPath = categoryPath => {
  if (Array.isArray(categoryPath)) {
    return categoryPath.filter(Boolean);
  }

  if (typeof categoryPath === 'string') {
    return categoryPath
      .split('/')
      .map(segment => segment.trim())
      .filter(Boolean);
  }

  return [];
};

/**
 * Resolve the category node referenced by a category path.
 *
 * @param {Array} categories hosted category tree from listing-categories.json
 * @param {string[]|string} categoryPath ids from root category to target category
 * @returns {Object|null} matching category node or null
 */
export const findCategoryByPath = (categories = [], categoryPath) => {
  const path = normalizeCategoryPath(categoryPath);

  if (path.length === 0) {
    return null;
  }

  let currentCategories = categories;
  let currentCategory = null;

  for (const categoryId of path) {
    currentCategory = currentCategories.find(category => category.id === categoryId) || null;

    if (!currentCategory) {
      return null;
    }

    currentCategories = currentCategory.subcategories || [];
  }

  return currentCategory;
};

const createCategorySearchHref = (categoryConfiguration, categoryPath) => {
  const path = normalizeCategoryPath(categoryPath);
  const categoryPrefix = categoryConfiguration?.key || 'categoryLevel';
  const queryParams = path.reduce((params, categoryId, index) => {
    return {
      ...params,
      [`pub_${categoryPrefix}${index + 1}`]: categoryId,
    };
  }, {});

  return `/s?${stringify(queryParams)}`;
};

const resolveDropdownItem = (item, categoryConfiguration) => {
  if (!item) {
    return null;
  }

  if (item.href && item.text) {
    return {
      group: item.group || 'primary',
      href: item.href,
      text: item.text,
    };
  }

  const categoryPath = normalizeCategoryPath(item.categoryPath);
  const category = findCategoryByPath(categoryConfiguration?.categories, categoryPath);

  if (!category) {
    return null;
  }

  return {
    group: item.group || 'primary',
    href: createCategorySearchHref(categoryConfiguration, categoryPath),
    text: item.label || category.name,
  };
};

/**
 * Convert hosted topbar dropdown item definitions into dropdown links.
 *
 * Supported item formats:
 * - { categoryPath: ['parent', 'child'], label?: 'Text' }
 * - { categoryPath: 'parent/child', label?: 'Text' }
 * - { href: '/s?...', text: 'Text' }
 *
 * @param {Array} items configured in top-bar.json
 * @param {Object} categoryConfiguration merged category configuration
 * @param {Array} fallbackItems local fallback item definitions
 * @returns {Array} dropdown items supported by LinksMenuDropdown
 */
export const resolveDropdownMenuItems = (items = [], categoryConfiguration, fallbackItems = []) => {
  const sourceItems = Array.isArray(items) && items.length > 0 ? items : fallbackItems;

  return sourceItems.map(item => resolveDropdownItem(item, categoryConfiguration)).filter(Boolean);
};

export const getCategoryDropdownsConfig = topbarData => topbarData?.categoryDropdowns || {};

export const fetchLocalTopbarData = fetchFn => {
  if (typeof fetchFn !== 'function') {
    return Promise.resolve(null);
  }

  return fetchFn(LOCAL_TOPBAR_DATA_PATH, {
    headers: {
      Accept: 'application/json',
    },
  })
    .then(response => (response.ok ? response.json() : null))
    .catch(() => null);
};
