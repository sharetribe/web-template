import React, { Component, useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { ValidationError, ExpandingTextarea, HelpText } from '../../components';

import css from './FieldTextInput.module.css';

const CONTENT_MAX_LENGTH = 5000;

const EyeIcon = props => (
  <svg
    style={{ fill: 'transparent' }}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.666992 7.99999C0.666992 7.99999 3.33366 2.66666 8.00033 2.66666C12.667 2.66666 15.3337 7.99999 15.3337 7.99999C15.3337 7.99999 12.667 13.3333 8.00033 13.3333C3.33366 13.3333 0.666992 7.99999 0.666992 7.99999Z"
      stroke="#A4A7AE"
      stroke-width="1.33333"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8.00033 9.99999C9.1049 9.99999 10.0003 9.10456 10.0003 7.99999C10.0003 6.89542 9.1049 5.99999 8.00033 5.99999C6.89576 5.99999 6.00033 6.89542 6.00033 7.99999C6.00033 9.10456 6.89576 9.99999 8.00033 9.99999Z"
      stroke="#A4A7AE"
      stroke-width="1.33333"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const EyeOffIcon = props => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M3.3 4.7a1 1 0 0 1 1.4 0l16.6 16.6a1 1 0 1 1-1.4 1.4l-2.1-2.1A11.7 11.7 0 0 1 12 19C6.5 19 2.5 14.6 1.2 12.7a1.2 1.2 0 0 1 0-1.4A18.9 18.9 0 0 1 6.1 6.8L3.3 5.1a1 1 0 0 1 0-1.4Zm4.2 4.2a4.9 4.9 0 0 0-.9 3.1A5.4 5.4 0 0 0 12 17.4c1.1 0 2.2-.3 3.1-.9l-1.6-1.6c-.4.2-1 .3-1.5.3a3 3 0 0 1-3-3c0-.6.1-1.1.3-1.5L7.5 8.9Zm4.3-3.9c.6 0 1.1 0 1.7.1a11.5 11.5 0 0 1 9.3 6.9c-.6.8-1.6 2.1-3 3.2l-1.5-1.5c1.1-.8 2-1.8 2.6-2.4-1.3-1.6-4.7-5-8.9-5-.2 0-.5 0-.7 0L11.8 5Z"
    />
  </svg>
);

const FieldTextInputComponent = props => {
  const {
    rootClassName,
    className,
    inputRootClass,
    labelClassName,
    customErrorText,
    helpText,
    id,
    label,
    input,
    meta,
    onUnmount,
    isUncontrolled,
    inputRef,
    hideErrorMessage,
    ...rest
  } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const { valid, invalid, touched, error } = meta;
  const isTextarea = input.type === 'textarea';
  const isPassword = !isTextarea && input.type === 'password';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const errorText = customErrorText || error;

  // Error message and input error styles are only shown if the
  // field has been touched and the validation has failed.
  const hasError = !!customErrorText || !!(touched && invalid && error);

  const fieldMeta = { touched: hasError, error: errorText };

  // Textarea doesn't need type.
  const { type, ...inputWithoutType } = input;
  const effectiveType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;
  // Uncontrolled input uses defaultValue instead of value.
  const { value: defaultValue, ...inputWithoutValue } = input;
  // Use inputRef if it is passed as prop.
  const refMaybe = inputRef ? { ref: inputRef } : {};

  const inputClasses =
    inputRootClass ||
    classNames(css.input, {
      [css.inputSuccess]: valid,
      [css.inputError]: hasError,
      [css.textarea]: isTextarea,
    });
  const maxLength = CONTENT_MAX_LENGTH;
  const inputProps = isTextarea
    ? {
        className: inputClasses,
        id,
        rows: 1,
        maxLength,
        ...refMaybe,
        ...inputWithoutType,
        ...rest,
      }
    : isUncontrolled
    ? {
        className: inputClasses,
        id,
        type: effectiveType,
        defaultValue,
        ...refMaybe,
        ...inputWithoutValue,
        ...rest,
      }
    : {
        className: inputClasses,
        id,
        type: effectiveType,
        ...refMaybe,
        ...inputWithoutType,
        ...rest,
      };

  const labelClassMaybe = labelClassName ? { className: labelClassName } : {};
  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes}>
      {label ? (
        <label htmlFor={id} {...labelClassMaybe}>
          {label}
        </label>
      ) : null}
      {isTextarea ? (
        <ExpandingTextarea {...inputProps} />
      ) : (
        <div className={classNames(css.inputWrapper, { [css.inputWrapperPassword]: isPassword })}>
          <input {...inputProps} />
          {isPassword ? (
            <button
              type="button"
              className={css.passwordToggle}
              onClick={() => setIsPasswordVisible(v => !v)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          ) : null}
        </div>
      )}
      <HelpText helpText={helpText} />
      {hideErrorMessage ? null : <ValidationError fieldMeta={fieldMeta} />}
    </div>
  );
};

/**
 * Create Final Form field for <input> or <textarea>.
 * It's often used for type="text" and sometimes with other types like 'number' too.
 *
 * Note: Uncontrolled input uses defaultValue prop, but doesn't pass value from form to the field.
 * https://reactjs.org/docs/uncontrolled-components.html#default-values
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.inputRootClass overwrite components own css.input
 * @param {string} props.name Name of the input in Final Form
 * @param {string} props.id
 * @param {string?} props.label Label is optional, but if it is given, an id is also required.
 * @param {string?} props.customErrorText Error message that can be manually passed to input field, overrides default validation message
 * @param {boolean} props.isUncontrolled is value tracked by parent component
 * @param {Object} props.inputRef a ref object passed for input element.
 * @param {Function} props.onUnmount Uncontrolled input uses defaultValue prop, but doesn't pass value from form to the field.
 * @returns {JSX.Element} Final Form Field containing nested "select" input
 */
class FieldTextInput extends Component {
  componentWillUnmount() {
    // Unmounting happens too late if it is done inside Field component
    // (Then Form has already registered its (new) fields and
    // changing the value without corresponding field is prohibited in Final Form
    if (this.props.onUnmount) {
      this.props.onUnmount();
    }
  }

  render() {
    return <Field component={FieldTextInputComponent} {...this.props} />;
  }
}

export default FieldTextInput;
