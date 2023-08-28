import React from 'react';
import { bool, func, object, string } from 'prop-types';
import classNames from 'classnames';

// Import util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { EXTENDED_DATA_SCHEMA_TYPES, LISTING_STATE_DRAFT } from '../../../../util/types';
import { isBookingProcessAlias } from '../../../../transactions/transaction';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import ErrorMessage from './ErrorMessage';
import EditListingDetailsForm from './EditListingDetailsForm';
import css from './EditListingDetailsPanel.module.css';

/**
 * Get listing configuration. For existing listings, it is stored to publicData.
 * For new listings, the data needs to be figured out from listingTypes configuration.
 *
 * In the latter case, we select first type in the array. However, EditListingDetailsForm component
 * gets 'selectableListingTypes' prop, which it uses to provide a way to make selection,
 * if multiple listing types are available.
 *
 * @param {Array} listingTypes
 * @param {Object} existingListingInfo
 * @returns an object containing mainly information that can be stored to publicData.
 */
const getTransactionInfo = (listingTypes, existingListingInfo = {}, inlcudeLabel = false) => {
  const { listingType, transactionProcessAlias, unitType } = existingListingInfo;

  if (listingType && transactionProcessAlias && unitType) {
    return { listingType, transactionProcessAlias, unitType };
  } else if (listingTypes.length === 1) {
    const { listingType: type, label, transactionType } = listingTypes[0];
    const { alias, unitType: configUnitType } = transactionType;
    const labelMaybe = inlcudeLabel ? { label: label || type } : {};
    return {
      listingType: type,
      transactionProcessAlias: alias,
      unitType: configUnitType,
      ...labelMaybe,
    };
  }
  return {};
};

/**
 * Check if listingType has already been set.
 *
 * If listing type (incl. process & unitType) has been set, we won't allow change to it.
 * It's possible to make it editable, but it becomes somewhat complex to modify following panels,
 * for the different process. (E.g. adjusting stock vs booking availability settings,
 * if process has been changed for existing listing.)
 *
 * @param {Object} publicData JSON-like data stored to listing entity.
 * @returns object literal with to keys: { hasExistingListingType, existingListingType }
 */
const hasSetListingType = publicData => {
  const { listingType, transactionProcessAlias, unitType } = publicData;
  const existingListingType = { listingType, transactionProcessAlias, unitType };

  return {
    hasExistingListingType: !!listingType && !!transactionProcessAlias && !!unitType,
    existingListingType,
  };
};

/**
 * Pick extended data fields from given data. Picking is based on extended data configuration
 * for the listing and target scopa and transaction process alias.
 *
 * With 'clearExtraCustomFields' parameter can be used to clear unused values for sdk.listings.update call.
 * It returns null for those fields that are managed by configuration, but don't match target process alias.
 *
 * @param {Object} data values to look through against listingConfig.js and util/configHelpers.js
 * @param {String} targetScope Check that the scope of extended data the config matches
 * @param {String} targetListingType Check that the extended data is relevant for this listing type.
 * @param {Object} listingFieldConfigs an extended data configurtions for listing fields.
 * @param {boolean} clearExtraCustomFields If true, returns also custom extended data fields with null values
 * @returns Array of picked extended data fields
 */
const pickListingFieldsData = (
  data,
  targetScope,
  targetListingType,
  listingFieldConfigs,
  clearExtraCustomFields = false
) => {
  return listingFieldConfigs.reduce((fields, field) => {
    const { key, includeForListingTypes, scope = 'public', schemaType } = field || {};

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isTargetScope = scope === targetScope;
    const isTargetListingType =
      includeForListingTypes == null || includeForListingTypes.includes(targetListingType);

    if (isKnownSchemaType && isTargetScope && isTargetListingType) {
      const fieldValue = data[key] || null;
      return { ...fields, [key]: fieldValue };
    } else if (
      isKnownSchemaType &&
      isTargetScope &&
      !isTargetListingType &&
      clearExtraCustomFields
    ) {
      return { ...fields, [key]: null };
    }
    return fields;
  }, {});
};

/**
 * If listing represents something else than a bookable listing, we set availability-plan to seats=0.
 * Note: this is a performance improvement since the API is backwards compatible.
 *
 * @param {string} processAlias selected for this listing
 * @returns availabilityPlan without any seats available for the listing
 */
