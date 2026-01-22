import React from 'react';

// Utils
import {
  getDetailCustomFieldValue,
  isFieldForCategory,
  isFieldForListingType,
  pickCategoryFields,
  pickCustomFieldProps,
} from '../../util/fieldHelpers.js';

import CustomExtendedDataSection from '../../components/CustomExtendedDataSection/CustomExtendedDataSection.js';

/**
 * Renders custom listing fields.
 * - SectionDetails is used if schemaType is 'enum', 'long', or 'boolean'
 * - SectionMultiEnum is used if schemaType is 'multi-enum'
 * - SectionText is used if schemaType is 'text'
 *
 * @param {*} props include publicData, metadata, listingFieldConfigs, categoryConfiguration
 * @returns React.Fragment containing aforementioned components
 */
const CustomListingFields = props => {
  const { publicData, metadata, listingFieldConfigs, categoryConfiguration, intl } = props;

  const { key: categoryPrefix, categories: listingCategoriesConfig } = categoryConfiguration;
  const categoriesObj = pickCategoryFields(publicData, categoryPrefix, 1, listingCategoriesConfig);
  const currentCategories = Object.values(categoriesObj);

  const isFieldForSelectedCategories = fieldConfig => {
    const isTargetCategory = isFieldForCategory(currentCategories, fieldConfig);
    return isTargetCategory;
  };
  const propsForCustomFields =
    pickCustomFieldProps(
      { publicData, metadata },
      listingFieldConfigs,
      'listingType',
      isFieldForSelectedCategories
    ) || [];

  const sectionDetailsProps = {
    ...props,
    isFieldForCategory: isFieldForSelectedCategories,
    fieldConfigs: listingFieldConfigs,
    heading: 'ListingPage.detailsTitle',
  };

  const pickExtendedDataFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, showConfig = {} } = config;
    const listingType = publicData.listingType;
    const isTargetListingType = isFieldForListingType(listingType, config);
    const isTargetCategory = isFieldForCategory(config);

    const { isDetail, label } = showConfig;
    const publicDataValue = publicData[key];
    const metadataValue = metadata[key];
    const value = typeof publicDataValue != null ? publicDataValue : metadataValue;

    if (isDetail && isTargetListingType && isTargetCategory && typeof value !== 'undefined') {
      const detailValue = getDetailCustomFieldValue(
        enumOptions,
        value,
        schemaType,
        key,
        label,
        intl,
        'ListingPage'
      );

      return detailValue ? filteredConfigs.concat(detailValue) : filteredConfigs;
    }
    return filteredConfigs;
  };

  return (
    <CustomExtendedDataSection
      sectionDetailsProps={sectionDetailsProps}
      propsForCustomFields={propsForCustomFields}
      idPrefix="listingPage"
      pickExtendedDataFields={pickExtendedDataFields}
    />
  );
};

export default CustomListingFields;
