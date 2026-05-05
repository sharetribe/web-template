import React from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { calculateFileSize } from '../../util/fileHelpers';
import { FileName } from '../../components';

import { IconCheck } from './IconCheck';
import { IconProgressCircle } from './IconProgressCircle';
import { IconSpinner } from './IconSpinner';
import { IconError } from './IconError';
import { IconCross } from './IconCross';

import css from './FileUpload.module.css';

const FILE_UPLOADING = 'uploading';
const FILE_FINISHING_UPLOAD = 'finishingUpload';
const FILE_VERIFYING = 'verifying';
const FILE_UPLOAD_COMPLETE = 'complete';
const FILE_UPLOAD_FAILED = 'failed';

/**
 * Maps raw upload item flags to one of five mutually exclusive upload state strings.
 *
 * @param {Object} fileItem - A fileUploads Redux state entry
 * @returns {string|null} One of the FILE_* state constants, or null for an unrecognized state
 */
const deriveFileUploadState = fileItem => {
  const { uploadInProgress, verificationInProgress, progress, error, file } = fileItem;

  if (error) {
    return FILE_UPLOAD_FAILED;
  } else if (uploadInProgress && progress === 100) {
    return FILE_FINISHING_UPLOAD;
  } else if (verificationInProgress) {
    return FILE_VERIFYING;
  } else if (uploadInProgress) {
    return FILE_UPLOADING;
  } else if (file) {
    return FILE_UPLOAD_COMPLETE;
  } else {
    return null;
  }
};

/**
 * Renders the status icon for the current upload state.
 * UPLOADING → progress circle; FINISHING_UPLOAD and VERIFYING → spinner;
 * FAILED → error icon; COMPLETE → check icon.
 *
 * @param {Object} props
 * @param {string} props.uploadState - One of the FILE_* state constants
 * @param {number|null} props.progress - Upload progress 0–100, forwarded to IconProgressCircle
 * @returns {JSX.Element}
 */
const StatusIcon = props => {
  const { uploadState, progress } = props;
  let statusIcon;
  if (uploadState === FILE_UPLOADING) {
    statusIcon = <IconProgressCircle progress={progress} />;
  } else if (uploadState === FILE_FINISHING_UPLOAD || uploadState === FILE_VERIFYING) {
    statusIcon = <IconSpinner />;
  } else if (uploadState === FILE_UPLOAD_FAILED) {
    statusIcon = <IconError />;
  } else if (uploadState === FILE_UPLOAD_COMPLETE) {
    statusIcon = <IconCheck />;
  }
  return <span className={css.statusIcon}>{statusIcon}</span>;
};

/**
 * Renders the status text for the current upload state.
 * In-progress states show i18n copy; FAILED shows an error-specific message;
 * COMPLETE shows the formatted file size.
 *
 * @param {Object} props
 * @param {string} props.uploadState - One of the FILE_* state constants
 * @param {Object|null} props.error - Error object with a `message` string (used in FAILED state)
 * @param {Object|null} props.file - SDK file entity with `attributes.size` (used in COMPLETE state)
 * @param {string} props.locale - locale string for file size formatting
 * @returns {JSX.Element}
 */
const StatusText = props => {
  const { uploadState, error, file, locale } = props;
  let statusText;

  if (uploadState === FILE_UPLOADING) {
    statusText = <FormattedMessage id="FileUpload.uploading" />;
  } else if (uploadState === FILE_FINISHING_UPLOAD) {
    statusText = <FormattedMessage id="FileUpload.finishingUpload" />;
  } else if (uploadState === FILE_VERIFYING) {
    statusText = <FormattedMessage id="FileUpload.verifying" />;
  } else if (uploadState === FILE_UPLOAD_FAILED) {
    statusText =
      error.message === 'verificationFailed' ? (
        <FormattedMessage id="FileUpload.verificationFailed" />
      ) : error.message === 'mimeTypeError' ? (
        <FormattedMessage id="FileUpload.mimeTypeError" />
      ) : error.message === 'timeout' ? (
        <FormattedMessage id="FileUpload.uploadFailed" />
      ) : error.message ? (
        error.message
      ) : (
        <FormattedMessage id="FileUpload.uploadFailed" />
      );
  } else if (uploadState === FILE_UPLOAD_COMPLETE) {
    const { size } = file?.attributes;
    statusText = calculateFileSize(size, locale);
  }

  return <span className={css.statusText}>{statusText}</span>;
};

/**
 * Displays a single file item during or after upload, with a status icon, file name, and
 * status text. The displayed state is derived from the item's upload and verification flags.
 * Renders nothing for items in an unrecognized state (e.g. before any upload has started).
 *
 * @component
 * @param {Object} props
 * @param {Object} props.item - Upload item from Redux state (TransactionPage.fileUploads entry)
 * @param {string} props.item.tempId - Client-side temporary identifier
 * @param {boolean} props.item.uploadInProgress - True while uploading to storage or in pendingUpload phase
 * @param {boolean} props.item.verificationInProgress - True while the backend is verifying the file
 * @param {number|null} props.item.progress - Upload progress 0–100; null before the first progress event
 * @param {string|null} props.item.verificationStatus - SDK file state: 'pendingUpload' | 'pendingVerification' | 'available' | 'verificationFailed' | null
 * @param {Object|null} props.item.file - SDK file entity; set once the file resource is created
 * @param {File|null} props.item.sourceFile - Browser File object; present during upload, cleared on completion
 * @param {Object|null} props.item.error - Error with a `message` string; null if no error
 * @param {string} [props.rootClassName] - Overrides the root CSS class
 * @param {string} [props.className] - Additional CSS classes appended to the root element
 * @param {Function} props.onRemoveFile - Called with `tempId` when the remove button is clicked
 * @param {Function} props.onDownloadFile - Called with `(fileId, download)` when the file name is clicked (COMPLETE state only)
 * @returns {JSX.Element|null}
 */
const FileUpload = props => {
  const { item, rootClassName, className, onRemoveFile, onDownloadFile } = props;
  const { file, tempId, progress, sourceFile, error } = item;
  const intl = useIntl();

  const name = file?.attributes?.name ?? sourceFile?.name;

  const uploadState = deriveFileUploadState(item);

  if (!uploadState) {
    return null;
  }

  const hasError = uploadState === FILE_UPLOAD_FAILED && (sourceFile || file);

  const classes = classNames(rootClassName || css.root, className, { [css.error]: hasError });
  const fileInfoClass = classNames(css.fileInfo, { [css.error]: hasError });

  const isDownloadable = uploadState === FILE_UPLOAD_COMPLETE;
  const fileNameElement = isDownloadable ? (
    <button
      type="button"
      className={classNames(css.fileNameDownloadable)}
      onClick={() => onDownloadFile(file.id.uuid, true)}
    >
      <FileName name={name} />
    </button>
  ) : (
    <FileName name={name} />
  );

  return (
    <div className={classes}>
      <StatusIcon uploadState={uploadState} progress={progress} />
      <div className={fileInfoClass}>
        {fileNameElement}

        <StatusText uploadState={uploadState} error={error} file={file} locale={intl.locale} />
      </div>
      <button
        className={css.removeButton}
        onClick={() => onRemoveFile(tempId)}
        aria-label={intl.formatMessage({ id: 'FileUpload.removeFile' }, { fileName: name })}
      >
        <IconCross />
      </button>
    </div>
  );
};

export default FileUpload;
