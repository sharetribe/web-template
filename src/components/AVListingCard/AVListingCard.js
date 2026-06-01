import React, { useMemo } from 'react';
import classNames from 'classnames';
import { types as sdkTypes } from '../../util/sdkLoader';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { displayPrice } from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import {
  AspectRatioWrapper,
  NamedLink,
  ResponsiveImage,
  AvatarSmall,
  StoreTypeTags,
} from '../../components';

import css from './AVListingCard.module.css';

const { Money } = sdkTypes;

const MIN_LENGTH_FOR_LONG_WORDS = 10;
const ASPECT_WIDTH_TALL = 3;
const ASPECT_HEIGHT_TALL = 4.85;
const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

// Build a `{ [fieldKey]: { [option]: label } }` lookup from listingFields so
// each card render does O(1) label lookups instead of O(N) array scans.
const buildEnumLookup = listingFields => {
  const out = {};
  for (const field of listingFields || []) {
    const opts = {};
    for (const opt of field?.enumOptions || []) {
      opts[opt.option] = opt.label;
    }
    out[field.key] = opts;
  }
  return out;
};

const getEnumLabel = (lookup, fieldKey, option) => lookup?.[fieldKey]?.[option] || option;

const PriceMaybe = props => {
  const { price, publicData, config, intl } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  if (!price) {
    return null;
  }

  const fixedPrice = formatMoney(intl, price);
  const priceTitle = fixedPrice;
  const priceValue = <span className={css.priceValue}>{fixedPrice}</span>;
  const pricePerUnit = isBookable ? (
    <span className={css.perUnit}>
      <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
    </span>
  ) : (
    ''
  );

  // Show the original ("was") price as a strike-through only when it is higher
  // than the current price, mirroring OrderPanel's display rule.
  const originalPriceRaw = publicData?.originalPrice;
  const originalPriceMoney =
    originalPriceRaw && originalPriceRaw.amount > price.amount
      ? new Money(originalPriceRaw.amount, originalPriceRaw.currency)
      : null;

  return (
    <div className={css.price} title={priceTitle}>
      <FormattedMessage id="ListingCard.price" values={{ priceValue, pricePerUnit }} />
      {originalPriceMoney ? (
        <s className={css.originalPrice}>{formatMoney(intl, originalPriceMoney)}</s>
      ) : null}
    </div>
  );
};

/**
 * ListingCard
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.listing API entity: listing or ownListing
 * @param {string?} props.renderSizes for img/srcset
 * @param {Function?} props.setActiveListing
 * @param {boolean?} props.showAuthorInfo
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const AVListingCard = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const {
    className,
    rootClassName,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo = true,
    showTallCards = true,
    showListingTitle = false,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price, publicData } = currentListing.attributes;
  const sizes = publicData?.all_sizes || [];
  const slug = createSlug(title);
  const author = ensureUser(listing?.author);
  const authorName = author?.attributes?.profile?.displayName || '';
  const authorId = author?.id?.uuid;
  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants || {}).filter(k => k.startsWith(variantPrefix))
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  const enumLookup = useMemo(() => buildEnumLookup(config.listing.listingFields), [
    config.listing.listingFields,
  ]);

  return (
    <div className={classes}>
      <NamedLink className={css.cardLink} name="ListingPage" params={{ id, slug }}>
        <AspectRatioWrapper
          className={css.aspectRatioWrapper}
          width={showTallCards ? ASPECT_WIDTH_TALL : aspectWidth}
          height={showTallCards ? ASPECT_HEIGHT_TALL : aspectHeight}
          {...setActivePropsMaybe}
        >
          <LazyImage
            rootClassName={css.rootForImage}
            alt={title}
            image={firstImage}
            variants={variants}
            sizes={renderSizes}
          />
          <StoreTypeTags author={author} className={css.storeTags} />
        </AspectRatioWrapper>
      </NamedLink>
      <div className={css.info}>
        {publicData?.brand ? (
          <NamedLink
            name="SearchPage"
            to={{ search: `?pub_brand=${publicData?.brand}` }}
            className={css.brand}
          >
            {getEnumLabel(enumLookup, 'brand', publicData?.brand)}
          </NamedLink>
        ) : (
          // Reserve the brand line's height so cards without a brand stay the
          // same height as those with one.
          <div className={css.brandPlaceholder} aria-hidden="true" />
        )}

        {showListingTitle && title ? (
          <div className={css.title}>
            {richText(title, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
          </div>
        ) : null}

        {sizes.length > 0 ? (
          <div className={css.sizes}>
            {sizes.map(size => getEnumLabel(enumLookup, 'all_sizes', size)).join(', ')}
          </div>
        ) : null}
        <PriceMaybe price={price} publicData={publicData} config={config} intl={intl} />
        <div className={css.mainInfo}>
          {showAuthorInfo ? (
            <div className={css.authorInfo}>
              <AvatarSmall user={author} className={css.providerAvatar} />
              {authorId ? (
                <NamedLink title={authorName} name="ProfilePage" params={{ id: authorId }}>
                  <FormattedMessage id="ListingCard.author" values={{ authorName }} />
                </NamedLink>
              ) : (
                <span>
                  <FormattedMessage id="ListingCard.author" values={{ authorName }} />
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default React.memo(AVListingCard);