const setNoAvailabilityForUnbookableListings = processAlias => {
  return isBookingProcessAlias(processAlias)
    ? {}
    : {
        availabilityPlan: {
          type: 'availability-plan/time',
          timezone: 'Etc/UTC',
          entries: [
            // Note: "no entries" is the same as seats=0 for every entry.
            // { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 0 },
            // { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 0 },
            // { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 0 },
            // { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 0 },
            // { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 0 },
            // { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 0 },
            // { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 0 },
          ],
        },
      };
};

/**
 * Get initialValues for the form. This function includes
 * title, description, listingType, transactionProcessAlias, unitType,
 * and those publicData & privateData fields that are configured through
 * config.listing.listingFields.
 *
 * @param {object} props
 * @param {object} existingListingType info saved to listing's publicData
 * @param {object} listingTypes app's configured types (presets for listings)
 * @param {object} listingFieldsConfig those extended data fields that are part of configurations
 * @returns initialValues object for the form
 */
const getInitialValues = (props, existingListingType, listingTypes, listingFieldsConfig) => {
  const { description, title, publicData, privateData } = props?.listing?.attributes || {};
  const { listingType } = publicData;

  // Initial values for the form
  return {
    title,
    description,
    // Transaction type info: listingType, transactionProcessAlias, unitType
    ...getTransactionInfo(listingTypes, existingListingType),
    ...pickListingFieldsData(publicData, 'public', listingType, listingFieldsConfig),
    ...pickListingFieldsData(privateData, 'private', listingType, listingFieldsConfig),
  };
};

const EditListingDetailsPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    onListingTypeChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    config,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const { publicData, state } = listing?.attributes || {};
  const listingTypes = config.listing.listingTypes;
  const listingFieldsConfig = config.listing.listingFields;

  const { hasExistingListingType, existingListingType } = hasSetListingType(publicData);
  const hasValidExistingListingType =
    hasExistingListingType &&
    !!listingTypes.find(conf => {
      const listinTypesMatch = conf.listingType === existingListingType.listingType;
      const unitTypesMatch = conf.transactionType?.unitType === existingListingType.unitType;
      return listinTypesMatch && unitTypesMatch;
    });

  const initialValues = getInitialValues(
    props,
    existingListingType,
    listingTypes,
    listingFieldsConfig
  );

  const noListingTypesSet = listingTypes?.length === 0;
  const hasListingTypesSet = listingTypes?.length > 0;
  const canShowEditListingDetailsForm =
    hasListingTypesSet && (!hasExistingListingType || hasValidExistingListingType);
  const isPublished = listing?.id && state !== LISTING_STATE_DRAFT;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingDetailsPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingDetailsPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>

      {canShowEditListingDetailsForm ? (
        <EditListingDetailsForm
          className={css.form}
          initialValues={initialValues}
          saveActionMsg={submitButtonText}
          onSubmit={values => {
            const {
              title,
              description,
              listingType,
              transactionProcessAlias,
              unitType,
              ...rest
            } = values;
            // Clear custom fields that are not included for the selected process
            const clearUnrelatedCustomFields = true;

            // New values for listing attributes
            const updateValues = {
              title: title.trim(),
              description,
              publicData: {
                listingType,
                transactionProcessAlias,
                unitType,
                ...pickListingFieldsData(
                  rest,
                  'public',
                  listingType,
                  listingFieldsConfig,
                  clearUnrelatedCustomFields
                ),
              },
              privateData: pickListingFieldsData(
                rest,
                'private',
                listingType,
                listingFieldsConfig,
                clearUnrelatedCustomFields
              ),
              ...setNoAvailabilityForUnbookableListings(transactionProcessAlias),
            };

            onSubmit(updateValues);
          }}
          selectableListingTypes={listingTypes.map(conf => getTransactionInfo([conf], {}, true))}
          hasExistingListingType={hasExistingListingType}
          onListingTypeChange={onListingTypeChange}
          listingFieldsConfig={listingFieldsConfig}
          marketplaceCurrency={config.currency}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
          autoFocus
        />
      ) : (
        <ErrorMessage
          marketplaceName={config.marketplaceName}
          noListingTypesSet={noListingTypesSet}
          invalidExistingListingType={!hasValidExistingListingType}
        />
      )}
    </div>
  );
};

EditListingDetailsPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  listing: null,
};

EditListingDetailsPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  onListingTypeChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingDetailsPanel;
