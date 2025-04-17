import React from 'react';
import { useIntl } from 'react-intl';
import { Button, message, Space, Tooltip, Upload } from 'antd';
import Papa from 'papaparse';
import { DownloadOutlined, InfoCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  CSV_UPLOAD_ERROR,
  CSV_UPLOAD_REQUEST,
  CSV_UPLOAD_SUCCESS,
  getListings,
} from '../../BatchEditListingPage.duck';
import {
  getCsvFieldValue,
  normalizeBoolean,
  normalizeCategory,
  normalizeUsage,
} from './CsvParsingHelpers';
import css from './CsvUpload.module.css';

export const CsvUpload = ({ categories, usageOptions, onSaveListing }) => {
  const listings = useSelector(getListings);
  const dispatch = useDispatch();
  const intl = useIntl();
  const csvUploadTooltip = intl.formatMessage({
    id: 'CsvUpload.tooltip',
  });
  const beforeUpload = file => {
    const isCsv = file.type === 'text/csv';
    if (!isCsv) {
      void message.error('You can only upload CSV files!');
    }
    return isCsv || Upload.LIST_IGNORE;
  };

  const handleCsvFile = request => {
    const { file } = request;
    dispatch({ type: CSV_UPLOAD_REQUEST });

    // noinspection JSUnresolvedReference
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => {
        processCsvData(result.data, result.meta.fields);
        dispatch({ type: CSV_UPLOAD_SUCCESS });
      },
      error: error => {
        message.error(`Error parsing CSV: ${error.message}`);
        dispatch({ type: CSV_UPLOAD_ERROR, payload: error });
      },
    });
    return false;
  };

  const processCsvData = (data, headers) => {
    if (!data.length) {
      message.warning('CSV file is empty or invalid.');
      return;
    }

    // Build a lookup map for quick matching
    const listingsMap = new Map(listings.map(listing => [listing.name, listing]));

    const updatedListings = [];

    data.forEach(row => {
      const fallbackRow = Object.values(row); // Convert row to an array for positional access
      const fileName = getCsvFieldValue(row, headers, 'fileName', fallbackRow);

      if (fileName) {
        const listing = listingsMap.get(fileName.trim());
        if (listing) {
          updatedListings.push({
            ...listing,
            title: getCsvFieldValue(row, headers, 'title', fallbackRow) || listing.title,
            description:
              getCsvFieldValue(row, headers, 'description', fallbackRow) || listing.description,
            isIllustration: normalizeBoolean(
              getCsvFieldValue(row, headers, 'isIllustration', fallbackRow),
              listing.isIllustration
            ),
            category: normalizeCategory(
              getCsvFieldValue(row, headers, 'category', fallbackRow),
              categories,
              listing.category
            ),
            usage:
              normalizeUsage(getCsvFieldValue(row, headers, 'usage', fallbackRow), usageOptions) ||
              listing.usage,
            releases: normalizeBoolean(
              getCsvFieldValue(row, headers, 'released', fallbackRow),
              listing.releases === 'yes'
            )
              ? 'yes'
              : 'no',
            keywords: getCsvFieldValue(row, headers, 'keywords', fallbackRow)
              ? getCsvFieldValue(row, headers, 'keywords', fallbackRow)
                  .split(',')
                  .map(keyword => keyword.trim())
              : listing.keywords,
            price: getCsvFieldValue(row, headers, 'price', fallbackRow)
              ? parseFloat(getCsvFieldValue(row, headers, 'price', fallbackRow))
              : listing.price,
          });
        }
      }
    });

    updatedListings.forEach(listing => onSaveListing(listing));

    void message.success('CSV processed successfully!');
  };

  return (
    <Space size="middle">
      <Button
        type="link"
        target="_blank"
        href="https://docs.google.com/spreadsheets/d/1dTP5t2BMBMeHL3J4ipuCZeSYafAPSXysGPu6OHpDSyI/edit?usp=drive_link"
        className={css.downloadLink}
      >
        <DownloadOutlined /> Use Template
      </Button>

      <Upload
        accept=".csv"
        beforeUpload={beforeUpload}
        customRequest={request => handleCsvFile(request)} // Custom handling
        maxCount={1}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />}>Upload CSV</Button>
      </Upload>
      <Tooltip title={csvUploadTooltip}>
        <InfoCircleOutlined />
      </Tooltip>
    </Space>
  );
};
