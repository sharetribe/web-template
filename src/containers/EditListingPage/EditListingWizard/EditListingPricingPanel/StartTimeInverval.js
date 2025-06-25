import React from 'react';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { FIXED } from '../../../../transactions/transaction';

// Import shared components
import { FieldRadioButton } from '../../../../components';

// Import modules from this directory
import css from './StartTimeInterval.module.css';

export const getInitialValuesForStartTimeInterval = params => {
  const { listing } = params;
  const { publicData } = listing?.attributes || {};
  const { startTimeInterval, unitType } = publicData || {};
  const isFixedUnitType = unitType === FIXED;

  return isFixedUnitType ? { startTimeInterval: startTimeInterval || 'hour' } : {};
};

export const handleSubmitValuesForStartTimeInterval = (values, publicData) => {
  const { startTimeInterval } = values;
  const startTimeIntervalMaybe = startTimeInterval ? { startTimeInterval } : {};
  return { publicData: { ...publicData, ...startTimeIntervalMaybe } };
};

/**
 * The StartTimeInterval component.
 *
 * @component
 * @param {Object} props
 * @param {string} props.name - The name of the input
 * @param {string} props.idPrefix - The id prefix for the input field
 * @param {Object} [props.formValues] - The values object from React Final Form
 * @param {'hour'|'halfHour'|'quarterHour'} props.formValues.startTimeInterval - The start time interval
 * @param {boolean} props.pristine
 * @returns {JSX.Element}
 */
const StartTimeInterval = props => {
  const intl = useIntl();
  const { name, idPrefix, formValues, pristine } = props;
  const showAsPristine = formValues?.startTimeInterval == null && pristine;

  // TODO check that required works

  return (
    <fieldset className={css.root}>
      <legend className={css.label}>
        <FormattedMessage id="StartTimeInterval.label" />
      </legend>

      <FieldRadioButton
        id={`${idPrefix}_startTimeInterval_hour`}
        name={name}
        className={css.option}
        label={intl.formatMessage({ id: 'StartTimeInterval.startEveryHour' })}
        value="hour"
        showAsRequired={showAsPristine}
      />

      <FieldRadioButton
        id={`${idPrefix}_startTimeInterval_halfHour`}
        name={name}
        className={css.option}
        label={intl.formatMessage({ id: 'StartTimeInterval.startEveryHalfHour' })}
        value="halfHour"
        showAsRequired={showAsPristine}
      />

      <FieldRadioButton
        id={`${idPrefix}_startTimeInterval_quarterHour`}
        name={name}
        className={css.option}
        label={intl.formatMessage({ id: 'StartTimeInterval.startEveryQuarterHour' })}
        value="quarterHour"
        showAsRequired={showAsPristine}
      />
    </fieldset>
  );
};

export default StartTimeInterval;
