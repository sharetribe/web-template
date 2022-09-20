import React from 'react';
import classNames from 'classnames';

import { AvatarMedium, AspectRatioWrapper, ResponsiveImage } from '../../../components';

import css from './TransactionPanel.module.css';

const DetailCardImage = props => {
  const {
    className,
    rootClassName,
    avatarWrapperClassName,
    listingTitle,
    image,
    provider,
    isCustomer,
    listingImageConfig,
  } = props;
  const classes = classNames(rootClassName || css.detailCardImageWrapper, className);
  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = listingImageConfig;
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
