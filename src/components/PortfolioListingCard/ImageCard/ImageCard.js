import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Image } from 'antd';

import imagePlaceholder from '../../../assets/image-placeholder.jpg';
import { useConfiguration } from '../../../context/configurationContext';
import { AspectRatioWrapper } from '../../../components';

import css from './ImageCard.module.css';

export const ImageCard = props => {
  const config = useConfiguration();
  const { className = null, rootClassName = null, item } = props;
  const classes = classNames(rootClassName || css.root, className);

  // Handle images
  const title = item?.attributes?.title || 'portfolio-image';
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const imageVariants = item?.attributes?.variants || {};
  const previewSrc = imageVariants['scaled-xlarge']?.url;
  const thumbnailSrc = imageVariants[variantPrefix]?.url;

  return (
    <div className={classes}>
      <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
        <Image
          src={thumbnailSrc}
          alt={title}
          fallback={imagePlaceholder}
          preview={{ src: previewSrc }}
        />
      </AspectRatioWrapper>
    </div>
  );
};

ImageCard.propTypes = {
  className: PropTypes.string,
  item: PropTypes.shape({
    attributes: PropTypes.object,
  }).isRequired,
};

export default ImageCard;
