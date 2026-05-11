import React, { useRef } from 'react';

import { FormattedMessage, useIntl } from '../../../../util/reactIntl';

import ListingImage from '../EditListingPhotosPanel/ListingImage';

import css from './PhotoGallerySection.module.css';

const MAX_IMAGES = 100;

/**
 * Free-form photo gallery section for the Details panel.
 * Renders current images as thumbnails with remove buttons,
 * plus an "Add" button. No React Final Form — upload/remove
 * are fired immediately via callbacks.
 *
 * @param {Object} props
 * @param {Array} props.images - Renderable image objects from Redux
 * @param {Function} props.onImageUpload - (data, listingImageConfig) => void
 * @param {Function} props.onRemoveImage - (imageId) => void
 * @param {Object|null} props.uploadImageError - API error from last upload attempt
 * @param {Object} props.listingImageConfig - { aspectWidth, aspectHeight, variantPrefix }
 * @param {string|null} props.photoError - intl key for validation error set by panel
 */
const PhotoGallerySection = props => {
  const {
    images = [],
    onImageUpload,
    onRemoveImage,
    uploadImageError,
    listingImageConfig,
    photoError,
  } = props;

  const intl = useIntl();
  const fileInputRef = useRef(null);

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = listingImageConfig || {};

  const isMaxReached = images.length >= MAX_IMAGES;

  const handleFileChange = e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      onImageUpload({ id: `${file.name}_${Date.now()}`, file }, listingImageConfig);
    });
    e.target.value = '';
  };

  const savedImageAltText = intl.formatMessage({
    id: 'EditListingPhotosForm.savedImageAltText',
  });

  return (
    <div className={css.root}>
      <h3 className={css.title}>
        <FormattedMessage id="EditListingDetailsPanel.photosTitle" />
      </h3>

      <div className={css.imageGrid}>
        {images.map(image => (
          <div key={image.id} className={css.imageWrapper}>
            <ListingImage
              image={image}
              savedImageAltText={savedImageAltText}
              onRemoveImage={onRemoveImage}
              aspectWidth={aspectWidth}
              aspectHeight={aspectHeight}
              variantPrefix={variantPrefix}
            />
          </div>
        ))}

        {!isMaxReached && (
          <div className={css.addImageWrapper}>
            <label className={css.addImageLabel} htmlFor="gallery-add-image">
              <span className={css.addImageIcon}>+</span>
            </label>
            <input
              ref={fileInputRef}
              id="gallery-add-image"
              className={css.fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {photoError && (
        <p className={css.error}>
          <FormattedMessage id={photoError} />
        </p>
      )}

      {uploadImageError && !photoError && (
        <p className={css.error}>
          <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
        </p>
      )}

      <p className={css.tip}>
        <FormattedMessage
          id={
            isMaxReached
              ? 'EditListingDetailsPanel.photosMaxReached'
              : 'EditListingDetailsPanel.photosAddTip'
          }
        />
      </p>
    </div>
  );
};

export default PhotoGallerySection;
