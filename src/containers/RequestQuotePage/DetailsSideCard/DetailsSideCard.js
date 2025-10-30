import React from 'react';
import classNames from 'classnames';

import { propTypes } from '../../../util/types';
import { createSlug } from '../../../util/urlHelpers';

import {
  AspectRatioWrapper,
  AvatarMedium,
  H4,
  NamedLink,
  ResponsiveImage,
} from '../../../components';

import css from './DetailsSideCard.module.css';

// Not in use at the moment.
// TODO: this needs a couple of imports, translation and css classes.
// const PriceDetails = props => {
//   const { showPrice, listing, intl } = props;
//   const { price, publicData } = listing?.attributes || {};
//   const unitType = publicData.unitType || 'unknown';

//   return showPrice ? (
//     <div className={css.priceContainer}>
//       <p className={css.price}>{formatMoney(intl, price)}</p>
//       <div className={css.perUnit}>
//         <FormattedMessage id="RequestQuotePage.perUnit" values={{ unitType }} />
//       </div>
//     </div>
//   ) : null;
// };

/**
 * A card that displays the listing and booking details on the MakeOfferPage.
 *
 * @component
 * @param {Object} props
 * @param {propTypes.listing} props.listing - The listing
 * @param {string} props.listingTitle - The listing title
 * @param {propTypes.user} props.author - The author
 * @param {propTypes.image} props.firstImage - The first image
 * @param {boolean} props.showListingImage - Whether to show the listing image
 * @param {Object} props.layoutListingImageConfig - The layout listing image config
 * @param {ReactNode} props.speculateTransactionErrorMessage - The speculate transaction error message
 * @param {boolean} props.showPrice - Whether to show the price
 * @param {intlShape} props.intl - The intl object
 */
const DetailsSideCard = props => {
  const {
    listing,
    listingTitle,
    author,
    firstImage,
    layoutListingImageConfig,
    speculateTransactionErrorMessage,
    showListingImage,
  } = props;

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } =
    layoutListingImageConfig || {};
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  return (
    <div className={css.detailsContainerDesktop} role="complementary">
      {showListingImage && (
        <AspectRatioWrapper
          width={aspectWidth}
          height={aspectHeight}
          className={css.detailsAspectWrapper}
        >
          <ResponsiveImage
            rootClassName={css.rootForImage}
            alt={listingTitle}
            image={firstImage}
            variants={variants}
          />
        </AspectRatioWrapper>
      )}
      <div className={css.listingDetailsWrapper}>
        <div className={classNames(css.avatarWrapper, { [css.noListingImage]: !showListingImage })}>
          <AvatarMedium user={author} disableProfileLink />
        </div>
        <div
          className={classNames(css.detailsHeadings, { [css.noListingImage]: !showListingImage })}
        >
          <H4 as="h2">
            <NamedLink
              name="ListingPage"
              params={{ id: listing?.id?.uuid, slug: createSlug(listingTitle) }}
            >
              {listingTitle}
            </NamedLink>
          </H4>
        </div>
        {speculateTransactionErrorMessage}
      </div>
    </div>
  );
};

export default DetailsSideCard;
