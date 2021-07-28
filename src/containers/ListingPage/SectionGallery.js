import React from 'react';
import config from '../../config';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';

import css from './ListingPage.module.css';

const SectionGallery = props => {
  const { listing } = props;
  const images = listing.images;
  const { variantPrefix } = config.listing;
  const imageVariants = ['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge'];
  const thumbnailVariants = [variantPrefix, `${variantPrefix}-2x`, `${variantPrefix}-4x`];
  return (
    <ListingImageGallery
      rootClassName={css.productGallery}
      images={images}
      imageVariants={imageVariants}
      thumbnailVariants={thumbnailVariants}
    />
  );
};

export default SectionGallery;
