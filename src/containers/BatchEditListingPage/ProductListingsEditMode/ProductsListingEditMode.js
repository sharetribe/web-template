import css from '../BatchEditListingPage.module.css';
import { EditListingBatchProductDetails } from '../BatchEditListingWizard/BatchEditListingProductDetails/EditListingBatchProductDetails';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getCreateListingsSuccess,
  getIsQueryInProgress,
  getSaveListingData,
  SAVE_LISTINGS_ABORTED,
} from '../BatchEditListingPage.duck';
import { message } from 'antd';

export const ProductsListingEditMode = () => {
  const isQueryLoading = useSelector(getIsQueryInProgress);
  const { failedListings, saveListingsInProgress } = useSelector(getSaveListingData);
  const publishListingsSuccess = useSelector(getCreateListingsSuccess);
  const hasErrors = failedListings.length > 0;
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = isSuccess => {
    void messageApi.open({
      type: isSuccess ? 'success' : 'error',
      content: isSuccess
        ? 'All listings were saved successfully'
        : 'Some listings failed to save. Please try again.',
    });
  };

  useEffect(() => {
    if (publishListingsSuccess || hasErrors) {
      showMessage(publishListingsSuccess);
      dispatch({ type: SAVE_LISTINGS_ABORTED });
    }
  }, [publishListingsSuccess, hasErrors, dispatch, messageApi]);

  return (
    <>
      {contextHolder}
      <div className={css.editRoot}>
        <EditListingBatchProductDetails
          cssRoot={css.listingDetails}
          loading={isQueryLoading || saveListingsInProgress}
          editMode
        />
      </div>
    </>
  );
};
