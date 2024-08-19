import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { H3, ListingLink, PrimaryButtonInline } from '../../../../components';
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
  const initialDocuments = getInitialValues(props);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const unitType = listing?.attributes?.publicData?.unitType;

  const [tableDocuments, addTableDocuments] = useState(initialDocuments);
  const [originalDocumentsToRemove, addOriginalDocumentsToRemove] = useState([]);
  const [newDocuments, addNewDocuments] = useState([]);

  const onDocumentUploadHandler = file => {
    if (file) {
      addTableDocuments([
        ...tableDocuments,
        { id: `${file.name}_${Date.now()}`, name: file.name}
      ]);
      addNewDocuments([...newDocuments, file]);
    }
  };

  const onDocumentRemoveHandler = (index, doc)=> {
    const newDocuments = tableDocuments.filter((doc, i) => i !== index);
    addTableDocuments(newDocuments);
    if (doc.url) {
      addOriginalDocumentsToRemove([...originalDocumentsToRemove, doc.id]);
    }
  };

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

      <div className={css.tableContainer}>
        <table className={css.documentsTable}>
          <thead>
          <tr>
            <th>Document Name</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          {tableDocuments.map((doc, index) => (
            <tr key={index}>
              <td align={'center'}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  {doc.name}
                </a>
              </td>
              <td align={'center'}>
                <PrimaryButtonInline onClick={() => onDocumentRemoveHandler(index, doc)}>
                  Delete
                </PrimaryButtonInline>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      <EditListingDocumentsForm
        className={css.form}
        initialValues={tableDocuments}
        onDocumentUpload={onDocumentUploadHandler}
        onSubmit={_ => {
          const updateValues = {
            documents: {
              documentsAdded: newDocuments,
              documentsRemoved: originalDocumentsToRemove
            }
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
        documents={tableDocuments}
      />
    </div>
  );
};

EditListingDocumentsPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingDocumentsPanel.propTypes = {
  className: PropTypes.string,
  rootClassName: PropTypes.string,
  listing: PropTypes.object,
  disabled: PropTypes.bool.isRequired,
  ready: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitButtonText: PropTypes.string.isRequired,
  panelUpdated: PropTypes.bool.isRequired,
  updateInProgress: PropTypes.bool.isRequired,
  errors: PropTypes.object.isRequired,
};

export default EditListingDocumentsPanel;
