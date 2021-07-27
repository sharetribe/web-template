import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import config from '../../../config';

import { AvatarMedium, AspectRatioWrapper, ResponsiveImage } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build AddressLinkMaybe
const DetailCardImage = props => {
  const {
    className,
    rootClassName,
    avatarWrapperClassName,
    listingTitle,
    image,
    provider,
    isCustomer,
  } = props;
  const classes = classNames(rootClassName || css.detailCardImageWrapper, className);
  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = config.listing;
  const variants = image
    ? Object.keys(image?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  return (
    <React.Fragment>
      <AspectRatioWrapper width={aspectWidth} height={aspectHeight} className={classes}>
        <ResponsiveImage
          rootClassName={css.rootForImage}
          alt={listingTitle}
          image={image}
          variants={variants}
        />
      </AspectRatioWrapper>
      {isCustomer ? (
        <div className={avatarWrapperClassName || css.avatarWrapper}>
          <AvatarMedium user={provider} />
        </div>
      ) : null}
    </React.Fragment>
  );
};

export default DetailCardImage;
