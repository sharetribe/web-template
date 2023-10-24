import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactImageGallery from 'react-image-gallery';

import { propTypes } from '../../../util/types';
import { injectIntl, intlShape } from '../../../util/reactIntl';
import { IconArrowHead, ResponsiveImage, NamedLink } from '../..';

// Copied directly from
// `node_modules/react-image-gallery/styles/css/image-gallery.css`. The
// copied file is left unedited, and all the overrides are defined in
// the component CSS file below.
import './image-gallery.css';

import css from './ImageCarousel.module.css';

const IMAGE_GALLERY_OPTIONS = {
  showPlayButton: false,
  disableThumbnailScroll: true,
  showThumbnails: false,
  showFullscreenButton: false,
  slideDuration: 350,
};

const ImageCarousel = props => {
  const [currentIndex, setIndex] = useState(0);
  const { intl, rootClassName, className, images, imageVariants, linkParams } = props;
  const { id, slug } = linkParams;

  const items = images.map((img, i) => {
    return {
      // We will only use the image resource, but react-image-gallery
      // requires the `original` key from each item.
      original: '',
      alt: intl.formatMessage(
        { id: 'ImageCarousel.imageAltText' },
        { index: i + 1, count: images.length }
      ),
      image: img,
    };
  });
  const renderItem = item => {
    return (
      <div className={css.imageWrapper}>
        <div className={css.itemCentering}>
        <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
            <ResponsiveImage
              rootClassName={css.item}
              image={item.image}
              alt={item.alt}
              variants={imageVariants}
              sizes="(max-width: 767px) 100vw, 80vw"
            />
          </NamedLink>
        </div>
      </div>
    );
  };

  const renderLeftNav = (onClick, disabled) => {
    return (
      <button className={css.navLeft} disabled={disabled} onClick={onClick}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="left" size="big" className={css.arrowHead} />
        </div>
      </button>
    );
  };
  const renderRightNav = (onClick, disabled) => {
    return (
      <button className={css.navRight} disabled={disabled} onClick={onClick}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="right" size="big" className={css.arrowHead} />
        </div>
      </button>
    );
  };

  // If no image is given, rendere empty image.
  if (items.length === 0) {
    const classes = classNames(rootClassName || css.noImage, className);
    return <ResponsiveImage className={classes} image={null} variants={[]} alt="" />;
  }

  // We render index outside of ReactImageGallery.
  // This keeps track of current index aka slide changes happening inside gallery.
  const handleSlide = currentIndex => {
    setIndex(currentIndex);
  };
  const naturalIndex = index => index + 1;

  // Render image index info. E.g. "4/12"
  const imageIndex =
    items.length > 0 ? (
      <span className={css.imageDots}>
        {naturalIndex(currentIndex)}/{items.length}
        <span className={css.sliderDot}></span>
      </span>
    ) : null;

    const itemsDots = items.map((img, i) => {
      const activeSliderDot = currentIndex == i ? css.activeSliderDot : null;
      const classForDot = classNames( activeSliderDot ,css.sliderDot)
      return (<span className={classForDot}></span>);
    });
    
    const latestTransition = currentIndex < items.length -2 ? (currentIndex-2) * 11 : (items.length -5) * 11;

    const translateSize = currentIndex > 2 ? latestTransition : 0;
    const btnStyle = { transform: 'translateX(-'+translateSize+'px)'};

    const dotsContainer = (
      <div className={css.sliderDotsContainer}>
        <div className={css.sliderDotsCenter}>
          <div style={btnStyle} className={css.imageDots}>
            {itemsDots}
          </div>
        </div>
      </div>
    );

  const classes = classNames(rootClassName || css.root, className);

  return (
    <>
      <ReactImageGallery
        additionalClass={classes}
        items={items}
        renderItem={renderItem}
        renderLeftNav={renderLeftNav}
        renderRightNav={renderRightNav}
        onSlide={handleSlide}
        {...IMAGE_GALLERY_OPTIONS}
      />
      {/* {imageIndex} */}
      {dotsContainer}
    </>
  );
};

ImageCarousel.defaultProps = {
  rootClassName: null,
  className: null,
};

const { string, arrayOf } = PropTypes;

ImageCarousel.propTypes = {
  rootClassName: string,
  className: string,
  images: arrayOf(propTypes.image).isRequired,
  imageVariants: arrayOf(string).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

export default injectIntl(ImageCarousel);
