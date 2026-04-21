import React from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { calculateFileSize } from '../../util/fileHelpers';
import { FileName } from '../../components';

import { IconCheck } from './IconCheck';
import { IconSpinner } from './IconSpinner';
import { IconError } from './IconError';
import { IconCross } from './IconCross';

import css from './FileUpload.module.css';

const StatusIcon = props => {
  const { uploadInProgress, verificationInProgress, hasError, hasCompletedUpload } = props;
  let statusIcon;
  if (uploadInProgress || verificationInProgress) {
    // TODO include progress functionality
    return <IconSpinner />;
  } else if (hasError) {
    return <IconError />;
  } else if (hasCompletedUpload) {
    return <IconCheck />;
  }
  return <span className={css.statusIcon}>{statusIcon}</span>;
};

const StatusText = props => {
  const {
    uploadInProgress,
    verificationInProgress,
    hasError,
    error,
    hasCompletedUpload,
    file,
  } = props;
  let statusText;

  if (uploadInProgress) {
    statusText = <FormattedMessage id="FileUpload.uploading" />;
  } else if (verificationInProgress) {
    statusText = <FormattedMessage id="FileUpload.verifying" />;
  } else if (hasError) {
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
  } else if (hasCompletedUpload && !verificationInProgress) {
    const { size: sizeRaw } = file?.attributes;
    const { size, unit } = calculateFileSize(sizeRaw);
    statusText = `${size} ${unit}`;
  }

  return <span className={css.statusText}>{statusText}</span>;
};

const FileUpload = props => {
  const { item, rootClassName, className, onRemoveFile, onDownloadFile } = props;
  const {
    file,
    tempId,
    progress,
    uploadInProgress,
    verificationInProgress,
    sourceFile,
    error,
  } = item;
  const intl = useIntl();

  const name = file?.attributes?.name ?? sourceFile?.name;

  const hasError = !uploadInProgress && !verificationInProgress && error && (sourceFile || file);
  const hasCompletedUpload = !uploadInProgress && !error;

  const isKnownState =
    uploadInProgress || verificationInProgress || hasError || (hasCompletedUpload && file);
  if (!isKnownState) {
    return null;
  }

  const classes = classNames(rootClassName || css.root, className, { [css.error]: hasError });
  const fileInfoClass = classNames(css.fileInfo, { [css.error]: hasError });

  const isDownloadable = hasCompletedUpload && !verificationInProgress;
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
      <StatusIcon
        uploadInProgress={uploadInProgress}
        verificationInProgress={verificationInProgress}
        hasError={hasError}
        hasCompletedUpload={hasCompletedUpload}
      />
      <div className={fileInfoClass}>
        {fileNameElement}

        <StatusText
          uploadInProgress={uploadInProgress}
          verificationInProgress={verificationInProgress}
          hasError={hasError}
          error={error}
          hasCompletedUpload={hasCompletedUpload}
          file={file}
        />
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
