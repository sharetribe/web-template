import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { ValidationError } from '../../../components';

import css from './FieldPhoneWithCountry.module.css';

const DIAL_CODE = '+31';

/**
 * A custom phone input with a fixed NL dial code (+31) prefix and a numeric input.
 *
 * The Final Form field value is stored as: `+31 <number>`
 * e.g. "+31 0612345678"
 *
 * @component
 * @param {Object} props
 * @param {string} props.id - Input id (required when label is provided)
 * @param {string} [props.label] - Field label
 * @param {string} [props.placeholder] - Phone number input placeholder
 * @param {string} [props.name] - Final Form field name
 * @param {string} [props.className] - Class for the root element
 * @param {Function} [props.validate] - Final Form validation function
 * @returns {JSX.Element}
 */
const FieldPhoneWithCountry = props => {
  const { id, label, placeholder, name, className, validate } = props;

  return (
    <Field name={name} validate={validate}>
      {fieldProps => {
        const { input, meta } = fieldProps;
        const { touched, error } = meta;
        const hasError = !!(touched && error);

        // Parse stored value: "+31 <digits>" → extract just the digits portion
        const storedValue = input.value || '';
        const storedNumber = storedValue.startsWith(`${DIAL_CODE} `)
          ? storedValue.slice(DIAL_CODE.length + 1)
          : '';

        const handleNumberChange = e => {
          const digits = e.target.value.replace(/\D/g, '');
          // Pass empty string when no digits so required validator fires correctly
          input.onChange(digits ? `${DIAL_CODE} ${digits}` : '');
        };

        const rootClasses = classNames(css.root, className);
        const rowClasses = classNames(css.phoneRow, {
          [css.phoneRowError]: hasError,
        });

        return (
          <div className={rootClasses}>
            {label ? (
              <label htmlFor={id} className={css.label}>
                {label}
              </label>
            ) : null}

            <div className={rowClasses}>
              {/* Dial code — static display */}
              <div className={css.dialCodeSegment} aria-hidden="true">
                <span className={css.dialCodeText}>{DIAL_CODE}</span>
              </div>

              {/* Phone number input */}
              <input
                id={id}
                className={css.numberInput}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={placeholder}
                value={storedNumber}
                onChange={handleNumberChange}
                onBlur={input.onBlur}
                onFocus={input.onFocus}
                autoComplete="tel-national"
              />
            </div>

            <ValidationError fieldMeta={{ touched, error }} />
          </div>
        );
      }}
    </Field>
  );
};

export default FieldPhoneWithCountry;
