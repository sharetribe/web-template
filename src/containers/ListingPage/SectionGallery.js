import React from 'react';
import classNames from 'classnames';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';

import css from './ListingPage.module.css';

const SectionGallery = props => {
  const { listing, variantPrefix, aspectWidth, aspectHeight, actionButton } = props;
  const images = listing.images;
  const imageVariants = ['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge'];
  const thumbnailVariants = [variantPrefix, `${variantPrefix}-2x`, `${variantPrefix}-4x`];
  return (
    <section
      className={classNames(css.productGallery, { [css.galleryWithAction]: actionButton })}
      data-testid="carousel"
    >
      {actionButton ? <div className={css.saveButtonForListingImage}>{actionButton}</div> : null}
      <ListingImageGallery
        images={images}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
      />
    </section>
  );
};

export default SectionGallery;
