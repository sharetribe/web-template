import React from 'react';
import { bool, func, object, string } from 'prop-types';
import classNames from 'classnames';

// Import util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { EXTENDED_DATA_SCHEMA_TYPES, LISTING_STATE_DRAFT } from '../../../../util/types';
import { isBookingProcess } from '../../../../util/transaction';

// Import shared components
import { ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingDetailsForm from './EditListingDetailsForm';
import css from './EditListingDetailsPanel.module.css';

/**
 * Get transaction configuration. For existing listings, it is stored to publicData.
 * For new listings, the data needs to be figured out from transactionTypes configuration.
 *
 * In the latter case, we select first type in the array. However, EditListingDetailsForm component
 * gets 'selectableTransactionTypes' prop, which it uses to provide a way to make selection,
 * if multiple transaction type are available.
 *
 * @param {Array} transactionTypes
 * @param {Object} existingTransactionInfo
 * @returns an object containing information that can be stored to publicData.
 */
const getTransactionInfo = (transactionTypes, existingTransactionInfo = {}) => {
  const { transactionType, transactionProcessAlias, unitType } = existingTransactionInfo;

  if (transactionType && transactionProcessAlias && unitType) {
    return { transactionType, transactionProcessAlias, unitType };
  } else if (transactionTypes.length === 1) {
    const { type, process, alias, unitType: configUnitType, label } = transactionTypes[0];
    return {
      transactionType: type,
      transactionProcessAlias: `${process}/${alias}`,
      unitType: configUnitType,
      label: label || type,
    };
  }
  return {};
};

/**
 * Check if transactionType has already been set.
 *
 * If transaction type (incl. process & unitType) has been set, we won't allow change to it.
 * It's possible to make it editable, but it becomes somewhat complex to modify following panels,
 * for the different process. (E.g. adjusting stock vs booking availability settings,
 * if process has been changed for existing listing.)
 *
 * @param {Object} publicData JSON-like data stored to listing entity.
 * @returns object literal with to keys: { hasExistingTransactionType, existingTransactionType }
 */
const hasSetTransactionType = publicData => {
  const { transactionType, transactionProcessAlias, unitType } = publicData;
  const existingTransactionType = { transactionType, transactionProcessAlias, unitType };

  return {
    hasExistingTransactionType:
      !!transactionType && !!transactionProcessAlias && !!transactionProcessAlias,
    existingTransactionType,
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
 * @param {String} targetProcessAlias Check that the extended data is relevant for this process alias.
 * @param {boolean} clearExtraCustomFields If true, returns also custom extended data fields with null values
 * @returns Array of picked extended data fields
 */
const pickCustomExtendedDataFields = (
  data,
  targetScope,
  targetProcessAlias,
  extendedDataConfigs,
  clearExtraCustomFields = false
) => {
  return extendedDataConfigs.reduce((fields, extendedDataConfig) => {
    const { key, includeForProcessAliases = [], scope = 'public', schemaType } =
      extendedDataConfig || {};

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isTargetScope = scope === targetScope;
    const isTargetProcessAlias = includeForProcessAliases.includes(targetProcessAlias);

    if (isKnownSchemaType && isTargetScope && isTargetProcessAlias) {
      const fieldValue = data[key] || null;
      return { ...fields, [key]: fieldValue };
    } else if (
      isKnownSchemaType &&
      isTargetScope &&
      !isTargetProcessAlias &&
      clearExtraCustomFields
    ) {
      return { ...fields, [key]: null };
    }
    return fields;
  }, {});
};

const PanelTitle = props => {
  const { listing, state } = props;
  const isPublished = listing?.id && state !== LISTING_STATE_DRAFT;

  return isPublished ? (
    <FormattedMessage
      id="EditListingDetailsPanel.title"
      values={{ listingTitle: <ListingLink listing={listing} /> }}
    />
  ) : (
    <FormattedMessage id="EditListingDetailsPanel.createListingTitle" />
  );
};

const ErrorMessage = props => {
  const { invalidExistingTransactionType, marketplaceName } = props;
  return invalidExistingTransactionType ? (
    <div>
      <h2>
        <FormattedMessage id="EditListingDetailsPanel.invalidTransactionTypeSetTitle" />
      </h2>
      <p>
        <FormattedMessage
          id="EditListingDetailsPanel.invalidTransactionTypeSetDescription"
          values={{ marketplaceName }}
        />
      </p>
    </div>
  ) : (
    <div>
      <h2>
        <FormattedMessage id="EditListingDetailsPanel.noTransactionTypeSetTitle" />
      </h2>
      <p>
        <FormattedMessage id="EditListingDetailsPanel.noTransactionTypeSetDescription" />
      </p>
    </div>
  );
};

const EditListingDetailsPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    onProcessChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    config,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const { description, title, publicData, privateData, state } = listing?.attributes || {};
  const transactionTypes = config.transaction.transactionTypes;
  const listingExtendedDataConfig = config.listing.listingExtendedData;
  const { hasExistingTransactionType, existingTransactionType } = hasSetTransactionType(publicData);
  const hasValidExistingTransactionType =
    hasExistingTransactionType &&
    !!transactionTypes.find(conf => conf.type === existingTransactionType.transactionType);

  const initialValues = (title, description, publicData, privateData) => {
    const { transactionProcessAlias } = publicData;

    return {
      title,
      description,
      ...getTransactionInfo(transactionTypes, existingTransactionType),
      ...pickCustomExtendedDataFields(
        publicData,
        'public',
        transactionProcessAlias,
        listingExtendedDataConfig
      ),
      ...pickCustomExtendedDataFields(
        privateData,
        'private',
        transactionProcessAlias,
        listingExtendedDataConfig
      ),
    };
  };

  // If listing represents a product instead of a booking, we set availability-plan to seats=0
  const setNoAvailabilityForProductListings = transactionProcessAlias => {
    return isBookingProcess(transactionProcessAlias)
      ? {}
      : {
          availabilityPlan: {
            type: 'availability-plan/time',
            timezone: 'Etc/UTC',
            entries: [
              { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 0 },
              { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 0 },
              { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 0 },
              { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 0 },
              { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 0 },
              { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 0 },
              { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 0 },
            ],
          },
        };
  };

  const noTransactionTypesSet = transactionTypes.length > 0;
  const canShowEditListingDetailsForm =
    noTransactionTypesSet && (!hasExistingTransactionType || hasValidExistingTransactionType);
  return (
    <div className={classes}>
      <h1 className={css.title}>
        <PanelTitle listing={listing} state={state} />
      </h1>
      {canShowEditListingDetailsForm ? (
        <EditListingDetailsForm
          className={css.form}
          initialValues={initialValues(title, description, publicData, privateData)}
          saveActionMsg={submitButtonText}
          onSubmit={values => {
            const {
              title,
              description,
              transactionType,
              transactionProcessAlias,
              unitType,
              ...rest
            } = values;
            // Clear custom fields that are not included for the selected process
            const clearUnrelatedCustomFields = true;

            // Construct values to be updated
            const updateValues = {
              title: title.trim(),
              description,
              publicData: {
                transactionType,
                transactionProcessAlias,
                unitType,
                ...pickCustomExtendedDataFields(
                  rest,
                  'public',
                  transactionProcessAlias,
                  listingExtendedDataConfig,
                  clearUnrelatedCustomFields
                ),
              },
              privateData: pickCustomExtendedDataFields(
                rest,
                'private',
                transactionProcessAlias,
                listingExtendedDataConfig,
                clearUnrelatedCustomFields
              ),
              ...setNoAvailabilityForProductListings(transactionProcessAlias),
            };

            onSubmit(updateValues);
          }}
          selectableTransactionTypes={transactionTypes.map(type => getTransactionInfo([type]))}
          hasExistingTransactionType={hasExistingTransactionType}
          onProcessChange={onProcessChange}
          listingExtendedDataConfig={listingExtendedDataConfig}
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
          noTransactionTypeSet={noTransactionTypeSet}
          invalidExistingTransactionType={!hasValidExistingTransactionType}
        />
      )}
    </div>
  );
};

EditListingDetailsPanel.defaultProps = {
  className: null,
  rootClassName: null,
  onProcessChange: null,
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
  onProcessChange: func,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingDetailsPanel;
