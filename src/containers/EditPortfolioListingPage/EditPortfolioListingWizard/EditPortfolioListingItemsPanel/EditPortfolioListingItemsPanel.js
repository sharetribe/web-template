import { H3 } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import React from 'react';
import classNames from 'classnames';
import css from './EditPortfolioListingItemsPanel.module.css';
import EditPortfolioListingFilesForm from './EditPortfolioListingFilesForm';
import { removeUploadedMedia, uploadMedia } from '../../EditPortfolioListingPage.duck';
import { useDispatch, useSelector } from 'react-redux';
import { Skeleton } from 'antd';

export const EditPortfolioListingItemsPanel = ({
  className,
  config,
  onPublishListing,
  isLoading,
}) => {
  const dispatch = useDispatch();
  const uploadedMedia = useSelector(state => state.EditPortfolioListingPage.uploadedMedia);
  const panelUpdated = useSelector(state => state.EditPortfolioListingPage.updated);

  const handleUpload = file => {
    dispatch(uploadMedia(file));
  };

  const handleRemove = mediaId => {
    dispatch(removeUploadedMedia(mediaId));
  };

  return (
    <div className={classNames(css.root, className)}>
      <H3 as="h1">
        <FormattedMessage
          id="EditPortfolioListingItemsPanel.title"
          defaultMessage="Portfolio Items"
        />
      </H3>

      {isLoading ? (
        <Skeleton.Node active style={{ width: 460, height: 460 }} />
      ) : (
        <EditPortfolioListingFilesForm
          className={css.form}
          fetchErrors={[]}
          initialValues={{ images: uploadedMedia }}
          onImageUpload={handleUpload}
          onRemoveImage={handleRemove}
          updated={panelUpdated}
          config={config}
          onPublishListing={onPublishListing}
        />
      )}
    </div>
  );
};
