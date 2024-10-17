import React, { useEffect, useState } from 'react';
import css from './EditListingBatchProductDetails.module.css';
import { Button, H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import { Flex, Switch, Table } from 'antd';
import { EditableCellComponents } from './EditableCellComponents';
import { imageDimensions } from '../../BatchEditListingPage.duck';
import imagePlaceholder from '../../../../assets/image-placeholder.jpg';

function stringSorter(strA, strB) {
  return strA.name.localeCompare(strB.name, 'en', { sensitivity: 'base' });
}

export const EditListingBatchProductDetails = props => {
  const { files, listingFieldsOptions, onUpdateFileDetails, onSaveBatchListing } = props;

  const {
    categories: imageryCategoryOptions,
    usages: usageOptions,
    releases: releaseOptions,
  } = listingFieldsOptions;

  const [dataSource, setDataSource] = useState(files);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    setDataSource(files);
  }, [files]);

  const columns = [
    {
      title: 'Thumbnail',
      dataIndex: 'preview',
      render: previewUrl => <img alt="Thumbnail" src={previewUrl || imagePlaceholder} />,
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
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const onSubmit = () => {
    console.log('Submit for review', dataSource);
    
    onSaveBatchListing();
  };

  const handleSave = updatedData => {
    onUpdateFileDetails(updatedData);
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
