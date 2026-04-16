import React from 'react';
import { analyseFileName } from '../../util/fileHelpers';

import css from './FileName.module.css';

const FileName = ({ name, className }) => {
  const { baseName, extension } = analyseFileName(name);
  return (
    <span className={className || css.root}>
      <span className={css.baseName}>{baseName}</span>
      {extension ? <span className={css.extension}>{extension}</span> : null}
    </span>
  );
};

export default FileName;
