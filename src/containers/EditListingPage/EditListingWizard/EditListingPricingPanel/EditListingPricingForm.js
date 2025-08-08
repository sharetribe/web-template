import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import * as validators from '../../../../util/validators';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { FIXED } from '../../../../transactions/transaction';

// Import shared components
import { Button, Form, FieldCurrencyInput } from '../../../../components';

import BookingPriceVariants from './BookingPriceVariants';
import StartTimeInterval from './StartTimeInverval';

// Import modules from this directory
import css from './EditListingPricingForm.module.css';

const { Money } = sdkTypes;

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

const ErrorMessages = props => {
  const { fetchErrors } = props;
  const { updateListingError, showListingsError } = fetchErrors || {};

  return (
    <>
      {updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingPricingForm.updateFailed" />
        </p>
      ) : null}
      {showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingPricingForm.showListingFailed" />
        </p>
      ) : null}
    </>
  );
};

/**
 * The EditListingPricingForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form id
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} props.unitType - The unit type
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @param {number} [props.listingMinimumPriceSubUnits] - The listing minimum price sub units
 * @param {boolean} [props.autoFocus] - Whether the input should be focused
 * @param {boolean} [props.disabled] - Whether the form is disabled
 * @param {boolean} [props.ready] - Whether the form is ready
 * @param {Function} props.onSubmit - The submit function
 * @param {boolean} [props.invalid] - Whether the form is invalid
 * @param {boolean} [props.pristine] - Whether the form is pristine
 * @param {string} props.saveActionMsg - The save action message
 * @param {boolean} [props.updated] - Whether the form is updated
 * @param {boolean} [props.updateInProgress] - Whether the form is updating
 * @param {Object} [props.fetchErrors] - The fetch errors
 * @returns {JSX.Element}
 */
export const EditListingPricingForm = props => (
  <FinalForm
    mutators={{ ...arrayMutators }}
    {...props}
    render={formRenderProps => {
      const {
        formId = 'EditListingPricingForm',
        autoFocus,
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        marketplaceCurrency,
        unitType,
        listingMinimumPriceSubUnits = 0,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress = false,
        fetchErrors,
        values: formValues,
      } = formRenderProps;

      const intl = useIntl();
      const priceValidators = getPriceValidators(
        listingMinimumPriceSubUnits,
        marketplaceCurrency,
        intl
      );

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const isFixedLengthBooking = unitType === FIXED;

      return (
        <Form onSubmit={handleSubmit} className={classes}>
          <ErrorMessages fetchErrors={fetchErrors} />

          {isFixedLengthBooking ? (
            <>
              <BookingPriceVariants
                formId={formId}
                autoFocus={autoFocus}
                className={css.input}
                marketplaceCurrency={marketplaceCurrency}
                unitType={unitType}
                listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
              />

              <StartTimeInterval
                name="startTimeInterval"
                idPrefix={`${formId}_startTimeInterval`}
                formValues={formValues}
                pristine={pristine}
              />
            </>
          ) : (
            <>
              <FieldCurrencyInput
                id={`${formId}.price`}
                name="price"
                className={css.input}
                autoFocus={autoFocus}
                label="Price per borrow"
                placeholder={intl.formatMessage({
                  id: 'EditListingPricingForm.priceInputPlaceholder',
                })}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                validate={priceValidators}
              />

              <p className={css.priceDescription}>
                <FormattedMessage id="EditListingPricingForm.priceDescription" />
              </p>
            </>
          )}

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

export default EditListingPricingForm;
