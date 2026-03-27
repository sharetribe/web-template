import React, { useEffect, useState } from 'react';
import { calculateFileSize } from '../../util/fileHelpers';

import css from './FileUpload.module.css';

const FileUpload = props => {
  const { item, className, onRemoveFile } = props;
  const { file, tempId, progress, inProgress, sourceFile, error, verificationStatus } = item;

  const name = file?.attributes?.name ?? sourceFile?.name;

  const isPendingFile = inProgress && !file;
  const hasError = !inProgress && error && sourceFile;
  const hasCompletedUpload = file && !inProgress && !error;

  const isKnownState = isPendingFile || hasError || hasCompletedUpload;
  if (!isKnownState) {
    return null;
  }

  let statusContent;

  if (isPendingFile && progress < 100) {
    statusContent = <span>Uploading... | {progress} %</span>;
  } else if (isPendingFile && progress === 100 && verificationStatus !== 'available') {
    statusContent = <span>Verifying...</span>;
  } else if (hasError) {
    const errorMessage = error.message || 'Failed to upload.';
    statusContent = <span>(!) {errorMessage}</span>;
  } else if (hasCompletedUpload) {
    const { size: sizeRaw } = file?.attributes;
    const { size, unit } = calculateFileSize(sizeRaw);
    statusContent = (
      <span>
        {size} {unit}
      </span>
    );
  }

  return (
    <div className={className || css.root}>
      <span>{name}</span>
      {statusContent}
      <span onClick={() => onRemoveFile(tempId)}>X</span>
    </div>
  );
};

export default FileUpload;
