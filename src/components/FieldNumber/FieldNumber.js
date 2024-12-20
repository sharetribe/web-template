import React from 'react';
import classNames from 'classnames';
import { Field } from 'react-final-form';
import { injectIntl } from '../../util/reactIntl';

import css from './FieldNumber.module.css';

const decrement = 'decrement';
const increment = 'increment';

const getIconClasses = props => {
  const { className, disabled } = props;
  const classes = classNames(className, css.iconContainer, { [css.disabled]: disabled });
  const iconClassName = classNames(css.icon, { [css.disabled]: disabled });

  return {
    classes,
    iconClassName,
  };
};

const IconMinus = props => {
  const { classes, iconClassName } = getIconClasses(props);

  return (
    <svg
      className={classes}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0.5" y="0.5" width="39" height="39" rx="6" />
      <path
        className={iconClassName}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.5 20C11.5 19.4477 11.9477 19 12.5 19H27.5C28.0523 19 28.5 19.4477 28.5 20C28.5 20.5523 28.0523 21 27.5 21H12.5C11.9477 21 11.5 20.5523 11.5 20Z"
      />
    </svg>
  );
};

const IconPlus = props => {
  const { classes, iconClassName } = getIconClasses(props);

  return (
    <svg
      className={classes}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0.5" y="0.5" width="39" height="39" rx="6" />
      <path
        className={iconClassName}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 11.5C20.5523 11.5 21 11.9477 21 12.5V19.0001H27.5C28.0523 19.0001 28.5 19.4478 28.5 20.0001C28.5 20.5524 28.0523 21.0001 27.5 21.0001H21V27.5C21 28.0523 20.5523 28.5 20 28.5C19.4477 28.5 19 28.0523 19 27.5V21.0001H12.5C11.9477 21.0001 11.5 20.5524 11.5 20.0001C11.5 19.4478 11.9477 19.0001 12.5 19.0001H19V12.5C19 11.9477 19.4477 11.5 20 11.5Z"
      />
    </svg>
  );
};

const NumberInputComponent = props => {
  const { value: rawValue, onChange } = props.input;
  const { initialValue, minValue = 0, maxValue, svgClassName, intl } = props;
  const value =
    rawValue && rawValue >= minValue
      ? Number.parseInt(rawValue)
      : initialValue && initialValue >= minValue
      ? Number.parseInt(initialValue)
      : minValue;

  const handleValueChange = event => {
    const { name } = event.target;
    if (name === increment) {
      onChange(value + 1);
    } else if (name === decrement) {
      onChange(value - 1);
    }
  };

  return (
    <span className={css.numberInputWrapper}>
      <button
        className={css.numberButton}
        name={decrement}
        type="button"
        onClick={handleValueChange}
        disabled={value <= minValue}
        title={intl.formatMessage({ id: 'NumberInput.decrementButton' })}
      >
        <IconMinus disabled={value <= minValue} className={svgClassName} />
      </button>
      <span className={css.numberInput}>{value}</span>
      <button
        className={css.numberButton}
        name={increment}
        type="button"
        onClick={handleValueChange}
        disabled={value >= maxValue}
        title={intl.formatMessage({ id: 'NumberInput.incrementButton' })}
      >
        <IconPlus disabled={value >= maxValue} className={svgClassName} />
      </button>
    </span>
  );
};

const NumberInput = injectIntl(NumberInputComponent);

/**
 * Renders a numeric selector with - and + icons
 * @component
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {string?} props.svgClassName
 * @param {string?} props.textClassName
 * @param {string?} props.label
 * @param {number?} props.maxValue
 * @param {number?} props.minValue
 * @returns {JSX.Element} containing a numeric selector field that can be used in a form
 */
const FieldNumberComponent = props => {
  const { rootClassName, className, textClassName, id, name, label } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <span className={classes}>
      {label ? (
        <label htmlFor={id} className={textClassName}>
          {label}
        </label>
      ) : null}
      <Field name={name}>
        {fieldRenderProps => {
          return (
            <div>
              <NumberInput {...props} {...fieldRenderProps} />
            </div>
          );
        }}
      </Field>
    </span>
  );
};

export default FieldNumberComponent;
