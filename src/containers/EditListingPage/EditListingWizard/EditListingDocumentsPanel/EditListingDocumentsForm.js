import React from 'react';
import { bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';

// Import shared components
import { Button, Form } from '../../../../components';

// Import modules from this directory
import css from './EditListingDocumentsForm.module.css';

export const EditListingDocumentsFormComponent = props => {

  const { onDocumentUpload } = props;

  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        const {
          formId,
          className,
          disabled,
          handleSubmit,
          invalid,
          pristine,
          saveActionMsg,
          updated,
          updateInProgress,
          fetchErrors,
        } = formRenderProps;

        const classes = classNames(css.root, className);
        const submitReady = (updated && pristine) || !invalid;
        const submitInProgress = updateInProgress;
        const submitDisabled = invalid || disabled || submitInProgress;
        const { updateListingError, showListingsError } = fetchErrors || {};

        const onChange = e => {
          const file = e.target.files[0];
          onDocumentUpload(file);
        };

        return (
          <Form onSubmit={handleSubmit} className={classes}>
            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingDocumentsForm.updateFailed" />
              </p>
            ) : null}
            {showListingsError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingDocumentsForm.showListingFailed" />
              </p>
            ) : null}

            <div className={css.uploadContainer}>
              <input
                id={`${formId}documents`}
                name="documents"
                type="file"
                onChange={onChange}
                className={css.fileInput}
              />

              <label
                htmlFor={`${formId}documents`}
                className={css.uploadButton}
              >
                Add
              </label>
            </div>

            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={submitReady}
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

EditListingDocumentsFormComponent.defaultProps = {
  fetchErrors: null,
  formId: 'EditListingDocumentsForm',
};

EditListingDocumentsFormComponent.propTypes = {
  formId: string,
  intl: intlShape.isRequired,
  onDocumentUpload: func.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingDocumentsFormComponent);
