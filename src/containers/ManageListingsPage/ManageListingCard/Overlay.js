import React from 'react';
import classNames from 'classnames';

import css from './Overlay.module.css';

/**
 * Overlay
 *
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.message] - The message
 * @param {string} [props.errorMessage] - The error message
 * @param {React.ReactNode} [props.children] - The children
 * @returns {JSX.Element} Overlay component
 */
const Overlay = props => {
  const { className, rootClassName, message, errorMessage, children } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div
      className={classes}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className={css.overlay} />
      <div className={css.overlayContent}>
        {errorMessage ? <div className={css.errorMessage}>{errorMessage}</div> : null}
        {message ? <div className={css.message}>{message}</div> : null}
        {children}
      </div>
    </div>
  );
};

export default Overlay;
