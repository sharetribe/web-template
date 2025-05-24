import React from 'react';
import { Field } from 'react-final-form';
import Decimal from 'decimal.js';
import classNames from 'classnames';

import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import * as validators from '../../../../util/validators';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { FIXED } from '../../../../transactions/transaction';

import { FieldCurrencyInput } from '../../../../components';
import css from './BookingPriceVariants.module.css';

const { Money } = sdkTypes;
const NIGHT = 1440; // minutes in a night

// Pricing tiers
const pricingTiers = [
  { nights: 3, discount: 0 },
  { nights: 4, discount: 0.25 },
  { nights: 5, discount: 0.25 },
  { nights: 6, discount: 0.3 },
  { nights: 7, discount: 0.3 },
  { nights: 8, discount: 0.4 },
  { nights: 9, discount: 0.4 },
  { nights: 10, discount: 0.4 },
  { nights: 11, discount: 0.4 },
  { nights: 12, discount: 0.4 },
  { nights: 13, discount: 0.4 },
  { nights: 14, discount: 0.4 },
];

export const getInitialValuesForPriceVariants = params => {
  const { listing } = params;
  const { price, publicData } = listing?.attributes || {};
  const { unitType, priceVariants = [] } = publicData || {};

  const variants =
    priceVariants.length > 0
      ? priceVariants.map(variant => {
          const bookingLengthInMinutes = variant.bookingLengthInMinutes;
          const priceInSubunits = variant.priceInSubunits;
          return {
            bookingLengthInMinutes,
            price: priceInSubunits ? new Money(priceInSubunits, price.currency) : null,
          };
        })
      : [];

  return unitType === FIXED ? { priceVariants: variants } : {};
};

export const handleSubmitValuesForPriceVariants = (values, publicData, unitType) => {
  const { basePrice } = values;

  const currency = basePrice?.currency;
  const baseAmount = basePrice?.amount;

  if (!baseAmount || unitType !== FIXED) return {};

  const basePerNight = new Decimal(baseAmount).dividedBy(3);

  const priceVariants = pricingTiers.map(tier => {
    const discountedPerNight = basePerNight.times(new Decimal(1).minus(tier.discount));
    const total = discountedPerNight.times(tier.nights).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    return {
      bookingLengthInMinutes: tier.nights * NIGHT,
      priceInSubunits: parseInt(total.toString(), 10),
    };
  });

  // ✅ Set listing price to the 3-night base price
  const price = new Money(baseAmount, currency);

  return {
    price,
    publicData: {
      ...publicData,
      priceVariants,
    },
  };
};





const getPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
  const priceRequiredMsg = intl.formatMessage({ id: 'EditListingPricingForm.priceRequired' });
  const priceRequired = validators.required(priceRequiredMsg);

  const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
  const minPrice = formatMoney(intl, minPriceRaw);
  const priceTooLowMsg = intl.formatMessage({ id: 'EditListingPricingForm.priceTooLow' }, { minPrice });
  const minPriceRequired = validators.moneySubUnitAmountAtLeast(priceTooLowMsg, listingMinimumPriceSubUnits);

  return listingMinimumPriceSubUnits
    ? validators.composeValidators(priceRequired, minPriceRequired)
    : priceRequired;
};

export const FixedBookingPriceVariants = props => {
  const intl = useIntl();
  const {
    formId = 'EditListingPricingForm',
    unitType,
    listingMinimumPriceSubUnits = 0,
    marketplaceCurrency,
  } = props;

  const isFixedLengthBooking = unitType === FIXED;

  return isFixedLengthBooking ? (
    <div className={css.priceVariant}>
      <FieldCurrencyInput
        id={`${formId}_basePrice`}
        name="basePrice"
        className={css.input}
        label="Price for 3-night minimum"
        placeholder="e.g. $90"
        currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
        validate={getPriceValidators(listingMinimumPriceSubUnits, marketplaceCurrency, intl)}
      />
      <p className={css.helperText}>
        Sherbrt will automatically apply discounts for longer borrows:
        <br />
        4–5 nights: 25% off · 6–7: 40% · 8–10: 50% · 11+: 60%
      </p>
    </div>
  ) : null;
};

export default FixedBookingPriceVariants;
