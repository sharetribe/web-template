import React from 'react';
import classNames from 'classnames';

import css from './BlockContainer.module.css';

/**
 * This element can be used to wrap some common styles and features,
 * if there are multiple blockTypes.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.as tag/element name. Defaults to 'div'.
 * @returns {JSX.Element} containing wrapper that can be used inside Block components.
 */
const BlockContainer = props => {
  const { className, rootClassName, as, ...otherProps } = props;
  const Tag = as || 'div';
  const classes = classNames(rootClassName || css.root, className);

  // Note: otherProps contains "children" too!
  return <Tag className={classes} {...otherProps} />;
};

export default BlockContainer;
