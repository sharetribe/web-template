import React, { useState } from 'react';
import css from './EditListingBatchProductDetails.module.css';
import { Button, H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import { Flex, Switch, Table } from 'antd';
import { EditableCellComponents } from './EditableCellComponents';

const SMALL_IMAGE = 'small';
const MEDIUM_IMAGE = 'medium';
const LARGE_IMAGE = 'large';

const imageDimensions = {
  [SMALL_IMAGE]: {
    value: 'small-image',
    maxDimension: 1000,
    label: 'Small (< 1,000px)',
  },
  [MEDIUM_IMAGE]: {
    value: 'medium-image',
    maxDimension: 2000,
    label: 'Medium (1,000px-2,000px)',
  },
  [LARGE_IMAGE]: {
    value: 'large-image',
    maxDimension: 2001,
    label: 'Large (>2,000px)',
  },
};

function getListingFieldOptions(config, listingFieldKey) {
  const { listing } = config;
  const { listingFields } = listing;
  const { enumOptions } = listingFields.find(f => f.key === listingFieldKey);
  return enumOptions.map(({ label, option }) => ({ value: option, label }));
}

function getDimensions(width, height) {
  const largestDimension = Math.max(width, height);
  if (largestDimension <= imageDimensions.small.maxSize) {
    return SMALL_IMAGE;
  }
  if (largestDimension <= imageDimensions.medium.maxSize) {
    return MEDIUM_IMAGE;
  }
  return LARGE_IMAGE;
}

function getData(uppy) {
  const uppyFiles = uppy.getFiles();
  return uppyFiles.map((file, index) => {
    const { id, meta, name, size, preview } = file;
    const { keywords, height, width } = meta;
    const dimensions = getDimensions(width, height);

    let keywordsOptions = [];
    if (keywords) {
      keywordsOptions = Array.isArray(keywords) ? keywords : keywords.split(',');
    }

    return {
      key: id,
      id,
      name,
      title: name,
      description: '-',
      keywords: keywordsOptions,
      size,
      preview,
      category: [],
      usage: 'editorial',
      releases: 'no-release',
      price: 0,
      dimensions: dimensions,
      isAi: false,
      isIllustration: false,
    };
  });
}

function stringSorter(strA, strB) {
  const a = strA.name.toUpperCase(); // ignore upper and lowercase
  const b = strB.name.toUpperCase(); // ignore upper and lowercase
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }

  return 0;
}

export const EditListingBatchProductDetails = props => {
  const { uppy, config } = props;

  const imageryCategoryOptions = getListingFieldOptions(config, 'imageryCategory');
  const usageOptions = getListingFieldOptions(config, 'usage');
  const releaseOptions = getListingFieldOptions(config, 'releases');

  const [dataSource, setDataSource] = useState(getData(uppy));
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const columns = [
    {
      title: 'Thumbnail',
      dataIndex: 'preview',
      render: text => <img alt="Thumbnail" src={text} />,
      fixed: 'left',
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
      editable: true,
      editControlType: 'text',
      sorter: stringSorter,
    },
    {
      title: 'Is AI',
      dataIndex: 'isAi',
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
      render: dimensionsKey => {
        return imageDimensions[dimensionsKey].label;
      },
      sorter: stringSorter,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      render: size => `${(size / 1024).toFixed(2)} KB`,
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: 'Price',
      dataIndex: 'price',
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

  const onSelectChange = newSelectedRowKeys => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const onSubmit = () => {
    console.log('Submit for review', dataSource);
  };

  const handleSave = row => {
    const newData = [...dataSource];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    setDataSource(newData);
  };

  return (
    <div className={css.root}>
      <Flex gap="middle">
        <Flex>
          <H3 as="h1">
            <FormattedMessage id="BatchEditListingProductDetails.title" />
            <p>
              <FormattedMessage id="BatchEditListingProductDetails.subtitle" />
            </p>
            <p>
              <FormattedMessage id="BatchEditListingProductDetails.warningRefresh" />
            </p>
          </H3>
        </Flex>

        <Flex style={{ alignSelf: 'flex-start', marginTop: 35 }}>
          <Button className={css.submitButton} type="button" inProgress={false} onClick={onSubmit}>
            Submit for Review
          </Button>
        </Flex>
      </Flex>
      <div style={{ marginTop: '20px' }}>
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
          className={css.productsTable}
          rowSelection={rowSelection}
        />
      </div>
    </div>
  );
};
