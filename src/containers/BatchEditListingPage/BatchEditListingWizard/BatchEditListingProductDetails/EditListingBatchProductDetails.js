import React, { useEffect, useState } from 'react';
import css from './EditListingBatchProductDetails.module.css';
import { Button, H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import { Checkbox, Flex, List, Modal, Progress, Space, Typography } from 'antd';
import {
  getAiTermsRequired,
  getInvalidListings,
  getListingCreationInProgress,
  getListingFieldsOptions,
  getListings,
  getSaveListingData,
  getSelectedRowsKeys,
  requestSaveBatchListings,
  requestUpdateListing,
  SAVE_LISTINGS_ABORTED,
  SET_AI_TERMS_ACCEPTED,
  SET_SELECTED_ROWS,
} from '../../BatchEditListingPage.duck';
import { useDispatch, useSelector } from 'react-redux';
import { EditableListingsTable } from './EditableListingsTable';
import useStickyHeader from '../useStickyHeader';
import {
  ExclamationCircleOutlined,
  FileExclamationOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { PAGE_MODE_NEW } from '../../constants';

const { Text, Paragraph } = Typography;

function ListingValidationModalContent({ invalidListings }) {
  return (
    <div className={css.modalContent}>
      <Paragraph>
        <FormattedMessage id="BatchEditListingProductDetails.validationModal.header"></FormattedMessage>
      </Paragraph>
      <Paragraph>
        <List
          dataSource={invalidListings}
          renderItem={item => (
            <List.Item>
              <Space size="middle">
                <FileExclamationOutlined /> {item}
              </Space>
            </List.Item>
          )}
        />
      </Paragraph>
      <Paragraph className={css.modalBottom}>
        <FormattedMessage id="BatchEditListingProductDetails.validationModal.content"></FormattedMessage>
      </Paragraph>
    </div>
  );
}

function AiTermsModalContent({ onTermsCheckboxChange }) {
  return (
    <div className={css.modalContent}>
      <Paragraph>
        <FormattedMessage id="BatchEditListingProductDetails.aiContentModal.content"></FormattedMessage>
      </Paragraph>
      <Paragraph className={css.modalBottom}>
        <Checkbox onChange={onTermsCheckboxChange}>
          <FormattedMessage id="BatchEditListingProductDetails.aiContentModal.optIn"></FormattedMessage>
        </Checkbox>
      </Paragraph>
    </div>
  );
}

export const EditListingBatchProductDetails = props => {
  const { cssRoot = css.root, loading = false, editMode = false } = props;
  const dispatch = useDispatch();

  const listings = useSelector(getListings);
  const listingFieldsOptions = useSelector(getListingFieldsOptions);
  const listingsCreationInProgress = useSelector(getListingCreationInProgress);
  const invalidListings = useSelector(getInvalidListings);
  const aiTermsRequired = useSelector(getAiTermsRequired);
  const selectedRowKeys = useSelector(getSelectedRowsKeys);
  const { failedListings, successfulListings, selectedRowsKeys } = useSelector(getSaveListingData);

  const [dataSource, setDataSource] = useState(listings);
  const [termsAcceptedCheckbox, setTermsAcceptedCheckbox] = useState(false); // Use state to track checkbox value
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showAiTermsModal, setShowAiTermsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const { mode } = useParams();

  const onTermsCheckboxChange = e => {
    setTermsAcceptedCheckbox(e.target.checked);
  };

  const onSelectChange = newSelectedRowKeys => {
    dispatch({ type: SET_SELECTED_ROWS, payload: newSelectedRowKeys });
  };

  const onSubmit = () => {
    dispatch(requestSaveBatchListings(mode));
  };

  const handleUpdateListing = updatedData => {
    dispatch(requestUpdateListing(updatedData));
  };

  const handleCancelValidationModal = () => {
    setShowValidationModal(false);
    dispatch({ type: SAVE_LISTINGS_ABORTED });
  };

  const handleCancelAiTermsModal = () => {
    setShowAiTermsModal(false);
    dispatch({ type: SAVE_LISTINGS_ABORTED });
  };

  const handleOkAiTermsModal = () => {
    if (termsAcceptedCheckbox) {
      dispatch({ type: SET_AI_TERMS_ACCEPTED });
      dispatch({ type: SAVE_LISTINGS_ABORTED });
      onSubmit();
    } else {
      dispatch({ type: SAVE_LISTINGS_ABORTED });
    }

    setShowAiTermsModal(false);
  };

  useEffect(() => {
    setDataSource(listings);
  }, [listings]);

  useEffect(() => {
    if (invalidListings.length > 0) {
      setShowValidationModal(listingsCreationInProgress);
      return;
    }

    if (aiTermsRequired && listings.some(listing => listing.isAi)) {
      setShowAiTermsModal(listingsCreationInProgress);
      return;
    }

    if (mode === PAGE_MODE_NEW) {
      setShowProgressModal(listingsCreationInProgress);
    }
  }, [
    invalidListings,
    aiTermsRequired,
    listingsCreationInProgress,
    failedListings,
    successfulListings,
    selectedRowsKeys,
  ]);

  useStickyHeader(css);

  const buttonTitleId = editMode
    ? 'BatchEditListingProductDetails.progressModal.submitButtonTextEditMode'
    : 'BatchEditListingProductDetails.progressModal.submitButtonText';

  return (
    <div className={cssRoot}>
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
            onClick={onSubmit}
            disabled={selectedRowKeys.length === 0 || listingsCreationInProgress}
          >
            <FormattedMessage id={buttonTitleId}></FormattedMessage>
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
          loading={loading || showProgressModal}
        ></EditableListingsTable>
      </div>

      <Modal
        title={
          <Space size="large">
            <Text type="danger">
              <ExclamationCircleOutlined />
            </Text>
            <FormattedMessage id="BatchEditListingProductDetails.validationModal.title"></FormattedMessage>
          </Space>
        }
        open={showValidationModal}
        onOk={handleCancelValidationModal}
        onCancel={handleCancelValidationModal}
        cancelButtonProps={{ hidden: true }}
        width={800}
      >
        <ListingValidationModalContent invalidListings={invalidListings} />
      </Modal>

      <Modal
        title={
          <Space size="large">
            <Text type="warning">
              <WarningOutlined />
            </Text>
            <FormattedMessage id="BatchEditListingProductDetails.aiContentModal.title"></FormattedMessage>
          </Space>
        }
        open={showAiTermsModal}
        onOk={handleOkAiTermsModal}
        onCancel={handleCancelAiTermsModal}
        okButtonProps={{ disabled: !termsAcceptedCheckbox }}
        width={800}
      >
        <AiTermsModalContent onTermsCheckboxChange={onTermsCheckboxChange} />
      </Modal>

      <Modal
        title="Creating listings"
        open={showProgressModal}
        footer={null}
        keyboard={false}
        closeIcon={null}
      >
        <H3>
          <FormattedMessage id="BatchEditListingProductDetails.progressModal.title"></FormattedMessage>
        </H3>
        <Paragraph>
          <Progress
            percent={(successfulListings.length / selectedRowsKeys.length) * 100}
            type="line"
            showInfo={false}
          />
        </Paragraph>
        {failedListings?.length > 0 && <Paragraph>{failedListings.length} files failed</Paragraph>}
      </Modal>
    </div>
  );
};
