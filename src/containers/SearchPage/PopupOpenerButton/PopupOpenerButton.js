import React from 'react';
import classNames from 'classnames';

import css from './PopupOpenerButton.module.css';

/**
 * PopupOpenerButton component
 *
 * @component
 * @param {Object} props
 * @param {boolean} [props.isSelected] - Whether the filter is selected
 * @param {number} [props.labelMaxWidth] - The maximum width of the label
 * @param {Function} props.toggleOpen - The function to toggle the filter
 * @param {React.Node} props.children - The children
 * @returns {JSX.Element}
 */
const PopupOpenerButton = props => {
  const { isSelected = false, labelMaxWidth = null, toggleOpen, children } = props;

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

export default PopupOpenerButton;
