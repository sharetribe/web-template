import React from 'react';
import classNames from 'classnames';

import css from './AspectRatioWrapper.module.css';

/**
 * Container that maintains a given aspect ratio, which should be given through width and heigh props
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {number} props.width
 * @param {number} props.height
 * @param {ReactNode} props.children
 * @returns {JSX.Element} container element that maintains given aspect ratio
 */
const AspectRatioWrapper = props => {
  const { children, className, rootClassName, width, height, ...rest } = props;
  const classes = classNames(rootClassName || css.root, className);

  const aspectRatio = (height / width) * 100;
  const paddingBottom = `${aspectRatio}%`;

  return (
    <div className={classes} {...rest}>
      <div className={css.aspectPadding} style={{ paddingBottom }}>
        <div className={css.aspectBox}>{children}</div>
      </div>
    </div>
  );
};

export default AspectRatioWrapper;
