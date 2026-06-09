import React, { useState } from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';

import { Button, Form, H5 } from '../../../../components';

import { MAX_FILE_UPLOAD_COUNT } from '../../../../util/fileHelpers';

import css from './EditListingFilesForm.module.css';

export const FieldAddFile = props => {
  const { onFileUpload, showFileLink, ...rest } = props;
  if (!showFileLink) {
    return null;
  }

  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { input, label, className } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const file = e.target.files[0];
          onFileUpload(file);
        };
        const inputProps = { id: name, name, onChange, type };
        return (
          <label className={className}>
            <input {...inputProps} className={css.hiddenFileInput} />
            {label}
          </label>
        );
      }}
    </Field>
  );
};

const IconAttachFile = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.6667 10.8333C17.1269 10.8333 17.5 11.2064 17.5 11.6667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V11.6667C2.5 11.2064 2.8731 10.8333 3.33333 10.8333C3.79357 10.8333 4.16667 11.2064 4.16667 11.6667V15.4167C4.16667 15.6468 4.35321 15.8333 4.58333 15.8333H15.4167C15.6468 15.8333 15.8333 15.6468 15.8333 15.4167V11.6667C15.8333 11.2064 16.2064 10.8333 16.6667 10.8333Z"
        fill="currentColor"
      />
      <path
        d="M9.99997 13.3333C9.53976 13.3332 9.16664 12.9601 9.16664 12.4999L9.16664 5.34497L7.25583 7.25578C6.93039 7.58119 6.40287 7.58121 6.07744 7.25578C5.75205 6.93035 5.75205 6.40282 6.07744 6.0774L9.41078 2.74406C9.7362 2.41864 10.2637 2.41866 10.5892 2.74406L13.9225 6.0774C14.2479 6.40283 14.2479 6.93034 13.9225 7.25578C13.5971 7.58119 13.0695 7.58121 12.7441 7.25578L10.8333 5.34497V12.4999C10.8333 12.9602 10.4602 13.3333 9.99997 13.3333Z"
        fill="currentColor"
      />
    </svg>
  );
};

/**
 * The EditListingFilesForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} [props.updateInProgress] - Whether the update is in progress
 * @param {Object} props.fetchErrors - The fetch errors object
 * @param {propTypes.error} [props.fetchErrors.updateListingError] - The update listing error
 * @param {string} props.saveActionMsg - The save action message
 * @param {Function} props.onFileUpload - The file upload function
 * @param {Array} props.files - Array of file upload state objects
 * @param {boolean} props.showAttachFiles - Whether to show the file upload UI
 * @param {boolean} props.isDraft - Whether the listing is a draft
 * @param {boolean} [props.hasPendingFileUploads] - Whether any file is still uploading
 * @returns {JSX.Element}
 */
export const EditListingFilesForm = props => {
  // null = never submitted, [] = submitted with no files
  const [submittedFileIds, setSubmittedFileIds] = useState(null);

  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        const {
          className,
          rootClassName,
          ready,
          updated,
          updateInProgress = false,
          fetchErrors,
          handleSubmit,
          saveActionMsg,
          onFileUpload,
          invalid,
          files,
          showAttachFiles,
          isDraft,
          hasPendingFileUploads,
        } = formRenderProps;

        const classes = classNames(rootClassName || css.root, className);

        const { updateListingError } = fetchErrors || {};

        const currentReadyFileIds = files?.filter(f => f.file).map(f => f.file.id.uuid) ?? [];
        const pristineSinceLastSubmit =
          submittedFileIds !== null && isEqual(currentReadyFileIds, submittedFileIds);

        // If listing is published, files must be verified before moving on through the wizard
        const filesVerifiedIfPublished =
          isDraft ||
          (Array.isArray(files) &&
            files.length > 0 &&
            files.every(
              file =>
                !file.verificationInProgress &&
                file.error === null &&
                file.verificationStatus === 'available'
            ));

        const hasFileErrors =
          Array.isArray(files) && files.length > 0 && files.some(file => file.error !== null);

        // Files are not ready if the attach-files feature is enabled AND:
        // 1) No files have been uploaded yet
        // 2) Any file is still uploading or has an error
        // 3) or the listing has been published (edit flow) and some files are still awaiting verification
        const filesNotReady =
          showAttachFiles &&
          (!files?.length || hasPendingFileUploads || hasFileErrors || !filesVerifiedIfPublished);

        const submitReady = (updated && pristineSinceLastSubmit) || ready;
        const submitInProgress = updateInProgress;

        const submitDisabled = invalid || submitInProgress || filesNotReady;
        const showFileLink = showAttachFiles && (!files || files?.length < MAX_FILE_UPLOAD_COUNT);

        const addFileLabel = (
          <>
            <IconAttachFile />
            <FormattedMessage id="EditListingFilesForm.uploadFile" />
          </>
        );

        const UpdateListingError = props => {
          return props.error ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingFilesForm.updateFailed" />
            </p>
          ) : null;
        };

        return (
          <Form
            className={classes}
            onSubmit={e => {
              setSubmittedFileIds(currentReadyFileIds);
              handleSubmit(e);
            }}
          >
            <FieldAddFile
              id="addFile"
              name="addFile"
              label={addFileLabel}
              type="file"
              onFileUpload={onFileUpload}
              className={css.fileLink}
              showFileLink={showFileLink}
            />
            <H5 as="h2" className={css.helpText}>
              <FormattedMessage id="EditListingFilesForm.helpText" />
            </H5>

            <UpdateListingError error={updateListingError} />

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

export default EditListingFilesForm;
