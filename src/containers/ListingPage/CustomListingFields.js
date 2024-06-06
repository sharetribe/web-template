import React from 'react';

// Utils
import { SCHEMA_TYPE_MULTI_ENUM } from '../../util/types';
import {
  isFieldForCategory,
  pickCategoryFields,
  pickCustomFieldProps,
} from '../../util/fieldHelpers.js';

import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';

/**
 * Renders custom listing fields.
 * - SectionDetailsMaybe is used if schemaType is 'enum', 'long', 'boolean', or 'text'
 * - SectionMultiEnumMaybe is used if schemaType is 'multi-enum'
 *
 * @param {*} props include publicData, metadata, listingFieldConfigs, categoryConfiguration
 * @returns React.Fragment containing aforementioned components
 */
const CustomListingFields = props => {
  const { publicData, metadata, listingFieldConfigs, categoryConfiguration } = props;

  const { key: categoryPrefix, categories: listingCategoriesConfig } = categoryConfiguration;
  const categoriesObj = pickCategoryFields(publicData, categoryPrefix, 1, listingCategoriesConfig);
  const currentCategories = Object.values(categoriesObj);

  const isFieldForSelectedCategories = fieldConfig => {
    const isTargetCategory = isFieldForCategory(currentCategories, fieldConfig);
    return isTargetCategory;
  };
  const propsForCustomFields =
    pickCustomFieldProps(
      publicData,
      metadata,
      listingFieldConfigs,
      'listingType',
      isFieldForSelectedCategories
    ) || [];

  const multiEnumFields = propsForCustomFields.filter(
    field => field.schemaType === SCHEMA_TYPE_MULTI_ENUM
  );

  const otherFields = propsForCustomFields.filter(
    field => field.schemaType !== SCHEMA_TYPE_MULTI_ENUM
  );

  return (
    <>
      {multiEnumFields.map(customFieldProps => {
        const { schemaType, ...fieldProps } = customFieldProps;
        return <SectionMultiEnumMaybe key={fieldProps.key} {...fieldProps} />;
      })}
      <SectionDetailsMaybe {...props} isFieldForCategory={isFieldForSelectedCategories} />
    </>
  );
};

export default CustomListingFields;
