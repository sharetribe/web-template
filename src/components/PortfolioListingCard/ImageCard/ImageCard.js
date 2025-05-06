import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Image } from 'antd';

import imagePlaceholder from '../../../assets/image-placeholder.jpg';
import { useConfiguration } from '../../../context/configurationContext';
import { AspectRatioWrapperMaybe } from '../../../components';

import css from './ImageCard.module.css';
import { GRID_STYLE_MASONRY, GRID_STYLE_SQUARE } from '../../../util/types';

export const ImageCard = props => {
  const config = useConfiguration();
  const { className = null, rootClassName = null, item, gridLayout = GRID_STYLE_SQUARE } = props;
  const classes = classNames(rootClassName || css.root, className);

  // Handle images
  const title = item?.attributes?.title || 'portfolio-image';
  const { aspectWidth = 1, aspectHeight = 1 } = config.layout.listingImage;

  const isSquareLayout = gridLayout === GRID_STYLE_SQUARE;
  const variantPrefix = isSquareLayout ? 'listing-card' : 'scaled-medium';
  const imageVariants = item?.attributes?.variants || {};
  const previewSrc = imageVariants['scaled-xlarge']?.url;
  const thumbnailSrc = imageVariants[variantPrefix]?.url;

  return (
    <div className={classes}>
      <AspectRatioWrapperMaybe
        width={aspectWidth}
        height={aspectHeight}
        isSquareLayout={isSquareLayout}
      >
        <Image
          src={thumbnailSrc}
          alt={title}
          fallback={imagePlaceholder}
          preview={{ src: previewSrc }}
        />
      </AspectRatioWrapperMaybe>
    </div>
  );
};

ImageCard.propTypes = {
  className: PropTypes.string,
  gridLayout: PropTypes.oneOf([GRID_STYLE_SQUARE, GRID_STYLE_MASONRY]),
  item: PropTypes.shape({
    attributes: PropTypes.object,
  }).isRequired,
};

export default ImageCard;
