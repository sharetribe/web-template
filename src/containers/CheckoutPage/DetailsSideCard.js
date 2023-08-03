import React from 'react';
import { node, object, string } from 'prop-types';

import { FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { createSlug } from '../../util/urlHelpers';
import { formatMoney } from '../../util/currency';

import {
  AspectRatioWrapper,
  AvatarMedium,
  H4,
  H6,
  NamedLink,
  ResponsiveImage,
} from '../../components';

import css from './CheckoutPage.module.css';

const DetailsSideCard = props => {
  const {
    listing,
    listingTitle,
    author,
    firstImage,
    layoutListingImageConfig,
    speculateTransactionErrorMessage,
    showPrice,
    processName,
    breakdown,
    intl,
  } = props;

  const { price, publicData } = listing?.attributes || {};
  const unitType = publicData.unitType || 'unknown';

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } =
    layoutListingImageConfig || {};
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  return (
    <div className={css.detailsContainerDesktop}>
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
      <div className={css.listingDetailsWrapper}>
        <div className={css.avatarWrapper}>
          <AvatarMedium user={author} disableProfileLink />
        </div>
        <div className={css.detailsHeadings}>
          <H4 as="h2">
            <NamedLink
              name="ListingPage"
              params={{ id: listing?.id?.uuid, slug: createSlug(listingTitle) }}
            >
              {listingTitle}
            </NamedLink>
          </H4>
          {showPrice ? (
            <div className={css.priceContainer}>
              <p className={css.price}>{formatMoney(intl, price)}</p>
              <div className={css.perUnit}>
                <FormattedMessage
                  id="CheckoutPageWithInquiryProcess.perUnit"
                  values={{ unitType }}
                />
              </div>
            </div>
          ) : null}
        </div>
        {speculateTransactionErrorMessage}
      </div>

      {!!breakdown ? (
        <div className={css.orderBreakdownHeader}>
          <H6 as="h3" className={css.orderBreakdownTitle}>
            <FormattedMessage id={`CheckoutPage.${processName}.orderBreakdown`} />
          </H6>
          <hr className={css.totalDivider} />
        </div>
      ) : null}
      {breakdown}
    </div>
  );
};

DetailsSideCard.defaultProps = {
  speculateTransactionErrorMessage: null,
  breakdown: null,
};

DetailsSideCard.propTypes = {
  listing: propTypes.listing.isRequired,
  listingTitle: string.isRequired,
  author: propTypes.user.isRequired,
  firstImage: propTypes.image.isRequired,
  layoutListingImageConfig: object.isRequired,
  speculateTransactionErrorMessage: node,
  processName: string.isRequired,
  breakdown: node,
};

export default DetailsSideCard;
