import React from 'react';
import { Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../../util/reactIntl';

import {
  compareEntriesByStartTime,
  getParsedHourMinutes,
  getTotalMinutesFromTime,
} from '../availability.helpers';

import { bookingTimeUnits } from '../../../../../util/dates';

import {
  InlineTextButton,
  FieldSelect,
  FieldCheckbox,
  IconDelete,
} from '../../../../../components';

import FieldSeatsInput from '../FieldSeatsInput/FieldSeatsInput';

import css from './AvailabilityPlanEntries.module.css';

const HOUR_MINUTES = bookingTimeUnits.hour.timeUnitInMinutes;

const HOURS = Array(24).fill();

// Internally, we use 00:00 ... 24:00 mapping for hour strings
const printHourStrings = h => (h > 9 ? `${h}:00` : `0${h}:00`);

// Start hours and end hours for each day on weekly schedule
// Note: if you need to use something else than sharp hours,
//       you'll need to customize this.
const ALL_START_HOURS = HOURS.map((v, i) => printHourStrings(i));
const ALL_END_HOURS = HOURS.map((v, i) => printHourStrings(i + 1));

// Formats a total-minutes-since-midnight value as a zero-padded 'HH:MM' string.
const printMinuteString = totalMinutes => {
  const hour = Math.floor(totalMinutes / HOUR_MINUTES);
  const minutes = totalMinutes % HOUR_MINUTES;
  const paddedHour = hour > 9 ? `${hour}` : `0${hour}`;
  const paddedMinutes = minutes > 9 ? `${minutes}` : `0${minutes}`;
  return `${paddedHour}:${paddedMinutes}`;
};

const STEP_MINUTES = bookingTimeUnits.quarterHour.timeUnitInMinutes;
const MINUTES_PER_DAY = 24 * HOUR_MINUTES;
const QUARTERS = Array(MINUTES_PER_DAY / STEP_MINUTES).fill();

const ALL_START_QUARTERS = QUARTERS.map((v, i) => printMinuteString(i * STEP_MINUTES));
const ALL_END_QUARTERS = QUARTERS.map((v, i) => printMinuteString(i * STEP_MINUTES + STEP_MINUTES));

/**
 * Localize UI time for hours.
 *
 * @param {string} timepoint hour string in the following format: 00:00 ... 24:00
 * @param {*} intl React Intl
 * @returns localized time format (e.g. '9:00 AM')
 */
const localizedTimeStrings = (timepoint, intl) => {
  const { hour, minutes } = getParsedHourMinutes(timepoint);
  // We use UTC (Jan 1) to generate hour strings
  const date = new Date(`${new Date().getUTCFullYear()}-01-01T00:00:00.000Z`);
  date.setUTCHours(hour);
  date.setUTCMinutes(minutes);
  const formattedTime = intl.formatTime(date, {
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'Etc/UTC',
  });
  return formattedTime;
};

// Curried: find entry by comparing start time and end time
const findEntryFn = entry => e => e.startTime === entry.startTime && e.endTime === entry.endTime;

/**
 * AvailabilityPlan entry.
 *
 * @typedef {Object} AvailabilityPlanEntry
 * @property {String} dayOfWeek - the day of week shorthand. E.g. 'Mon'.
 * @property {String} startTime - start time. E.g. '09:00' or '09:15'.
 * @property {String} endTime - end time. E.g. '17:00' or '16:45'.
 * @property {Number} seats - the number of available seats 0...Number.MAX_SAFE_INTEGER
 */

/**
 * From all the available start times, filter only those start times that can be used
 * in the current entry creation.
 *
 * For start times this mainly means a situation where end time is set first.
 *
 * @param {Array<string>} availableStartTimes (times are in format: '13:00')
 * @param {Array<AvailabilityPlanEntry>} entries created entries: [{ startTime: '13:00', endTime: '17:00' }]
 * @param {Number} index index in the Final Form Array: current dayOfWeek
 * @returns returns only those start times that are allowed to be selected.
 */
const filterStartTimes = (availableStartTimes, entries, index) => {
  const currentEntry = entries[index];

  // If there is no end time selected, return all the available start times
  if (!currentEntry.endTime) {
    return availableStartTimes;
  }

  // By default the entries are not in order so we need to sort the entries by startTime
  // in order to find out the previous entry
  const sortedEntries = [...entries].sort(compareEntriesByStartTime());

  // Find the index of the current entry from sorted entries
  const currentIndex = sortedEntries.findIndex(findEntryFn(currentEntry));

  // If there is no next entry or the previous entry does not have endTime,
  // return all the available times before current selected end time.
  // Otherwise return all the available start times that are after the previous entry or entries.
  const prevEntry = sortedEntries[currentIndex - 1];
  const pickBefore = time => h => h < time;
  const pickBetween = (start, end) => h => h >= start && h < end;

  return !prevEntry || !prevEntry.endTime
    ? availableStartTimes.filter(pickBefore(currentEntry.endTime))
    : availableStartTimes.filter(pickBetween(prevEntry.endTime, currentEntry.endTime));
};

/**
 * From all the available end times, filter only those end times that can be used
 * in the current entry creation.
 *
 * For end times this only means a situation where start time is set first.
 *
 * @param {Array<string>} availableEndTimes (hours are in format: '13:00')
 * @param {Array<AvailabilityPlanEntry>} entries created entries: [{ startTime: '13:00', endTime: '17:00' }]
 * @param {Number} index index in the Final Form Array: current dayOfWeek
 * @returns returns only those end hours that are allowed to be selected.
 */
const filterEndTimes = (availableEndTimes, entries, index) => {
  const currentEntry = entries[index];

  // If there is no start time selected, return an empty array;
  if (!currentEntry.startTime) {
    return [];
  }

  // By default the entries are not in order so we need to sort the entries by startTime
  // in order to find out the allowed start times
  // Undefined entry ({ startTime: null, endTime: null }) is pushed to the beginning with '-1'.
  const sortedEntries = [...entries].sort(compareEntriesByStartTime(-1));

  // Find the index of the current entry from sorted entries
  const currentIndex = sortedEntries.findIndex(findEntryFn(currentEntry));

  // If there is no next entry,
  // return all the available end times that are after the start of current entry.
  // Otherwise return all the available end times between current start time and next entry.
  const nextEntry = sortedEntries[currentIndex + 1];
  const pickAfter = time => h => h > time;
  const pickBetween = (start, end) => h => h > start && h <= end;

  return !nextEntry || !nextEntry.startTime
    ? availableEndTimes.filter(pickAfter(currentEntry.startTime))
    : availableEndTimes.filter(pickBetween(currentEntry.startTime, nextEntry.startTime));
};

/**
 * Find all the entries that boundaries are already reserved.
 *
 * @param {Array<AvailabilityPlanEntry>} entries look like this [{ startTime: '13:00', endTime: '17:00' }]
 * @param {Boolean} options.findStartTimes find start times (00:00 ... 23:00) or else (01:00 ... 24:00)
 * @param {Boolean} options.useIncrementalBoundaries return boundaries in 15 minute increments (00:15 ... 23:45) or in full hours (00:00 ... 23:00)
 * @returns array of reserved sharp hours (e.g. ['13:00', '14:00', '15:00', '16:00']) or quarter hours (e.g. ['13:00', '13:15', '13:30']).
 */
const getEntryBoundaries = (entries, options) => index => {
  const { findStartTimes, useIncrementalBoundaries } = options;
  if (useIncrementalBoundaries) {
    return entries.reduce((allIncrements, entry, i) => {
      const { startTime, endTime } = entry || {};
      const boundaryDiffMinutes = findStartTimes ? 0 : STEP_MINUTES;

      if (i !== index && startTime && endTime) {
        const startTotal = getTotalMinutesFromTime(startTime);
        const endTotal = getTotalMinutesFromTime(endTime);

        // Calculate the possible booking boundaries that fall between the end and start times:
        // - determine how many 15 minute increments fall between the start and the end
        // - create an array for that length
        // - map the array to printed boundaries
        const quartersBetween = Array((endTotal - startTotal) / STEP_MINUTES)
          .fill()
          .map((v, i) => printMinuteString(startTotal + i * STEP_MINUTES + boundaryDiffMinutes));

        return allIncrements.concat(quartersBetween);
      }

      return allIncrements;
    }, []);
  } else {
    return entries.reduce((allHours, entry, i) => {
      const { startTime, endTime } = entry || {};
      const boundaryDiff = findStartTimes ? 0 : 1;

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
  }
};

/**
 * Date pickers that create time range inside the day: start time - end time
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.name - the name of the form field/input
 * @param {string} props.dayOfWeek - the shorthand for the day of week. E.g. 'mon'
 * @param {Number} props.index - the index in the Final Form Array for the current dayOfWeek
 * @param {Array<String>} props.availableStartTimes - array of strings represeting start times: '00:00', '01:00', etc.
 * @param {Array<String>} props.availableEndTimes - array of strings represeting end times: '01:00', '02:00', etc.
 * @param {Function} props.isTimeSetFn - Check if 'startTime' or 'endTime' is set for the form
 * @param {Boolean} props.isNextDay - flag if the selected 'endTime' is the next day aka (24:00)
 * @param {Array<AvailabilityPlanEntry>} props.entries - AvailabilityPlan entries: [['Mon[0]']: ]]
 * @param {Function} props.onRemove - a function to remove plan entry
 * @param {String} props.unitType - 'hour', 'day', 'night', 'fixed'
 * @param {Boolean} props.useMultipleSeats - true if availabilityType is 'multipleSeats'
 * @param {ReactIntl} props.intl - React Intl instance
 * @returns {JSX.Element} The component that allows selecting plan entries
 */
const TimeRangeSelects = props => {
  const {
    name,
    dayOfWeek,
    index,
    availableStartTimes,
    availableEndTimes,
    isTimeSetFn,
    isNextDay,
    entries,
    onRemove,
    unitType,
    useMultipleSeats,
    intl,
  } = props;
  const entry = entries[index];
  const dayLabel = intl.formatMessage({
    id: `EditListingAvailabilityPlanForm.dayOfWeek.${dayOfWeek}`,
  });
  const hasTimeRange = Boolean(entry?.startTime && entry?.endTime);
  const deleteAriaLabel = intl.formatMessage(
    { id: 'EditListingAvailabilityPlanForm.screenreader.deleteEntry' },
    {
      dayOfWeek: dayLabel,
      hasTimeRange: hasTimeRange ? 'yes' : 'no',
      startTime: hasTimeRange ? localizedTimeStrings(entry.startTime, intl) : null,
      endTime: hasTimeRange ? localizedTimeStrings(entry.endTime, intl) : null,
    }
  );
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
            {filterStartTimes(availableStartTimes, entries, index).map(s => (
              <option value={s} key={s}>
                {localizedTimeStrings(s, intl)}
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
            {filterEndTimes(availableEndTimes, entries, index).map(s => (
              <option value={s} key={s}>
                {localizedTimeStrings(s, intl)}
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
      <InlineTextButton
        rootClassName={css.fieldArrayDelete}
        type="button"
        onClick={onRemove}
        aria-label={deleteAriaLabel}
      >
        <IconDelete rootClassName={css.deleteIcon} />
        <FormattedMessage id="EditListingAvailabilityPlanForm.delete" />
      </InlineTextButton>
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
 * @param {String} props.unitType - 'hour', 'day', 'night', 'fixed'
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
 * @param {String} props.unitType - 'hour', 'day', 'night', 'fixed'.
 * @param {Object} props.values - form values for the availability plan entries.
 * @param {*} props.formApi - React Final Form api ('form').
 * @param {ReactIntl} props.intl - React Intl instance.
 * @returns {JSX.Element} The field elements for the form.
 */
const AvailabilityPlanEntries = props => {
  const {
    dayOfWeek,
    useFullDays,
    useIncrementalBoundaries,
    useMultipleSeats,
    unitType,
    values,
    formApi,
    intl,
  } = props;
  const entries = values[dayOfWeek];
  const hasEntries = entries && entries[0];
  const getEntryStartTimes = getEntryBoundaries(entries, {
    findStartTimes: true,
    useIncrementalBoundaries,
  });
  const getEntryEndTimes = getEntryBoundaries(entries, {
    findStartTimes: false,
    useIncrementalBoundaries,
  });

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
                // The 'hour' and 'fixed' units are not initialized with any value,
                // because user needs to pick them themselves.
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
                const pickUnreservedStartTimes = h => !getEntryStartTimes(index).includes(h);
                const startPointsList = useIncrementalBoundaries
                  ? ALL_START_QUARTERS
                  : ALL_START_HOURS;
                const availableStartTimes = startPointsList.filter(pickUnreservedStartTimes);

                // Pick available end hours
                const pickUnreservedEndTimes = h => !getEntryEndTimes(index).includes(h);
                const endPointsList = useIncrementalBoundaries ? ALL_END_QUARTERS : ALL_END_HOURS;
                const availableEndTimes = endPointsList.filter(pickUnreservedEndTimes);
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
                    dayOfWeek={dayOfWeek}
                    index={index}
                    useMultipleSeats={useMultipleSeats}
                    availableStartTimes={availableStartTimes}
                    availableEndTimes={availableEndTimes}
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
