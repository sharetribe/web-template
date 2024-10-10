// This util file is about user and listing fields.
// I.e. These are custom fields to data entities. They are added through the Marketplace Console.
// In the codebase, we also have React Final Form fields, which are wrapper around user inputs.

import { SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_TEXT, SCHEMA_TYPE_YOUTUBE } from './types';

const keyMapping = {
  userType: {
    wrapper: 'userTypeConfig',
    limitTo: 'limitToUserTypeIds',
    ids: 'userTypeIds',
  },
  listingType: {
    wrapper: 'listingTypeConfig',
    limitTo: 'limitToListingTypeIds',
    ids: 'listingTypeIds',
  },
  category: {
    wrapper: 'categoryConfig',
    limitTo: 'limitToCategoryIds',
    ids: 'categoryIds',
  },
};

const getEntityTypeRestrictions = (entityTypeKey, config) => {
  const { wrapper, limitTo, ids } = keyMapping[entityTypeKey];
  const isLimited = config && config[wrapper] && config[wrapper][limitTo];
  const limitToIds = config && config[wrapper] && config[wrapper][ids];

  return { isLimited, limitToIds };
};

/**
 * Check if the given listing type is allowed according to the given listing field config.
 *
 * @param {String} entityTypeKey entity type key (e.g. 'listingType', 'userType')
 * @param {String|Array<String>} entityType entity type to be checked (e.g. 'amenities'). Accepts an array too.
 * @param {*} fieldConfig the config of a custom listing field
 * @returns true if listingTypeConfig allows the listingType
 */
export const isFieldFor = (entityTypeKey, entityType, fieldConfig) => {
  const { isLimited, limitToIds } = getEntityTypeRestrictions(entityTypeKey, fieldConfig);

  if (Array.isArray(entityType)) {
    return !isLimited || limitToIds.some(cid => entityType.includes(cid));
  }
  return !isLimited || limitToIds.includes(entityType);
};

export const isFieldForUserType = (userType, fieldConfig) =>
  isFieldFor('userType', userType, fieldConfig);
export const isFieldForListingType = (listingType, fieldConfig) =>
  isFieldFor('listingType', listingType, fieldConfig);
export const isFieldForCategory = (categories, fieldConfig) =>
  isFieldFor('category', categories, fieldConfig);

/**
 * Returns the value of the attribute in extended data.
 * @param {*} data extended data containing the value
 * @param {*} key attribute key in extended data
 * @returns
 */
export const getFieldValue = (data, key) => {
  const value = data?.[key];
  return value != null ? value : null;
};

/**
 * Picks current values for listing categories based on provided public data and configuration.
 * This function validates if the initial values match with the configuration received via assets.
 * If a categoryLevel value doesn't match with the category configuration, it is not passed on to the form.
 *
 * @param {*} data publicData or some other set where category-related nested data is available
 * @param {String} prefix prefix used for storing nested values.
 * @param {Number} level refers to nesting level (starts from 1)
 * @param {Array} categoryLevelOptions array of nested category structure
 * @returns pick valid prefixed properties
 */
export const pickCategoryFields = (data, prefix, level, categoryLevelOptions = []) => {
  const currentCategoryKey = `${prefix}${level}`;
  const currentCategoryValue = data[currentCategoryKey];
  const isCategoryLevelSet = typeof currentCategoryValue !== 'undefined';

  // Validate the value against category options
  const categoryOptionConfig = categoryLevelOptions.find(
    category => category.id === currentCategoryValue
  );
  const isValidCategoryValue = !!categoryOptionConfig;
  const nextLevelOptions = categoryOptionConfig?.subcategories || [];

  // Return category level property if it's found from the data and the value is one of the valid options.
  // Go through all the nested levels.
  return isCategoryLevelSet && isValidCategoryValue
    ? {
        [currentCategoryKey]: currentCategoryValue,
        ...pickCategoryFields(data, prefix, ++level, nextLevelOptions),
      }
    : {};
};

/**
 * Pick props for SectionMultiEnumMaybe and SectionTextMaybe display components.
 *
 * @param {*} publicData entity public data containing the value(s) to be displayed
 * @param {*} metadata entity metadata containing the value(s) to be displayed
 * @param {Array<Object>} fieldConfigs array of custom field configuration objects
 * @param {String} entityTypeKey the name of the key denoting the entity type in publicData.
 * E.g. 'listingType', 'userType', or 'category'
 * @param {function} shouldPickFn an optional function to add extra check before including the field props
 * @returns an object with attributes 'schemaType', 'key', and 'heading', as well as either
 * - 'options' and 'selectedOptions' for SCHEMA_TYPE_MULTI_ENUM
 * - or 'text' for SCHEMA_TYPE_TEXT
 */
export const pickCustomFieldProps = (
  publicData,
  metadata,
  fieldConfigs,
  entityTypeKey,
  shouldPickFn
) => {
  return fieldConfigs?.reduce((pickedElements, config) => {
    const { key, enumOptions, schemaType, scope = 'public', showConfig } = config;
    const { label, unselectedOptions: showUnselectedOptions } = showConfig || {};
    const entityType = publicData && publicData[entityTypeKey];
    const isTargetEntityType = isFieldFor(entityTypeKey, entityType, config);

    const createFilterOptions = options =>
      options.map(o => ({ key: `${o.option}`, label: o.label }));

    const shouldPick = shouldPickFn ? shouldPickFn(config) : true;

    const value =
      scope === 'public'
        ? getFieldValue(publicData, key)
        : scope === 'metadata'
        ? getFieldValue(metadata, key)
        : null;

    return isTargetEntityType && schemaType === SCHEMA_TYPE_MULTI_ENUM && shouldPick
      ? [
          ...pickedElements,
          {
            schemaType,
            key,
            heading: label,
            options: createFilterOptions(enumOptions),
            selectedOptions: value || [],
            showUnselectedOptions: showUnselectedOptions !== false,
          },
        ]
      : isTargetEntityType && !!value && config.schemaType === SCHEMA_TYPE_TEXT && shouldPick
      ? [
          ...pickedElements,
          {
            schemaType,
            key,
            heading: label,
            text: value,
          },
        ]
      : isTargetEntityType && schemaType === SCHEMA_TYPE_YOUTUBE && shouldPick
      ? [
          ...pickedElements,
          {
            schemaType,
            key,
            videoUrl: value,
            heading: label,
          },
        ]
      : pickedElements;
  }, []);
};
