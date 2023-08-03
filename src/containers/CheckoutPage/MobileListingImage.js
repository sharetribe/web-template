import React from 'react';
import classNames from 'classnames';

import { AspectRatioWrapper, AvatarMedium, ResponsiveImage } from '../../components';

import css from './CheckoutPage.module.css';

const MobileListingImage = props => {
  const { listingTitle, author, firstImage, layoutListingImageConfig } = props;

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } =
    layoutListingImageConfig || {};
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  return (
    <>
      <AspectRatioWrapper
        width={aspectWidth}
        height={aspectHeight}
        className={css.listingImageMobile}
      >
        <ResponsiveImage
          rootClassName={css.rootForImage}
          alt={listingTitle}
          image={firstImage}
          variants={variants}
        />
      </AspectRatioWrapper>
      <div className={classNames(css.avatarWrapper, css.avatarMobile)}>
        <AvatarMedium user={author} disableProfileLink />
      </div>
    </>
  );
};

export default MobileListingImage;
