import imagePlaceholder from '../../../../assets/image-placeholder.jpg';
import { Image, Table } from 'antd';
import { IMAGE_DIMENSIONS_MAP, MAX_CATEGORIES } from '../../BatchEditListingPage.duck';
import css from './EditListingBatchProductDetails.module.css';
import React from 'react';
import { EditableCellComponents } from './EditableCellComponents';
import { useIntl } from 'react-intl';

const stringSorter = (strA, strB) => {
  return strA.name.localeCompare(strB.name, 'en', { sensitivity: 'base' });
};

const numberSorter = (a, b) => {
  return a - b;
};

export const EditableListingsTable = props => {
  const {
    onSave,
    dataSource,
    listingFieldsOptions,
    onSelectChange,
    selectedRowKeys,
    loading = false,
  } = props;
  const intl = useIntl();

  const { categories: imageryCategoryOptions, usages: usageOptions } = listingFieldsOptions;

  const handleSave = updatedData => {
    onSave(updatedData);
  };

  const columns = [
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.columnThumbnail',
        defaultMessage: 'Thumbnail',
      }),
      dataIndex: 'preview',
      render: previewUrl => (
        <Image alt="Thumbnail" src={previewUrl} fallback={imagePlaceholder} width={200} />
      ),
      fixed: 'left',
      width: 210,
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.fileName',
        defaultMessage: 'File Name',
      }),
      dataIndex: 'name',
      width: 300,
      sorter: stringSorter,
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.title',
        defaultMessage: 'Title',
      }),
      width: 400,
      dataIndex: 'title',
      editable: true,
      editControlType: 'text',
      sorter: stringSorter,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.titlePlaceholder',
        defaultMessage: 'The listing title',
      }),
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.description',
        defaultMessage: 'Description',
      }),
      dataIndex: 'description',
      width: 300,
      editable: true,
      editControlType: 'textarea',
      sorter: stringSorter,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.descriptionPlaceholder',
        defaultMessage: 'The listing description',
      }),
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.isAi',
        defaultMessage: 'Is AI',
      }),
      dataIndex: 'isAi',
      width: 150,
      editable: true,
      editControlType: 'switch',
      onBeforeSave: record => ({
        ...record,
        isIllustration: record.isAi ? false : record.isIllustration,
      }),
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.isIllustration',
        defaultMessage: 'Is Illustration',
      }),
      dataIndex: 'isIllustration',
      width: 150,
      editable: true,
      editControlType: 'switch',
      onBeforeSave: record => ({
        ...record,
        isAi: record.isIllustration ? false : record.isAi,
      }),
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.category',
        defaultMessage: 'Category',
      }),
      width: 300,
      dataIndex: 'category',
      editable: true,
      editControlType: 'selectMultiple',
      options: imageryCategoryOptions,
      maxSelection: MAX_CATEGORIES,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.categoryPlaceholder',
        defaultMessage: 'Up to 5 categories',
      }),
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.usage',
        defaultMessage: 'Usage',
      }),
      width: 200,
      dataIndex: 'usage',
      editable: true,
      editControlType: 'select',
      options: usageOptions,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.usagePlaceholder',
        defaultMessage: 'Select the usage',
      }),
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.releases',
        defaultMessage: 'Do you have releases on file / can you obtain them?',
      }),
      dataIndex: 'releases',
      width: 300,
      editable: true,
      editControlType: 'switch',
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.keywords',
        defaultMessage: 'Keywords',
      }),
      width: 400,
      dataIndex: 'keywords',
      editable: true,
      editControlType: 'tags',
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.keywordsPlaceholder',
        defaultMessage: 'Up to 30 keywords',
      }),
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.dimensions',
        defaultMessage: 'Dimensions',
      }),
      dataIndex: 'dimensions',
      width: 200,
      render: dimensionsKey => {
        return IMAGE_DIMENSIONS_MAP[dimensionsKey].label;
      },
      sorter: stringSorter,
    },
    {
      title: intl.formatMessage({
        id: 'EditableListingsTable.price',
        defaultMessage: 'Price',
      }),
      dataIndex: 'price',
      width: 200,
      editable: true,
      editControlType: 'money',
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.pricePlaceholder',
        defaultMessage: 'Enter the price',
      }),
      sorter: numberSorter,
    },
  ];

  const editableColumns = columns.map(col => {
    if (!col.editable) return col;

    return {
      ...col,
      onCell: (record, rowIndex) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
        editControlType: col.editControlType,
        options: col.options,
        cellClassName: css.editableCellValueWrap,
        onBeforeSave: col.onBeforeSave,
        placeholder: col.placeholder,
        rowIndex: rowIndex,
        maxSelection: col.maxSelection,
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
      loading={loading}
    ></Table>
  );
};
