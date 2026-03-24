import React, { useEffect, useState } from 'react';
import { calculateFileSize } from '../../util/fileHelpers';

import css from './FileUpload.module.css';

const FileUpload = props => {
  const { item, className, onRemoveFile } = props;
  const { file, tempId } = item;
  const { size: sizeRaw } = file;
  const { size, unit } = calculateFileSize(sizeRaw);

  return (
    <div className={className || css.root}>
      <span>{file.name}</span>
      <span>
        {size} {unit}
      </span>
      <span onClick={() => onRemoveFile(tempId)}>X</span>
    </div>
  );
};

export default FileUpload;
