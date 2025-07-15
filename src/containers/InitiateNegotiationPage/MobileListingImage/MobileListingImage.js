import React from 'react';
import classNames from 'classnames';

import { AspectRatioWrapper, AvatarMedium, ResponsiveImage } from '../../../components';

import css from './MobileListingImage.module.css';

const MobileListingImage = props => {
  const { listingTitle, author, firstImage, layoutListingImageConfig, showListingImage } = props;

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } =
    layoutListingImageConfig || {};
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  return (
    <>
      {showListingImage && (
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
      )}
      <div
        className={classNames(css.avatarWrapper, css.avatarMobile, {
          [css.noListingImage]: !showListingImage,
        })}
      >
        <AvatarMedium user={author} disableProfileLink />
      </div>
    </>
  );
};

export default MobileListingImage;
