import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import {
  H3,
  ListingLink, PrimaryButtonInline
} from '../../../../components';

// Import modules from this directory
import EditListingDocumentsForm from './EditListingDocumentsForm';
import css from './EditListingDocumentsPanel.module.css';

const getInitialValues = params => {
  const { listing } = params;
  return listing?.documents || [];
};

const EditListingDocumentsPanel = props => {
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
  const documents = getInitialValues(props);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const unitType = listing?.attributes?.publicData?.unitType;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingDocumentsPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingDocumentsPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>

      <table className="documents-table">
        <thead>
        <tr>
          <th>Document Name</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        {documents.map((doc, index) => (
          <tr key={index}>
            <td align={'center'}>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                {doc.name}
              </a>
            </td>
            <td align={'center'}>
              <PrimaryButtonInline type="submit">
                Delete
              </PrimaryButtonInline>
            </td>
          </tr>
        ))}
        </tbody>
      </table>

      <EditListingDocumentsForm
        className={css.form}
        initialValues={documents}
        onSubmit={values => {
          const { extraFeatures = '' } = values;

          // New values for listing attributes
          const updateValues = {
            publicData: {
              extraFeatures,
            },
          };
          onSubmit(updateValues);
        }}
        unitType={unitType}
        saveActionMsg={submitButtonText}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
      />
    </div>
  );
};

const { func, object, string, bool } = PropTypes;

EditListingDocumentsPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingDocumentsPanel.propTypes = {
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

export default EditListingDocumentsPanel;
