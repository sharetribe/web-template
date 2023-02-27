import React from 'react';
import { bool, func, node, number } from 'prop-types';
import classNames from 'classnames';

import css from './PopupOpenerButton.module.css';

const PopupOpenerButton = props => {
  const { isSelected, labelMaxWidth, toggleOpen, children } = props;

  const labelStyles = isSelected ? css.labelSelected : css.label;
  const labelMaxWidthMaybe = labelMaxWidth ? { maxWidth: `${labelMaxWidth}px` } : {};
  const labelMaxWidthStyles = labelMaxWidth ? css.labelEllipsis : null;

  return (
    <button
      className={classNames(labelStyles, labelMaxWidthStyles)}
      style={labelMaxWidthMaybe}
      onClick={() => toggleOpen()}
    >
      {children}
    </button>
  );
};

PopupOpenerButton.defaultProps = {
  isSelected: false,
  labelMaxWidth: null,
};

PopupOpenerButton.propTypes = {
  isSelected: bool,
  toggleOpen: func.isRequired,
  children: node.isRequired,
  labelMaxWidth: number,
};

export default PopupOpenerButton;
