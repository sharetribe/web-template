import React, { useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { ValidationError, HelpText } from '../../components';

import css from './FieldSelectPopup.module.css';

const optionsFromChildren = children =>
  React.Children.toArray(children)
    .filter(child => child.type === 'option')
    .map(child => ({
      value: child.props.value,
      label: child.props.children,
      disabled: !!child.props.disabled,
    }));

const FieldSelectPopupComponent = props => {
  const {
    rootClassName,
    className,
    selectClassName,
    labelClassName,
    id,
    label,
    helpText,
    input,
    meta,
    children,
    onChange,
    showLabelAsDisabled,
    disabled,
    ...rest
  } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const [isOpen, setIsOpen] = useState(false);

  const { invalid, touched, error } = meta;

  // Error message and input error styles are only shown if the
  // field has been touched and the validation has failed.
  const hasError = touched && invalid && error;

  const options = optionsFromChildren(children);
  const selectedOption = options.find(o => o.value === input.value);

  const selectValue = value => {
    input.onChange(value);
    if (onChange) {
      onChange(value);
    }
    setIsOpen(false);
  };

  const labelClasses = classNames({
    [css.labelDisabled]: showLabelAsDisabled,
    [labelClassName]: !!labelClassName,
  });
  const classes = classNames(rootClassName || css.root, className);
  const triggerClasses = classNames(css.trigger, {
    [selectClassName]: selectClassName,
    [css.triggerError]: hasError,
  });

  return (
    <div className={classes}>
      {label ? (
        <label htmlFor={id} className={labelClasses}>
          {label}
        </label>
      ) : null}
      <div className={css.popupWrapper}>
        <button
          type="button"
          id={id}
          className={triggerClasses}
          disabled={disabled}
          onFocus={input.onFocus}
          onBlur={input.onBlur}
          onClick={() => setIsOpen(current => !current)}
          {...rest}
        >
          <span className={css.triggerLabel}>{selectedOption?.label}</span>
        </button>
        {isOpen ? (
          <div className={css.popup}>
            <ul className={css.popupList}>
              {options.map(option => (
                <li
                  key={option.value}
                  className={classNames(css.popupOption, {
                    [css.popupOptionDisabled]: option.disabled,
                  })}
                  onClick={() => !option.disabled && selectValue(option.value)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <HelpText helpText={helpText} />
      <ValidationError fieldMeta={meta} />
    </div>
  );
};

/**
 * A form field with a button trigger that opens a custom option list, instead of a native
 * <select>. Renders the custom trigger at every viewport.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.selectClassName add more style rules to the trigger button
 * @param {string} props.name Name of the input in Final Form
 * @param {string} props.id Label is optional, but if it is given, an id is also required so the label can reference the input in the `for` attribute
 * @param {ReactNode} props.label
 * @param {ReactNode} props.children <option> elements -- the first should be a disabled placeholder
 * @param {boolean} props.disabled Whether the trigger is disabled
 * @param {boolean} props.showLabelAsDisabled Whether the label is disabled
 * @returns {JSX.Element} Final Form Field containing a trigger button and a toggled option list
 */
const FieldSelectPopup = props => {
  return <Field component={FieldSelectPopupComponent} {...props} />;
};

export default FieldSelectPopup;
