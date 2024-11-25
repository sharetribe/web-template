import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import { pickCategoryFields } from '../../../../util/fieldHelpers';
import {
  getTransactionInfo,
  hasSetListingType,
  initialValuesForListingFields,
  pickListingFieldsData,
} from '../EditListingDetailsPanel/EditListingDetailsPanel';
import EditListingLocationForm from './EditListingLocationForm';
import css from './EditListingLocationPanel.module.css';

const getInitialValues = (
  props,
  existingListingTypeInfo,
  listingTypes,
  listingFields,
  listingCategories,
  categoryKey
) => {
  const { listing } = props;
  const { geolocation, publicData, privateData } = listing?.attributes || {};
  const { listingType } = publicData;
  const nestedCategories = pickCategoryFields(publicData, categoryKey, 1, listingCategories);
  // Only render current search if full place object is available in the URL params
  // TODO bounds are missing - those need to be queried directly from Google Places
  const locationFieldsPresent = publicData?.location?.address && geolocation;
  const location = publicData?.location || {};
  const { address, building } = location;

  return {
    building,
    location: locationFieldsPresent
      ? {
        search: address,
        selectedPlace: { address, origin: geolocation },
      }
      : null,
    ...nestedCategories,
    // Transaction type info: listingType, transactionProcessAlias, unitType
    ...getTransactionInfo(listingTypes, existingListingTypeInfo),
    ...initialValuesForListingFields(
      publicData,
      'public',
      listingType,
      nestedCategories,
      listingFields
    ),
    ...initialValuesForListingFields(
      privateData,
      'private',
      listingType,
      nestedCategories,
      listingFields
    ),
  };
};

const EditListingLocationPanel = props => {
  // State is needed since LocationAutocompleteInput doesn't have internal state
  // and therefore re-rendering would overwrite the values during XHR call.
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
    config,
  } = props;

  const listingTypes = config.listing.listingTypes;
  const listingFields = config.listing.listingFields;
  const listingCategories = config.categoryConfiguration.categories;
  const categoryKey = config.categoryConfiguration.key;
  const { publicData } = listing?.attributes || {};
  const { hasExistingListingType, existingListingTypeInfo } = hasSetListingType(publicData);

  const initialValues = getInitialValues(
    props,
    existingListingTypeInfo,
    listingTypes,
    listingFields,
    listingCategories,
    categoryKey
  );

  const [state, setState] = useState({ initialValues });

  const classes = classNames(rootClassName || css.root, className);
  const isPublished = listing?.id && listing?.attributes.state !== LISTING_STATE_DRAFT;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingLocationPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingLocationPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      <EditListingLocationForm
        className={css.form}
        initialValues={state.initialValues}
        onSubmit={values => {
          const { building = '', location = '', listingType, ...rest } = values;
          const { selectedPlace } = location || {};

          const { address, origin } = selectedPlace || {};

          const nestedCategories = pickCategoryFields(rest, categoryKey, 1, listingCategories);
          // Remove old categories by explicitly saving null for them.
          const cleanedNestedCategories = {
            ...[1, 2, 3].reduce((a, i) => ({ ...a, [`${categoryKey}${i}`]: null }), {}),
            ...nestedCategories,
          };
          const publicListingFields = pickListingFieldsData(
            rest,
            'public',
            listingType,
            nestedCategories,
            listingFields
          );
          const privateListingFields = pickListingFieldsData(
            rest,
            'private',
            listingType,
            nestedCategories,
            listingFields
          );

          const setLocation = { address, building };
          
          // New values for listing attributes
          const updateValues = {
            geolocation: origin,
            publicData: {
              location: publicListingFields.project_type !== 'online' ? setLocation : null,
              ...cleanedNestedCategories,
              ...publicListingFields,
            },
            privateData: privateListingFields,
          };
          // Save the initialValues to state
          // LocationAutocompleteInput doesn't have internal state
          // and therefore re-rendering would overwrite the values during XHR call.
          setState({
            initialValues: {
              building,
              location: { search: address, selectedPlace: { address, origin } },
            },
          });
          onSubmit(updateValues);
        }}
        saveActionMsg={submitButtonText}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        autoFocus
        listingFieldsConfig={listingFields}
        pickSelectedCategories={values =>
          pickCategoryFields(values, categoryKey, 1, listingCategories)
        }
        selectableCategories={listingCategories}
      />
    </div>
  );
};

const { func, object, string, bool } = PropTypes;

EditListingLocationPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingLocationPanel.propTypes = {
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

export default EditListingLocationPanel;
