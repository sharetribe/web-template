import React from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { calculateFileSize } from '../../util/fileHelpers';
import { FileName } from '../../components';

import css from './FileUpload.module.css';

const IconCheck = () => (
  <svg
    className={css.iconCheck}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.6635 3.02644C17.0631 3.25479 17.2019 3.76383 16.9735 4.16343L10.2707 15.8934C9.77035 16.769 8.55357 16.8846 7.89726 16.1189L3.11729 10.5423C2.81777 10.1929 2.85824 9.66678 3.20768 9.36727C3.55712 9.06775 4.0832 9.10822 4.38272 9.45765L8.9703 14.8098L15.5265 3.33653C15.7548 2.93693 16.2639 2.7981 16.6635 3.02644Z"
      fill="currentColor"
    />
  </svg>
);

const IconSpinner = () => (
  <svg
    className={css.iconSpinner}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <path
      d="M16.6667 10.0001C16.6667 8.68152 16.2753 7.39277 15.5428 6.29644C14.8103 5.20017 13.7693 4.34578 12.5512 3.84119C11.3331 3.33663 9.99266 3.20396 8.69951 3.46114C7.4063 3.71838 6.21795 4.35334 5.2856 5.28569C4.35325 6.21805 3.71829 7.40639 3.46105 8.6996C3.20387 9.99275 3.33654 11.3332 3.8411 12.5513C4.34569 13.7694 5.20007 14.8104 6.29635 15.5429C7.39268 16.2754 8.68142 16.6667 9.99997 16.6667C10.4602 16.6667 10.8333 17.0398 10.8333 17.5001C10.8333 17.9603 10.4602 18.3334 9.99997 18.3334C8.35179 18.3334 6.74065 17.8445 5.37024 16.9288C3.99988 16.0131 2.93129 14.712 2.30057 13.1894C1.66984 11.6666 1.50539 9.99059 1.82693 8.37408C2.14851 6.75767 2.94183 5.27268 4.10721 4.1073C5.27259 2.94192 6.75757 2.1486 8.37399 1.82703C9.9905 1.50548 11.6665 1.66993 13.1893 2.30066C14.7119 2.93139 16.013 3.99998 16.9287 5.37033C17.8444 6.74074 18.3333 8.35188 18.3333 10.0001C18.3333 10.4603 17.9602 10.8334 17.5 10.8334C17.0398 10.8334 16.6667 10.4603 16.6667 10.0001Z"
      fill="currentColor"
    />
  </svg>
);

const IconError = () => (
  <svg
    className={css.iconError}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <path
      d="M9.99999 12.5001C10.4602 12.5001 10.8333 12.8732 10.8333 13.3334C10.8333 13.7937 10.4602 14.1667 9.99999 14.1667C9.53975 14.1667 9.16666 13.7937 9.16666 13.3334C9.16666 12.8732 9.53975 12.5001 9.99999 12.5001Z"
      fill="currentColor"
    />
    <path
      d="M9.99999 5.83342C10.4602 5.83342 10.8333 6.20651 10.8333 6.66675V10.4167C10.8333 10.877 10.4602 11.2501 9.99999 11.2501C9.53975 11.2501 9.16666 10.877 9.16666 10.4167V6.66675C9.16666 6.20651 9.53975 5.83342 9.99999 5.83342Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.99999 1.66675C14.6024 1.66675 18.3333 5.39771 18.3333 10.0001C18.3333 14.6025 14.6024 18.3334 9.99999 18.3334C5.39762 18.3334 1.66666 14.6025 1.66666 10.0001C1.66666 5.39771 5.39762 1.66675 9.99999 1.66675ZM9.99999 3.33341C6.31809 3.33341 3.33332 6.31818 3.33332 10.0001C3.33332 13.682 6.31809 16.6667 9.99999 16.6667C13.6819 16.6667 16.6667 13.682 16.6667 10.0001C16.6667 6.31818 13.6819 3.33341 9.99999 3.33341Z"
      fill="currentColor"
    />
  </svg>
);

const IconCross = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.4714 2.52876C13.7317 2.78911 13.7317 3.21122 13.4714 3.47157L8.94282 8.00012L13.4714 12.5288C13.7318 12.7891 13.7318 13.2112 13.4714 13.4716C13.2111 13.7319 12.789 13.7319 12.5286 13.4716L8.00002 8.94293L3.47145 13.4715C3.2111 13.7319 2.78899 13.7319 2.52864 13.4715C2.26829 13.2112 2.26829 12.7891 2.52864 12.5287L7.05721 8.00012L2.52872 3.47162C2.26837 3.21127 2.26837 2.78916 2.52872 2.52881C2.78907 2.26846 3.21118 2.26846 3.47153 2.52881L8.00002 7.05731L12.5286 2.52876C12.7889 2.26841 13.211 2.26841 13.4714 2.52876Z"
      fill="currentColor"
    />
  </svg>
);

const FileUpload = props => {
  const { item, className, onRemoveFile, onDownloadFile } = props;
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

  let statusIcon;
  if (uploadInProgress || verificationInProgress) {
    // TODO include progress functionality
    statusIcon = <IconSpinner />;
  } else if (hasError) {
    statusIcon = <IconError />;
  } else if (hasCompletedUpload) {
    statusIcon = <IconCheck />;
  }

  let statusText;
  if (uploadInProgress) {
    statusText = <FormattedMessage id="FileUpload.uploading" />;
  } else if (verificationInProgress) {
    statusText = <FormattedMessage id="FileUpload.verifying" />;
  } else if (hasError) {
    statusText =
      error.reason === 'verificationFailed' ? (
        <FormattedMessage id="FileUpload.verificationFailed" />
      ) : error.reason === 'timeout' ? (
        <FormattedMessage id="FileUpload.verificationFailed" />
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

  const rootClass = classNames(className || css.root, hasError && css.error);
  const fileInfoClass = classNames(css.fileInfo, hasError && css.fileInfoError);

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
    <div className={rootClass}>
      <span className={css.statusIcon}>{statusIcon}</span>
      <div className={fileInfoClass}>
        {fileNameElement}
        <span className={css.statusText}>{statusText}</span>
      </div>
      <button
        className={css.removeButton}
        onClick={() => onRemoveFile(tempId)}
        aria-label={intl.formatMessage({ id: 'FileUpload.removeFile' })}
      >
        <IconCross />
      </button>
    </div>
  );
};

export default FileUpload;
