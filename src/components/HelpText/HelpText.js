import React from 'react';
import classNames from 'classnames';

import css from './HelpText.module.css';

/**
 * This component can be used to show help text below form
 * input fields. It renders the given text string if present.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.helpText] - The help text to display
 * @returns {JSX.Element|null} Help text component
 */
const HelpText = props => {
  const { rootClassName, className, helpText } = props;
  const classes = classNames(rootClassName || css.root, className);
  return helpText ? (
    <p className={classes}>
      <span>{helpText}</span>
    </p>
  ) : null;
};

export default HelpText;
