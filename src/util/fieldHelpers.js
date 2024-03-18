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
 * Pick props for SectionMultiEnumMaybe and SectionTextMaybe display components.
 * @param {*} publicData entity public data containing the value(s) to be displayed
 * @param {*} metadata entity metadata containing the value(s) to be displayed
 * @param {*} fieldConfig custom field configuration object
 * @param {*} entityTypeKey the name of the key denoting the entity type in publicData.
 * Currently supports 'userType' and 'listingType'.
 * @returns an object with attributes 'schemaType', 'key', and 'heading', as well as either
 * - 'options' and 'selectedOptions' for SCHEMA_TYPE_MULTI_ENUM
 * - or 'text' for SCHEMA_TYPE_TEXT
 *
 */
export const pickCustomFieldProps = (publicData, metadata, fieldConfig, entityTypeKey) => {
  return fieldConfig?.reduce((pickedElements, config) => {
    const { key, enumOptions, schemaType, scope = 'public' } = config;
    const { isLimited, limitToIds } = getEntityTypeRestrictions(entityTypeKey, config);
    const entityType = publicData && publicData[entityTypeKey];
    const isTargetEntityType = !isLimited || limitToIds.includes(entityType);

    const createFilterOptions = options =>
      options.map(o => ({ key: `${o.option}`, label: o.label }));

    const value =
      scope === 'public' && !!publicData
        ? publicData[key]
        : scope === 'metadata' && !!metadata
        ? metadata[key]
        : null;

    const hasValue = value != null;
    return isTargetEntityType && schemaType === SCHEMA_TYPE_MULTI_ENUM
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
      : isTargetEntityType && hasValue && config.schemaType === SCHEMA_TYPE_TEXT
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
