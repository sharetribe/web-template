import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { findRouteByRouteName } from '../../../util/routes';

import { AspectRatioWrapper, ResponsiveImage } from '../../../components';

import css from './ManageListingCard.module.css';

export const PortfolioListingCard = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const { className = null, rootClassName = null, image, renderSizes = null } = props;
  const classes = classNames(rootClassName || css.root, className);
  const title = image?.attributes?.title || 'portfolio-image';

  const onOverListingLink = () => {
    // Enforce preloading of ListingPage (loadable component)
    const { component: Page } = findRouteByRouteName('ListingPage', routeConfiguration);
    // Loadable Component has a "preload" function.
    if (Page.preload) {
      Page.preload();
    }
  };

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = Object.keys(image?.attributes?.variants).filter(k =>
    k.startsWith(variantPrefix)
  );

  return (
    <div className={classes}>
      <div
        className={css.clickWrapper}
        tabIndex={0}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onMouseOver={onOverListingLink}
        onTouchStart={onOverListingLink}
      >
        <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
          <ResponsiveImage
            rootClassName={css.rootForImage}
            alt={title}
            image={image}
            variants={variants}
            sizes={renderSizes}
          />
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
