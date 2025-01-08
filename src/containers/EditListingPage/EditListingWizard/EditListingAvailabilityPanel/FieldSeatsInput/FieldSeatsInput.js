import React from 'react';
import classNames from 'classnames';

import { validateInteger } from '../../../../../util/validators';

import { FieldTextInput } from '../../../../../components';

import css from './FieldSeatsInput.module.css';

const validate = (value, min, max, intl) => {
  const requiredMsg = intl.formatMessage({ id: 'FieldSeatsInput.seatsError' });
  const numberTooSmallMessage = intl.formatMessage(
    { id: 'FieldSeatsInput.numberTooSmall' },
    { min }
  );
  const numberTooBigMessage = intl.formatMessage({ id: 'FieldSeatsInput.numberTooBig' }, { max });

  return value == null
    ? requiredMsg
    : validateInteger(value, max, min, numberTooSmallMessage, numberTooBigMessage);
};

/**
 * React Final Form Field to set the number of seats.
 *
 * @component
 * @param {Object} props
 * @param {String?} props.rootClassName - a class name that overwrites 'root' class
 * @param {String?} props.className - a class name to add next to 'root' class
 * @param {String?} props.inputRootClass - a class name to pass to input element
 * @param {String} props.id - the id of the element
 * @param {String} props.name - the name of the Final Form Field (input).
 * @param {String} props.unitType - 'hour', 'day', 'night'
 * @param {ReactIntl} props.intl - instance of React Intl
 * @returns {JSX.Element} seats input for the React Final Form.
 */
const FieldSeatsInput = props => {
  const { rootClassName, className, inputRootClass, id, name, unitType, intl } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <FieldTextInput
        className={css.customField}
        inputRootClass={inputRootClass}
        id={id}
        name={name}
        type="number"
        step="1"
        min="0"
        max={`${Number.MAX_SAFE_INTEGER}`}
        parse={value => {
          const parsed = Number.parseInt(value, 10);
          return Number.isNaN(parsed) ? null : parsed;
        }}
        label={intl.formatMessage({ id: 'FieldSeatsInput.seatsLabel' }, { unitType })}
        placeholder={intl.formatMessage({ id: 'FieldSeatsInput.seatsPlaceholder' }, { unitType })}
        validate={value => validate(value, 0, Number.MAX_SAFE_INTEGER, intl)}
        onWheel={e => {
          // fix: number input should not change value on scroll
          if (e.target === document.activeElement) {
            // Prevent the input value change, because we prefer page scrolling
            e.target.blur();

            // Refocus immediately, on the next tick (after the current function is done)
            setTimeout(() => {
              e.target.focus();
            }, 0);
          }
        }}
      />
    </div>
  );
};

export default FieldSeatsInput;
