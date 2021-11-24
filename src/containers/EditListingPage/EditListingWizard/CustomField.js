import React from 'react';

// Import config and utils
import { required } from '../../../util/validators';
// Import shared components
import { FieldCheckboxGroup, FieldSelect } from '../../../components';
// Import modules from this directory
import css from './EditListingWizard.module.css';

const CustomFieldEnum = props => {
  const { id, filterConfig } = props;
  const { config, label, wizardPlaceholder, wizardRequired } = filterConfig || {};
  const { options = [], schemaType } = config;

  return options && schemaType === 'enum' ? (
    <FieldSelect
      className={css.detailsSelect}
      name={id}
      id={id}
      label={label}
      validate={required(wizardRequired)}
    >
      <option disabled value="">
        {wizardPlaceholder}
      </option>
      {options.map(c => (
        <option key={c.key} value={c.key}>
          {c.label}
        </option>
      ))}
    </FieldSelect>
  ) : null;
};

const CustomFieldMultiEnum = props => {
  const { id, filterConfig } = props;
  const { config, label } = filterConfig || {};
  const { options = [], schemaType } = config;

  return options && schemaType === 'multi-enum' ? (
    <FieldCheckboxGroup
      className={css.multiEnum}
      id={id}
      name={id}
      label={label}
      options={options}
    />
  ) : null;
};

const CustomField = props => {
  const { options = [], schemaType } = props?.filterConfig?.config || {};
  return options && schemaType === 'enum' ? (
    <CustomFieldEnum {...props} />
  ) : options && schemaType === 'multi-enum' ? (
    <CustomFieldMultiEnum {...props} />
  ) : null;
};

export default CustomField;
