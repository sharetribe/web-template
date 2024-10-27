import React, { useEffect, useState } from 'react';
import css from './EditListingBatchProductDetails.module.css';
import { Button, H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import { Checkbox, Flex, List, Modal } from 'antd';
import {
  CREATE_LISTINGS_ABORTED,
  getAiTermsRequired,
  getInvalidListings,
  getListingCreationInProgress,
  getListingFieldsOptions,
  getListings,
  getSelectedRowsKeys,
  requestSaveBatchListings,
  requestUpdateListing,
  SET_AI_TERMS_ACCEPTED,
  SET_SELECTED_ROWS,
} from '../../BatchEditListingPage.duck';
import { useDispatch, useSelector } from 'react-redux';
import { EditableListingsTable } from './EditableListingsTable';
import useStickyHeader from '../hooks/useStickyHeader';
import Paragraph from 'antd/es/typography/Paragraph';

function ListingValidationModalContent({ invalidListings }) {
  return (
    <div>
      <p>The following files have missing required information:</p>
      <List
        dataSource={invalidListings}
        size="small"
        renderItem={item => (
          <List.Item>
            <div>{item}</div>
          </List.Item>
        )}
      />
      <p>
        Please ensure all files have a valid category, title, description, and price before saving.
        You can either enter the missing information or deselect the invalid files to proceed.
      </p>
    </div>
  );
}

function AiTermsModalContent({ onTermsCheckboxChange }) {
  return (
    <div>
      <p>You are listing files marked as AI-generated content.</p>
      <p>
        To proceed with listing these products, you must comply with The Luupe's terms for
        AI-generated content.
      </p>
      <Checkbox onChange={onTermsCheckboxChange}>
        I have read and accept The Luupe's terms for listing AI-generated content.
      </Checkbox>
    </div>
  );
}

export const EditListingBatchProductDetails = () => {
  const dispatch = useDispatch();

  const listings = useSelector(getListings);
  const listingFieldsOptions = useSelector(getListingFieldsOptions);
  const listingsCreationInProgress = useSelector(getListingCreationInProgress);
  const invalidListings = useSelector(getInvalidListings);
  const aiTermsRequired = useSelector(getAiTermsRequired);
  const selectedRowKeys = useSelector(getSelectedRowsKeys);

  const [dataSource, setDataSource] = useState(listings);
  const [termsAcceptedCheckbox, setTermsAcceptedCheckbox] = useState(false); // Use state to track checkbox value
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showAiTermsModal, setShowAiTermsModal] = useState(false);

  const onTermsCheckboxChange = e => {
    setTermsAcceptedCheckbox(e.target.checked);
  };

  const onSelectChange = newSelectedRowKeys => {
    dispatch({ type: SET_SELECTED_ROWS, payload: newSelectedRowKeys });
  };

  const onSubmit = () => {
    dispatch(requestSaveBatchListings());
  };

  const handleUpdateListing = updatedData => {
    dispatch(requestUpdateListing(updatedData));
  };

  const handleCancelValidationModal = () => {
    setShowValidationModal(false);
    dispatch({ type: CREATE_LISTINGS_ABORTED });
  };

  const handleCancelAiTermsModal = () => {
    setShowAiTermsModal(false);
    dispatch({ type: CREATE_LISTINGS_ABORTED });
  };

  const handleOkAiTermsModal = () => {
    if (termsAcceptedCheckbox) {
      dispatch({ type: SET_AI_TERMS_ACCEPTED });
      setShowAiTermsModal(false);
      onSubmit();
    } else {
      setShowAiTermsModal(false);
      dispatch({ type: CREATE_LISTINGS_ABORTED });
    }
  };

  useEffect(() => {
    setDataSource(listings);
  }, [listings]);

  useEffect(() => {
    if (listingsCreationInProgress && invalidListings.length > 0) {
      setShowValidationModal(true);
    }
  }, [invalidListings, listingsCreationInProgress]);

  useEffect(() => {
    if (listingsCreationInProgress && aiTermsRequired && listings.some(listing => listing.isAi)) {
      setShowAiTermsModal(true);
    }
  }, [aiTermsRequired, listingsCreationInProgress]);

  useStickyHeader(css);

  return (
    <div className={css.root}>
      <Flex className={css.stickyHeader}>
        <Flex vertical>
          <H3 as="h1">
            <FormattedMessage id="BatchEditListingProductDetails.title" />
          </H3>

          <Flex className={css.subTitle} vertical>
            <Paragraph>
              <FormattedMessage id="BatchEditListingProductDetails.subtitle" />
            </Paragraph>
            <Paragraph>
              <FormattedMessage id="BatchEditListingProductDetails.warningRefresh" />
            </Paragraph>
          </Flex>
        </Flex>
        <Flex className={css.buttonWrapper}>
          <Button
            className={css.submitButton}
            type="button"
            inProgress={listingsCreationInProgress}
            onClick={onSubmit}
            disabled={selectedRowKeys.length === 0 || listingsCreationInProgress}
          >
            Submit for Review
          </Button>
        </Flex>
      </Flex>

      <div>
        <EditableListingsTable
          dataSource={dataSource}
          onSave={handleUpdateListing}
          listingFieldsOptions={listingFieldsOptions}
          onSelectChange={onSelectChange}
          selectedRowKeys={selectedRowKeys}
        ></EditableListingsTable>
      </div>

      <Modal
        title="Incomplete Information for Selected Files"
        open={showValidationModal}
        onOk={handleCancelValidationModal}
        onCancel={handleCancelValidationModal}
        cancelButtonProps={{ hidden: true }}
      >
        <ListingValidationModalContent invalidListings={invalidListings} />
      </Modal>

      <Modal
        title="AI Content Listing Compliance"
        open={showAiTermsModal}
        onOk={handleOkAiTermsModal}
        onCancel={handleCancelAiTermsModal}
        okButtonProps={{ disabled: !termsAcceptedCheckbox }}
      >
        <AiTermsModalContent onTermsCheckboxChange={onTermsCheckboxChange} />
      </Modal>
    </div>
  );
};
