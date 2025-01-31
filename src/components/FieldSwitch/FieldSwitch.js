import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { Switch } from 'antd';

import { ValidationError } from '../../components';

import css from './FieldSwitch.module.css';

const FieldSwitchComponent = props => {
  const {
    rootClassName,
    className,
    selectClassName,
    id,
    label,
    input,
    meta,
    children,
    onChange,
    ...rest
  } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const { invalid, touched, error } = meta;

  // Error message and input error styles are only shown if the
  // field has been touched and the validation has failed.
  const hasError = touched && invalid && error;

  const selectClasses = classNames({
    [selectClassName]: selectClassName,
    [css.selectError]: hasError,
  });
  const handleChange = e => {
    input.onChange(e);
    if (onChange) {
      onChange(e.currentTarget.value);
    }
  };

  const switchProps = { className: selectClasses, id, ...input, onChange: handleChange, ...rest };

  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <Switch {...switchProps} />
      <ValidationError fieldMeta={meta} />
    </div>
  );
};

const FieldSwitch = props => {
  return <Field component={FieldSwitchComponent} {...props} type="checkbox" />;
};

export default FieldSwitch;
