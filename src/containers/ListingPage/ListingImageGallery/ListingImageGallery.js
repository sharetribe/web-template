import React, { useState, useEffect } from 'react';
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
import avCss from './ListingImageGalleryAV.module.css';

const IMAGE_GALLERY_OPTIONS = {
  showPlayButton: false,
  disableThumbnailScroll: true,
};

// Vertical (left/right) thumbnails are used from --viewportMedium (768px) up; below
// that (mobile) they fall back to bottom thumbnails. SSR-safe: defaults to the
// small-screen layout, then upgrades on mount (no hydration mismatch).
const VIEWPORT_MEDIUM_QUERY = '(min-width: 768px)';
const useResponsiveThumbnailPosition = requested => {
  const isVertical = requested === 'left' || requested === 'right';
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }
    const mql = window.matchMedia(VIEWPORT_MEDIUM_QUERY);
    const update = () => setIsWide(mql.matches);
    update();
    if (mql.addEventListener) {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);
  return isVertical && !isWide ? 'bottom' : requested;
};
const MAX_LANDSCAPE_ASPECT_RATIO = 2; // 2:1
const MAX_PORTRAIT_ASPECT_RATIO = 4 / 3;

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
 * @returns {JSX.Element} listing image gallery component
 */
// AV: returns the human-readable slot label for an image when the listing was
// created in slot-mode (publicData.imageSlots present). For listings created
// under the upstream gallery mode, imageSlots is undefined and this is a no-op.
const getSlotLabelForImage = (image, imageSlots, intl) => {
  if (!imageSlots) return null;
  const imageUuid = image?.id?.uuid;
  if (!imageUuid) return null;
  const slotKey = Object.keys(imageSlots).find(k => imageSlots[k] === imageUuid);
  if (!slotKey) return null;
  return intl.formatMessage({ id: `ListingImageGallery.imageLabel.${slotKey}` });
};

const ListingImageGallery = props => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intl = useIntl();
  const {
    rootClassName,
    className,
    images,
    imageSlots,
    imageVariants,
    thumbnailVariants,
    // AV: 'top' | 'right' | 'bottom' | 'left' (react-image-gallery). Default keeps
    // the upstream bottom thumbnails. Vertical positions fall back to bottom below
    // --viewportMedium (see useResponsiveThumbnailPosition).
    thumbnailPosition = 'bottom',
  } = props;
  const effectiveThumbnailPosition = useResponsiveThumbnailPosition(thumbnailPosition);
  const thumbVariants = thumbnailVariants || imageVariants;
  // imageVariants are scaled variants.
  const { aspectWidth, aspectHeight } = getFirstImageAspectRatio(images?.[0], imageVariants[0]);
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
      slotLabel: getSlotLabelForImage(img, imageSlots, intl),
    };
  });
  const imageSizesMaybe = isFullscreen
    ? {}
    : { sizes: `(max-width: 1024px) 100vw, (max-width: 1200px) calc(100vw - 192px), 708px` };
  const renderItem = item => {
    return (
      <div>
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
            />
          </div>
        </AspectRatioWrapper>
        {item.slotLabel ? <p className={avCss.imageLabel}>{item.slotLabel}</p> : null}
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
          variants={thumbVariants}
          sizes="88px"
        />
      </div>
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

  return (
    <ReactImageGallery
      additionalClass={classes}
      items={items}
      renderItem={renderItem}
      renderThumbInner={renderThumbInner}
      onScreenChange={onScreenChange}
      renderLeftNav={renderLeftNav}
      renderRightNav={renderRightNav}
      renderFullscreenButton={renderFullscreenButton}
      {...IMAGE_GALLERY_OPTIONS}
      thumbnailPosition={effectiveThumbnailPosition}
    />
  );
};

export default ListingImageGallery;
