import React, { useContext } from 'react';
import { Form, Input, InputNumber, Select, Switch } from 'antd';
import css from './EditListingBatchProductDetails.module.css';

const { TextArea } = Input;

const EditableContext = React.createContext(null);
const EditableCell = props => {
  const {
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    editControlType,
    options,
    cellClassName,
    onBeforeSave = null,
    placeholder = '',
    ...restProps
  } = props;
  const form = useContext(EditableContext);
  const value = record ? record[dataIndex] : '';

  const save = async () => {
    try {
      let values = await form.getFieldsValue();
      if (onBeforeSave) {
        values = onBeforeSave(values);
        form.setFieldsValue(values);
      }

      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  return (
    <td {...restProps}>
      {editable ? (
        <div>
          <Form.Item
            initialValue={value}
            name={dataIndex}
            className={css.formItem}
            rules={[{ required: editControlType !== 'switch', message: `${title} is required.` }]}
          >
            {
              {
                text: <Input onPressEnter={save} onBlur={save} placeholder={placeholder} />,
                textarea: <TextArea autoSize onBlur={save} placeholder={placeholder}></TextArea>,
                selectMultiple: (
                  <Select
                    style={{ width: '100%' }}
                    mode="multiple"
                    options={options}
                    onSelect={save}
                    onChange={save}
                    onDeselect={save}
                    placeholder={placeholder}
                  />
                ),
                select: (
                  <Select
                    style={{ width: '100%' }}
                    options={options}
                    onSelect={save}
                    onChange={save}
                    onDeselect={save}
                    placeholder={placeholder}
                  />
                ),
                tags: (
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    onSelect={save}
                    onChange={save}
                    onDeselect={save}
                    placeholder={placeholder}
                  />
                ),
                switch: (
                  <Switch
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                    onChange={save}
                    value={value}
                  ></Switch>
                ),
                money: (
                  <InputNumber
                    addonBefore="$"
                    onPressEnter={save}
                    onBlur={save}
                    type="number"
                    placeholder={placeholder}
                  />
                ),
              }[editControlType]
            }
          </Form.Item>
        </div>
      ) : (
        <div className={css.displayCell}>{children}</div>
      )}
    </td>
  );
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
