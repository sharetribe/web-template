import { SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_TEXT } from './types';

export const pickCustomFieldProps = (publicData, metadata, fieldConfig, entityTypeKey) => {
  return fieldConfig?.reduce((pickedElements, config) => {
    const {
      key,
      enumOptions,
      limitToUserTypeIds,
      schemaType,
      userTypeIds,
      scope = 'public',
    } = config;
    const entityType = publicData && publicData[entityTypeKey];
    const isTargetEntityType = !limitToUserTypeIds || userTypeIds.includes(entityType);

    // console.log({ config })

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
