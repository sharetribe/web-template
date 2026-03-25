import React, { useEffect, useState } from 'react';
import { calculateFileSize } from '../../util/fileHelpers';

import css from './FileUpload.module.css';

const FileUpload = props => {
  const { item, className, onRemoveFile } = props;
  const { file, tempId } = item;

  if (!file) {
    return;
  }

  const { size: sizeRaw, name } = file?.attributes;
  const { size, unit } = calculateFileSize(sizeRaw);

  return (
    <div className={className || css.root}>
      <span>{name}</span>
      <span>
        {size} {unit}
      </span>
      <span onClick={() => onRemoveFile(tempId)}>X</span>
    </div>
  );
};

export default FileUpload;
