import React from 'react';
import classNames from 'classnames';

import { listingFieldDisplayOverrides } from '../../config/configListingDisplay';
import { useIntl } from '../../util/reactIntl';
import { CustomExtendedDataField } from '../../components';
import FieldColorDropdown from '../FieldColorDropdown/FieldColorDropdown';
import FieldGroupedMultiSelect from '../FieldGroupedMultiSelect/FieldGroupedMultiSelect';

import css from './DisplayOverrideField.module.css';

// AV custom multi-enum input renderers, dispatched by saveConfig.inputType
// inside upstream CustomExtendedDataField. Each receives:
//   { name, id, label, saveConfig, enumOptions, createFilterOptions, validate? }
const groupedMultiSelectInput = props => {
  const { name, id, label, saveConfig, enumOptions, validate } = props;
  const intl = useIntl();
  const enumLabels = (enumOptions || []).reduce((labels, option) => {
    labels[option.option] = option.label;
    return labels;
  }, {});
  const groups = (saveConfig?.groups || []).map(group => ({
    ...group,
    label: group.labelTranslationKey
      ? intl.formatMessage({ id: group.labelTranslationKey })
      : group.label,
    options: (group.options || []).map(optionKey => ({
      option: optionKey,
      label: enumLabels[optionKey] || optionKey,
    })),
  }));

  return (
    <FieldGroupedMultiSelect
      name={name}
      id={id}
      label={label}
      groups={groups}
      validate={validate}
    />
  );
};

const colorGridPickerInput = props => {
  const { name, id, label, enumOptions, createFilterOptions, validate } = props;
  return (
    <FieldColorDropdown
      name={name}
      id={id}
      label={label}
      options={createFilterOptions(enumOptions)}
      validate={validate}
    />
  );
};

const AV_INPUT_COMPONENTS = {
  groupedMultiSelect: groupedMultiSelectInput,
  colorGridPicker: colorGridPickerInput,
};

/**
 * DisplayOverrideField — wraps the upstream `CustomExtendedDataField` with two
 * AV concerns:
 *
 *  1. Display-only input override (e.g. swap the default `multi-enum` input for
 *     `groupedMultiSelect` when the field's key matches `listingFieldDisplayOverrides`).
 *     Does NOT change the backend search schema — only the rendered input.
 *
 *  2. CSS hook (`.customField` class on a wrapper div) so the parent
 *     `.fieldsGrid` can target it to render half-width on tablet+ viewports
 *     without each call site needing JSX wrappers.
 *
 * Pass-through props match `CustomExtendedDataField`. The `fieldConfig` prop is
 * looked up against `listingFieldDisplayOverrides` and merged into
 * `fieldConfig.saveConfig` if there's a match. AV input components are
 * provided via the upstream `inputComponents` extension hook.
 */
const DisplayOverrideField = props => {
  const { fieldConfig, className, ...rest } = props;
  const key = fieldConfig?.key;
  const override = key ? listingFieldDisplayOverrides[key] : null;

  const effectiveFieldConfig = override
    ? {
        ...fieldConfig,
        saveConfig: { ...fieldConfig?.saveConfig, ...override.saveConfig },
      }
    : fieldConfig;

  return (
    <div className={classNames('customField', css.customField, className)}>
      <CustomExtendedDataField
        fieldConfig={effectiveFieldConfig}
        inputComponents={AV_INPUT_COMPONENTS}
        {...rest}
      />
    </div>
  );
};

export default DisplayOverrideField;
