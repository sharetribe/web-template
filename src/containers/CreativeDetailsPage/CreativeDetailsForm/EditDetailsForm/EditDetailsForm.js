import React from 'react';
import { func, string, object } from 'prop-types';

// Import util modules
import { useIntl } from '../../../../util/reactIntl';
import { EXTENDED_DATA_SCHEMA_TYPES, propTypes } from '../../../../util/types';
import { isFieldForCategory, isFieldForListingType } from '../../../../util/fieldHelpers';

// Import shared components
import { CustomExtendedDataField } from '../../../../components';
// Import modules from this directory

// Add collect data for listing fields (both publicData and privateData) based on configuration
const AddListingFields = props => {
  const { listingType, listingFieldsConfig, selectedCategories, formId, intl } = props;
  const targetCategoryIds = Object.values(selectedCategories);
  const fields = listingFieldsConfig.reduce((pickedFields, fieldConfig) => {
    const { key, schemaType, scope } = fieldConfig || {};
    const namespacedKey = scope === 'public' ? `pub_${key}` : `priv_${key}`;
    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isProviderScope = ['public', 'private'].includes(scope);
    const isTargetListingType = isFieldForListingType(listingType, fieldConfig);
    const isTargetCategory = isFieldForCategory(targetCategoryIds, fieldConfig);
    return isKnownSchemaType && isProviderScope && isTargetListingType && isTargetCategory
      ? [
          ...pickedFields,
          <CustomExtendedDataField
            key={namespacedKey}
            name={namespacedKey}
            fieldConfig={fieldConfig}
            defaultRequiredMessage={intl.formatMessage({
              id: 'EditListingDetailsForm.defaultRequiredMessage',
            })}
            formId={formId}
          />,
        ]
      : pickedFields;
  }, []);
  return <>{fields}</>;
};

const EditDetailsForm = ({
  formId,
  pickSelectedCategories,
  listingFieldsConfig = [],
  values: {},
}) => {
  const intl = useIntl();
  const { listingType } = values;
  return (
    <AddListingFields
      listingType={listingType}
      listingFieldsConfig={listingFieldsConfig}
      selectedCategories={pickSelectedCategories(values)}
      formId={formId}
      intl={intl}
    />
  );
};

EditDetailsForm.propTypes = {
  formId: string,
  pickSelectedCategories: func.isRequired,
  listingFieldsConfig: propTypes.listingFields,
  values: object,
};

export default EditDetailsForm;
