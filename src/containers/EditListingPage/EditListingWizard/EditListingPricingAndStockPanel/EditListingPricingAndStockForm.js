import React from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { STOCK_INFINITE_ITEMS, STOCK_MULTIPLE_ITEMS, propTypes } from '../../../../util/types';
import { isOldTotalMismatchStockError } from '../../../../util/errors';
import * as validators from '../../../../util/validators';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import {
  Button,
  Form,
  FieldCurrencyInput,
  FieldCheckboxGroup,
  FieldTextInput,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingPricingAndStockForm.module.css';

const { Money } = sdkTypes;
const MILLION = 1000000;

const getPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
  const priceRequiredMsgId = { id: 'EditListingPricingAndStockForm.priceRequired' };
  const priceRequiredMsg = intl.formatMessage(priceRequiredMsgId);
  const priceRequired = validators.required(priceRequiredMsg);

  const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
  const minPrice = formatMoney(intl, minPriceRaw);
  const priceTooLowMsgId = { id: 'EditListingPricingAndStockForm.priceTooLow' };
  const priceTooLowMsg = intl.formatMessage(priceTooLowMsgId, { minPrice });
  const minPriceRequired = validators.moneySubUnitAmountAtLeast(
    priceTooLowMsg,
    listingMinimumPriceSubUnits
  );

  return listingMinimumPriceSubUnits
    ? validators.composeValidators(priceRequired, minPriceRequired)
    : priceRequired;
};

/**
 * If stock type is changed to infinity (on the fly),
 * we show checkbox for providers to update their current stock to infinity.
 * This is created to avoid overselling problem, if operator changes stock type
 * from finite to infinite. I.e. the provider notices, if stock management configuration has changed.
 *
 * Note 1: infinity is faked using billiard aka 10^15
 * Note 2: If stock is less than a million (10^6) items, we show this checkbox component.
 *
 * @param {Object} props contains { hasInfiniteStock, currentStock, formId, intl }
 * @returns a component containing checkbox group (stockTypeInfinity) with one key: infinity
 */
const UpdateStockToInfinityCheckboxMaybe = ({ hasInfiniteStock, currentStock, formId, intl }) => {
  return hasInfiniteStock && currentStock != null && currentStock < MILLION ? (
    <div className={css.input}>
      <p>
        <FormattedMessage
          id="EditListingPricingAndStockForm.updateToInfiniteInfo"
          values={{
            currentStock,
            b: msgFragment => <b>{msgFragment}</b>,
          }}
        />
      </p>
      <FieldCheckboxGroup
        id={`${formId}.stockTypeInfinity`}
        name="stockTypeInfinity"
        options={[
          {
            key: 'infinity',
            label: intl.formatMessage({
              id: 'EditListingPricingAndStockForm.updateToInfinite',
            }),
          },
        ]}
        validate={validators.requiredFieldArrayCheckbox(
          intl.formatMessage({
            id: 'EditListingPricingAndStockForm.updateToInfiniteRequired',
          })
        )}
      />
    </div>
  ) : null;
};

/**
 * The EditListingPricingAndStockForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form id
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {propTypes.listingType} props.listingType - The listing types config
 * @param {string} props.unitType - The unit type (e.g. 'item')
 * @param {string} props.marketplaceCurrency - The marketplace currency (e.g. 'USD')
 * @param {number} props.listingMinimumPriceSubUnits - The listing minimum price sub units
 * @param {boolean} [props.autoFocus] - Whether the form should autofocus
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the form is updating
 * @param {Object} props.fetchErrors - The fetch errors
 * @param {propTypes.error} [props.fetchErrors.showListingsError] - The show listings error
 * @param {propTypes.error} [props.fetchErrors.updateListingError] - The update listing error
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.saveActionMsg - The save action message
 * @returns {JSX.Element}
 */
export const EditListingPricingAndStockForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        formId = 'EditListingPricingAndStockForm',
        autoFocus,
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        invalid,
        pristine,
        marketplaceCurrency,
        unitType,
        listingMinimumPriceSubUnits = 0,
        listingType,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
      } = formRenderProps;

      const intl = useIntl();
      const priceValidators = getPriceValidators(
        listingMinimumPriceSubUnits,
        marketplaceCurrency,
        intl
      );
      // Note: outdated listings don't have listingType!
      // I.e. listings that are created with previous listing type setup.
      const hasStockManagement = listingType?.stockType === STOCK_MULTIPLE_ITEMS;
      const stockValidator = validators.numberAtLeast(
        intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockIsRequired' }),
        0
      );
      const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingType?.stockType);
      const currentStock = values.stock;

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const { updateListingError, showListingsError, setStockError } = fetchErrors || {};

      const stockErrorMessage = isOldTotalMismatchStockError(setStockError)
        ? intl.formatMessage({ id: 'EditListingPricingAndStockForm.oldStockTotalWasOutOfSync' })
        : intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockUpdateFailed' });

      return (
        <Form onSubmit={handleSubmit} className={classes}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingAndStockForm.updateFailed" />
            </p>
          ) : null}
          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingAndStockForm.showListingFailed" />
            </p>
          ) : null}
          <FieldCurrencyInput
            id={`${formId}.price`}
            name="price"
            className={css.input}
            autoFocus={autoFocus}
            label={intl.formatMessage(
              { id: 'EditListingPricingAndStockForm.pricePerProduct' },
              { unitType }
            )}
            placeholder={intl.formatMessage({
              id: 'EditListingPricingAndStockForm.priceInputPlaceholder',
            })}
            currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
            validate={priceValidators}
          />

          <UpdateStockToInfinityCheckboxMaybe
            formId={formId}
            hasInfiniteStock={hasInfiniteStock}
            currentStock={currentStock}
            intl={intl}
          />

          {hasStockManagement ? (
            <FieldTextInput
              className={css.input}
              id={`${formId}.stock`}
              name="stock"
              label={intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockLabel' })}
              placeholder={intl.formatMessage({
                id: 'EditListingPricingAndStockForm.stockPlaceholder',
              })}
              type="number"
              min={0}
              validate={stockValidator}
              onWheel={e => {
                // fix: number input should not change value on scroll
                if (e.target === document.activeElement) {
                  // Prevent the input value change, because we prefer page scrolling
                  e.target.blur();

                  // Refocus immediately, on the next tick (after the current function is done)
                  setTimeout(() => {
                    e.target.focus();
                  }, 0);
                }
              }}
            />
          ) : (
            <Field id="stock" name="stock" type="hidden" className={css.unitTypeHidden}>
              {fieldRenderProps => <input {...fieldRenderProps?.input} />}
            </Field>
          )}
          {setStockError ? <p className={css.error}>{stockErrorMessage}</p> : null}

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

export default EditListingPricingAndStockForm;
