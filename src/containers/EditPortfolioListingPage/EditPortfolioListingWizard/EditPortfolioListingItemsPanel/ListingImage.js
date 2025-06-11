import React, { useState } from 'react';
import { func, object, string } from 'prop-types';
import classNames from 'classnames';
import {
  AspectRatioWrapper,
  IconSpinner,
  ImageFromFile,
  ResponsiveImage,
} from '../../../../components';

import css from './ListingImage.module.css';
import { Popconfirm } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

export const RemoveImageButton = props => {
  const { className, rootClassName, onClick, confirmTitle, confirmMessage } = props;
  const classes = classNames(rootClassName || css.removeImage, className);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = e => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
  };

  return (
    <Popconfirm
      open={confirmOpen}
      title={confirmTitle}
      description={confirmMessage}
      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
      onConfirm={handleConfirm}
      onCancel={() => setConfirmOpen(false)}
    >
      <button
        className={classes}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          setConfirmOpen(true);
        }}
      >
        <svg
          width="10px"
          height="10px"
          viewBox="0 0 10 10"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g strokeWidth="1" fillRule="evenodd">
            <g transform="translate(-821.000000, -311.000000)">
              <g transform="translate(809.000000, 299.000000)">
                <path
                  d="M21.5833333,16.5833333 L17.4166667,16.5833333 L17.4166667,12.4170833 C17.4166667,12.1866667 17.2391667,12 17.00875,12 C16.77875,12 16.5920833,12.18625 16.5920833,12.41625 L16.5883333,16.5833333 L12.4166667,16.5833333 C12.18625,16.5833333 12,16.7695833 12,17 C12,17.23 12.18625,17.4166667 12.4166667,17.4166667 L16.5875,17.4166667 L16.5833333,21.5829167 C16.5829167,21.8129167 16.7691667,21.9995833 16.9991667,22 L16.9995833,22 C17.2295833,22 17.41625,21.81375 17.4166667,21.58375 L17.4166667,17.4166667 L21.5833333,17.4166667 C21.8133333,17.4166667 22,17.23 22,17 C22,16.7695833 21.8133333,16.5833333 21.5833333,16.5833333"
                  transform="translate(17.000000, 17.000000) rotate(-45.000000) translate(-17.000000, -17.000000) "
                />
              </g>
            </g>
          </g>
        </svg>
      </button>
    </Popconfirm>
  );
};

const ListingImage = props => {
  const {
    className,
    image,
    savedImageAltText,
    onRemoveImage,
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = props;

  if (image.file && !image.attributes) {
    const removeButton =
      image.imageId && onRemoveImage ? (
        <RemoveImageButton
          onClick={onRemoveImage}
          confirmTitle="Delete Image?"
          confirmMessage="This action cannot be undone."
        />
      ) : null;

    const uploadingOverlay = !image.imageId ? (
      <div className={css.thumbnailLoading}>
        <IconSpinner />
      </div>
    ) : null;

    return (
      <ImageFromFile
        id={image.id}
        className={className}
        file={image.file}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
      >
        {removeButton}
        {uploadingOverlay}
      </ImageFromFile>
    );
  } else {
    const classes = classNames(css.root, className);

    const variants = image?.attributes?.variants
      ? Object.keys(image?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
      : [];
    const imgForResponsiveImage = image.imageId ? { ...image, id: image.imageId } : image;

    // This is shown when image is uploaded,
    // but the new responsive image is not yet downloaded by the browser.
    // This is absolutely positioned behind the actual image.
    const fallbackWhileDownloading = image.file ? (
      <ImageFromFile
        id={image.id}
        className={css.fallbackWhileDownloading}
        file={image.file}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
      >
        <div className={css.thumbnailLoading}>
          <IconSpinner />
        </div>
      </ImageFromFile>
    ) : null;

    return (
      <div className={classes}>
        <div className={css.wrapper}>
          {fallbackWhileDownloading}
          <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
            <ResponsiveImage
              rootClassName={css.rootForImage}
              image={imgForResponsiveImage}
              alt={savedImageAltText}
              variants={variants}
            />
          </AspectRatioWrapper>
          {onRemoveImage && (
            <RemoveImageButton
              onClick={onRemoveImage}
              confirmTitle="Delete Image?"
              confirmMessage="This action cannot be undone."
            />
          )}
        </div>
      </div>
    );
  }
};

ListingImage.propTypes = {
  className: string,
  image: object.isRequired,
  savedImageAltText: string.isRequired,
  onRemoveImage: func,
};

export default ListingImage;
