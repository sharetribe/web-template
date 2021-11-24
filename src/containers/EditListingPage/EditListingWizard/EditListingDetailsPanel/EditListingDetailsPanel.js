import React from 'react';
import { bool, func, object, string } from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import config from '../../../../config';
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { getSupportedProcessesInfo } from '../../../../util/transaction';

// Import shared components
import { ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingDetailsForm from './EditListingDetailsForm';
import css from './EditListingDetailsPanel.module.css';

const EditListingDetailsPanel = props => {
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
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const { description, title, publicData, state } = listing?.attributes || {};

  const isPublished = listing?.id && state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingDetailsPanel.title"
      values={{ listingTitle: <ListingLink listing={listing} /> }}
    />
  ) : (
    <FormattedMessage id="EditListingDetailsPanel.createListingTitle" />
  );

  const activeProcesses = config.custom.processes;
  const supportedProcessesInfo = getSupportedProcessesInfo();
  const activeProcessInfos = supportedProcessesInfo.filter(processInfo =>
    activeProcesses.includes(processInfo.name)
  );
  const getCustomFields = values => {
    const filterConfigs = config.custom.filters;
    return filterConfigs.reduce((fields, filterConfig) => {
      if (['enum', 'multi-enum'].includes(filterConfig?.config?.schemaType)) {
        const fieldName = filterConfig.id;
        const fieldValue = values[fieldName] || null;
        return { ...fields, [fieldName]: fieldValue };
      }
      return fields;
    }, {});
  };
  const initialValues = (title, description, publicData) => {
    const { transactionProcessAlias, unitType, ...rest } = publicData;
    const customFields = getCustomFields(rest);
    return {
      title,
      description,
      transactionProcessAlias,
      unitType,
      ...customFields,
    };
  };

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      <EditListingDetailsForm
        className={css.form}
        initialValues={initialValues(title, description, publicData)}
        saveActionMsg={submitButtonText}
        onSubmit={values => {
          const { title, description, transactionProcessAlias, unitType, ...rest } = values;
          const customFields = getCustomFields(rest);
          const updateValues = {
            title: title.trim(),
            description,
            publicData: { transactionProcessAlias, unitType, ...customFields },
          };

          onSubmit(updateValues);
        }}
        processInfos={activeProcessInfos}
        onChange={onChange}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        autoFocus
      />
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
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingDetailsPanel;
