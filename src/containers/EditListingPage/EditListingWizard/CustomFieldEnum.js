import React from 'react';
// Import shared components
import { FieldSelect } from '../../../components';
// Import modules from this directory
import css from './EditListingWizard.module.css';

const CustomFieldEnum = props => {
  const { name, id, options, label, placeholder, validate, schemaType } = props;

  return options && schemaType === 'enum' ? (
    <FieldSelect
      className={css.detailsSelect}
      name={name}
      id={id}
      label={label}
      validate={validate}
    >
      <option disabled value="">
        {placeholder}
      </option>
      {options.map(c => (
        <option key={c.key} value={c.key}>
          {c.label}
        </option>
      ))}
    </FieldSelect>
  ) : null;
};

export default CustomFieldEnum;
