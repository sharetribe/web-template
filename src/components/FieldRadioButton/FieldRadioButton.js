import React from 'react';
import classNames from 'classnames';
import { Field } from 'react-final-form';

import css from './FieldRadioButton.module.css';

/**
 * IconRadioButton
 *
 * @component
 * @param {Object} props
 * @param {string?} props.checkedClassName overwrite components own css.checkedStyle
 * @param {boolean?} props.showAsRequired adds attention color for the icon if not selected
 * @returns {JSX.Element} checkbox svg that places the native radio button
 */
const IconRadioButton = props => {
  const { className, checkedClassName, showAsRequired } = props;
  return (
    <div>
      <svg className={className} width="14" height="14" xmlns="http://www.w3.org/2000/svg">
        <circle
          className={showAsRequired ? css.required : css.notChecked}
          cx="5"
          cy="19"
          r="6"
          transform="translate(2 -12)"
          strokeWidth="2"
          fill="none"
          fillRule="evenodd"
        />

        <g
          className={classNames(css.checked, checkedClassName || css.checkedStyle)}
          transform="translate(2 -12)"
          fill="none"
          fillRule="evenodd"
        >
          <circle strokeWidth="2" cx="5" cy="19" r="6" />
          <circle fill="#FFF" fillRule="nonzero" cx="5" cy="19" r="3" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Final Form Field containing radio button input
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.svgClassName is passed to radio button svg as className
 * @param {string?} props.checkedClassName overwrite components own css.checkedStyle given to icon
 * @param {string} props.id Id is needed to connect the label with input.
 * @param {string} props.name Name groups several RadioButtons to be alternative values for this "key"
 * @param {string} props.value RadioButton needs a value that is passed forward when user checks the RadioButton
 * @param {ReactNode} props.label
 * @param {boolean?} props.showAsRequired adds attention color for the icon if not selected
 * @returns {JSX.Element} Final Form Field containing radio button input
 */
const FieldRadioButton = props => {
  const {
    rootClassName,
    className,
    svgClassName,
    checkedClassName,
    id,
    label,
    showAsRequired,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const radioButtonProps = {
    id,
    className: css.input,
    component: 'input',
    type: 'radio',
    ...rest,
  };

  return (
    <span className={classes}>
      <Field {...radioButtonProps} />
      <label htmlFor={id} className={css.label}>
        <span className={css.radioButtonWrapper}>
          <IconRadioButton
            className={svgClassName}
            checkedClassName={checkedClassName}
            showAsRequired={showAsRequired}
          />
        </span>
        <span className={css.text}>{label}</span>
      </label>
    </span>
  );
};

export default FieldRadioButton;
