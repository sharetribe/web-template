import React, { Component } from 'react';
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
import EditListingDeliveryForm from './EditListingDeliveryForm';
import css from './EditListingDeliveryPanel.module.css';

const { Money } = sdkTypes;

class EditListingDeliveryPanel extends Component {
  constructor(props) {
    super(props);

    this.getInitialValues = this.getInitialValues.bind(this);

    this.state = {
      initialValues: this.getInitialValues(),
    };
  }

  getInitialValues() {
    const { listing } = this.props;
    const currentListing = ensureOwnListing(listing);
    const { geolocation, publicData, price } = currentListing.attributes;

    // Only render current search if full place object is available in the URL params
    // TODO bounds are missing - those need to be queried directly from Google Places
    const locationFieldsPresent = publicData?.location?.address && geolocation;
    const location = publicData?.location ? publicData.location : {};
    const { address, building } = location;
    const {
      shippingEnabled,
      pickupEnabled,
      shippingPriceInSubunitsOneItem,
      shippingPriceInSubunitsAdditionalItems,
    } = publicData;
    const deliveryOptions = [];

    if (shippingEnabled) {
      deliveryOptions.push('shipping');
    }
    if (pickupEnabled) {
      deliveryOptions.push('pickup');
    }

    const currency = price?.currency || config.currency;
    const shippingOneItemAsMoney = shippingPriceInSubunitsOneItem
      ? new Money(shippingPriceInSubunitsOneItem, currency)
      : null;
    const shippingAdditionalItemsAsMoney = shippingPriceInSubunitsAdditionalItems
      ? new Money(shippingPriceInSubunitsAdditionalItems, currency)
      : null;
    return {
      building,
      location: locationFieldsPresent
        ? {
            search: address,
            selectedPlace: { address, origin: geolocation },
          }
        : { search: undefined, selectedPlace: undefined },
      deliveryOptions,
      shippingPriceInSubunitsOneItem: shippingOneItemAsMoney,
      shippingPriceInSubunitsAdditionalItems: shippingAdditionalItemsAsMoney,
    };
  }

  render() {
    const {
      className,
      rootClassName,
      listing,
      disabled,
      ready,
      onSubmit,
      onChange,
      submitButtonText,
      panelUpdated,
      updateInProgress,
      errors,
    } = this.props;

    const classes = classNames(rootClassName || css.root, className);
    const currentListing = ensureOwnListing(listing);

    const isPublished =
      currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
    const panelTitle = isPublished ? (
      <FormattedMessage
        id="EditListingDeliveryPanel.title"
        values={{ listingTitle: <ListingLink listing={listing} /> }}
      />
    ) : (
      <FormattedMessage id="EditListingDeliveryPanel.createListingTitle" />
    );

    return (
      <div className={classes}>
        <h1 className={css.title}>{panelTitle}</h1>
        <EditListingDeliveryForm
          className={css.form}
          initialValues={this.state.initialValues}
          onSubmit={values => {
            const {
              building = '',
              location,
              shippingPriceInSubunitsOneItem,
              shippingPriceInSubunitsAdditionalItems,
              deliveryOptions,
            } = values;

            const shippingEnabled = deliveryOptions.includes('shipping');
            const pickupEnabled = deliveryOptions.includes('pickup');
            const address = location?.selectedPlace?.address || null;
            const origin = location?.selectedPlace?.origin || null;

            const pickupDataMaybe =
              pickupEnabled && address ? { location: { address, building } } : {};

            const shippingDataMaybe =
              shippingEnabled && shippingPriceInSubunitsOneItem
                ? {
                    // Note: we only save the "amount" because currency should not differ from listing's price.
                    // Money is always dealt in subunits (e.g. cents) to avoid float calculations.
                    shippingPriceInSubunitsOneItem: shippingPriceInSubunitsOneItem.amount,
                    shippingPriceInSubunitsAdditionalItems:
                      shippingPriceInSubunitsAdditionalItems?.amount,
                  }
                : {};

            const updateValues = {
              geolocation: origin,
              publicData: {
                pickupEnabled,
                ...pickupDataMaybe,
                shippingEnabled,
                ...shippingDataMaybe,
              },
            };
            this.setState({
              initialValues: {
                building,
                location: { search: address, selectedPlace: { address, origin } },
                shippingPriceInSubunitsOneItem,
                shippingPriceInSubunitsAdditionalItems,
                deliveryOptions,
              },
            });
            onSubmit(updateValues);
          }}
          onChange={onChange}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
          autoFocus
        />
      </div>
    );
  }
}

const { func, object, string, bool } = PropTypes;

EditListingDeliveryPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingDeliveryPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingDeliveryPanel;
