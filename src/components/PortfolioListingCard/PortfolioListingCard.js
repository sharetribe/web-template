import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Image } from 'antd';

import imagePlaceholder from '../../assets/image-placeholder.jpg';
import { useConfiguration } from '../../context/configurationContext';
import { AspectRatioWrapper } from '../../components';

import css from './PortfolioListingCard.module.css';

export const PortfolioListingCard = props => {
  const config = useConfiguration();
  const { className = null, rootClassName = null, image, renderSizes = null } = props;
  const classes = classNames(rootClassName || css.root, className);
  const title = image?.attributes?.title || 'portfolio-image';

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = Object.keys(image?.attributes?.variants).filter(k =>
    k.startsWith(variantPrefix)
  );
  const imageVariants = image.attributes.variants;
  const srcSet = variants
    .map(variantName => {
      const variant = imageVariants[variantName];

      if (!variant) {
        // Variant not available (most like just not loaded yet)
        return null;
      }
      return `${variant.url} ${variant.width}w`;
    })
    .filter(v => v != null)
    .join(', ');

  const imgProps = {
    sizes: renderSizes,
    alt: title,
    srcSet,
  };

  return (
    <div className={classes}>
      <div>
        <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
          <Image {...imgProps} fallback={imagePlaceholder} />
        </AspectRatioWrapper>
      </div>
    </div>
  );
};

const { string } = PropTypes;

PortfolioListingCard.propTypes = {
  className: string,
  // Responsive image sizes hint
  renderSizes: string,
};

export default PortfolioListingCard;
