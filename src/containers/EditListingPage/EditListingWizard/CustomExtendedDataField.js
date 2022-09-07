import React from 'react';

// Import config and utils
import {
  SCHEMA_TYPE_ENUM,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_LONG,
  SCHEMA_TYPE_BOOLEAN,
} from '../../../util/types';
import { required } from '../../../util/validators';
// Import shared components
import { FieldCheckboxGroup, FieldSelect, FieldTextInput, FieldBoolean } from '../../../components';
// Import modules from this directory
import css from './EditListingWizard.module.css';

const getOptionValue = option => `${option}`.toLowerCase().replace(/\s/g, '_');

const CustomFieldEnum = props => {
  const { name, fieldConfig, defaultRequiredMessage } = props;
  const { schemaOptions = [], editListingPageConfig } = fieldConfig || {};
  const { label, placeholder, required, requiredMessage } = editListingPageConfig || {};
  const validateMaybe = required ? { validate: required(requiredMessage || defaultRequiredMessage) } : {};

  return schemaOptions ? (
    <FieldSelect className={css.customField} name={name} id={name} label={label} {...validateMaybe}>
      <option disabled value="">
        {placeholder}
      </option>
      {schemaOptions.map(option => {
        // Key is used in URL on SearchPage, when making listing queries.
        // We turn it to more readable form by avoiding encoded space characters
        // I.e. "My Option" => "my_option"
        const key = getOptionValue(option);
        return (
          <option key={key} value={key}>
            {option}
          </option>
        );
      })}
    </FieldSelect>
  ) : null;
};

const CustomFieldMultiEnum = props => {
  const { name, fieldConfig } = props;
  const { schemaOptions = [], editListingPageConfig } = fieldConfig || {};
  const options = schemaOptions.map(option => {
    // Key is used in URL on SearchPage, when making listing queries.
    // We turn it to more readable form by avoiding encoded space characters
    // I.e. "My Option" => "my_option"
    const key = getOptionValue(option);
    return { key, label: option };
  });

  return options ? (
    <FieldCheckboxGroup
      className={css.customField}
      id={name}
      name={name}
      label={editListingPageConfig?.label}
      options={options}
    />
  ) : null;
};

const CustomFieldText = props => {
  const { name, fieldConfig, defaultRequiredMessage } = props;
  const { label, placeholder, required, requiredMessage } = fieldConfig?.editListingPageConfig || {};
  const validateMaybe = required ? { validate: required(requiredMessage || defaultRequiredMessage) } : {};

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
  const { name, fieldConfig, defaultRequiredMessage } = props;
  const { label, placeholder, required, requiredMessage } = fieldConfig?.editListingPageConfig || {};
  const validateMaybe = required ? { validate: required(requiredMessage || defaultRequiredMessage) } : {};

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
  const { name, fieldConfig, defaultRequiredMessage } = props;
  const { label, placeholder, required, requiredMessage } = fieldConfig?.editListingPageConfig || {};
  const validateMaybe = required ? { validate: required(requiredMessage || defaultRequiredMessage) } : {};

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
  const { schemaOptions = [], schemaType } = props?.fieldConfig || {};
  const renderFieldComponent = (FieldComponent, props) => <FieldComponent {...props} />;

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
