import { useEffect, useState } from 'react';
import { CustomSelect } from '../CustomSelect/CustomSelect';

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
    table.options.meta?.updateData(row.index, column.id, value);
  };

  const onSelectChange = option => {
    console.log(option);
    setValue(option.value);
    tableMeta?.updateData(row.index, column.id, option.value);
  };

  const controlType = columnMeta?.type || 'input';

  return (
    <>
      {
        {
          select: (
            <CustomSelect
              onChange={onSelectChange}
              value={initialValue}
              options={columnMeta?.options}
              isMulti={columnMeta?.isMulti || false}
            ></CustomSelect>
          ),
          input: (
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={onBlur}
              type={columnMeta?.inputType || 'text'}
            />
          ),
        }[controlType]
      }
    </>
  );
};
