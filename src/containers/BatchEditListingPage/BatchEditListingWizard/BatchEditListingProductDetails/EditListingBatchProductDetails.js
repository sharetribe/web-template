import React, { useEffect, useState } from 'react';
import css from './EditListingBatchProductDetails.module.css';
import { Button, H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import { Checkbox, Flex, List, Modal } from 'antd';
import {
  getAiTermsModalVisibility,
  getInvalidListings,
  getListingFieldsOptions,
  getListings,
  SET_AI_TERMS_ACCEPTED,
} from '../../BatchEditListingPage.duck';
import { useDispatch, useSelector } from 'react-redux';
import { EditableListingsTable } from './EditableListingsTable';

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

export const EditListingBatchProductDetails = props => {
  const { onUpdateFileDetails, onSaveBatchListing } = props;
  const listings = useSelector(getListings);
  const listingFieldsOptions = useSelector(getListingFieldsOptions);

  const [dataSource, setDataSource] = useState(listings);

  const invalidListings = useSelector(getInvalidListings);
  const dispatch = useDispatch();
  const showAiTermsModal = useSelector(getAiTermsModalVisibility);

  const [termsAcceptedCheckbox, setTermsAcceptedCheckbox] = useState(false);
  const onTermsCheckboxChange = e => {
    setTermsAcceptedCheckbox(e.target.checked);
  };

  useEffect(() => {
    setDataSource(listings);
  }, [listings]);

  const onSubmit = () => {
    onSaveBatchListing();
  };

  useEffect(() => {
    if (invalidListings.length > 0) {
      Modal.error({
        title: 'Incomplete Information for Selected Files',
        content: <ListingValidationModalContent invalidListings={invalidListings} />,
      });
    }
  }, [invalidListings, dispatch]);

  useEffect(() => {
    if (showAiTermsModal) {
      Modal.warning({
        title: 'AI Content Listing Compliance',
        content: <AiTermsModalContent onTermsCheckboxChange={onTermsCheckboxChange} />,
        onOk() {
          dispatch({ type: SET_AI_TERMS_ACCEPTED, payload: termsAcceptedCheckbox });
          if (termsAcceptedCheckbox) {
            onSaveBatchListing();
          }
        },
        onCancel() {
          dispatch({ type: SET_AI_TERMS_ACCEPTED, payload: false });
        },
      });
    }
  }, [showAiTermsModal, dispatch]);

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
        <EditableListingsTable
          dataSource={dataSource}
          onSave={onUpdateFileDetails}
          listingFieldsOptions={listingFieldsOptions}
        ></EditableListingsTable>
      </div>
    </div>
  );
};
