import React, { useState } from 'react';
import { Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import Decimal from 'decimal.js';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import * as validators from '../../../../util/validators';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { FIXED } from '../../../../transactions/transaction';

// Import shared components
import { FieldCurrencyInput, InlineTextButton, ValidationError } from '../../../../components';

// Import modules from this directory
import css from './BookingPriceVariants.module.css';

const { Money } = sdkTypes;

const MAX_HOURS_FOR_BOOKING_DURATION = 12;
const MINUTES_FOR_BOOKING_DURATION = [0, 15, 30, 45];

const getDurationInMinutes = (hours = 0, minutes = 0) => {
  if (hours === 0 && minutes === 0) {
    return 0;
  }
  return new Decimal(hours)
    .times(60)
    .plus(minutes)
    .toNumber();
};

const getDurationFactors = durationInMinutes => {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  return [hours, minutes];
};

const setDefault = (value, defaultValue) => (value != null ? value : defaultValue);

export const getInitialValuesForPriceVariants = params => {
  const { listing } = params;
  const { price, publicData } = listing?.attributes || {};
  const { unitType, priceVariants = [] } = publicData || {};

  const variants =
    priceVariants.length > 0
      ? priceVariants.map(variant => {
          const bookingLengthInMinutes = setDefault(variant.bookingLengthInMinutes, 60);
          const priceInSubunits = setDefault(variant.priceInSubunits, null);
          return {
            bookingLengthInMinutes,
            price: priceInSubunits ? new Money(priceInSubunits, price.currency) : null,
          };
        })
      : [{ bookingLengthInMinutes: 60, price: null }];
  return unitType === FIXED ? { priceVariants: variants } : {};
};

export const handleSubmitValuesForPriceVariants = (values, publicData, unitType) => {
  const { priceVariants } = values;
  const firstPrice = priceVariants?.[0]?.price;
  const firstPriceInSubUnits = firstPrice?.amount;
  const currency = firstPrice?.currency;

  const lowestPrice = priceVariants.reduce((priceInSubUnits, variant) => {
    return priceInSubUnits < variant?.price?.amount ? priceInSubUnits : variant.price?.amount;
  }, firstPriceInSubUnits);
  const price = new Money(lowestPrice, currency);

  return unitType === FIXED
    ? {
        price,
        publicData: {
          ...publicData,
          priceVariants: priceVariants.map(variant => {
            const { bookingLengthInMinutes, price: variantPrice } = variant;
            return {
              priceInSubunits: variantPrice.amount,
              bookingLengthInMinutes,
            };
          }),
        },
      }
    : {};
};

const getPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
  const priceRequiredMsgId = { id: 'EditListingPricingForm.priceRequired' };
  const priceRequiredMsg = intl.formatMessage(priceRequiredMsgId);
  const priceRequired = validators.required(priceRequiredMsg);

  const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
  const minPrice = formatMoney(intl, minPriceRaw);
  const priceTooLowMsgId = { id: 'EditListingPricingForm.priceTooLow' };
  const priceTooLowMsg = intl.formatMessage(priceTooLowMsgId, { minPrice });
  const minPriceRequired = validators.moneySubUnitAmountAtLeast(
    priceTooLowMsg,
    listingMinimumPriceSubUnits
  );

  return listingMinimumPriceSubUnits
    ? validators.composeValidators(priceRequired, minPriceRequired)
    : priceRequired;
};

