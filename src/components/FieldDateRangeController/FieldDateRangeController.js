import React from 'react';
import { string } from 'prop-types';
import { isInclusivelyAfterDay, isInclusivelyBeforeDay } from 'react-dates';
import { Field } from 'react-final-form';
import moment from 'moment';

import { useConfiguration } from '../../context/configurationContext';
import DateRangeController from './DateRangeController';

const component = props => {
  const { input, controllerRef, ...rest } = props;
  const { type, checked, ...restOfInput } = input;
  return <DateRangeController ref={controllerRef} {...restOfInput} {...rest} />;
};

const FieldDateRangeController = props => {
  const config = useConfiguration();
  const { isOutsideRange, firstDayOfWeek, ...rest } = props;

  // Outside range -><- today ... today+available days -1 -><- outside range
  const defaultIsOutSideRange = day => {
    const endOfRange = config.stripe?.dayCountAvailableForBooking - 1;
    return (
      !isInclusivelyAfterDay(day, moment()) ||
      !isInclusivelyBeforeDay(day, moment().add(endOfRange, 'days'))
    );
  };
  const defaultFirstDayOfWeek = config.localization.firstDayOfWeek;

  return (
    <Field
      component={component}
      isOutsideRange={isOutsideRange || defaultIsOutSideRange}
      firstDayOfWeek={firstDayOfWeek || defaultFirstDayOfWeek}
      {...rest}
    />
  );
};

FieldDateRangeController.defaultProps = {
  rootClassName: null,
  className: null,
};

FieldDateRangeController.propTypes = {
  rootClassName: string,
  className: string,
};

export default FieldDateRangeController;
