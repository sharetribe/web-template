/**
 * Lets the smart search page reuse the filter drawer of the search page.
 *
 * The drawer works with URL style params (pub_color=black, price=10,50, pub_categoryLevel1=men).
 * Smart search keeps filters in `state.filters` (Hackthon_case/CONTRACT.md §4 and §6). These
 * helpers translate between the two.
 */
import { isFilterEnabled } from '../../util/search';

import {
  SIZE_GROUPS,
  formatSizeChip,
  getFilterLabel,
  getParamNames,
  getVisibleCategories,
  isEnumFilter,
  parseEnumValues,
} from '../SearchPage/FilterDrawer/FilterDrawer.helpers';

import { addFilter, removeFilter } from './SmartSearchPage.helpers';

// Filter keys the smart search backend understands (CONTRACT.md §4)
const CONTRACT_FIELD_KEYS = [
  'size',
  'shoeSize',
  'kidsSize',
  'color',
  'brand',
  'condition',
  'petFreeHome',
  'smokeFreeHome',
];
const CATEGORY_KEYS = ['categoryLevel1', 'categoryLevel2'];
// Yes/no fields: the chip shows the field label, e.g. "Pet-free home"
const YES_NO_FIELD_KEYS = ['petFreeHome', 'smokeFreeHome'];

/**
 * Filters for the drawer on the smart search page: category, price and the listing fields that
 * the backend understands. Fields limited to some categories are shown for all.
 *
 * @param {Object} config marketplace config
 * @returns {Array<Object>} filter configs
 */
export const getSmartSearchDrawerFilters = config => {
  const defaultFilters = (config.search?.defaultFilters || []).filter(f =>
    ['category', 'price'].includes(f.schemaType)
  );
  const fieldFilters = (config.listing?.listingFields || []).filter(
    f => CONTRACT_FIELD_KEYS.includes(f.key) && isEnumFilter(f) && isFilterEnabled(f.filterConfig)
  );
  return [...defaultFilters, ...fieldFilters];
};

const toMajorUnits = cents => Math.round(cents / 100);

/**
 * URL style params for the drawer from `state.filters`.
 *
 * @param {Object} state smart search state
 * @param {Array<Object>} drawerFilters
 * @returns {Object} params
 */
export const stateToDrawerParams = (state, drawerFilters) => {
  const params = {};
  (state?.filters || []).forEach(f => {
    if (CATEGORY_KEYS.includes(f.key)) {
      const categoryFilter = drawerFilters.find(c => c.schemaType === 'category');
      const level = CATEGORY_KEYS.indexOf(f.key);
      const paramName = categoryFilter ? getParamNames(categoryFilter)[level] : null;
      if (paramName) {
        params[paramName] = f.value;
      }
    } else if (f.key === 'price') {
      const priceFilter = drawerFilters.find(c => c.schemaType === 'price');
      const { min, max } = f.value || {};
      const minValue = min != null ? toMajorUnits(min) : priceFilter?.min || 0;
      const maxValue = max != null ? toMajorUnits(max) : priceFilter?.max || 1000;
      params.price = `${minValue},${maxValue}`;
    } else {
      const fieldFilter = drawerFilters.find(c => c.key === f.key);
      if (fieldFilter) {
        const values = Array.isArray(f.value) ? f.value : [f.value];
        params[getParamNames(fieldFilter)[0]] = values.join(',');
      }
    }
  });
  return params;
};

const formatMoney = (intl, amount, currency) =>
  intl.formatNumber(amount, { style: 'currency', currency, maximumFractionDigits: 0 });

