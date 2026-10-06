import React from 'react';
import classNames from 'classnames';

import { AspectRatioWrapper, AvatarMedium, ResponsiveImage } from '../../components';

import css from './CheckoutPage.module.css';

// Matches below --viewportLarge in src/styles/customMediaQueries.css
const MAX_MOBILE_SCREEN_WIDTH = 1023;

const MobileListingImage = props => {
  const { listingTitle, author, firstImage, layoutListingImageConfig, showListingImage } = props;

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } =
    layoutListingImageConfig || {};
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  // Mobile-only image: skip mount from --viewportLarge up so srcset is not fetched while
  // listingImageMobile is display:none.
  const hasMatchMedia = typeof window !== 'undefined' && !!window?.matchMedia;
  const isVisible = hasMatchMedia
    ? window.matchMedia(`(max-width: ${MAX_MOBILE_SCREEN_WIDTH}px)`)?.matches
    : true;

  return (
    <>
      {showListingImage && isVisible ? (
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
            sizes="100vw"
          />
        </AspectRatioWrapper>
      ) : null}
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
