import { SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_TEXT } from './types';

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
 * @param {String} entityType entity type to be checked (e.g. 'amenities')
 * @param {*} fieldConfig the config of a custom listing field
 * @returns true if listingTypeConfig allows the listingType
 */
export const isFieldFor = (entityTypeKey, entityType, fieldConfig) => {
  const { isLimited, limitToIds } = getEntityTypeRestrictions(entityTypeKey, fieldConfig);
  return !isLimited || limitToIds.includes(entityType);
};

export const isFieldForUserType = (userType, fieldConfig) =>
  isFieldFor('userType', userType, fieldConfig);
export const isFieldForListingType = (listingType, fieldConfig) =>
  isFieldFor('listingType', listingType, fieldConfig);
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
 * Pick props for SectionMultiEnumMaybe and SectionTextMaybe display components.
 * @param {*} publicData entity public data containing the value(s) to be displayed
 * @param {*} metadata entity metadata containing the value(s) to be displayed
 * @param {*} fieldConfigs array of custom field configuration objects
 * @param {*} entityTypeKey the name of the key denoting the entity type in publicData.
 * Currently supports 'userType' and 'listingType'.
 * @returns an object with attributes 'schemaType', 'key', and 'heading', as well as either
 * - 'options' and 'selectedOptions' for SCHEMA_TYPE_MULTI_ENUM
 * - or 'text' for SCHEMA_TYPE_TEXT
 *
 */
export const pickCustomFieldProps = (publicData, metadata, fieldConfigs, entityTypeKey) => {
  return fieldConfigs?.reduce((pickedElements, config) => {
    const { key, enumOptions, schemaType, showConfig = {}, scope = 'public' } = config;
    const { displayInProfile } = showConfig;
    const entityType = publicData && publicData[entityTypeKey];
    const isTargetEntityType = isFieldFor(entityTypeKey, entityType, config);

    const createFilterOptions = options =>
      options.map(o => ({ key: `${o.option}`, label: o.label }));

    const value =
      scope === 'public'
        ? getFieldValue(publicData, key)
        : scope === 'metadata'
        ? getFieldValue(metadata, key)
        : null;

    return isTargetEntityType && schemaType === SCHEMA_TYPE_MULTI_ENUM && displayInProfile
      ? [
          ...pickedElements,
          {
            schemaType,
            key,
            heading: config?.showConfig?.label,
            options: createFilterOptions(enumOptions),
            selectedOptions: value || [],
          },
        ]
      : isTargetEntityType && !!value && config.schemaType === SCHEMA_TYPE_TEXT && displayInProfile
      ? [
          ...pickedElements,
          {
            schemaType,
            key,
            heading: config?.showConfig?.label,
            text: value,
          },
        ]
      : pickedElements;
  }, []);
};
