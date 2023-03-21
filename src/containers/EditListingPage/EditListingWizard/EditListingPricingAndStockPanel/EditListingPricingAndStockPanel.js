import React from 'react';
import PropTypes, { arrayOf, number, shape } from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';
import css from './EditListingPricingAndStockPanel.module.css';

const { Money } = sdkTypes;

const getInitialValues = params => {
  const { listing } = params;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const price = listing?.attributes?.price;
  const currentStock = listing?.currentStock;

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  const currentStockQuantity = currentStock?.attributes?.quantity;
  const stock = currentStockQuantity != null ? currentStockQuantity : isPublished ? 0 : 1;

  return { price, stock };
};

const EditListingPricingAndStockPanel = props => {
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
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const initialValues = getInitialValues(props);

  // Form needs to know data from listingType
  const publicData = listing?.attributes?.publicData;
  const selectedListingType = publicData.listingType;
  const unitType = publicData.unitType;
  const listingTypeConfig = listingTypes.find(conf => conf.listingType === selectedListingType);

  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const priceCurrencyValid =
    initialValues.price instanceof Money
      ? initialValues.price?.currency === marketplaceCurrency
      : true;

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
            const { price, stock } = values;

            // Update stock only if the value has changed.
            // NOTE: this is going to be used on a separate call to API
            // in EditListingPage.duck.js: sdk.stock.compareAndSet();

            const hasNoCurrentStock = listing?.currentStock?.attributes?.quantity == null;
            const hasStockQuantityChanged = stock && stock !== initialValues.stock;
            // currentStockQuantity is null or undefined, return null - otherwise use the value
            const oldTotal = hasNoCurrentStock ? null : initialValues.stock;
            const stockUpdateMaybe =
              hasNoCurrentStock || hasStockQuantityChanged
                ? {
                    stockUpdate: {
                      oldTotal,
                      newTotal: stock,
                    },
                  }
                : {};

            // New values for listing attributes
            const updateValues = {
              price,
              ...stockUpdateMaybe,
            };
            onSubmit(updateValues);
          }}
          listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
          marketplaceCurrency={marketplaceCurrency}
          listingType={listingTypeConfig}
          unitType={unitType}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
        />
      ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage id="EditListingPricingAndStockPanel.listingPriceCurrencyInvalid" />
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
      stockType: string,
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
