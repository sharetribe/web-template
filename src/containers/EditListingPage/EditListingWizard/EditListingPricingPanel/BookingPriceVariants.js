import React, { useState } from 'react';
import { Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import Decimal from 'decimal.js';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { createSlug } from '../../../../util/urlHelpers';
import { isPriceVariationsEnabled } from '../../../../util/configHelpers';
import * as validators from '../../../../util/validators';
import { formatMoney } from '../../../../util/currency';
import { FIXED } from '../../../../transactions/transaction';

// Import shared components
import {
  FieldCurrencyInput,
  FieldTextInput,
  IconDelete,
  InlineTextButton,
  ValidationError,
} from '../../../../components';

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

/**
 * Get the initial values for the price variants.
 *
 * @param {Object} props - The props given to the panel component.
 * @param {Object} props.listing - The listing entity.
 * @param {boolean} isUsingBookingPriceVariations - Whether the booking price variations are enabled.
 * @returns {Object} An object including the priceVariants array or an empty object.
 */
export const getInitialValuesForPriceVariants = (props, isUsingBookingPriceVariations) => {
  const { listing } = props;
  const { price, publicData } = listing?.attributes || {};
  const { unitType, priceVariants = [] } = publicData || {};

  const hasPriceVariants = priceVariants.length > 0;
  const isFixedUnitType = unitType === FIXED;

  const variants = hasPriceVariants
    ? priceVariants.map(variant => {
        const nameMaybe = variant.name ? { name: variant.name } : {};
        const bookingLengthInMinutes = setDefault(variant.bookingLengthInMinutes, 60);
        const bookingLengthInMinutesMaybe = isFixedUnitType ? { bookingLengthInMinutes } : {};
        const priceInSubunits = setDefault(variant.priceInSubunits, null);
        return {
          ...nameMaybe,
          ...bookingLengthInMinutesMaybe,
          price: priceInSubunits ? new Money(priceInSubunits, price.currency) : null,
        };
      })
    : isFixedUnitType
    ? [{ name: null, price: null, bookingLengthInMinutes: 60 }]
    : isUsingBookingPriceVariations && !!price
    ? [{ name: null, price }]
    : [{ name: null, price: null }];

  return variants ? { priceVariants: variants } : {};
};

const isEmpty = value => {
  const isNullish = value == null;
  const isZeroLength = value?.hasOwnProperty('length') && value?.length === 0;
  return isNullish || isZeroLength;
};
const isPropertyMissing = (variants, property) =>
  variants.some(variant => isEmpty(variant[property]));

const slugify = value => createSlug(value || '');
const areNamesUnique = names => {
  const slugs = names.map(slugify);
  const uniqueNames = new Set(slugs);
  return uniqueNames.size === slugs.length;
};

/**
 * Format the submitted values so that they include the priceVariants array, if it's enabled.
 *
 * @param {Object} values - The submitted form values.
 * @param {Object} publicData - The public data of the listing.
 * @param {string} unitType - The unit type of the listing from publicData.
 * @param {Object} listingTypeConfig - The listing type config.
 * @returns {Object} The formatted values.
 */
export const handleSubmitValuesForPriceVariants = (
  values,
  publicData,
  unitType,
  listingTypeConfig
) => {
  const { priceVariants } = values;
  const hasPriceVariants = priceVariants.length > 0;
  // Note: publicData contains priceVariationsEnabled if listing is created with priceVariations enabled.
  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);

  const isFixedUnitType = unitType === FIXED;

  if (hasPriceVariants && isPriceVariationsInUse) {
    if (isPropertyMissing(priceVariants, 'name')) {
      throw new Error('Price variants must have a name');
    }
    if (isPropertyMissing(priceVariants, 'price')) {
      throw new Error('Price variants must have a price');
    }
  } else if (hasPriceVariants && isFixedUnitType) {
    if (isPropertyMissing(priceVariants, 'bookingLengthInMinutes')) {
      throw new Error('Price variants must have a booking length');
    }
  }

  const shouldIncludeName = isPriceVariationsInUse || priceVariants?.length > 1;
  const firstPrice = priceVariants?.[0]?.price;
  const firstPriceInSubUnits = firstPrice?.amount;
  const currency = firstPrice?.currency;

  const lowestPrice = priceVariants.reduce((priceInSubUnits, variant) => {
    return priceInSubUnits < variant?.price?.amount ? priceInSubUnits : variant.price?.amount;
  }, firstPriceInSubUnits);
  const price = new Money(lowestPrice, currency);

  return isFixedUnitType || hasPriceVariants
    ? {
        price,
        publicData: {
          ...publicData,
          priceVariants: priceVariants.map(variant => {
            const { name, bookingLengthInMinutes, price: variantPrice } = variant;
            const nameMaybe = shouldIncludeName && name ? { name } : {};
            const bookingLengthInMinutesMaybe = isFixedUnitType ? { bookingLengthInMinutes } : {};
            return {
              ...nameMaybe,
              priceInSubunits: variantPrice.amount,
              ...bookingLengthInMinutesMaybe,
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
          const newHours = e.target.value;
          const bookingLengthInMinutes = getDurationInMinutes(newHours, minutes);
          setFactors([newHours, minutes]);
          input.onChange(bookingLengthInMinutes);
        };
        const handleMinutesChange = e => {
          const newMinutes = e.target.value;
          const bookingLengthInMinutes = getDurationInMinutes(hours, newMinutes);
          setFactors([hours, newMinutes]);
          input.onChange(bookingLengthInMinutes);
        };

        const hasError = touched && invalid && error;
        const selectClasses = classNames(css.select, {
          [css.selectSuccess]: valid,
          [css.selectError]: hasError,
        });

        return (
          <div className={classes}>
            <label>
              {intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.bookingLengthLabel' })}
            </label>

            <div className={css.selects}>
              <select
                id={`${idPrefix}_hours`}
                name={`${name}.hours`}
                className={selectClasses}
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
                className={selectClasses}
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
    isPriceVariationsInUse,
    showDeleteButton,
    onRemovePriceVariant,
    priceVariantNames,
    currentIndex,
    formApi,
    intl,
  } = props;

  const priceValidators = getPriceValidators(
    listingMinimumPriceSubUnits,
    marketplaceCurrency,
    intl
  );

  const requiredValidator = validators.required(
    intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.nameRequired' })
  );

  // Get error message when name is not unique.
  // Note: name and slug are passed as arguments, so it's possible to use an explicit message like:
  // "EditListingPricingForm.priceVariant.nameMustBeUnique": "The name, \"{name}\", must be unique when converted to a URL-friendly identifier. Another price variation already uses \"{slug}\".",
  const getUniqueNameRequiredMessage = (name, slug) =>
    intl.formatMessage(
      { id: 'EditListingPricingForm.priceVariant.nameMustBeUnique' },
      { name, slug }
    );

  // Validate name only when the variant is active (on focus)
  const formState = formApi.getState();
  const isVariantActive = formState.active === `${name}.name`;
  const hasNoActiveField = formState.active == null;
  const validate =
    isVariantActive || hasNoActiveField
      ? validators.composeValidators(
          requiredValidator,
          validators.uniqueString(
            currentIndex,
            priceVariantNames,
            getUniqueNameRequiredMessage,
            slugify
          )
        )
      : requiredValidator;

  return (
    <div className={css.priceVariant}>
      {isPriceVariationsInUse ? (
        <FieldTextInput
          id={`${idPrefix}_name`}
          name={`${name}.name`}
          label={intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.name' })}
          placeholder={intl.formatMessage({
            id: 'EditListingPricingForm.priceVariant.nameInputPlaceholder',
          })}
          validate={validate}
        />
      ) : null}

      <FieldCurrencyInput
        id={`${idPrefix}_price`}
        name={`${name}.price`}
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

      {unitType === FIXED ? (
        <FieldBookingLength
          name={`${name}.bookingLengthInMinutes`}
          idPrefix={idPrefix}
          intl={intl}
          validate={validators.numberAtLeast(
            intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.bookingLengthRequired' }),
            15
          )}
        />
      ) : null}

      {isPriceVariationsInUse && showDeleteButton ? (
        <InlineTextButton
          className={css.fieldArrayDelete}
          type="button"
          onClick={onRemovePriceVariant}
        >
          <span>
            <IconDelete rootClassName={css.deleteIcon} />
            <FormattedMessage id="EditListingPricingForm.priceVariant.delete" />
          </span>
        </InlineTextButton>
      ) : null}
    </div>
  );
};

// NOTE: we'll create unique keys for each price variant
// This is needed because React virtual DOM needs to map with real DOM elements through unique keys.
// https://github.com/final-form/react-final-form-arrays/issues/116
const initVariantKeys = initialLengthOfPriceVariants => {
  const counter = initialLengthOfPriceVariants || 0;
  const keys =
    counter > 0
      ? [...Array(initialLengthOfPriceVariants)].map((_, i) => {
          return `variantKey_${i}`;
        })
      : [];
  return [counter, keys];
};

const addNewVariantKey = setVariantKeys => {
  setVariantKeys(([counter, variantKeys]) => [
    counter + 1,
    [...variantKeys, `variantKey_${counter}`],
  ]);
};

const removeVariantKey = (setVariantKeys, index) => {
  setVariantKeys(([counter, variantKeys]) => [
    counter,
    [...variantKeys.slice(0, index), ...variantKeys.slice(index + 1)],
  ]);
};

/**
 * The BookingPriceVariants component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form id
 * @param {string} props.unitType - The unit type
 * @param {number} props.listingMinimumPriceSubUnits - The minimum price subunits
 * @param {number} props.initialLengthOfPriceVariants - The initial length of price variants
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @returns {JSX.Element}
 */
export const BookingPriceVariants = props => {
  const intl = useIntl();
  // NOTE: we'll create unique keys for each price variant
  // This is needed because React virtual DOM needs to map with real DOM elements through unique keys.
  // https://github.com/final-form/react-final-form-arrays/issues/116
  const [data, setVariantKeys] = useState(initVariantKeys(props.initialLengthOfPriceVariants));
  const [counter, variantKeys] = data;

  const {
    formId = 'EditListingPricingForm',
    formApi,
    unitType,
    listingMinimumPriceSubUnits = 0,
    isPriceVariationsInUse,
    marketplaceCurrency,
  } = props;

  return (
    <FieldArray
      name="priceVariants"
      validate={validators.composeValidators(
        validators.nonEmptyArray(
          intl.formatMessage({ id: 'EditListingPricingForm.priceVariant.required' })
        )
      )}
    >
      {({ fields }) => {
        const priceVariantNames = fields?.value?.map(field => field.name);
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
                    const initialPriceVariantValues =
                      unitType === FIXED && isPriceVariationsInUse
                        ? { name: null, price: null, bookingLengthInMinutes: 60 }
                        : unitType === FIXED
                        ? { price: null, bookingLengthInMinutes: 60 }
                        : { name: null, price: null };
                    fields.push(initialPriceVariantValues);
                    addNewVariantKey(setVariantKeys); // Handle unique keys for each array item.
                  }}
                >
                  <FormattedMessage id="EditListingPricingForm.priceVariant.addPriceVariant" />
                </InlineTextButton>
              </div>
            ) : null}

            <div className={css.priceVariants}>
              {fields.map((name, index) => {
                return (
                  <PriceVariant
                    key={variantKeys[index]}
                    name={name}
                    formApi={formApi}
                    unitType={unitType}
                    isPriceVariationsInUse={isPriceVariationsInUse || fields?.length > 1}
                    idPrefix={`${formId}_${index}`}
                    onRemovePriceVariant={() => {
                      fields.remove(index);
                      removeVariantKey(setVariantKeys, index); // Handle unique keys for each array item.
                    }}
                    listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
                    marketplaceCurrency={marketplaceCurrency}
                    showDeleteButton={fields?.length > 1}
                    priceVariantNames={priceVariantNames}
                    currentIndex={index}
                    intl={intl}
                  />
                );
              })}

              {areNamesUnique(priceVariantNames) ? null : (
                <div className={css.smallError}>
                  {intl.formatMessage({
                    id: 'EditListingPricingForm.priceVariant.variationNamesMustBeUnique',
                  })}
                </div>
              )}
            </div>

            {isPriceVariationsInUse && fields?.length < 20 ? (
              <div className={css.addPriceVariants}>
                <InlineTextButton
                  className={css.addPriceVariantButton}
                  type="button"
                  onClick={() => {
                    const initialPriceVariantValues =
                      unitType === FIXED && isPriceVariationsInUse
                        ? { name: null, price: null, bookingLengthInMinutes: 60 }
                        : unitType === FIXED
                        ? { price: null, bookingLengthInMinutes: 60 }
                        : { name: null, price: null };
                    fields.push(initialPriceVariantValues);
                    addNewVariantKey(setVariantKeys); // Handle unique keys for each array item.
                  }}
                >
                  <FormattedMessage id="EditListingPricingForm.priceVariant.addPriceVariant" />
                </InlineTextButton>
              </div>
            ) : null}
          </>
        );
      }}
    </FieldArray>
  );
};

export default BookingPriceVariants;