const FieldBookingLength = props => {
  const { name, className, rootClassName, label, idPrefix, intl, ...rest } = props;

  const getHoursOptionLabel = hours =>
    intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.hoursOption' }, { hours });
  const getMinutesOptionLabel = minutes =>
    intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.minutesOption' }, { minutes });

  const toHourOption = (_, i) => ({ key: i, label: getHoursOptionLabel(i) });
  const optionsHours = Array.from({ length: MAX_HOURS_FOR_BOOKING_DURATION }, toHourOption);
  const toMinuteOption = minutes => ({ key: minutes, label: getMinutesOptionLabel(minutes) });
  const optionsMinutes = MINUTES_FOR_BOOKING_DURATION.map(toMinuteOption);

  const classes = classNames(rootClassName || css.root, className);

  return (
    <Field name={name} {...rest}>
      {({ input, meta }) => {
        const [factors, setFactors] = useState(getDurationFactors(input?.value));
        const [hours, minutes] = factors;
        const { valid, invalid, touched, error } = meta;
        const handleHoursChange = e => {
          // const [hours, minutes] = factors;
          const newHours = e.target.value;
          const bookingLengthInMinutes = getDurationInMinutes(newHours, minutes);
          setFactors([newHours, minutes]);
          input.onChange(bookingLengthInMinutes);
        };
        const handleMinutesChange = e => {
          // const [hours, minutes] = factors;
          const newMinutes = e.target.value;
          const bookingLengthInMinutes = getDurationInMinutes(hours, newMinutes);
          setFactors([hours, newMinutes]);
          input.onChange(bookingLengthInMinutes);
        };

        return (
          <div className={classes}>
            <label>
              {intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.bookingLengthLabel' })}
            </label>

            <div className={css.selects}>
              <select
                id={`${idPrefix}_hours`}
                name={`${name}.hours`}
                className={css.select}
                onChange={handleHoursChange}
                onBlur={input.onBlur}
                value={hours}
              >
                {optionsHours.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                id={`${idPrefix}_minutes`}
                name={`${name}.minutes`}
                className={css.select}
                onChange={handleMinutesChange}
                onBlur={input.onBlur}
                value={minutes}
              >
                {optionsMinutes.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <ValidationError fieldMeta={meta} />
          </div>
        );
      }}
    </Field>
  );
};

const PriceVariant = props => {
  const {
    name,
    idPrefix,
    unitType,
    listingMinimumPriceSubUnits,
    marketplaceCurrency,
    intl,
  } = props;

  const priceValidators = getPriceValidators(
    listingMinimumPriceSubUnits,
    marketplaceCurrency,
    intl
  );

  return (
    <div className={css.priceVariant}>
      <FieldCurrencyInput
        id={`${idPrefix}_price`}
        name={`${name}.price`}
        className={css.input}
        label={intl.formatMessage(
          { id: 'EditListingPricingForm.priceVariant.pricePerProduct' },
          { unitType }
        )}
        placeholder={intl.formatMessage({
          id: 'EditListingPricingForm.priceVariant.priceInputPlaceholder',
        })}
        currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
        validate={priceValidators}
      />

      <FieldBookingLength
        name={`${name}.bookingLengthInMinutes`}
        idPrefix={idPrefix}
        intl={intl}
        validate={validators.numberAtLeast(
          intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.bookingLengthRequired' }),
          15
        )}
      />
    </div>
  );
};

/**
 * The FixedBookingPriceVariants component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form id
 * @param {string} props.unitType - The unit type
 * @param {number} props.listingMinimumPriceSubUnits - The minimum price subunits
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @returns {JSX.Element}
 */
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
    <FieldArray
      name="priceVariants"
      validate={validators.composeValidators(
        validators.nonEmptyArray(
          intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.required' })
        )
      )}
    >
      {({ fields }) => {
        return (
          <>
            {fields?.length === 0 ? (
              <div className={css.noPriceVariant}>
                <div className={css.error}>
                  {intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.required' })}
                </div>
                <InlineTextButton
                  className={css.addPriceVariantButton}
                  onClick={() => {
                    fields.push({ bookingLengthInMinutes: 60, price: null });
                  }}
                >
                  <FormattedMessage id="EditListingPricingForm.priceVariant.addPriceVariant" />
                </InlineTextButton>
              </div>
            ) : null}

            {fields.map((name, index) => {
              return (
                <PriceVariant
                  key={name}
                  name={name}
                  unitType={unitType}
                  idPrefix={`${formId}_${index}`}
                  listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
                  marketplaceCurrency={marketplaceCurrency}
                  intl={intl}
                />
              );
            })}
          </>
        );
      }}
    </FieldArray>
  ) : null;
};

export default FixedBookingPriceVariants;
