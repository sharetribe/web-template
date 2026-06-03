import React from 'react';
import { useIntl } from '../../../../util/reactIntl';
import { AspectRatioWrapper } from '../../../../components';

import ListingImage from './ListingImage';
import css from './ImageSlot.module.css';

const ACCEPT_IMAGES = 'image/*';

const ImageSlot = props => {
  const {
    slotKey,
    label,
    image,
    onImageUpload,
    onRemoveImage,
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix,
    disabled,
    isRequired,
  } = props;
  const intl = useIntl();
  const inputId = `addImage_${slotKey}`;

  const handleChange = e => {
    const file = e.target.files[0];
    if (file) {
      onImageUpload(file, slotKey);
    }
  };

  const labelClass = isRequired ? css.required : css.slotLabel;

  if (image) {
    return (
      <div className={css.root}>
        <ListingImage
          image={image}
          className={css.thumbnail}
          savedImageAltText={intl.formatMessage({ id: 'EditListingPhotosForm.savedImageAltText' })}
          onRemoveImage={() => onRemoveImage(slotKey)}
          aspectWidth={aspectWidth}
          aspectHeight={aspectHeight}
          variantPrefix={variantPrefix}
        />
        <p className={labelClass}>{label}</p>
      </div>
    );
  }

  return (
    <div className={css.root}>
      <div className={css.slotWrapper}>
        <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
          {!disabled && (
            <input
              id={inputId}
              name={inputId}
              type="file"
              accept={ACCEPT_IMAGES}
              onChange={handleChange}
              className={css.fileInput}
            />
          )}
          <label htmlFor={inputId} className={css.uploadArea}>
            <svg
              className={css.cameraIcon}
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Camera body */}
              <path
                d="M8 22h6l4-6h28l4 6h6a2 2 0 012 2v28a2 2 0 01-2 2H8a2 2 0 01-2-2V24a2 2 0 012-2z"
                fill="currentColor"
                opacity="0.15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Lens */}
              <circle cx="32" cy="36" r="10" fill="white" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="32" cy="36" r="6" stroke="currentColor" strokeWidth="2" />
              {/* Plus sign */}
              <line
                x1="32"
                y1="8"
                x2="32"
                y2="16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="28"
                y1="12"
                x2="36"
                y2="12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className={css.uploadLabel}>{label}</span>
          </label>
        </AspectRatioWrapper>
      </div>
    </div>
  );
};

export default ImageSlot;
