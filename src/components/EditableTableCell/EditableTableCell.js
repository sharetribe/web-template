import { useEffect, useState } from 'react';
import { CustomSelect } from '../CustomSelect/CustomSelect';
import { TagInput } from '../TagInput/TagInput';

export const EditableTableCell = props => {
  const { getValue, row, column, table } = props;

  const columnMeta = column.columnDef.meta;
  const initialValue = columnMeta?.defaultValue || getValue() || '';

  const tableMeta = table.options.meta;
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    console.log(value);
    tableMeta?.updateData(row.index, column.id, value);
  };

  const onSelectChange = option => {
    setValue(option.value);
    tableMeta?.updateData(row.index, column.id, option.value);
  };

  const onTagInputChange = values => {
    const tags = values.map(({ value }) => value);
    setValue(tags);
    tableMeta?.updateData(row.index, column.id, tags);
  };

  const controlType = columnMeta?.type || 'input';

  function onTextChange(e) {
    console.log(e);
    setValue(e.target.value);
  }

  return (
    <>
      {
        {
          select: (
            <CustomSelect
              onChange={onSelectChange}
              value={value}
              options={columnMeta?.options}
              isMulti={columnMeta?.isMulti || false}
            ></CustomSelect>
          ),
          tagInput: <TagInput initialValue={value} onChange={onTagInputChange}></TagInput>,
          input: (
            <input
              value={value}
              onChange={onTextChange}
              onBlur={onBlur}
              type={columnMeta?.inputType || 'text'}
            />
          ),
          textArea: (
            <textarea value={value} onChange={onTextChange} onBlur={onBlur}></textarea>
          ),
        }[controlType]
      }
    </>
  );
};
