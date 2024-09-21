import { useEffect, useState } from 'react';

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

  const onSelectChange = e => {
    setValue(e.target.value);
    tableMeta?.updateData(row.index, column.id, e.target.value);
  };

  const controlType = columnMeta?.type || 'input';

  return (
    <>
      {
        {
          select: (
            <select onChange={onSelectChange} value={initialValue}>
              {columnMeta?.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
