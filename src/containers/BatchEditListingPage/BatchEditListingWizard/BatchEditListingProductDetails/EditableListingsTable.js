import imagePlaceholder from '../../../../assets/image-placeholder.jpg';
import { Flex, Image, Table } from 'antd';
import { MAX_CATEGORIES, MAX_KEYWORDS } from '../../constants';
import css from './EditListingBatchProductDetails.module.css';
import React from 'react';
import { NamedLink } from '../../../../components';
import { EditableCellComponents, getPricingGuideLink } from './EditableCellComponents';
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

export const getLicensingGuideLink = () => (
  <NamedLink name="CMSPage" params={{ pageId: 'licensing-guide' }}>
    Learn More.
  </NamedLink>
);

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

  const licensingGuideLink = getLicensingGuideLink();
  const pricingGuideLink = getPricingGuideLink();
  const titleHelperText = intl.formatMessage({ id: 'EditableListingsTable.title.helperText' });
  const descriptionHelperText = intl.formatMessage({
    id: 'EditableListingsTable.description.helperText',
  });
  const isAiHelperText = intl.formatMessage({ id: 'EditableListingsTable.isAi.helperText' });
  const isIllustrationHelperText = intl.formatMessage({
    id: 'EditableListingsTable.isIllustration.helperText',
  });
  const categoryHelperText = intl.formatMessage(
    { id: 'EditableListingsTable.category.helperText' },
    { maxCategories: MAX_CATEGORIES }
  );
  const usageHelperText = intl.formatMessage(
    { id: 'EditableListingsTable.usage.helperText' },
    { learnMore: licensingGuideLink }
  );
  const releasesHelperText = intl.formatMessage(
    { id: 'EditableListingsTable.releases.helperText' },
    { learnMore: licensingGuideLink }
  );
  const keywordsHelperText = intl.formatMessage(
    { id: 'EditableListingsTable.keywords.helperText' },
    { maxKeywords: MAX_KEYWORDS }
  );
  const priceHelperText = intl.formatMessage(
    { id: 'EditableListingsTable.price.helperText' },
    { pricingGuide: pricingGuideLink }
  );

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
        <TableHeaderTitle helperText={titleHelperText}>
          <FormattedMessage id="EditableListingsTable.title" defaultMessage="Title" />
        </TableHeaderTitle>
      ),
      width: 400,
      dataIndex: 'title',
      editable: true,
      editControlType: 'text',
      sorter: stringSorter,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.title.placeholder',
        defaultMessage: 'The listing title',
      }),
    },
    {
      title: (
        <TableHeaderTitle helperText={descriptionHelperText}>
          <FormattedMessage id="EditableListingsTable.description" defaultMessage="Description" />
        </TableHeaderTitle>
      ),
      dataIndex: 'description',
      width: 300,
      editable: true,
      editControlType: 'textarea',
      sorter: stringSorter,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.description.placeholder',
        defaultMessage: 'The listing description',
      }),
    },
    // [TODO:] Disabled for the time being
    // {
    //   title: (
    //     <TableHeaderTitle helperText={isAiHelperText}>
    //       <FormattedMessage id="EditableListingsTable.isAi" defaultMessage="Is AI" />
    //     </TableHeaderTitle>
    //   ),
    //   dataIndex: 'isAi',
    //   width: 150,
    //   editable: true,
    //   editControlType: 'switch',
    //   onBeforeSave: record => ({
    //     ...record,
    //     isIllustration: record.isAi,
    //   }),
    // },
    {
      title: (
        <TableHeaderTitle helperText={isIllustrationHelperText}>
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
        <TableHeaderTitle helperText={categoryHelperText}>
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
        id: 'EditableListingsTable.category.placeholder',
        defaultMessage: 'Up to 5 categories',
      }),
    },
    {
      title: (
        <TableHeaderTitle helperText={usageHelperText}>
          <FormattedMessage id="EditableListingsTable.usage" defaultMessage="Usage" />
        </TableHeaderTitle>
      ),
      width: 200,
      dataIndex: 'usage',
      editable: true,
      editControlType: 'select',
      options: usageOptions,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.usage.placeholder',
        defaultMessage: 'Select the usage',
      }),
    },
    {
      title: (
        <TableHeaderTitle helperText={releasesHelperText}>
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
        <TableHeaderTitle helperText={keywordsHelperText}>
          <FormattedMessage id="EditableListingsTable.keywords" defaultMessage="Keywords" />
        </TableHeaderTitle>
      ),
      width: 400,
      dataIndex: 'keywords',
      editable: true,
      editControlType: 'tags',
      maxSelection: MAX_KEYWORDS,
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.keywords.placeholder',
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
        <TableHeaderTitle helperText={priceHelperText}>
          <FormattedMessage id="EditableListingsTable.price" defaultMessage="Price" />
        </TableHeaderTitle>
      ),
      dataIndex: 'price',
      width: 200,
      editable: true,
      editControlType: 'money',
      placeholder: intl.formatMessage({
        id: 'EditableListingsTable.price.placeholder',
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
