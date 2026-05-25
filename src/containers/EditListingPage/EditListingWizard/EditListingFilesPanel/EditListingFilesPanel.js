import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, FileUpload, ListingLink } from '../../../../components';

import EditListingFilesForm from './EditListingFilesForm';
import css from './EditListingFilesPanel.module.css';
import { useConfiguration } from '../../../../context/configurationContext';

/**
 * The EditListingFilesPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Object} props.errors - The errors object
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Array} props.fileUploads - Array of file upload state objects
 * @param {boolean} props.fileUploadsDisabled - Whether file uploads were disabled at runtime
 * @param {boolean} props.hasPendingFileUploads - Whether any file is still uploading
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {Function} props.onUploadFile - The file upload function
 * @param {Function} props.onClearUploadedFiles - The function to remove uploaded files from state
 * @param {Function} props.onDownloadFile - The function to download a file
 * @param {string} props.submitButtonText - The submit button text
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Function} props.onSubmit - The submit function
 * @param {Function} props.updatePageTitle - The update page title function
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const EditListingFilesPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    ready,
    fileUploads,
    fileUploadsDisabled,
    listing,
    onUploadFile,
    onClearUploadedFiles,
    onDownloadFile,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    updatePageTitle: UpdatePageTitle,
    intl,
    hasPendingFileUploads,
  } = props;

  const config = useConfiguration();

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isDraft = listing?.id && listing?.attributes?.state === LISTING_STATE_DRAFT;

  const panelHeadingProps = isDraft
    ? {
        id: 'EditListingFilesPanel.createListingTitle',
        values: { lineBreak: <br /> },
        messageProps: {},
      }
    : {
        id: 'EditListingFilesPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      };

  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(
    conf => conf.listingType === listing?.attributes?.publicData?.listingType
  );

  const allowFiles =
    !config.accessControl.marketplace.fileUploadAndDownloadDisabled && !fileUploadsDisabled;
  const listingTypeHasFileAttachments = foundListingTypeConfig?.defaultListingFields?.files;
  const showAttachFiles = listingTypeHasFileAttachments && allowFiles;

  const onUploadFileToPanel = file => {
    if (file) {
      const tempId = `${file.name}-${Date.now()}`;
      onUploadFile(file, tempId);
    }
  };

  // By default, the EditListingFilesForm submit button is disabled if
  // any files are still uploading or have an error. If you make changes to that
  // logic, adjust this logic to filter out pending or failed uploads.
  const handleFilesSubmit = () => {
    const protectedFileAttachments = fileUploads
      .filter(f => f.file)
      .map(f => ({ fileId: f.file.id }));
    return onSubmit({ protectedFileAttachments });
  };

  const onRemoveFileFromPanel = tempId => {
    onClearUploadedFiles([tempId]);
  };

  const showDisabledFilesError = listingTypeHasFileAttachments && !allowFiles;
  const showUploads = showAttachFiles && fileUploads?.length > 0;

  return (
    <main className={classes}>
      <UpdatePageTitle
        panelHeading={intl.formatMessage(
          { id: panelHeadingProps.id },
          { ...panelHeadingProps.messageProps }
        )}
      />
      <H3 as="h1">
        <FormattedMessage id={panelHeadingProps.id} values={{ ...panelHeadingProps.values }} />
      </H3>
      {showDisabledFilesError ? (
        <p className={css.error}>
          <FormattedMessage
            id="EditListingFilesForm.messageFilesDisabled"
            values={{ marketplaceName: config.marketplaceName }}
          />
        </p>
      ) : (
        <>
          {showUploads && (
            <div className={css.files}>
              {fileUploads.map(f => (
                <FileUpload
                  item={f}
                  key={f.tempId}
                  onRemoveFile={onRemoveFileFromPanel}
                  onDownloadFile={onDownloadFile}
                />
              ))}
            </div>
          )}
          <EditListingFilesForm
            className={css.form}
            rootClassName={css.editListingFilesForm}
            ready={ready}
            updated={panelUpdated}
            updateInProgress={updateInProgress}
            fetchErrors={errors}
            onSubmit={handleFilesSubmit}
            saveActionMsg={submitButtonText}
            onFileUpload={onUploadFileToPanel}
            files={fileUploads}
            showAttachFiles={showAttachFiles}
            isDraft={isDraft}
            hasPendingFileUploads={hasPendingFileUploads}
          />
        </>
      )}
    </main>
  );
};

export default EditListingFilesPanel;
