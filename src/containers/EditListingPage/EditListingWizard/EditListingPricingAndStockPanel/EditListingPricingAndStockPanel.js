import React, { useEffect, useState } from 'react';
import PropTypes, { arrayOf, number, oneOf, shape } from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT, STOCK_INFINITE_ITEMS, STOCK_TYPES } from '../../../../util/types';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { convertToDefaultCurrency } from '../../../../extensions/MultipleCurrency/utils/currency';
import { DEFAULT_CURRENCY } from '../../../../extensions/common/config/constants/currency.constants';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';
import css from './EditListingPricingAndStockPanel.module.css';

const { Money } = sdkTypes;
const BILLIARD = 1000000000000000;

const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
};

const getInitialValues = (props, uiCurrency) => {
  const { listing, listingTypes } = props;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const currentStock = listing?.currentStock;

  const publicData = listing?.attributes?.publicData;
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingTypeConfig?.stockType);
  const isDefaultCurrency = uiCurrency === DEFAULT_CURRENCY;
  const currencyPrice = publicData.exchangePrice?.[uiCurrency];
  const price = isDefaultCurrency
    ? listing.attributes.price
    : currencyPrice
    ? new Money(currencyPrice.amount, currencyPrice.currency)
    : null;

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  // Note: infinite stock is refilled to billiard using "stockUpdateMaybe"
  const currentStockQuantity = currentStock?.attributes?.quantity;
  const stock =
    currentStockQuantity != null
      ? currentStockQuantity
      : isPublished
      ? 0
      : hasInfiniteStock
      ? BILLIARD
      : 1;
  const stockTypeInfinity = [];

  return { price, stock, stockTypeInfinity };
};

const EditListingPricingAndStockPanel = props => {
  // State is needed since re-rendering would overwrite the values during XHR call.
  const [initialValues, setInitialValues] = useState({});
  const { exchangeRate } = useSelector(state => state.ExchangeRate);
  const { uiCurrency } = useSelector(state => state.ui);

  const {
    className,
    rootClassName,
    listing,
    marketplaceCurrency,
    listingMinimumPriceSubUnits,
    listingTypes,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    
    // Custom props
    providerCommission,
    providerFlatFee,
  } = props;

  useEffect(() => {
    setInitialValues(getInitialValues(props, uiCurrency));
  }, [uiCurrency]);

  const classes = classNames(rootClassName || css.root, className);

  // Form needs to know data from listingType
  const publicData = listing?.attributes?.publicData;
  const unitType = publicData.unitType;
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);

  const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingTypeConfig?.stockType);
  const listingCurrency = uiCurrency || marketplaceCurrency;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const priceCurrencyValid =
    listingCurrency && initialValues.price instanceof Money && !updateInProgress
      ? initialValues.price?.currency === listingCurrency
      : !!listingCurrency;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingPricingAndStockPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingPricingAndStockPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      {priceCurrencyValid ? (
        <EditListingPricingAndStockForm
          className={css.form}
          initialValues={initialValues}
          onSubmit={values => {
            const { price, stock, stockTypeInfinity } = values;
            const isDefaultCurrency = uiCurrency === DEFAULT_CURRENCY;
            const exchangePrice = !isDefaultCurrency
              ? convertToDefaultCurrency(price, exchangeRate)
              : null;
            // Update stock only if the value has changed, or stock is infinity in stockType,
            // but not current stock is a small number (might happen with old listings)
            // NOTE: this is going to be used on a separate call to API
            // in EditListingPage.duck.js: sdk.stock.compareAndSet();

            const hasStockTypeInfinityChecked = stockTypeInfinity?.[0] === 'infinity';
            const hasNoCurrentStock = listing?.currentStock?.attributes?.quantity == null;
            const hasStockQuantityChanged = stock && stock !== initialValues.stock;
            // currentStockQuantity is null or undefined, return null - otherwise use the value
            const oldTotal = hasNoCurrentStock ? null : initialValues.stock;
            const stockUpdateMaybe =
              hasInfiniteStock && (hasNoCurrentStock || hasStockTypeInfinityChecked)
                ? {
                    stockUpdate: {
                      oldTotal,
                      newTotal: BILLIARD,
                    },
                  }
                : hasNoCurrentStock || hasStockQuantityChanged
                ? {
                    stockUpdate: {
                      oldTotal,
                      newTotal: stock,
                    },
                  }
                : {};

            // New values for listing attributes
            const updateValues = {
              price: isDefaultCurrency ? price : exchangePrice,
              publicData: !isDefaultCurrency
                ? {
                    listingCurrency: uiCurrency,
                    exchangePrice: {
                      [uiCurrency]: { amount: price.amount, currency: price.currency },
                    },
                  }
                : {
                    listingCurrency: uiCurrency,
                  },
              ...stockUpdateMaybe,
            };
            // Save the initialValues to state
            // Otherwise, re-rendering would overwrite the values during XHR call.
            setInitialValues({
              price: price,
              stock: stockUpdateMaybe?.stockUpdate?.newTotal || stock,
              stockTypeInfinity,
            });
            onSubmit(updateValues);
          }}
          listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
          marketplaceCurrency={listingCurrency}
          listingType={listingTypeConfig}
          unitType={unitType}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}

          // Custom props
          providerCommission={providerCommission}
          providerFlatFee={providerFlatFee}
        />
      ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage
            id="EditListingPricingAndStockPanel.listingPriceCurrencyInvalid"
            values={{ marketplaceCurrency: listingCurrency }}
          />
        </div>
      )}
    </div>
  );
};

const { func, object, string, bool } = PropTypes;

EditListingPricingAndStockPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingPricingAndStockPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,
  marketplaceCurrency: string.isRequired,
  listingMinimumPriceSubUnits: number.isRequired,
  listingTypes: arrayOf(
    shape({
      stockType: oneOf(STOCK_TYPES),
    })
  ).isRequired,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingPricingAndStockPanel;
