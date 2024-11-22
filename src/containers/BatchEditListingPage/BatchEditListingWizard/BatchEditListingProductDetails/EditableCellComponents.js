import React, { useContext, useEffect, useRef } from 'react';
import { Form, Input, InputNumber, Select, Switch } from 'antd';
import css from './EditListingBatchProductDetails.module.css';
import { MAX_KEYWORDS } from '../../BatchEditListingPage.duck';

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
    rowIndex,
    maxSelection,
    ...restProps
  } = props;
  const form = useContext(EditableContext);
  const value = record ? record[dataIndex] : '';
  const isMounted = useRef(true);

  // Cleanup to avoid state updates on unmounted components
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const save = async () => {
    try {
      let values = await form.getFieldsValue();
      if (onBeforeSave) {
        values = onBeforeSave(values);
        form.setFieldsValue(values);
      }

      if (isMounted.current) {
        handleSave({ ...record, ...values });
      }
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
            id={`${dataIndex}-${record.id}`}
            className={css.formItem}
            rules={[{ required: editControlType !== 'switch', message: `${title} is required.` }]}
          >
            {
              {
                text: (
                  <Input
                    id={`${dataIndex}-${rowIndex}`}
                    onPressEnter={save}
                    onBlur={save}
                    placeholder={placeholder}
                  />
                ),
                textarea: (
                  <TextArea
                    id={`${dataIndex}-${rowIndex}`}
                    autoSize
                    onBlur={save}
                    placeholder={placeholder}
                  ></TextArea>
                ),
                selectMultiple: (
                  <Select
                    id={`${dataIndex}-${rowIndex}`}
                    style={{ width: '100%' }}
                    mode="multiple"
                    options={options}
                    onSelect={save}
                    onChange={save}
                    onDeselect={save}
                    placeholder={placeholder}
                    maxCount={maxSelection}
                  />
                ),
                select: (
                  <Select
                    id={`${dataIndex}-${rowIndex}`}
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
                    id={`${dataIndex}-${rowIndex}`}
                    mode="tags"
                    style={{ width: '100%' }}
                    onSelect={save}
                    onChange={save}
                    onDeselect={save}
                    placeholder={placeholder}
                    maxTagCount={MAX_KEYWORDS}
                  />
                ),
                switch: (
                  <Switch
                    id={`${dataIndex}-${rowIndex}`}
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                    onChange={save}
                    value={value}
                  ></Switch>
                ),
                money: (
                  <InputNumber
                    id={`${dataIndex}-${rowIndex}`}
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
