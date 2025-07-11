

import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { displayPrice, isPriceVariationsEnabled } from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';
import { AspectRatioWrapper, NamedLink, ResponsiveImage } from '../../components';
import { voucherifyBackend } from '../../util/api';
import { isFieldForListingType, isFieldForCategory } from '../../util/fieldHelpers';
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

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

const PriceMaybe = props => {
  const { price, publicData, config, intl } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
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
 * @param {Function?} props.setActiveListing
 * @param {boolean?} props.showAuthorInfo
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const ListingCard = props => {
  const config = useConfiguration();
  const listingFieldConfigs = config.listing?.listingFields || [];
  const intl = props.intl || useIntl();
  const location = useLocation();
  const history = useHistory();
  //console.log('listingFieldConfigs in ListingCard:', listingFieldConfigs);
  //console.log('isFieldForCategory in ListingCard:', isFieldForCategory);


  const {
    className,
    currentUser,
    rootClassName,
    listing,
    renderSizes,
    setActiveListing,
    onToggleFavorites,
    showAuthorInfo = true,
    showHeartIcon,
    showStateInfo = true, 
    //showCityInfo = true,
    showwhereIam = true,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  //console.log("----------------->", currentListing, currentListing.id, currentListing.id.uuid);

  const { title = '', price, publicData, metadata = {} } = currentListing.attributes;
  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  //console.log(listing.author);
  const authorName = author.attributes.profile.displayName;
  const stateInfo = publicData.State_for_inperson;
  const cityInfo = publicData.City;
  const whereIam = publicData.where_i_am;
  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const {  
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => {
          setActiveListing(currentListing.id);

          //console.log('publicData:', publicData);
          //console.log('listingType:', publicData?.listingType);        
        },
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  // [SKYFARER]
  // Make sure Voucherify customer is created
  // TODO: refactor and move this to a hook
  useEffect(() => {
    if (currentUser && config.vouchers.ENABLED) {
      try {
        voucherifyBackend.customers.createOrGet({
          source_id: currentUser.id.uuid,
          email: currentUser.attributes.email,
          name: currentUser.attributes.profile.displayName,
          createdAt: currentUser.attributes.createdAt.toString(),
          userType: currentUser.attributes.profile.publicData.userType,
        })
      } catch {}
    }
  }, [currentUser])

  const HeartIcon = ({ filled }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      style={{
        height: '28px',
        width: '28px',
        marginLeft: '1px',
        marginTop: '-4px',
        verticalAlign: 'middle',
        fill: filled ? 'red' : 'none',
        stroke: filled ? 'none' : 'black',
        strokeWidth: 1,
        transition: 'all 0.1s ease',
      }}
    >
      <path d={
        filled
          ? "M12.1 8.64l-.1.1-.11-.1C10.14 6.6 7.4 6.6 5.5 8.5 \
              c-1.9 1.9-1.9 4.63 0 6.54l6.6 6.6 6.6-6.6 \
              c1.9-1.9 1.9-4.63 0-6.54-1.9-1.9-4.64-1.9-6.54 0z"
          : "M12.1 8.64l-.1.1-.11-.1C10.14 6.6 7.4 6.6 5.5 8.5 \
              c-1.9 1.9-1.9 4.63 0 6.54l6.6 6.6 6.6-6.6 \
              c1.9-1.9 1.9-4.63 0-6.54-1.9-1.9-4.64-1.9-6.54 0z"
      } />
    </svg>
  );

  const isFavorite = currentUser?.attributes.profile.privateData.favorites?.includes(
    listing.id.uuid
  );

  const toggleFavorites = e => {
  e.preventDefault();
  e.stopPropagation();   // Prevent image click

  console.log('currentUser passed to handleToggleFavorites:', currentUser);

  if (!currentUser) {
    // Redirect directly to /signup if the user is not logged in
    window.location.href = '/signup';
    return;
  }

  if (typeof onToggleFavorites === 'function') {
    onToggleFavorites(isFavorite, id);
  }
};

//console.log('ListingCard → stateInfo:', stateInfo);
//console.log('City info----->', cityInfo);


  return (
    <NamedLink
      className={classes}
      name="ListingPage"
      params={{ id, slug }}
      target={typeof window !== 'undefined' ? window.location.hostname === 'localhost' ? undefined : '_blank' : '_blank'}
    >
      <AspectRatioWrapper
        className={css.aspectRatioWrapper}
        width={aspectWidth}
        height={aspectHeight}
        {...setActivePropsMaybe}
      >
        <div className={css.imageWrapper}>
          <LazyImage
            rootClassName={css.listingImage}
            alt={title}
            image={firstImage}
            variants={variants}
            sizes={renderSizes}
          />
          {showHeartIcon && (
            <button
              type="button"
              className={css.favoriteButton}
              onClick={toggleFavorites}
              aria-label="Favorite listing"
            >
              <HeartIcon filled={isFavorite} />
            </button>
          )}
        </div>
      </AspectRatioWrapper>

      <div className={css.info}>
        <PriceMaybe price={price} publicData={publicData} config={config} intl={intl} />
        <div className={css.mainInfo}>
          <div className={css.title}>
            {richText(title, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
            {showStateInfo && (stateInfo || whereIam) ? `, ${stateInfo || whereIam}` : null} 
          </div>
          
          {showAuthorInfo ? (
            <div className={css.authorInfo}>
              <FormattedMessage id="ListingCard.author" values={{ authorName }} />
            </div>
          ) : null}

        </div>
      </div>

    </NamedLink>
  );
};

export default ListingCard;
