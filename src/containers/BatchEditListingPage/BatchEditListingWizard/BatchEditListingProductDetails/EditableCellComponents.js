import React from 'react';
import { Input, InputNumber, Select, Switch } from 'antd';
import { NamedLink } from '../../../../components';
import css from './EditListingBatchProductDetails.module.css';

const { TextArea } = Input;

const EditableCell = ({
  title,
  editable,
  dataIndex,
  record = {}, // Default to an empty object to avoid undefined errors
  handleSave,
  editControlType,
  options,
  placeholder = '',
  maxSelection,
  onBeforeSave,
  disabled = () => false,
  children, // Content for non-editable cells
  ...restProps
}) => {
  const value = record[dataIndex] !== undefined ? record[dataIndex] : '';

  const handleChange = newValue => {
    const values = { ...record, [dataIndex]: newValue };
    const updatedValues = onBeforeSave ? onBeforeSave(values) : values;

    if (handleSave) {
      handleSave(updatedValues);
    }
  };

  const renderEditableField = () => {
    switch (editControlType) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={e => handleChange(e.target.value)}
            onBlur={() => handleChange(value)}
            placeholder={placeholder}
            className={css.formItem}
          />
        );
      case 'textarea':
        return (
          <TextArea
            value={value}
            onChange={e => handleChange(e.target.value)}
            autoSize
            placeholder={placeholder}
            className={css.formItem}
          />
        );
      case 'selectMultiple':
        return (
          <Select
            value={value}
            mode="multiple"
            options={options}
            onChange={handleChange}
            placeholder={placeholder}
            maxCount={maxSelection}
            className={css.formItem}
            style={{ width: '100%' }}
          />
        );
      case 'select':
        return (
          <Select
            value={value}
            options={options}
            onChange={handleChange}
            placeholder={placeholder}
            className={css.formItem}
            style={{ width: '100%' }}
          />
        );
      case 'tags':
        return (
          <Select
            mode="tags"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            maxTagCount={maxSelection}
            className={css.formItem}
            style={{ width: '100%' }}
          />
        );
      case 'switch':
        return (
          <Switch
            checked={!!value} // Ensure the value is a boolean
            onChange={checked => handleChange(checked)}
            checkedChildren="Yes"
            unCheckedChildren="No"
            className={css.formItem}
            disabled={disabled(record)}
          />
        );
      case 'money':
        return (
          <>
            <InputNumber
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              formatter={val => `$ ${val}`}
              className={css.formItem}
            />
            <div className={css.moneyFieldPricingGuide}>
              <NamedLink name="CMSPage" params={{ pageId: 'pricing-guide' }}>
                Pricing guide
              </NamedLink>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return <td {...restProps}>{editable ? renderEditableField() : children}</td>;
};

const EditableRow = ({ index, ...props }) => {
  return <tr {...props} />;
};

export const EditableCellComponents = {
  body: {
    row: EditableRow,
    cell: EditableCell,
  },
};
