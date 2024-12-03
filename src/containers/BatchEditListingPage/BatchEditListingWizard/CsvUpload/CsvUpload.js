import React from 'react';
import { Button, message, Upload } from 'antd';
import Papa from 'papaparse';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  CSV_UPLOAD_ERROR,
  CSV_UPLOAD_REQUEST,
  CSV_UPLOAD_SUCCESS,
  getListings,
} from '../../BatchEditListingPage.duck';
import { normalizeBoolean, normalizeCategory, normalizeUsage } from './CsvParsingHelpers';

export const CsvUpload = props => {
  const { categories, usageOptions, onSaveListing } = props;
  const listings = useSelector(getListings);
  const dispatch = useDispatch();
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

    Papa.parse(file, {
      header: true,
      complete: result => {
        handleCsvData(result.data);
        dispatch({ type: CSV_UPLOAD_SUCCESS });
      },
      error: error => {
        message.error(`Error parsing CSV: ${error.message}`);
        dispatch({ type: CSV_UPLOAD_ERROR, payload: error });
      },
    });
    return false;
  };

  const handleCsvData = data => {
    const updatedListings = listings.map(listing => {
      const csvRow = data.find(row => row['File Name'] === listing.name);

      if (csvRow) {
        return {
          ...listing,
          title: csvRow['Title'] || listing.title,
          description: csvRow['Description'] || listing.description,
          isAi: normalizeBoolean(csvRow['Is AI'], listing.isAi),
          isIllustration: normalizeBoolean(csvRow['Is Illustration'], listing.isIllustration),
          category: csvRow['Category']
            ? normalizeCategory(csvRow['Category'], categories, listing.category)
            : listing.category,
          usage: csvRow['Usage'] ? normalizeUsage(csvRow['Usage'], usageOptions) : listing.usage,
          releases: normalizeBoolean(csvRow['Release'], listing.releases === 'yes') ? 'yes' : 'no',
          keywords: csvRow['Keywords']
            ? csvRow['Keywords'].split(',').map(keyword => keyword.trim())
            : listing.keywords,
          price: csvRow['Price'] ? parseFloat(csvRow['Price']) : listing.price,
        };
      }

      return listing;
    });

    updatedListings.forEach(listing => {
      onSaveListing(listing);
    });

    void message.success('CSV processed successfully!');
  };

  return (
    <Upload
      accept=".csv"
      beforeUpload={beforeUpload}
      customRequest={request => handleCsvFile(request)} // Custom handling
      maxCount={1}
      showUploadList={false}
    >
      <Button icon={<UploadOutlined />}>Upload CSV</Button>
    </Upload>
  );
};
