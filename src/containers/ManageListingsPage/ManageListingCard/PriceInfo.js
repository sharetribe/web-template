import React from 'react';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { displayPrice, isPriceVariationsEnabled } from '../../../util/configHelpers';
import { useConfiguration } from '../../../context/configurationContext';
import { formatMoney } from '../../../util/currency';

import css from './ManageListingCard.module.css';

/**
 * Derives formatted price information for a listing.
 *
 * @param {Object} price - Money object from listing attributes
 * @param {string} price.currency - ISO currency code of the price
 * @param {Object} marketplaceCurrency - Marketplace currency configuration (e.g. from app config)
 * @param {Object} intl - React Intl instance (e.g. from useIntl())
 * @returns {{ formattedPrice?: string }} Object containing formattedPrice when it can be shown
 */
const priceData = (price, marketplaceCurrency, intl) => {
  if (price?.currency === marketplaceCurrency) {
    const formatted = formatMoney(intl, price);
    return { formattedPrice: formatted };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ManageListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

/**
 * PriceInfo
 *
 * Shows localized price information for a manage listing card.
 * Handles unsupported currencies, price variations, and per-unit labels.
 *
 * @param {Object} props
 * @param {Object} props.price - Money object from listing attributes
 * @param {Object} props.publicData - Listing publicData containing price and unit metadata
 * @param {boolean} props.isBookable - Whether the listing uses a booking process
 * @param {Object} props.listingTypeConfig - Listing type configuration used for pricing rules
 * @returns {JSX.Element|null} Price info markup or null if price should not be shown
 */
const PriceInfo = props => {
  const intl = useIntl();
  const config = useConfiguration();
  const { price, publicData, isBookable, listingTypeConfig } = props;

  const showPrice = displayPrice(listingTypeConfig);
  if (!showPrice) {
    return null;
  }

  const marketplaceCurrency = config.currency;
  const { formattedPrice } = priceData(price, marketplaceCurrency, intl);
  if (!formattedPrice) {
    return (
      <div className={css.noPrice}>
        <FormattedMessage id="ManageListingCard.priceNotSet" />
      </div>
    );
  }

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;

  const perUnitString =
    isBookable && publicData?.unitType
      ? intl.formatMessage({ id: 'ManageListingCard.perUnit' }, { unitType: publicData.unitType })
      : '';

  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? <span className={css.perUnit}>{perUnitString}</span> : '';

  return (
    <div className={css.price}>
      {hasMultiplePriceVariants ? (
        <FormattedMessage
          id="ManageListingCard.priceStartingFrom"
          values={{ priceValue, pricePerUnit }}
        />
      ) : (
        <FormattedMessage id="ManageListingCard.price" values={{ priceValue, pricePerUnit }} />
      )}
    </div>
  );
};

export default PriceInfo;
