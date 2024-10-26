import imagePlaceholder from '../../../../assets/image-placeholder.jpg';
import { Image, Switch, Table } from 'antd';
import { imageDimensions } from '../../BatchEditListingPage.duck';
import css from './EditListingBatchProductDetails.module.css';
import React from 'react';
import { EditableCellComponents } from './EditableCellComponents';

function stringSorter(strA, strB) {
  return strA.name.localeCompare(strB.name, 'en', { sensitivity: 'base' });
}

export const EditableListingsTable = props => {
  const { onSave, dataSource, listingFieldsOptions, onSelectChange, selectedRowKeys } = props;

  const {
    categories: imageryCategoryOptions,
    usages: usageOptions,
    releases: releaseOptions,
  } = listingFieldsOptions;

  const handleSave = updatedData => {
    onSave(updatedData);
  };

  const columns = [
    {
      title: 'Thumbnail',
      dataIndex: 'preview',
      render: previewUrl => (
        <Image alt="Thumbnail" src={previewUrl} fallback={imagePlaceholder} width={200} />
      ),
      fixed: 'left',
      width: 210,
    },
    {
      title: 'File Name',
      dataIndex: 'name',
      width: 300,
      sorter: stringSorter,
    },
    {
      title: 'Title',
      width: 400,
      dataIndex: 'title',
      editable: true,
      editControlType: 'text',
      sorter: stringSorter,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: 300,
      editable: true,
      editControlType: 'text',
      sorter: stringSorter,
    },
    {
      title: 'Is AI',
      dataIndex: 'isAi',
      width: 150,
      render: (_, record) => {
        const { isAi } = record;
        return (
          <Switch
            value={isAi}
            checkedChildren="Yes"
            unCheckedChildren="No"
            onChange={value =>
              handleSave({
                ...record,
                isAi: value,
                isIllustration: value ? false : record.isIllustration,
              })
            }
          />
        );
      },
    },
    {
      title: 'Is Illustration',
      dataIndex: 'isIllustration',
      width: 150,
      render: (_, record) => {
        const { isIllustration } = record;
        return (
          <Switch
            value={isIllustration}
            checkedChildren="Yes"
            unCheckedChildren="No"
            onChange={value =>
              handleSave({
                ...record,
                isAi: value ? false : record.isAi,
                isIllustration: value,
              })
            }
          />
        );
      },
    },
    {
      title: 'Category',
      width: 300,
      dataIndex: 'category',
      editable: true,
      editControlType: 'selectMultiple',
      options: imageryCategoryOptions,
    },
    {
      title: 'Usage',
      width: 200,
      dataIndex: 'usage',
      editable: true,
      editControlType: 'select',
      options: usageOptions,
    },
    {
      title: 'Do you have releases on file / can you obtain them?',
      dataIndex: 'releases',
      width: 300,
      editable: true,
      editControlType: 'select',
      options: releaseOptions,
    },
    {
      title: 'Keywords',
      width: 400,
      dataIndex: 'keywords',
      editable: true,
      editControlType: 'tags',
    },
    {
      title: 'Dimensions',
      dataIndex: 'dimensions',
      width: 200,
      render: dimensionsKey => {
        return imageDimensions[dimensionsKey].label;
      },
      sorter: stringSorter,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      width: 200,
      render: size => `${(size / 1024).toFixed(2)} KB`,
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      width: 200,
      editable: true,
      editControlType: 'text',
    },
  ];

  const editableColumns = columns.map(col => {
    if (!col.editable) return col;

    return {
      ...col,
      onCell: record => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
        editControlType: col.editControlType,
        options: col.options,
        cellClassName: css.editableCellValueWrap,
      }),
    };
  });

  return (
    <Table
      columns={editableColumns}
      components={EditableCellComponents}
      dataSource={dataSource}
      rowClassName={() => css.editableRow}
      rowKey="id"
      pagination={false}
      scroll={{
        x: 'max-content',
      }}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectChange,
      }}
      sticky={{ offsetHeader: 80 }}
      summary={() => <Table.Summary fixed="top"></Table.Summary>}
    ></Table>
  );
};
