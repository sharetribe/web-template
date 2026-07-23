import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { calculateFileSize } from '../../../util/fileHelpers';

import { Heading, FileName } from '../../../components';

import { IconDownload } from './IconDownload';
import { IconUnavailable } from './IconUnavailable';
import { IconSpinnerSmall } from './IconSpinnerSmall';
import { IconErrorSmall } from './IconErrorSmall';

import css from './FileAttachments.module.css';

/**
 * Abstracts an individual file attachment. A message or a transaction may have multiple
 * files attached to it.
 *
 * @param {Object} props
 * @param {Object} props.fileAttachment - The file attachment entity
 * @param {Function} props.onDownloadFile - Download handler
 * @param {Object} props.intl - Intl object
 * @param {string} [props.iconClassName] - Additional CSS class for the icon element
 * @param {string} [props.downloadUrl] - Temporary download URL for manual fallback link
 */
const FileAttachmentItem = props => {
  const { fileAttachment, onDownloadFile, intl, iconClassName, downloadUrl } = props;
  const { file } = fileAttachment;
  const isDeleted = !file || file.attributes?.deleted;

  const isAvailable = !isDeleted && file.attributes.state === 'available' && fileAttachment.file;
  const isVerifying = !isDeleted && file.attributes.state === 'pendingVerification';
  const isVerificationFailed = !isDeleted && file.attributes.state === 'verificationFailed';

  const iconClasses = classNames(
    css.fileAttachmentIcon,
    iconClassName || css.fileAttachmentIconDefault
  );

  if (isDeleted) {
    return (
      <div className={css.fileAttachment}>
        <span className={iconClasses}>
          <IconUnavailable />
        </span>
        <span className={css.fileAttachmentStatus}>
          <FormattedMessage id="Message.fileDeleted" />
        </span>
      </div>
    );
  }

  const name = file.attributes.name;

  if (isAvailable) {
    const formattedSize = calculateFileSize(file.attributes.size, intl.locale);
    return (
      <div className={css.fileAttachmentItem}>
        <button
          className={classNames(css.fileAttachment, css.fileAttachmentAvailable)}
          aria-label={intl.formatMessage({ id: 'Message.downloadFile' }, { fileName: name })}
          onClick={() => onDownloadFile(fileAttachment.id)}
        >
          <span className={iconClasses}>
            <IconDownload />
          </span>
          <FileName name={name} />
          <span className={css.fileAttachmentStatus}>{formattedSize}</span>
        </button>
        {downloadUrl ? (
          <p className={css.downloadFallback}>
            <FormattedMessage
              id="Message.downloadFallback"
              values={{
                link: (
                  <a
                    className={css.downloadFallbackLink}
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FormattedMessage
                      id="Message.downloadFallbackLink"
                      values={{ fileName: name }}
                    />
                  </a>
                ),
              }}
            />
          </p>
        ) : null}
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className={css.fileAttachment}>
        <span className={iconClasses}>
          <IconSpinnerSmall />
        </span>
        <FileName name={name} />
        <span className={css.fileAttachmentStatus}>
          <FormattedMessage id="Message.fileVerifying" />
        </span>
      </div>
    );
  }

  if (isVerificationFailed) {
    return (
      <div className={css.fileAttachment}>
        <span className={iconClasses}>
          <IconErrorSmall />
        </span>
        <FileName name={name} />
        <span className={css.fileAttachmentStatus}>
          <FormattedMessage id="Message.fileSecurityCheckFailed" />
        </span>
      </div>
    );
  }

  return null;
};

const FilesDisabledError = props => {
  const { marketplaceName } = props;
  return (
    <div className={css.fileAttachmentError}>
      <FormattedMessage id="TransactionPage.messageFilesDisabled" values={{ marketplaceName }} />
    </div>
  );
};

/**
 * Renders a list of file attachments with download support.
 * Shared between Message (publicFileAttachments) and TransactionPage (protectedFileAttachments).
 *
 * @param {Object} props
 * @param {Array} props.fileAttachments - The file attachment entities
 * @param {boolean} props.allowFiles - Whether file downloads are allowed
 * @param {Function} props.onDownloadFile - Download handler
 * @param {Object} [props.fileDownloads] - Map of file attachment uuid to download state
 * @param {Object} props.intl - Intl object
 * @param {string} props.marketplaceName - Marketplace name for disabled-files error
 * @param {string} [props.iconClassName] - Additional CSS class for the icon element
 */
export const FileAttachmentList = props => {
  const {
    fileAttachments,
    allowFiles,
    onDownloadFile,
    fileDownloads,
    intl,
    marketplaceName,
    iconClassName,
  } = props;
  if (!fileAttachments?.length) {
    return null;
  }

  if (!allowFiles) {
    return <FilesDisabledError marketplaceName={marketplaceName} />;
  }

  return fileAttachments.map(f => (
    <FileAttachmentItem
      fileAttachment={f}
      key={f.id.uuid}
      onDownloadFile={onDownloadFile}
      intl={intl}
      iconClassName={iconClassName}
      downloadUrl={fileDownloads?.[f.id.uuid]?.downloadUrl}
    />
  ));
};

/**
 * Transaction-specific file attachments panel with heading.
 * Renders the protected file attachments for download-process transactions.
 */
const FileAttachments = props => {
  const {
    className,
    rootClassName,
    isDownloadProcess,
    hideFiles,
    allowFiles,
    fileAttachments,
    onDownloadFile,
    fileDownloads,
    intl,
    marketplaceName,
  } = props;

  if (!isDownloadProcess || hideFiles) {
    return null;
  }

  if (allowFiles && !fileAttachments?.length) {
    return null;
  }

  const classes = classNames(rootClassName || css.container, className);

  return (
    <div className={classes}>
      <Heading as="h3" rootClassName={css.sectionHeading}>
        <FormattedMessage id="FileAttachments.heading" />
      </Heading>
      <div className={css.list}>
        <FileAttachmentList
          fileAttachments={fileAttachments}
          allowFiles={allowFiles}
          onDownloadFile={onDownloadFile}
          fileDownloads={fileDownloads}
          intl={intl}
          marketplaceName={marketplaceName}
        />
      </div>
    </div>
  );
};

export default FileAttachments;
