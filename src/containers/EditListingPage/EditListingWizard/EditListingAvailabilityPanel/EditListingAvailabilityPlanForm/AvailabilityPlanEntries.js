import React from 'react';
import { Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../../util/reactIntl';

import {
  InlineTextButton,
  FieldSelect,
  FieldCheckbox,
  IconDelete,
} from '../../../../../components';

import FieldSeatsInput from '../FieldSeatsInput/FieldSeatsInput';

import css from './AvailabilityPlanEntries.module.css';

const HOURS = Array(24).fill();

// Internally, we use 00:00 ... 24:00 mapping for hour strings
const printHourStrings = h => (h > 9 ? `${h}:00` : `0${h}:00`);

// Start hours and end hours for each day on weekly schedule
// Note: if you need to use something else than sharp hours,
//       you'll need to customize this.
const ALL_START_HOURS = HOURS.map((v, i) => printHourStrings(i));
const ALL_END_HOURS = HOURS.map((v, i) => printHourStrings(i + 1));

/**
 * Localize UI time for hours.
 *
 * @param {string} hour24 hour string in the following format: 00:00 ... 24:00
 * @param {*} intl React Intl
 * @returns localized time format (e.g. '9:00 AM')
 */
const localizedHourStrings = (hour24, intl) => {
  const hour = Number.parseInt(hour24.split(':')[0]);
  // We use UTC (Jan 1) to generate hour strings
  const date = new Date(`${new Date().getUTCFullYear()}-01-01T00:00:00.000Z`);
  date.setUTCHours(hour);
  const formattedHour = intl.formatTime(date, {
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'Etc/UTC',
  });
  return formattedHour;
};

/**
 * User might create entries inside the day of week in what ever order.
 * We need to sort them before they can be compared with available hours.
 *
 * @param {Integer} defaultCompareReturn if startTime is null, negative value pushes the entry to the beginning
 * @returns
 */
const sortEntries = (defaultCompareReturn = 0) => (a, b) => {
  if (a.startTime && b.startTime) {
    const aStart = Number.parseInt(a.startTime.split(':')[0]);
    const bStart = Number.parseInt(b.startTime.split(':')[0]);
    return aStart - bStart;
  }
  return defaultCompareReturn;
};

// Curried: find entry by comparing start time and end time
const findEntryFn = entry => e => e.startTime === entry.startTime && e.endTime === entry.endTime;

/**
 * AvailabilityPlan entry.
 *
 * @typedef {Object} AvailabilityPlanEntry
 * @property {String} dayOfWeek - the day of week shorthand. E.g. 'Mon'.
 * @property {String} startTime - start hour. E.g. '09:00'.
 * @property {String} endTime - end hour. E.g. '17:00'.
 * @property {Number} seats - the number of available seats 0...Number.MAX_SAFE_INTEGER
 */

/**
 * From all the available start hours, filter only those start hours that can be used
 * in the current entry creation.
 *
 * For start hours this mainly means situation where end hours is set first.
 *
 * @param {Array<string>} availableStartHours (hours are in format: '13:00')
 * @param {Array<AvailabilityPlanEntry>} entries created entries: [{ startTime: '13:00', endTime: '17:00' }]
 * @param {Number} index index in the Final Form Array: current dayOfWeek
 * @returns returns only those start hours that are allowed to be selected.
 */
const filterStartHours = (availableStartHours, entries, index) => {
  const currentEntry = entries[index];

  // If there is no end time selected, return all the available start times
  if (!currentEntry.endTime) {
    return availableStartHours;
  }

  // By default the entries are not in order so we need to sort the entries by startTime
  // in order to find out the previous entry
  const sortedEntries = [...entries].sort(sortEntries());

  // Find the index of the current entry from sorted entries
  const currentIndex = sortedEntries.findIndex(findEntryFn(currentEntry));

  // If there is no next entry or the previous entry does not have endTime,
  // return all the available times before current selected end time.
  // Otherwise return all the available start times that are after the previous entry or entries.
  const prevEntry = sortedEntries[currentIndex - 1];
  const pickBefore = time => h => h < time;
  const pickBetween = (start, end) => h => h >= start && h < end;

  return !prevEntry || !prevEntry.endTime
    ? availableStartHours.filter(pickBefore(currentEntry.endTime))
    : availableStartHours.filter(pickBetween(prevEntry.endTime, currentEntry.endTime));
};

/**
 * From all the available end hours, filter only those end hours that can be used
 * in the current entry creation.
 *
 * For end hour this only means a situation where start hour is set first.
 *
 * @param {Array<string>} availableEndHours (hours are in format: '13:00')
 * @param {Array<AvailabilityPlanEntry>} entries created entries: [{ startTime: '13:00', endTime: '17:00' }]
 * @param {Number} index index in the Final Form Array: current dayOfWeek
 * @returns returns only those end hours that are allowed to be selected.
 */
const filterEndHours = (availableEndHours, entries, index) => {
  const currentEntry = entries[index];

  // If there is no start time selected, return an empty array;
  if (!currentEntry.startTime) {
    return [];
  }

  // By default the entries are not in order so we need to sort the entries by startTime
  // in order to find out the allowed start times
  // Undefined entry ({ startTime: null, endTime: null }) is pushed to the beginning with '-1'.
  const sortedEntries = [...entries].sort(sortEntries(-1));

  // Find the index of the current entry from sorted entries
  const currentIndex = sortedEntries.findIndex(findEntryFn(currentEntry));

  // If there is no next entry,
  // return all the available end times that are after the start of current entry.
  // Otherwise return all the available end hours between current start time and next entry.
  const nextEntry = sortedEntries[currentIndex + 1];
  const pickAfter = time => h => h > time;
  const pickBetween = (start, end) => h => h > start && h <= end;

  return !nextEntry || !nextEntry.startTime
    ? availableEndHours.filter(pickAfter(currentEntry.startTime))
    : availableEndHours.filter(pickBetween(currentEntry.startTime, nextEntry.startTime));
};

/**
 * Find all the entries that boundaries are already reserved.
 *
 * @param {Array<AvailabilityPlanEntry>} entries look like this [{ startTime: '13:00', endTime: '17:00' }]
 * @param {Boolean} findStartHours find start hours (00:00 ... 23:00) or else (01:00 ... 24:00)
 * @returns array of reserved sharp hours. E.g. ['13:00', '14:00', '15:00', '16:00']
 */
const getEntryBoundaries = (entries, findStartHours) => index => {
  const boundaryDiff = findStartHours ? 0 : 1;

  return entries.reduce((allHours, entry, i) => {
    const { startTime, endTime } = entry || {};

    if (i !== index && startTime && endTime) {
      const startHour = Number.parseInt(startTime.split(':')[0]);
      const endHour = Number.parseInt(endTime.split(':')[0]);
      const hoursBetween = Array(endHour - startHour)
        .fill()
        .map((v, i) => printHourStrings(startHour + i + boundaryDiff));

      return allHours.concat(hoursBetween);
    }

    return allHours;
  }, []);
};

/**
 * Date pickers that create time range inside the day: start hour - end hour
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.name - the name of the form field/input
 * @param {Number} props.index - the index in the Final Form Array for the current dayOfWeek
 * @param {Array<String>} props.availableStartHours - array of strings represeting start hours: '00:00', '01:00', etc.
 * @param {Array<String>} props.availableEndHours - array of strings represeting end hours: '01:00', '02:00', etc.
 * @param {Function} props.isTimeSetFn - Check if 'startTime' or 'endTime' is set for the form
 * @param {Boolean} props.isNextDay - flag if the selected 'endTime' is the next day aka (24:00)
 * @param {Array<AvailabilityPlanEntry>} props.entries - AvailabilityPlan entries: [['Mon[0]']: ]]
 * @param {Function} props.onRemove - a function to remove plan entry
 * @param {String} props.unitType - 'hour', 'day', 'night'
 * @param {Boolean} props.useMultipleSeats - true if availabilityType is 'multipleSeats'
 * @param {ReactIntl} props.intl - React Intl instance
 * @returns {JSX.Element} The component that allows selecting plan entries
 */
const TimeRangeSelects = props => {
  const {
    name,
    index,
    availableStartHours,
    availableEndHours,
    isTimeSetFn,
    isNextDay,
    entries,
    onRemove,
    unitType,
    useMultipleSeats,
    intl,
  } = props;
  return (
    <div className={css.segmentWrapper} key={name}>
      <div className={css.segment}>
        <label>
          <FormattedMessage id="EditListingAvailabilityPlanForm.selectTime" />
        </label>
        <div className={css.timeRangeRow}>
          <FieldSelect
            id={`${name}.startTime`}
            name={`${name}.startTime`}
            rootClassName={css.hourField}
            selectClassName={classNames(css.fieldSelect, {
              [css.notSelected]: !isTimeSetFn('startTime'),
            })}
          >
            <option disabled value="">
              {intl.formatMessage({
                id: 'EditListingAvailabilityPlanForm.startTimePlaceholder',
              })}
            </option>
            {filterStartHours(availableStartHours, entries, index).map(s => (
              <option value={s} key={s}>
                {localizedHourStrings(s, intl)}
              </option>
            ))}
          </FieldSelect>
          <span className={css.dashBetweenTimes}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" fill="none">
              <path d="M3.5 8h10" strokeWidth="1.333" strokeLinecap="round" />
            </svg>
          </span>
          <FieldSelect
            id={`${name}.endTime`}
            name={`${name}.endTime`}
            rootClassName={css.hourField}
            selectClassName={classNames(css.fieldSelect, {
              [css.notSelected]: !isTimeSetFn('endTime'),
            })}
          >
            <option disabled value="">
              {intl.formatMessage({
                id: 'EditListingAvailabilityPlanForm.endTimePlaceholder',
              })}
            </option>
            {filterEndHours(availableEndHours, entries, index).map(s => (
              <option value={s} key={s}>
                {localizedHourStrings(s, intl)}
              </option>
            ))}
          </FieldSelect>
          <div className={classNames(css.plus1Day, { [css.showPlus1Day]: isNextDay })}>
            <FormattedMessage id="EditListingAvailabilityPlanForm.plus1Day" />
          </div>
        </div>
      </div>
      {useMultipleSeats ? (
        <div className={css.segment}>
          <FieldSeatsInput
            id={`${name}.seats`}
            name={`${name}.seats`}
            inputRootClass={css.seatsInput}
            rootClassName={css.seatsField}
            unitType={unitType}
            intl={intl}
          />
        </div>
      ) : (
        <FieldHidden name={`${name}.seats`} value={1} />
      )}
      <div className={css.fieldArrayDelete} onClick={onRemove} style={{ cursor: 'pointer' }}>
        <IconDelete rootClassName={css.deleteIcon} />
        <FormattedMessage id="EditListingAvailabilityPlanForm.delete" />
      </div>
    </div>
  );
};

/**
 * Hidden input field
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.name - the name of the form field/input
 * @returns {JSX.Element} component rendering a hidden form field.
 */
const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden">
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

/**
 * For unitType: 'hour', set entire day (00:00 - 24:00) and hide the inputs from end user.
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.name - the name of the form field/input. E.g. 'Mon[0]'
 * @returns {JSX.Element} component rendering a hidden form fields for 'startTime' and 'endTime'.
 */
const TimeRangeHidden = props => {
  const { name } = props;
  return (
    <div className={css.timeRangeHidden}>
      <FieldHidden name={`${name}.startTime`} />
      <FieldHidden name={`${name}.endTime`} />
    </div>
  );
};

/**
 * Show input element to add the number of seats and include hidden inputs for time range.
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.name - the name of the form field/input. E.g. 'Mon[0]'
 * @param {String} props.unitType - 'hour', 'day', 'night'
 * @param {ReactIntl} props.intl - React Intl instance
 * @returns {JSX.Element} component rendering an input field for seats count and hidden form fields for 'startTime' and 'endTime'.
 */
const SeatsWithTimeRangeHidden = props => {
  const { name, unitType, intl } = props;
  return (
    <>
      <TimeRangeHidden name={name} />

      <FieldSeatsInput
        id={`${name}.seats`}
        name={`${name}.seats`}
        inputRootClass={css.seatsInput}
        rootClassName={css.seatsField}
        unitType={unitType}
        intl={intl}
      />
    </>
  );
};

/**
 * A form to handle entries for the availability plan (weekly default schedule).
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.dayOfWeek - the shorthand for the day of week. E.g. 'Mon'.
 * @param {Boolean} props.useFullDays - enforce full days (used with 'day' and 'night' unit types).
 * @param {Boolean} props.useMultipleSeats - true if availabilityType is 'multipleSeats'.
 * @param {String} props.unitType - 'hour', 'day', 'night'.
 * @param {Object} props.values - form values for the availability plan entries.
 * @param {*} props.formApi - React Final Form api ('form').
 * @param {ReactIntl} props.intl - React Intl instance.
 * @returns {JSX.Element} The field elements for the form.
 */
const AvailabilityPlanEntries = props => {
  const { dayOfWeek, useFullDays, useMultipleSeats, unitType, values, formApi, intl } = props;
  const entries = values[dayOfWeek];
  const hasEntries = entries && entries[0];
  const getEntryStartTimes = getEntryBoundaries(entries, true);
  const getEntryEndTimes = getEntryBoundaries(entries, false);

  const checkboxName = `checkbox_${dayOfWeek}`;
  return (
    <div className={classNames(css.weekDay, hasEntries ? css.hasEntries : null)}>
      <div className={css.dayOfWeek}>
        <FieldCheckbox
          key={checkboxName}
          id={checkboxName}
          className={css.dayOfWeekContent}
          name="activePlanDays"
          useSuccessColor
          label={intl.formatMessage({
            id: `EditListingAvailabilityPlanForm.dayOfWeek.${dayOfWeek}`,
          })}
          value={dayOfWeek}
          onChange={e => {
            const isChecked = e.target.checked;

            // 'day' and 'night' units use full days
            if (useFullDays) {
              if (isChecked) {
                const seats = useMultipleSeats ? { seats: 1 } : { seats: 1 };
                formApi.mutators.push(dayOfWeek, {
                  startTime: '00:00',
                  endTime: '24:00',
                  ...seats,
                });
              } else {
                formApi.mutators.remove(dayOfWeek, 0);
              }
            } else {
              const shouldAddEntry = isChecked && !hasEntries;
              if (shouldAddEntry) {
                const seats = useMultipleSeats ? { seats: 1 } : { seats: 1 };
                // The 'hour' unit is not initialized with any value,
                // because user need to pick them themselves.
                formApi.mutators.push(dayOfWeek, { startTime: null, endTime: null, ...seats });
              } else if (!isChecked) {
                // If day of week checkbox is unchecked,
                // we'll remove all the entries for that day.
                formApi.mutators.removeBatch(dayOfWeek, entries);
              }
            }
          }}
        />
      </div>

      <FieldArray name={dayOfWeek}>
        {({ fields }) => {
          return (
            <div className={classNames(css.planEntriesForDay, css.planEntryFields)}>
              {fields.map((name, index) => {
                // Pick available start hours
                const pickUnreservedStartHours = h => !getEntryStartTimes(index).includes(h);
                const availableStartHours = ALL_START_HOURS.filter(pickUnreservedStartHours);

                // Pick available end hours
                const pickUnreservedEndHours = h => !getEntryEndTimes(index).includes(h);
                const availableEndHours = ALL_END_HOURS.filter(pickUnreservedEndHours);
                const isTimeSetFn = time => fields.value?.[index]?.[time];
                const isNextDay = entries[index]?.endTime === '24:00';

                // If full days (00:00 - 24:00) are used we'll hide the start time and end time fields.
                // This affects only day & night unit types by default.
                return useFullDays && useMultipleSeats ? (
                  <SeatsWithTimeRangeHidden
                    name={name}
                    key={name}
                    unitType={unitType}
                    intl={intl}
                  />
                ) : useFullDays ? (
                  <TimeRangeHidden name={name} key={name} />
                ) : (
                  <TimeRangeSelects
                    key={name}
                    name={name}
                    index={index}
                    useMultipleSeats={useMultipleSeats}
                    availableStartHours={availableStartHours}
                    availableEndHours={availableEndHours}
                    isTimeSetFn={isTimeSetFn}
                    entries={entries}
                    isNextDay={isNextDay}
                    onRemove={() => {
                      fields.remove(index);
                      const hasOnlyOneEntry = fields.value?.length === 1;
                      if (hasOnlyOneEntry) {
                        const activeDays = values['activePlanDays'];
                        const cleanedDays = activeDays.filter(d => d !== dayOfWeek);
                        // The day should not be active anymore
                        formApi.change('activePlanDays', cleanedDays);
                      }
                    }}
                    unitType={unitType}
                    intl={intl}
                  />
                );
              })}

              {!useFullDays && fields.length > 0 ? (
                <InlineTextButton
                  type="button"
                  className={css.buttonAddNew}
                  onClick={() => fields.push({ startTime: null, endTime: null })}
                >
                  <FormattedMessage id="EditListingAvailabilityPlanForm.addAnother" />
                </InlineTextButton>
              ) : null}
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
};

export default AvailabilityPlanEntries;
