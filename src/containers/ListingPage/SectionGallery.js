import React from 'react';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';
import { StoreTypeTags } from '../../components';

import css from './ListingPage.module.css';
import avCss from './ListingPageAV.module.css';

const SectionGallery = props => {
  const { listing, variantPrefix, thumbnailPosition, className } = props;
  const images = listing.images;
  const imageSlots = listing?.attributes?.publicData?.imageSlots;
  const imageVariants = ['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge'];
  const thumbnailVariants = [variantPrefix, `${variantPrefix}-2x`, `${variantPrefix}-4x`];
  return (
    <section className={className || css.productGallery} data-testid="carousel">
      <StoreTypeTags author={listing?.author} className={avCss.galleryStoreTags} />
      <ListingImageGallery
        images={images}
        imageSlots={imageSlots}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
        thumbnailPosition={thumbnailPosition}
      />
    </section>
  );
};

export default SectionGallery;
