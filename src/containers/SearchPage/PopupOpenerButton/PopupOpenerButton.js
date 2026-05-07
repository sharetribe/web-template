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
  const { isSelected = false, labelMaxWidth = null, toggleOpen, children, ...rest } = props;

  const labelStyles = isSelected ? css.labelSelected : css.label;
  const labelMaxWidthMaybe = labelMaxWidth ? { maxWidth: `${labelMaxWidth}px` } : {};
  const labelMaxWidthStyles = labelMaxWidth ? css.labelEllipsis : null;

  return (
    <button
      className={classNames(labelStyles, labelMaxWidthStyles)}
      style={labelMaxWidthMaybe}
      onClick={() => toggleOpen()}
      {...rest}
    >
      {children} &nbsp;
      <svg style={{fill:"transparent"}} width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.75 0.75L4.75 4.75L8.75 0.75" stroke="#414651" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>


    </button>
  );
};

export default PopupOpenerButton;
