import React, { useState } from 'react';
import { arrayOf, bool, func, object, string } from 'prop-types';
import { compose } from 'redux';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { formatMoney } from '../../../util/currency';
import { ensureListing } from '../../../util/data';

import { AspectRatioWrapper, ResponsiveImage } from '../../../components';

import css from './SearchMapInfoCard.module.css';

// ListingCard is the listing info without overlayview or carousel controls
const ListingCard = props => {
  const { className, clickHandler, intl, isInCarousel, listing, urlToListing, config } = props;

  const { title, price } = listing.attributes;
  const formattedPrice =
    price && price.currency === config.currency
      ? formatMoney(intl, price)
      : price?.currency
      ? price.currency
      : null;
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  // listing card anchor needs sometimes inherited border radius.
  const classes = classNames(
    css.anchor,
    css.borderRadiusInheritTop,
    { [css.borderRadiusInheritBottom]: !isInCarousel },
    className
  );

  return (
    <a
      alt={title}
      className={classes}
      href={urlToListing}
      onClick={e => {
        e.preventDefault();
        // Use clickHandler from props to call internal router
        clickHandler(listing);
      }}
    >
      <div
        className={classNames(css.card, css.borderRadiusInheritTop, {
          [css.borderRadiusInheritBottom]: !isInCarousel,
        })}
      >
        <AspectRatioWrapper
          className={css.aspectRatioWrapper}
          width={aspectWidth}
          height={aspectHeight}
        >
          <ResponsiveImage
            rootClassName={classNames(css.rootForImage, css.borderRadiusInheritTop)}
            alt={title}
            noImageMessage={intl.formatMessage({ id: 'SearchMapInfoCard.noImage' })}
            image={firstImage}
            variants={variants}
            sizes="250px"
          />
        </AspectRatioWrapper>
        <div className={classNames(css.info, { [css.borderRadiusInheritBottom]: !isInCarousel })}>
          <div className={classNames(css.price, { [css.noPriceSetLabel]: !formattedPrice })}>
            {formattedPrice}
          </div>
          <div className={css.name}>{title}</div>
        </div>
      </div>
    </a>
  );
};

ListingCard.defaultProps = {
  className: null,
};

ListingCard.propTypes = {
  className: string,
  listing: propTypes.listing.isRequired,
  clickHandler: func.isRequired,
  intl: intlShape.isRequired,
  isInCarousel: bool.isRequired,
};

const SearchMapInfoCard = props => {
  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const {
    className,
    rootClassName,
    intl,
    listings,
    createURLToListing,
    onListingInfoCardClicked,
    config,
  } = props;
  const currentListing = ensureListing(listings[currentListingIndex]);
  const hasCarousel = listings.length > 1;

  const classes = classNames(rootClassName || css.root, className);
  const caretClass = classNames(css.caret, { [css.caretWithCarousel]: hasCarousel });

  return (
    <div className={classes}>
      <div className={css.caretShadow} />
      <ListingCard
        clickHandler={onListingInfoCardClicked}
        urlToListing={createURLToListing(currentListing)}
        listing={currentListing}
        intl={intl}
        isInCarousel={hasCarousel}
        config={config}
      />
      {hasCarousel ? (
        <div className={classNames(css.paginationInfo, css.borderRadiusInheritBottom)}>
          <button
            className={css.paginationPrev}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentListingIndex(
                prevListingIndex => (prevListingIndex + listings.length - 1) % listings.length
              );
            }}
          />
          <div className={css.paginationPage}>
            {`${currentListingIndex + 1}/${listings.length}`}
          </div>
          <button
            className={css.paginationNext}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentListingIndex(
                prevListingIndex => (prevListingIndex + listings.length + 1) % listings.length
              );
            }}
          />
        </div>
      ) : null}
      <div className={caretClass} />
    </div>
  );
};

SearchMapInfoCard.defaultProps = {
  className: null,
  rootClassName: null,
};

SearchMapInfoCard.propTypes = {
  className: string,
  rootClassName: string,
  listings: arrayOf(propTypes.listing).isRequired,
  onListingInfoCardClicked: func.isRequired,
  createURLToListing: func.isRequired,
  config: object.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

export default compose(injectIntl)(SearchMapInfoCard);
