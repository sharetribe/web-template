import { displayPrice, isPriceVariationsEnabled } from '../../util/configHelpers';
import { formatMoney } from '../../util/currency';
import { richText } from '../../util/richText';
import { isBookingProcessAlias } from '../../transactions/transaction';

import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTooltip: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTooltip: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

/**
 * Returns all translated and formatted strings for ListingCard so the
 * presentational component can stay simple and aria-labels use the same copy.
 *
 * @param {Object} listing - API entity: listing or ownListing
 * @param {Object} config - app configuration (e.g. from useConfiguration())
 * @param {Object} intl - React Intl instance (e.g. from useIntl())
 * @returns {Object} translations and derived values:
 *   - titlePlain: raw title string (for aria/alt)
 *   - titleFormatted: React nodes from richText(title) for display
 *   - showPrice: whether to show the price block
 *   - priceTooltip: string for the price element's title attribute (tooltip on hover)
 *   - priceMessage: string or null for the price block content (same translation as used in cardAriaLabel when shown)
 *   - cardAriaLabel: ready-to-use aria-label for the card link (listing title + price line when shown)
 *   - authorName: "ListingCard.author" string containing author's display name
 */
export const getListingCardTranslations = (listing, config, intl) => {
  const { title = '', price, publicData } = listing?.attributes || {};

  const authorDisplayName = listing?.author?.attributes?.profile?.displayName;
  const authorName = intl.formatMessage(
    { id: 'ListingCard.author' },
    { authorName: authorDisplayName }
  );

  const validListingTypes = config.listing.listingTypes || [];
  const { listingType } = publicData || {};
  const listingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);

  const showPrice = displayPrice(listingTypeConfig);
  const { formattedPrice, priceTooltip } = priceData(price, config.currency, intl);

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;
  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);

  const priceMessageId = hasMultiplePriceVariants
    ? 'ListingCard.priceStartingFrom'
    : 'ListingCard.price';

  const perUnitString = isBookable
    ? intl.formatMessage({ id: 'ListingCard.perUnit' }, { unitType: publicData?.unitType })
    : '';

  // Single formatted price line (amount + per-unit if applicable); used for both card aria and price block
  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? <span className={css.perUnit}>{perUnitString}</span> : '';
  const priceMessage =
    showPrice && formattedPrice != null
      ? intl.formatMessage({ id: priceMessageId }, { priceValue, pricePerUnit })
      : '';

  const cardAriaLabel =
    priceMessage.length > 0
      ? intl.formatMessage(
          { id: 'ListingCard.screenreader.label' },
          { listingTitle: title, formattedPrice: priceMessage }
        )
      : title;

  return {
    titlePlain: title,
    titleFormatted: richText(title, {
      longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
      longWordClass: css.longWord,
    }),
    authorName,
    showPrice,
    priceTooltip,
    priceMessage,
    cardAriaLabel,
  };
};

/** Demo copy for the `course` card variant; override via `publicData.courseCard`. */
export const COURSE_CARD_DEMO = {
  priceLabel: '€450',
  title: 'Efficient Leadership',
  badgePrimary: 'Personal Growth',
  badgeSecondary: 'Group Coaching',
  authorName: 'Ayse Gumus',
  highlight: 'The class includes 3 group online sessions of 60 minutes each.',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  mediaLabel: 'Presentation',
};

/**
 * Resolves display fields for the horizontal `course` listing card. Listing data takes
 * precedence when present; otherwise demo fallbacks are used.
 *
 * @param {Object} listing
 * @param {Object} config
 * @param {Object} intl
 * @param {boolean} showPrice
 * @returns {Object} resolved course card fields
 */
export const resolveCourseCardContent = (listing, config, intl, showPrice) => {
  const attributes = listing?.attributes || {};
  const pd = attributes.publicData?.courseCard || {};
  const { price, title: listingTitle = '', description: listingDescription = '' } = attributes;
  const authorFromListing = listing?.author?.attributes?.profile?.displayName;

  let priceLabel = pd.priceLabel;
  if (!priceLabel && showPrice && price && price.currency === config.currency) {
    priceLabel = formatMoney(intl, price);
  }
  if (!priceLabel) {
    priceLabel = COURSE_CARD_DEMO.priceLabel;
  }

  return {
    priceLabel,
    title: pd.title || listingTitle || COURSE_CARD_DEMO.title,
    badgePrimary: pd.badgePrimary ?? COURSE_CARD_DEMO.badgePrimary,
    badgeSecondary: pd.badgeSecondary ?? COURSE_CARD_DEMO.badgeSecondary,
    authorDisplayName: pd.authorName || authorFromListing || COURSE_CARD_DEMO.authorName,
    highlight: pd.highlight ?? COURSE_CARD_DEMO.highlight,
    description: pd.description || listingDescription || COURSE_CARD_DEMO.description,
    mediaLabel: pd.mediaLabel ?? COURSE_CARD_DEMO.mediaLabel,
  };
};
