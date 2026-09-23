import React, { useState } from 'react';
import classNames from 'classnames';
import ReactImageGallery from 'react-image-gallery';

import { propTypes } from '../../../util/types';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import {
  AspectRatioWrapper,
  Button,
  IconClose,
  IconArrowHead,
  ResponsiveImage,
} from '../../../components';

// Copied directly from
// `node_modules/react-image-gallery/styles/image-gallery.css`. The
// copied file is left unedited, and all the overrides are defined in
// the component CSS file below.
import './image-gallery.css';

import css from './ListingImageGallery.module.css';

const IMAGE_GALLERY_OPTIONS = {
  showPlayButton: false,
  disableThumbnailScroll: true,
};
const MAX_LANDSCAPE_ASPECT_RATIO = 2; // 2:1
const MAX_PORTRAIT_ASPECT_RATIO = 4 / 3;
/** Longer side of a thumbnail inside the gallery strip (matches .thumb max-*). */
const THUMBNAIL_MAX_SIDE = 88;

/**
 * Display size for a thumbnail that fits inside an 88px box
 * while keeping the hosted listing-image crop aspect ratio.
 *
 * @param {number} aspectWidth
 * @param {number} aspectHeight
 * @returns {{ width: number, height: number }}
 */
const getThumbnailDisplaySize = (aspectWidth, aspectHeight) => {
  const w = aspectWidth || 1;
  const h = aspectHeight || 1;
  if (w >= h) {
    return { width: THUMBNAIL_MAX_SIDE, height: Math.round((THUMBNAIL_MAX_SIDE * h) / w) };
  }
  return { width: Math.round((THUMBNAIL_MAX_SIDE * w) / h), height: THUMBNAIL_MAX_SIDE };
};

const getFirstImageAspectRatio = (firstImage, scaledVariant) => {
  if (!firstImage) {
    return { aspectWidth: 1, aspectHeight: 1 };
  }

  const v = firstImage?.attributes?.variants?.[scaledVariant];
  const w = v?.width;
  const h = v?.height;
  const hasDimensions = !!w && !!h;
  const aspectRatio = w / h;

  // We keep the fractions separated as these are given to AspectRatioWrapper
  // which expects separate width and height
  return hasDimensions && aspectRatio >= MAX_LANDSCAPE_ASPECT_RATIO
    ? { aspectWidth: 2, aspectHeight: 1 }
    : hasDimensions && aspectRatio <= MAX_PORTRAIT_ASPECT_RATIO
    ? { aspectWidth: 4, aspectHeight: 3 }
    : hasDimensions
    ? { aspectWidth: w, aspectHeight: h }
    : { aspectWidth: 1, aspectHeight: 1 };
};

/**
 * The ListingImageGallery component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Array<propTypes.image>} props.images - The images
 * @param {Array<string>} props.imageVariants - The image variants
 * @param {Array<string>} props.thumbnailVariants - The thumbnail variants
 * @param {number} [props.aspectWidth] - Hosted listing-image crop aspect width (for thumbnails)
 * @param {number} [props.aspectHeight] - Hosted listing-image crop aspect height (for thumbnails)
 * @returns {JSX.Element} listing image gallery component
 */
const ListingImageGallery = props => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intl = useIntl();
  const {
    rootClassName,
    className,
    images,
    imageVariants,
    thumbnailVariants,
    aspectWidth: listingImageAspectWidth = 1,
    aspectHeight: listingImageAspectHeight = 1,
  } = props;
  const thumbVariants = thumbnailVariants || imageVariants;
  // imageVariants are scaled variants (main slide uses natural image aspect, capped).
  const { aspectWidth, aspectHeight } = getFirstImageAspectRatio(images?.[0], imageVariants[0]);
  const thumbDisplaySize = getThumbnailDisplaySize(
    listingImageAspectWidth,
    listingImageAspectHeight
  );
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
      thumbnail: img.attributes?.variants?.[thumbVariants[0]],
      image: img,
    };
  });
  const imageSizesMaybe = isFullscreen
    ? {}
    : { sizes: `(max-width: 1024px) 100vw, (max-width: 1200px) calc(100vw - 192px), 708px` };
  const firstImageId = images[0]?.id?.uuid;
  const renderItem = item => {
    const isLcpImage = !!firstImageId && item.image?.id?.uuid === firstImageId;
    return (
      <AspectRatioWrapper
        width={aspectWidth || 1}
        height={aspectHeight || 1}
        className={isFullscreen ? css.itemWrapperFullscreen : css.itemWrapper}
      >
        <div className={css.itemCentering}>
          <ResponsiveImage
            rootClassName={css.item}
            image={item.image}
            alt={item.alt}
            variants={imageVariants}
            {...imageSizesMaybe}
            {...(isLcpImage ? { fetchpriority: 'high' } : {})}
          />
        </div>
      </AspectRatioWrapper>
    );
  };
  const renderThumbInner = item => {
    return (
      <ResponsiveImage
        rootClassName={css.thumb}
        image={item.image}
        alt={item.thumbAlt}
        variants={thumbVariants}
        sizes={`${THUMBNAIL_MAX_SIDE}px`}
        width={thumbDisplaySize.width}
        height={thumbDisplaySize.height}
      />
    );
  };

  const onScreenChange = isFull => {
    setIsFullscreen(isFull);
  };

  const renderLeftNav = (onClick, disabled) => {
    return (
      <button className={css.navLeft} disabled={disabled} onClick={onClick}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="left" size="big" />
        </div>
      </button>
    );
  };
  const renderRightNav = (onClick, disabled) => {
    return (
      <button className={css.navRight} disabled={disabled} onClick={onClick}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="right" size="big" />
        </div>
      </button>
    );
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

  const classes = classNames(rootClassName || css.root, className);
  // Explicit rendered thumb size (longer side ≤ 88px) for CSS layout reservation.
  const rootStyle = {
    '--listing-thumb-display-width': `${thumbDisplaySize.width}px`,
    '--listing-thumb-display-height': `${thumbDisplaySize.height}px`,
  };

  return (
    <div className={classes} style={rootStyle}>
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
    </div>
  );
};

export default ListingImageGallery;
