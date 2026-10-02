import { constructQueryParamName } from '../../../util/search';
import { SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM } from '../../../util/types';

// Listing fields that are searchable through the search bar but not shown as filters
export const HIDDEN_FILTER_KEYS = ['material'];

// Categories (any level) that are not offered in the filters yet
export const HIDDEN_CATEGORY_IDS = ['accessories'];

// Size fields, shown together as button grids. `collapsed` is how many options are shown
// before "More sizes" is clicked; 0 means the whole group is behind "More sizes".
// `chipMessageId` formats the chip text, e.g. "Size M"; without it the option label is used.
export const SIZE_GROUPS = [
  { key: 'size', collapsed: 5, chipMessageId: 'FilterDrawer.chip.size' },
  { key: 'shoeSize', collapsed: 8, chipMessageId: 'FilterDrawer.chip.shoeSize' },
  { key: 'kidsSize', collapsed: 0, chipMessageId: null },
];
export const SIZE_FIELD_KEYS = SIZE_GROUPS.map(g => g.key);

/**
 * Chip text for a size option, e.g. "Size M" or "EU 42".
 *
 * @param {Object} intl
 * @param {Object} sizeGroup entry of SIZE_GROUPS
 * @param {string} optionLabel
 * @returns {string}
 */
export const formatSizeChip = (intl, sizeGroup, optionLabel) =>
  sizeGroup.chipMessageId
    ? intl.formatMessage({ id: sizeGroup.chipMessageId }, { value: optionLabel })
    : optionLabel;

export const COLOR_FIELD_KEY = 'color';
export const BRAND_FIELD_KEY = 'brand';
// How many brands are listed before the buyer searches
export const POPULAR_BRAND_COUNT = 6;

// Option ids shown as their plain label in the active filter chips (others get "Field: value")
const PLAIN_CHIP_FIELD_KEYS = [COLOR_FIELD_KEY, BRAND_FIELD_KEY, 'condition'];

// Swatch colours for colour options, by option id
const COLOR_SWATCHES = {
  black: '#1c1c1a',
  white: '#ffffff',
  grey: '#9a9892',
  gray: '#9a9892',
  silver: '#c9c9c4',
  beige: '#d9c7a7',
  cream: '#f1e9d6',
  brown: '#7a5638',
  bronze: '#9c6b3c',
  gold: '#c9a243',
  red: '#9b3b33',
  burgundy: '#6d2230',
  pink: '#e2a3ae',
  orange: '#d9853b',
  yellow: '#e2c25a',
  green: '#5c6e4a',
  khaki: '#8f8a5c',
  blue: '#3f5b7a',
  navy: '#24324a',
  purple: '#6e4f8a',
  multicolor: 'conic-gradient(#9b3b33, #e2c25a, #5c6e4a, #3f5b7a, #6e4f8a, #9b3b33)',
};
const FALLBACK_SWATCH = '#e7e4dc';

/**
 * Swatch for a colour option.
 *
 * @param {string} option option id from Console
 * @returns {string} CSS background value
 */
export const getColorSwatch = option =>
  COLOR_SWATCHES[`${option}`.toLowerCase().replace(/[\s_-]+/g, '')] || FALLBACK_SWATCH;

/**
 * URL parameter names used by a filter config.
 *
 * @param {Object} filterConfig
 * @returns {Array<string>}
 */
export const getParamNames = filterConfig => {
  const { key, scope, schemaType, nestedParams } = filterConfig;
  if (schemaType === 'category') {
    return (nestedParams || []).map(p => constructQueryParamName(p, scope));
  }
  if (['price', 'keywords', 'dates', 'seats'].includes(schemaType)) {
    return [key];
  }
  return [constructQueryParamName(key, scope)];
};

/**
 * Selected values of an enum URL parameter, e.g. "has_any:red,blue" → ['red', 'blue'].
 *
 * @param {string?} value
 * @returns {Array<string>}
 */
export const parseEnumValues = value =>
  value == null || value === ''
    ? []
    : `${value}`
        .replace(/^has_(any|all):/, '')
        .split(',')
        .filter(Boolean);

/**
 * URL parameter value for selected enum options. Null removes the parameter.
 *
 * @param {Object} filterConfig listing field config
 * @param {Array<string>} values
 * @returns {string|null}
 */
