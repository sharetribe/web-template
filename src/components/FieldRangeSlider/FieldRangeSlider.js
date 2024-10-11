import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { RangeSlider } from '..';

function RangeSliderInput(props) {
  const { input, handles, ...rest } = props;
  const { value, ...inputProps } = input;

  const currentHandles = Array.isArray(value) ? value : handles;
  return <RangeSlider {...inputProps} {...rest} handles={currentHandles} />;
}

function FieldRangeSlider(props) {
  const { rootClassName, className, id, label, ...rest } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const inputProps = { id, ...rest };
  const classes = classNames(rootClassName, className);

  return (
    <div className={classes}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <Field component={RangeSliderInput} {...inputProps} />
    </div>
  );
}

export default FieldRangeSlider;
