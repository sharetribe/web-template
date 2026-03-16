import React from 'react';
import classNames from 'classnames';

import css from './Overlay.module.css';

/**
 * Overlay
 *
 * @param {Object} props
 * @param {string} [props.as] - Root element: 'div' or 'button' (when 'button', overlay is clickable and onClick is used)
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.message] - The message
 * @param {string} [props.errorMessage] - The error message
 * @param {React.ReactNode} [props.children] - The children
 * @returns {JSX.Element} Overlay component
 */
const Overlay = props => {
  const { as = 'div', className, rootClassName, message, errorMessage, children, onClick } = props;

  const Tag = as || 'div';
  const tagProps = {
    className: classNames(rootClassName || css.root, className),
    onClick: event => {
      event.preventDefault();
      event.stopPropagation();
    },
  };

  return (
    <Tag {...tagProps}>
      <div className={css.overlay} />
      <div className={css.overlayContent}>
        {errorMessage ? <div className={css.errorMessage}>{errorMessage}</div> : null}
        {message ? <div className={css.message}>{message}</div> : null}
        {children}
      </div>
    </Tag>
  );
};

export default Overlay;
