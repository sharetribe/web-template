import React from 'react';
import { analyseFileName } from '../../util/fileHelpers';

import css from './FileName.module.css';
import classNames from 'classnames';

/**
 * Renders a file name as two inline spans so the base name can truncate with ellipsis while the
 * extension stays fully visible. The split is performed by `analyseFileName` helper.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.name] - Full file name including extension (e.g. `"archive.tar.gz"`)
 * @param {string} [props.rootClassName] - CSS class to replace the default styling of the root span
 * @param {string} [props.className] - additional CSS class applied to the root span
 * @returns {JSX.Element}
 */
const FileName = props => {
  const { name, rootClassName, className } = props;
  const { baseName, extension } = analyseFileName(name);
  const classes = classNames(rootClassName || css.root, className);
  return (
    <span className={classes}>
      <span className={css.dynamicNameBeginning}>{baseName}</span>
      {extension ? <span className={css.fixedNameEnding}>{extension}</span> : null}
    </span>
  );
};

export default FileName;
