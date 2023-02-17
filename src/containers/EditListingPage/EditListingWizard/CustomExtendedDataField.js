import React from 'react';

// Import config and utils
import {
  SCHEMA_TYPE_ENUM,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_LONG,
  SCHEMA_TYPE_BOOLEAN,
} from '../../../util/types';
import { useIntl } from '../../../util/reactIntl';
import { required } from '../../../util/validators';
// Import shared components
import { FieldCheckboxGroup, FieldSelect, FieldTextInput, FieldBoolean } from '../../../components';
// Import modules from this directory
import css from './EditListingWizard.module.css';

const createFilterOptions = options => options.map(o => ({ key: `${o.option}`, label: o.label }));

const CustomFieldEnum = props => {
  const { name, fieldConfig, defaultRequiredMessage, intl } = props;
  const { schemaOptions = [], editListingPageConfig } = fieldConfig || {};
  const { label, placeholderMessage, isRequired, requiredMessage } = editListingPageConfig || {};
  const validateMaybe = isRequired
    ? { validate: required(requiredMessage || defaultRequiredMessage) }
    : {};
  const placeholder =
    placeholderMessage ||
    intl.formatMessage({ id: 'CustomExtendedDataField.placeholderSingleSelect' });
  const filterOptions = createFilterOptions(schemaOptions);

  return filterOptions ? (
    <FieldSelect className={css.customField} name={name} id={name} label={label} {...validateMaybe}>
      <option disabled value="">
        {placeholder}
      </option>
      {filterOptions.map(optionConfig => {
        const key = optionConfig.key;
        return (
          <option key={key} value={key}>
            {optionConfig.label}
          </option>
        );
      })}
    </FieldSelect>
  ) : null;
};

const CustomFieldMultiEnum = props => {
  const { name, fieldConfig } = props;
  const { schemaOptions = [], editListingPageConfig } = fieldConfig || {};

  return schemaOptions ? (
    <FieldCheckboxGroup
      className={css.customField}
      id={name}
      name={name}
      label={editListingPageConfig?.label}
      options={createFilterOptions(schemaOptions)}
    />
  ) : null;
};

const CustomFieldText = props => {
  const { name, fieldConfig, defaultRequiredMessage, intl } = props;
  const { label, placeholderMessage, isRequired, requiredMessage } =
    fieldConfig?.editListingPageConfig || {};
  const validateMaybe = isRequired
    ? { validate: required(requiredMessage || defaultRequiredMessage) }
    : {};
  const placeholder =
    placeholderMessage || intl.formatMessage({ id: 'CustomExtendedDataField.placeholderText' });

  return (
    <FieldTextInput
      className={css.customField}
      id={name}
      name={name}
      type="textarea"
      label={label}
      placeholder={placeholder}
      {...validateMaybe}
    />
  );
};

const CustomFieldLong = props => {
  const { name, fieldConfig, defaultRequiredMessage, intl } = props;
  const { label, placeholderMessage, isRequired, requiredMessage } =
    fieldConfig?.editListingPageConfig || {};
  const validateMaybe = isRequired
    ? { validate: required(requiredMessage || defaultRequiredMessage) }
    : {};
  const placeholder =
    placeholderMessage || intl.formatMessage({ id: 'CustomExtendedDataField.placeholderLong' });

  return (
    <FieldTextInput
      className={css.customField}
      id={name}
      name={name}
      type="number"
      step="1"
      parse={value => {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
      }}
      label={label}
      placeholder={placeholder}
      {...validateMaybe}
    />
  );
};

const CustomFieldBoolean = props => {
  const { name, fieldConfig, defaultRequiredMessage, intl } = props;
  const { label, placeholderMessage, isRequired, requiredMessage } =
    fieldConfig?.editListingPageConfig || {};
  const validateMaybe = isRequired
    ? { validate: required(requiredMessage || defaultRequiredMessage) }
    : {};
  const placeholder =
    placeholderMessage || intl.formatMessage({ id: 'CustomExtendedDataField.placeholder' });

  return (
    <FieldBoolean
      className={css.customField}
      id={name}
      name={name}
      label={label}
      placeholder={placeholder}
      {...validateMaybe}
    />
  );
};

/**
 * Return Final Form field for each configuration according to schema type.
 *
 * These custom extended data fields are for generating input fields from configuration defined
 * in marketplace-custom-config.js. Other panels in EditListingWizard might add more extended data
 * fields (e.g. shipping fee), but these are independently customizable.
 *
 * @param {Object} props should contain fieldConfig that defines schemaType, schemaOptions?, and
 * editListingPageConfig for the field.
 */
const CustomExtendedDataField = props => {
  const intl = useIntl();
  const { schemaOptions = [], schemaType } = props?.fieldConfig || {};
  const renderFieldComponent = (FieldComponent, props) => <FieldComponent {...props} intl={intl} />;

  return schemaType === SCHEMA_TYPE_ENUM && schemaOptions
    ? renderFieldComponent(CustomFieldEnum, props)
    : schemaType === SCHEMA_TYPE_MULTI_ENUM && schemaOptions
    ? renderFieldComponent(CustomFieldMultiEnum, props)
    : schemaType === SCHEMA_TYPE_TEXT
    ? renderFieldComponent(CustomFieldText, props)
    : schemaType === SCHEMA_TYPE_LONG
    ? renderFieldComponent(CustomFieldLong, props)
    : schemaType === SCHEMA_TYPE_BOOLEAN
    ? renderFieldComponent(CustomFieldBoolean, props)
    : null;
};

export default CustomExtendedDataField;
