import React, { useContext, useEffect, useRef, useState } from 'react';
import { Form, Input, Select, Switch, Tag } from 'antd';

const SelectMultipleDisplay = ({ value, options }) => {
  if (!value || value.length === 0) {
    return ' - ';
  }
  const display = options.filter(option => value.includes(option.value));
  return display.map(v => <Tag key={v.value}>{v.label}</Tag>);
};

const SelectDisplay = ({ value, options }) => {
  if (!value) {
    return ' - ';
  }
  const display = options.find(option => value === option.value);
  return display.label;
};

const TagsDisplay = ({ value }) => {
  if (!value || value.length === 0) {
    return ' - ';
  }
  return value.map(v => <Tag key={v}>{v}</Tag>);
};

const EditableContext = React.createContext(null);
const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  editControlType,
  options,
  cellClassName,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  const value = record ? record[dataIndex] : '';

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  //const editContainerRef = useClickOutside(toggleEdit);

  let childrenControls = children;
  if (editable) {
    childrenControls = editing ? (
      <div>
        <Form.Item
          style={{ margin: 0 }}
          name={dataIndex}
          rules={[{ required: true, message: `${title} is required.` }]}
        >
          {
            {
              text: <Input ref={inputRef} onPressEnter={save} onBlur={save} />,
              selectMultiple: (
                <Select
                  ref={inputRef}
                  style={{ width: '100%' }}
                  mode="multiple"
                  options={options}
                  onSelect={save}
                  onChange={save}
                  onBlur={toggleEdit}
                  onDeselect={save}
                />
              ),
              select: (
                <Select
                  ref={inputRef}
                  style={{ width: '100%' }}
                  options={options}
                  onSelect={save}
                  onChange={save}
                  onBlur={toggleEdit}
                  onDeselect={save}
                />
              ),
              tags: (
                <Select
                  ref={inputRef}
                  mode="tags"
                  style={{ width: '100%' }}
                  onSelect={save}
                  onChange={save}
                  onBlur={toggleEdit}
                  onDeselect={save}
                />
              ),
            }[editControlType]
          }
        </Form.Item>
      </div>
    ) : (
      <div
        className={editControlType === 'toggle' ? '' : cellClassName}
        style={{ paddingInlineEnd: 24 }}
        onClick={toggleEdit}
      >
        {
          {
            text: <>{childrenControls}</>,
            selectMultiple: <SelectMultipleDisplay value={value} options={options} />,
            select: <SelectDisplay value={value} options={options} />,
            tags: <TagsDisplay value={value} />,
          }[editControlType]
        }
      </div>
    );
  }

  return <td {...restProps}>{childrenControls}</td>;
};

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

export const EditableCellComponents = {
  body: {
    row: EditableRow,
    cell: EditableCell,
  },
};
