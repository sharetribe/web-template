import React from 'react';
import classNames from 'classnames';

import css from './ValidationError.module.css';

/**
 * This component can be used to show validation errors next to form
 * input fields. The component takes the final-form Field component
 * `meta` object as a prop and infers if an error message should be
 * shown.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Object} props.fieldMeta - The field meta object (Final Form Field meta)
 * @param {boolean} props.fieldMeta.touched - Whether the field has been touched
 * @param {string} [props.fieldMeta.error] - The error message
 * @returns {JSX.Element} Validation error component
 */
const ValidationError = props => {
  const { rootClassName, className, fieldMeta } = props;
  const { touched, error } = fieldMeta;
  const classes = classNames(rootClassName || css.root, className);
  return touched && error ? <div className={classes}>{error}</div> : null;
};

export default ValidationError;
