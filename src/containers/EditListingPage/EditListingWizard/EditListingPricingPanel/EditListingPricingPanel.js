import React, { useState } from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT, propTypes } from '../../../../util/types';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { isValidCurrencyForTransactionProcess } from '../../../../util/fieldHelpers';
import { FIXED } from '../../../../transactions/transaction';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPricingForm from './EditListingPricingForm';
import {
  getInitialValuesForPriceVariants,
  handleSubmitValuesForPriceVariants,
} from './BookingPriceVariants';
import {
  getInitialValuesForStartTimeInterval,
  handleSubmitValuesForStartTimeInterval,
} from './StartTimeInverval';
import css from './EditListingPricingPanel.module.css';

const { Money } = sdkTypes;

const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
};

// NOTE: components that handle price variants and start time interval are currently
// exporting helper functions that handle the initial values and the submission values.
// This is a tentative approach to contain logic in one place.
const getInitialValues = props => {
  const { listing } = props;
  const { unitType } = listing?.attributes?.publicData || {};
  return unitType === FIXED
    ? { ...getInitialValuesForPriceVariants(props), ...getInitialValuesForStartTimeInterval(props) }
    : { price: listing?.attributes?.price };
};

const getEstimatedListing = (listing, updateValues) => {
  const tmpListing = {
    ...listing,
    attributes: {
      ...listing.attributes,
      ...updateValues,
      publicData: {
        ...listing.attributes?.publicData,
        ...updateValues?.publicData,
      },
    },
  };
  return tmpListing;
};

/**
 * The EditListingPricingPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @param {number} props.listingMinimumPriceSubUnits - The listing minimum price sub units
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.submitButtonText - The submit button text
 * @param {Array<propTypes.listingType>} props.listingTypes - The listing types
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the panel is updating
 * @param {Object} props.errors - The errors
 * @returns {JSX.Element}
 */
const EditListingPricingPanel = props => {
  const [state, setState] = useState({ initialValues: getInitialValues(props) });

  const {
    className,
    rootClassName,
    listing,
    marketplaceCurrency,
    listingMinimumPriceSubUnits,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    listingTypes,
    panelUpdated,
    updateInProgress,
    errors,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const initialValues = state.initialValues;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const publicData = listing?.attributes?.publicData;
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  const transactionProcessAlias = listingTypeConfig.transactionType.alias;

  const isCompatibleCurrency = isValidCurrencyForTransactionProcess(
    transactionProcessAlias,
    marketplaceCurrency
  );

  const priceCurrencyValid = !isCompatibleCurrency
    ? false
    : marketplaceCurrency && initialValues.price instanceof Money
    ? initialValues.price.currency === marketplaceCurrency
    : !!marketplaceCurrency;
  const unitType = listing?.attributes?.publicData?.unitType;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingPricingPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingPricingPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      {priceCurrencyValid ? (
        <EditListingPricingForm
          className={css.form}
          initialValues={initialValues}
          onSubmit={values => {
            const { price } = values;

            // New values for listing attributes
            let updateValues = {};

            if (unitType === FIXED) {
              let publicDataUpdates = {};
              // NOTE: components that handle price variants and start time interval are currently
              // exporting helper functions that handle the initial values and the submission values.
              // This is a tentative approach to contain logic in one place.
              // We might remove or improve this setup in the future.

              // This adds startTimeInterval to publicData
              const startTimeIntervalChanges = handleSubmitValuesForStartTimeInterval(
                values,
                publicDataUpdates
              );
              // This adds lowest price variant to the listing.attributes.price and priceVariants to listing.attributes.publicData
              const priceVariantChanges = handleSubmitValuesForPriceVariants(
                values,
                publicDataUpdates,
                unitType
              );
              updateValues = {
                ...priceVariantChanges,
                ...startTimeIntervalChanges,
                publicData: {
                  ...startTimeIntervalChanges.publicData,
                  ...priceVariantChanges.publicData,
                },
              };
            } else {
              updateValues = { price };
            }

            // Save the initialValues to state
            // Otherwise, re-rendering would overwrite the values during XHR call.
            setState({
              initialValues: getInitialValues({
                listing: getEstimatedListing(listing, updateValues),
              }),
            });
            onSubmit(updateValues);
          }}
          marketplaceCurrency={marketplaceCurrency}
          unitType={unitType}
          listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
        />
      ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage
            id="EditListingPricingPanel.listingPriceCurrencyInvalid"
            values={{ marketplaceCurrency }}
          />
        </div>
      )}
    </div>
  );
};

export default EditListingPricingPanel;