const priceFilterFromParam = (value, priceConfig, intl, currency) => {
  const [minRaw, maxRaw] = `${value}`.split(',').map(Number);
  const hasMin = minRaw > (priceConfig?.min || 0);
  const hasMax = maxRaw < (priceConfig?.max || Infinity);
  if (!hasMin && !hasMax) {
    return null;
  }
  const min = formatMoney(intl, minRaw, currency);
  const max = formatMoney(intl, maxRaw, currency);
  const label =
    hasMin && hasMax
      ? `${min} – ${max}`
      : hasMax
      ? intl.formatMessage({ id: 'SmartSearchPage.priceUnder' }, { max })
      : intl.formatMessage({ id: 'SmartSearchPage.priceFrom' }, { min });
  return {
    key: 'price',
    value: { ...(hasMin ? { min: minRaw * 100 } : {}), ...(hasMax ? { max: maxRaw * 100 } : {}) },
    label,
    op: 'range',
  };
};

const optionLabelFor = (fieldFilter, option, intl) => {
  const optionConfig = (fieldFilter.enumOptions || []).find(o => `${o.option}` === `${option}`);
  const optionLabel = optionConfig?.label || `${option}`;
  if (YES_NO_FIELD_KEYS.includes(fieldFilter.key)) {
    return getFilterLabel(fieldFilter);
  }
  const sizeGroup = SIZE_GROUPS.find(g => g.key === fieldFilter.key);
  return sizeGroup ? formatSizeChip(intl, sizeGroup, optionLabel) : optionLabel;
};

/**
 * Apply a change from the drawer (URL style params) to the smart search state, using the edits
 * of CONTRACT.md §6. A filter has one value per key, so picking a new option replaces the old one.
 *
 * @param {Object} params
 * @param {Object} params.state current smart search state (or a starting state)
 * @param {Object} params.changedParams URL style params from the drawer; null removes
 * @param {Array<Object>} params.drawerFilters
 * @param {Array<Object>} params.listingCategories category tree from config
 * @param {Object} params.intl
 * @param {string} params.marketplaceCurrency
 * @returns {Object} next state
 */
export const applyDrawerChange = ({
  state,
  changedParams,
  drawerFilters,
  listingCategories,
  intl,
  marketplaceCurrency,
}) => {
  const current = stateToDrawerParams(state, drawerFilters);
  const byKey = key => state.filters.find(f => f.key === key);
  const remove = (s, key) => (s.filters.some(f => f.key === key) ? removeFilter(s, byKey(key)) : s);
  let next = state;

  drawerFilters.forEach(filterConfig => {
    const paramNames = getParamNames(filterConfig);
    const touched = paramNames.filter(p => p in changedParams);
    if (touched.length === 0) {
      return;
    }

    if (filterConfig.schemaType === 'category') {
      const categories = getVisibleCategories(listingCategories);
      const [level1Param, level2Param] = paramNames;
      const level1 = categories.find(c => c.id === changedParams[level1Param]);
      const level2 = level1?.subcategories?.find(c => c.id === changedParams[level2Param]);
      next = remove(remove(next, 'categoryLevel2'), 'categoryLevel1');
      if (level1) {
        next = addFilter(next, { key: 'categoryLevel1', value: level1.id, label: level1.name });
      }
      if (level2) {
        next = addFilter(next, { key: 'categoryLevel2', value: level2.id, label: level2.name });
      }
      return;
    }

    if (filterConfig.schemaType === 'price') {
      const value = changedParams.price;
      const priceFilter = value
        ? priceFilterFromParam(value, filterConfig, intl, marketplaceCurrency)
        : null;
      next = priceFilter ? addFilter(next, priceFilter) : remove(next, 'price');
      return;
    }

    if (isEnumFilter(filterConfig)) {
      const paramName = paramNames[0];
      const before = parseEnumValues(current[paramName]);
      const after = parseEnumValues(changedParams[paramName]);
      const added = after.filter(v => !before.includes(v));
      const option = added[0] || (after.length > 0 ? after[after.length - 1] : null);
      next = option
        ? addFilter(next, {
            key: filterConfig.key,
            value: option,
            label: optionLabelFor(filterConfig, option, intl),
          })
        : remove(next, filterConfig.key);
    }
  });

  return next;
};

/**
 * Remove every filter (the drawer's "Clear all").
 *
 * @param {Object} state
 * @returns {Object} next state
 */
export const clearAllFilters = state => state.filters.reduce((s, f) => removeFilter(s, f), state);
