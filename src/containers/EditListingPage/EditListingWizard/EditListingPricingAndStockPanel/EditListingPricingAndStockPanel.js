import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import config from '../../../../config';
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { ensureOwnListing } from '../../../../util/data';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import { ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';
import css from './EditListingPricingAndStockPanel.module.css';

const { Money } = sdkTypes;

const EditListingPricingAndStockPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  const currentStockRaw = currentListing.currentStock?.attributes?.quantity;
  const currentStock = typeof currentStockRaw != null ? currentStockRaw : 1;
  const { price } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingPricingAndStockPanel.title"
      values={{ listingTitle: <ListingLink listing={listing} /> }}
    />
  ) : (
    <FormattedMessage id="EditListingPricingAndStockPanel.createListingTitle" />
  );

  const priceCurrencyValid = price instanceof Money ? price.currency === config.currency : true;
  const form = priceCurrencyValid ? (
    <EditListingPricingAndStockForm
      className={css.form}
      initialValues={{ price, stock: currentStock }}
      onSubmit={values => {
        const { price, stock } = values;

        // Update stock only if the value has changed.
        // NOTE: this is going to be used on a separate call to API
        // in EditListingPage.duck.js: sdk.stock.compareAndSet();
        const hasStockQuantityChanged = stock && currentStockRaw !== stock;
        // currentStockRaw is null or undefined, return null - otherwise use the value
        const oldTotal = currentStockRaw != null ? currentStockRaw : null;
        const stockUpdateMaybe = hasStockQuantityChanged
          ? {
              stockUpdate: {
                oldTotal,
                newTotal: stock,
              },
            }
          : {};

        const updateValues = {
          price,
          ...stockUpdateMaybe,
        };
        onSubmit(updateValues);
      }}
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
  );

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      {form}
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

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingPricingAndStockPanel;
