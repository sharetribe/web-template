import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { ValidationError } from '../../../components';

import css from './FieldUrlInput.module.css';

const PREFIX = 'https://';

/**
 * A custom URL input with:
 * - An optional icon rendered to the LEFT of the input box (not inside it)
 * - A fixed "https://" prefix shown inside the box
 * - Normal Final Form field behaviour (validation, error display below)
 *
 * The stored value is the full URL: `https://<userInput>`.
 * An empty input stores an empty string so required validators work correctly.
 *
 * @component
 * @param {Object} props
 * @param {string} props.id - Input id
 * @param {string} [props.label] - Field label
 * @param {string} [props.placeholder] - Placeholder for the editable part (after https://)
 * @param {string} props.name - Final Form field name
 * @param {string} [props.className] - Class for the root element
 * @param {Function} [props.validate] - Final Form validation function
 * @param {React.ReactNode} [props.icon] - Icon node rendered to the left of the input box
 * @returns {JSX.Element}
 */
const FieldUrlInput = props => {
  const { id, label, placeholder, name, className, validate, icon } = props;

  return (
    <Field name={name} validate={validate}>
      {fieldProps => {
        const { input, meta } = fieldProps;
        const { touched, error } = meta;
        const hasError = !!(touched && error);

        // Strip the prefix for display; restore it on change
        const storedValue = input.value || '';
        const displayValue = storedValue.startsWith(PREFIX)
          ? storedValue.slice(PREFIX.length)
          : storedValue;

        const handleChange = e => {
          const raw = e.target.value;
          // Empty input → empty string so required validators fire correctly
          input.onChange(raw ? `${PREFIX}${raw}` : '');
        };

        const rootClasses = classNames(css.root, className);
        const inputBoxClasses = classNames(css.inputBox, {
          [css.inputBoxError]: hasError,
        });

        return (
          <div className={rootClasses}>
            {label ? (
              <label htmlFor={id} className={css.label}>
                {label}
              </label>
            ) : null}

            <div className={css.fieldRow}>
              {icon ? (
                <div className={css.iconWrapper} aria-hidden="true">
                  {icon}
                </div>
              ) : null}

              <div className={inputBoxClasses}>
                <span className={css.prefix} aria-hidden="true">
                  {PREFIX}
                </span>
                <input
                  id={id}
                  className={css.input}
                  type="text"
                  inputMode="url"
                  value={displayValue}
                  placeholder={placeholder}
                  onChange={handleChange}
                  onBlur={input.onBlur}
                  onFocus={input.onFocus}
                  autoComplete="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
            </div>

            <ValidationError fieldMeta={{ touched, error }} />
          </div>
        );
      }}
    </Field>
  );
};

export default FieldUrlInput;
