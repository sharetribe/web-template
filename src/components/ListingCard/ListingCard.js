import React from 'react';
import classNames from 'classnames';
import { Button as AButton } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { displayPrice, isPriceVariationsEnabled } from '../../util/configHelpers';
import { createLazyLoader, lazyLoadWithDimensions } from '../../util/uiHelpers';
import { GRID_STYLE_SQUARE, LISTING_TYPES } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import { AspectRatioWrapperMaybe, NamedLink, ResponsiveImage } from '../../components';

import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

const lazyLoadWhenVisible = createLazyLoader({ withDimensions: false });
const LazyMasonryImage = lazyLoadWhenVisible(ResponsiveImage, { loadAfterInitialRendering: 3000 });
const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

const PriceMaybe = props => {
  const { hidePrice, price, publicData, config, intl } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = !hidePrice && displayPrice(foundListingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, foundListingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;
  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);

  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? (
    <span className={css.perUnit}>
      <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
    </span>
  ) : (
    ''
  );

  return (
    <div className={css.price} title={priceTitle}>
      {hasMultiplePriceVariants ? (
        <FormattedMessage
          id="ListingCard.priceStartingFrom"
          values={{ priceValue, pricePerUnit }}
        />
      ) : (
        <FormattedMessage id="ListingCard.price" values={{ priceValue, pricePerUnit }} />
      )}
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
 * @param {string?} props.isFavorite is it a currentUser's favorite
 * @param {Function?} props.onToggleFavorites
 * @param {Function?} props.setActiveListing
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const ListingCard = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();
  const {
    className,
    rootClassName,
    listing,
    renderSizes,
    setActiveListing,
    hidePrice,
    isFavorite,
    onToggleFavorites,
    gridLayout,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title: listingTitle = '', price, publicData } = currentListing.attributes;
  const isCreativeProfile = publicData.listingType === LISTING_TYPES.PROFILE;
  const author = ensureUser(listing.author);
  const authorDisplayName = author.attributes.profile.displayName;
  const title = isCreativeProfile ? authorDisplayName : listingTitle;
  const slug = createSlug(title);
  const authorName = 'Artist Profile';
  const authorProfileImage = author.profileImage;
  const firstImage = isCreativeProfile
    ? authorProfileImage
    : currentListing.images && currentListing.images.length > 0
    ? currentListing.images[0]
    : null;
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const isSquareLayout = gridLayout === GRID_STYLE_SQUARE || isCreativeProfile;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k =>
        k.startsWith(isSquareLayout ? variantPrefix : 'scaled-medium')
      )
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  const toggleFavorites = event => {
    event.preventDefault();
    event.stopPropagation();
    onToggleFavorites(isFavorite);
  };
  const favoriteButton = isFavorite ? (
    <AButton
      type="text"
      icon={<HeartFilled style={{ fontSize: '30px' }} />}
      onClick={toggleFavorites}
      className={css.favoriteButton}
    />
  ) : (
    <AButton
      type="text"
      icon={<HeartOutlined style={{ fontSize: '30px' }} />}
      onClick={toggleFavorites}
      className={css.favoriteButton}
    />
  );

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      <AspectRatioWrapperMaybe
        className={css.aspectRatioWrapper}
        width={aspectWidth}
        height={aspectHeight}
        {...setActivePropsMaybe}
        isSquareLayout={isSquareLayout}
      >
        {isSquareLayout ? (
          <LazyImage
            rootClassName={css.rootForImage}
            alt={title}
            image={firstImage}
            variants={variants}
            sizes={renderSizes}
          />
        ) : (
          <div className={css.masonryImageWrapper}>
            <LazyMasonryImage
              alt={title}
              image={firstImage}
              variants={variants}
              sizes={renderSizes}
            />
          </div>
        )}
      </AspectRatioWrapperMaybe>
      <div className={css.menubarWrapper}>
        <div className={css.menubarGradient} />
        <div className={css.menubar}>{favoriteButton}</div>
      </div>

      <div className={css.info}>
        <PriceMaybe
          price={price}
          publicData={publicData}
          config={config}
          intl={intl}
          hidePrice={hidePrice}
        />
        {isCreativeProfile && (
          <div className={css.mainInfo}>
            <div className={css.title}>
              {richText(title, {
                longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                longWordClass: css.longWord,
              })}
            </div>
            <div className={css.authorInfo}>
              <FormattedMessage id="ListingCard.author" values={{ authorName }} />
            </div>
          </div>
        )}
      </div>
    </NamedLink>
  );
};

export default ListingCard;
