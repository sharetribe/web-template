import React, { Component } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { ValidationError, ExpandingTextarea } from '../../components';

import css from './FieldTextInput.module.css';

const CONTENT_MAX_LENGTH = 5000;

const FieldTextInputComponent = props => {
  const {
    rootClassName,
    className,
    inputRootClass,
    customErrorText,
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

  const errorText = customErrorText || error;

  // Error message and input error styles are only shown if the
  // field has been touched and the validation has failed.
  const hasError = !!customErrorText || !!(touched && invalid && error);

  const fieldMeta = { touched: hasError, error: errorText };

  // Textarea doesn't need type.
  const { type, ...inputWithoutType } = input;
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
        type,
        defaultValue,
        ...refMaybe,
        ...inputWithoutValue,
        ...rest,
      }
    : { className: inputClasses, id, type, ...refMaybe, ...input, ...rest };

  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      {isTextarea ? <ExpandingTextarea {...inputProps} /> : <input {...inputProps} />}
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