export const formatEnumValues = (filterConfig, values) => {
  if (values.length === 0) {
    return null;
  }
  const isMultiEnum = filterConfig.schemaType === SCHEMA_TYPE_MULTI_ENUM;
  const searchMode = filterConfig.filterConfig?.searchMode || 'has_any';
  return isMultiEnum ? `${searchMode}:${values.join(',')}` : values.join(',');
};

export const isEnumFilter = filterConfig =>
  [SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM].includes(filterConfig.schemaType);

/**
 * Label of a listing field filter.
 *
 * @param {Object} filterConfig
 * @returns {string}
 */
export const getFilterLabel = filterConfig =>
  filterConfig.filterConfig?.label || filterConfig.showConfig?.label || filterConfig.key;

/**
 * Filters that are shown in the drawer (everything except keywords and hidden fields).
 *
 * @param {Array<Object>} filters
 * @returns {Array<Object>}
 */
export const getDrawerFilters = filters =>
  filters.filter(f => f.schemaType !== 'keywords' && !HIDDEN_FILTER_KEYS.includes(f.key));

/**
 * Categories without the hidden ones, at every level.
 *
 * @param {Array<Object>} categories category tree from config
 * @returns {Array<Object>}
 */
export const getVisibleCategories = (categories = []) =>
  categories
    .filter(c => !HIDDEN_CATEGORY_IDS.some(hidden => `${c.id}`.includes(hidden)))
    .map(c => ({ ...c, subcategories: getVisibleCategories(c.subcategories) }));

const formatRange = (intl, value, currency) => {
  const [min, max] = `${value}`.split(',');
  const format = v =>
    currency
      ? intl.formatNumber(Number(v), { style: 'currency', currency, maximumFractionDigits: 0 })
      : intl.formatNumber(Number(v));
  return `${format(min)} – ${format(max)}`;
};

/**
 * Active filter chips for the toolbar above the results.
 *
 * @param {Object} params
 * @param {Array<Object>} params.filters drawer filters
 * @param {Object} params.urlQueryParams
 * @param {Array<Object>} params.listingCategories
 * @param {Object} params.intl
 * @param {string} params.marketplaceCurrency
 * @returns {Array<{ key: string, label: string, params: Object }>} label and the URL params
 *          that remove the chip
 */
export const getActiveChips = ({
  filters,
  urlQueryParams,
  listingCategories,
  intl,
  marketplaceCurrency,
}) => {
  const chips = [];

  filters.forEach(filterConfig => {
    const { schemaType, key } = filterConfig;
    const paramNames = getParamNames(filterConfig);

    if (schemaType === 'category') {
      const [level1Param, level2Param] = paramNames;
      const level1 = listingCategories.find(c => c.id === urlQueryParams[level1Param]);
      const level2 = level1?.subcategories?.find(c => c.id === urlQueryParams[level2Param]);
      if (level1) {
        const clearAll = paramNames.reduce((acc, p) => ({ ...acc, [p]: null }), {});
        chips.push({
          key: 'category',
          label: level2 ? `${level1.name}: ${level2.name}` : level1.name,
          params: clearAll,
        });
      }
      return;
    }

    if (schemaType === 'price' || schemaType === 'long') {
      const value = urlQueryParams[paramNames[0]];
      if (value) {
        const range = formatRange(intl, value, schemaType === 'price' ? marketplaceCurrency : null);
        chips.push({
          key,
          label: schemaType === 'price' ? range : `${getFilterLabel(filterConfig)}: ${range}`,
          params: { [paramNames[0]]: null },
        });
      }
      return;
    }

    if (isEnumFilter(filterConfig)) {
      const paramName = paramNames[0];
      const values = parseEnumValues(urlQueryParams[paramName]);
      const sizeGroup = SIZE_GROUPS.find(g => g.key === key);
      values.forEach(value => {
        const option = (filterConfig.enumOptions || []).find(o => `${o.option}` === value);
        const optionLabel = option?.label || value;
        const label = sizeGroup
          ? formatSizeChip(intl, sizeGroup, optionLabel)
          : PLAIN_CHIP_FIELD_KEYS.includes(key)
          ? optionLabel
          : `${getFilterLabel(filterConfig)}: ${optionLabel}`;
        const remaining = values.filter(v => v !== value);
        chips.push({
          key: `${key}.${value}`,
          label,
          params: { [paramName]: formatEnumValues(filterConfig, remaining) },
        });
      });
    }
  });

  return chips;
};
