import imagePlaceholder from '../../../../assets/image-placeholder.jpg';
import { Flex, Image, Table } from 'antd';
import { DEFAULT_PRODUCT_LISTING_PRICE, MAX_CATEGORIES, MAX_KEYWORDS } from '../../constants';
import css from './EditListingBatchProductDetails.module.css';
import React from 'react';
import { EditableCellComponents } from './EditableCellComponents';
import { FormattedMessage, useIntl } from 'react-intl';
import { getImageDimensionLabel } from '../../imageHelpers';
import { CsvUpload } from '../CsvUpload/CsvUpload';
import { TableHeaderTitle } from './TableHeaderTitle';

const stringSorter = (strA, strB) => {
  return strA.name.localeCompare(strB.name, 'en', { sensitivity: 'base' });
};

const numberSorter = (a, b) => {
  return a - b;
};

export const EditableListingsTable = props => {
  const {
    onSave,
    listingFieldsOptions,
    onSelectChange,
    selectedRowKeys,
    listings,
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
      title: (
        <TableHeaderTitle helperText="Provide the main title of the listing. This will be prominently displayed.">
          <FormattedMessage id="EditableListingsTable.title" defaultMessage="Title" />
        </TableHeaderTitle>
      ),
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
      title: (
        <TableHeaderTitle helperText="Enter a detailed description of the listing to inform potential buyers.">
          <FormattedMessage id="EditableListingsTable.description" defaultMessage="Description" />
        </TableHeaderTitle>
      ),
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
      title: (
        <TableHeaderTitle helperText="Indicate if the listing was generated using artificial intelligence.">
          <FormattedMessage id="EditableListingsTable.isAi" defaultMessage="Is AI" />
        </TableHeaderTitle>
      ),
      dataIndex: 'isAi',
      width: 150,
      editable: true,
      editControlType: 'switch',
      onBeforeSave: record => ({
        ...record,
        isIllustration: record.isAi,
      }),
    },
    {
      title: (
        <TableHeaderTitle helperText="Specify if this listing is an illustration. This option will be disabled if marked as AI-generated.">
          <FormattedMessage
            id="EditableListingsTable.isIllustration"
            defaultMessage="Is Illustration"
          />
        </TableHeaderTitle>
      ),
      dataIndex: 'isIllustration',
      width: 150,
      editable: true,
      editControlType: 'switch',
      disabled: record => record.isAi,
    },
    {
      title: (
        <TableHeaderTitle
          helperText={`Select up to ${MAX_CATEGORIES} categories to classify the listing for better discoverability.`}
        >
          <FormattedMessage id="EditableListingsTable.category" defaultMessage="Category" />
        </TableHeaderTitle>
      ),
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
      title: (
        <TableHeaderTitle helperText="Choose a use case for the listing from the options provided.">
          <FormattedMessage id="EditableListingsTable.usage" defaultMessage="Usage" />
        </TableHeaderTitle>
      ),
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
      title: (
        <TableHeaderTitle helperText="Indicate whether you have or can obtain the necessary releases for this listing">
          <FormattedMessage
            id="EditableListingsTable.releases"
            defaultMessage="Do you have releases on file / can you obtain them?"
          />
        </TableHeaderTitle>
      ),
      dataIndex: 'releases',
      width: 300,
      editable: true,
      editControlType: 'switch',
    },
    {
      title: (
        <TableHeaderTitle
          helperText={`Enter up to ${MAX_KEYWORDS} keywords to enhance searchability of the listing`}
        >
          <FormattedMessage id="EditableListingsTable.keywords" defaultMessage="Keywords" />
        </TableHeaderTitle>
      ),
      width: 400,
      dataIndex: 'keywords',
      editable: true,
      editControlType: 'tags',
      maxSelection: MAX_KEYWORDS,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.keywordsPlaceholder',
        defaultMessage: 'Up to 30 keywords',
      }),
    },
    {
      title: (
        <TableHeaderTitle>
          <FormattedMessage id="EditableListingsTable.dimensions" defaultMessage="Dimensions" />
        </TableHeaderTitle>
      ),
      dataIndex: 'dimensions',
      width: 200,
      render: getImageDimensionLabel,
      sorter: stringSorter,
    },
    {
      title: (
        <TableHeaderTitle
          helperText={`Set the listing price, default is ${DEFAULT_PRODUCT_LISTING_PRICE} USD but adjustable as needed`}
        >
          <FormattedMessage id="EditableListingsTable.price" defaultMessage="Price" />
        </TableHeaderTitle>
      ),
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
        disabled: col.disabled,
      }),
    };
  });

  return (
    <div>
      <Flex className={css.csvUploadWrapper}>
        <CsvUpload
          categories={imageryCategoryOptions}
          usageOptions={usageOptions}
          onSaveListing={onSave}
        ></CsvUpload>
      </Flex>
      <Table
        columns={editableColumns}
        components={EditableCellComponents}
        dataSource={listings}
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
        showSorterTooltip={false}
      ></Table>
    </div>
  );
};
