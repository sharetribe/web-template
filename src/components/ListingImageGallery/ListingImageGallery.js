import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactImageGallery from 'react-image-gallery';

import 'react-image-gallery/styles/css/image-gallery.css';

import { propTypes } from '../../util/types';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { Button, IconClose, ResponsiveImage } from '../../components';

import css from './ListingImageGallery.module.css';

const IMAGE_GALLERY_OPTIONS = {
  showPlayButton: false,
  disableThumbnailScroll: true,
};

const ListingImageGallery = props => {
  const { intl, images, imageVariants, thumbnailVariants } = props;
  const items = images.map((img, i) => {
    return {
      // We will only use the image resource, but react-image-gallery
      // requires the `original` key from each item.
      original: '',
      alt: intl.formatMessage(
        { id: 'ListingImageGallery.imageAltText' },
        { index: i + 1, count: images.length }
      ),
      thumbAlt: intl.formatMessage(
        { id: 'ListingImageGallery.imageThumbnailAltText' },
        { index: i + 1, count: images.length }
      ),
      image: img,
    };
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const renderItem = item => {
    return (
      <div className={isFullscreen ? css.itemWrapperFullscreen : css.itemWrapper}>
        <ResponsiveImage
          rootClassName={css.item}
          image={item.image}
          alt={item.alt}
          variants={imageVariants}
        />
      </div>
    );
  };
  const renderThumbInner = item => {
    return (
      <div>
        <ResponsiveImage
          rootClassName={css.thumb}
          image={item.image}
          alt={item.thumbAlt}
          variants={thumbnailVariants}
        />
      </div>
    );
  };

  const onScreenChange = isFull => {
    setIsFullscreen(isFull);
  };

  const renderLeftNav = (onClick, disabled) => {
    return <button className={css.navLeft} disabled={disabled} onClick={onClick} />;
  };
  const renderRightNav = (onClick, disabled) => {
    return <button className={css.navRight} disabled={disabled} onClick={onClick} />;
  };
  const renderFullscreenButton = (onClick, isFullscreen) => {
    return isFullscreen ? (
      <Button
        onClick={onClick}
        rootClassName={css.close}
        title={intl.formatMessage({ id: 'ListingImageGallery.closeModalTitle' })}
      >
        <span className={css.closeText}>
          <FormattedMessage id="ListingImageGallery.closeModal" />
        </span>
        <IconClose rootClassName={css.closeIcon} />
      </Button>
    ) : (
      <button className={css.openFullscreen} onClick={onClick}>
        <FormattedMessage
          id="ListingImageGallery.viewImagesButton"
          values={{ count: images.length }}
        />
      </button>
    );
  };

  if (items.length === 0) {
    return <ResponsiveImage className={css.noImage} image={null} variants={[]} alt="" />;
  }

  return (
    <ReactImageGallery
      items={items}
      renderItem={renderItem}
      renderThumbInner={renderThumbInner}
      onScreenChange={onScreenChange}
      renderLeftNav={renderLeftNav}
      renderRightNav={renderRightNav}
      renderFullscreenButton={renderFullscreenButton}
      {...IMAGE_GALLERY_OPTIONS}
    />
  );
};

ListingImageGallery.defaultProps = {
  rootClassName: null,
  className: null,
  imageVariants: ['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge'],
  thumbnailVariants: ['scaled-small', 'scaled-medium'],
};

const { string, arrayOf } = PropTypes;

ListingImageGallery.propTypes = {
  rootClassName: string,
  className: string,
  images: arrayOf(propTypes.image).isRequired,
  imageVariants: arrayOf(string),
  thumbnailVariants: arrayOf(string),

  // from injectIntl
  intl: intlShape.isRequired,
};

export default injectIntl(ListingImageGallery);
