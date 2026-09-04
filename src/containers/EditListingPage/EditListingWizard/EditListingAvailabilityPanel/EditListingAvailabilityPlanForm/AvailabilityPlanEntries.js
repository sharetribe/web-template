import React, { useState } from 'react';
import { Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../../util/reactIntl';
import { FIXED } from '../../../../../transactions/transaction';

import {
  compareEntriesByStartTime,
  getParsedHourMinutes,
  printHourStrings,
  printMinuteString,
  getEntryBoundaries,
} from '../availability.helpers';

import { bookingTimeUnits } from '../../../../../util/dates';

import {
  InlineTextButton,
  FieldSelect,
  FieldSelectPopup,
  FieldCheckbox,
  IconDelete,
} from '../../../../../components';

import FieldSeatsInput from '../FieldSeatsInput/FieldSeatsInput';

import css from './AvailabilityPlanEntries.module.css';

const HOUR_MINUTES = bookingTimeUnits.hour.timeUnitInMinutes;

const HOURS = Array(24).fill();

// Start hours and end hours for each day on weekly schedule
// Note: if you need to use something else than sharp hours,
//       you'll need to customize this.
const ALL_START_HOURS = HOURS.map((v, i) => printHourStrings(i));
const ALL_END_HOURS = HOURS.map((v, i) => printHourStrings(i + 1));

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
 * Renders the correct time-select variant, FieldSelectPopup (capped-height custom popup) or
 * FieldSelect (plain native <select>), and the option structure each one expects, from a single
 * `isFixedUnitType` flag.
 *
 * Defined here at module scope, not inside TimeRangeSelects: TimeRangeSelects re-renders on every
 * parent update, and a component defined inside another component's render body is a new type to
 * React on every render, which would remount FieldSelectPopup (losing its open/highlighted-option
 * state) instead of updating it in place.
 *
 * @component
 * @param {Object} props
 * @param {Boolean} props.isFixedUnitType whether to render FieldSelectPopup (true) or FieldSelect (false)
 * @param {Array<{value: string, label: ReactNode, disabled: boolean}>} props.options
 * @param {Function} [props.onToggleActive] FieldSelectPopup-only, never forwarded to FieldSelect
 * @param {...*} rest forwarded to whichever component is rendered
 * @returns {JSX.Element}
 */
const TimeSelectField = props => {
  const { isFixedUnitType, options, onToggleActive, ...rest } = props;
  return isFixedUnitType ? (
    <FieldSelectPopup options={options} onToggleActive={onToggleActive} {...rest} />
  ) : (
    <FieldSelect {...rest}>
      {options.map(option => (
        <option value={option.value} key={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </FieldSelect>
  );
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
  // Only 'fixed' unit type's quarter-hour list (up to 96 options) needs the custom popup;
  // 'hour' keeps the plain native FieldSelect it already had. Passed to the module-level
  // TimeSelectField wrapper above, which picks the component/option shape.
  const isFixedUnitType = unitType === FIXED;
  // FieldSelectPopup's own popup stays a plain in-flow child (see its module.css), so it would
  // otherwise be clipped by a later row's own stacking context (.timeRangeRow: `position:
  // relative` + `z-index: 1`); no z-index on the popup itself can out-rank a sibling row's
  // content. Raising this row's own z-index above its siblings while either popup is open fixes
  // that without the popup leaving this row's DOM subtree, unlike an escaped portal, which would
  // also have to compete with unrelated ancestors (e.g. a wrapping Modal's own z-index).
  const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
  const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);
  const isAnyTimeSelectOpen = isStartTimeOpen || isEndTimeOpen;
  const entry = entries[index];
  const dayLabel = intl.formatMessage({
    id: `EditListingAvailabilityPlanForm.dayOfWeek.${dayOfWeek}`,
  });
  const hasTimeRange = Boolean(entry?.startTime && entry?.endTime);
  // Informative accessible names for the start/end fields. Neither component gets one from the
  // shared, sighted-only "Select time" <label> below, since it has no `htmlFor` and so isn't
  // programmatically associated with either field. Passed as `label` (visually hidden via
  // `css.srOnlyLabel`), so FieldSelect gets a real `<label for>` for the first time, and
  // FieldSelectPopup's aria-labelledby composition has something to compose with. The current
  // value isn't repeated here, since both components already announce it separately.
  const startTimeAriaLabel = intl.formatMessage(
    { id: 'EditListingAvailabilityPlanForm.screenreader.startTimeLabel' },
    { dayOfWeek: dayLabel }
  );
  const endTimeAriaLabel = intl.formatMessage(
    { id: 'EditListingAvailabilityPlanForm.screenreader.endTimeLabel' },
    { dayOfWeek: dayLabel }
  );
  const deleteAriaLabel = intl.formatMessage(
    { id: 'EditListingAvailabilityPlanForm.screenreader.deleteEntry' },
    {
      dayOfWeek: dayLabel,
      hasTimeRange: hasTimeRange ? 'yes' : 'no',
      startTime: hasTimeRange ? localizedTimeStrings(entry.startTime, intl) : null,
      endTime: hasTimeRange ? localizedTimeStrings(entry.endTime, intl) : null,
    }
  );
  // FieldSelectPopup takes an `options` array prop; FieldSelect (a plain native <select>) still
  // needs real <option> JSX children, built from the same array below so there's one source of
  // truth for both.
  const startTimeOptions = [
    {
      value: '',
      label: intl.formatMessage({ id: 'EditListingAvailabilityPlanForm.startTimePlaceholder' }),
      disabled: true,
    },
    ...filterStartTimes(availableStartTimes, entries, index).map(s => ({
      value: s,
      label: localizedTimeStrings(s, intl),
    })),
  ];
  const endTimeOptions = [
    {
      value: '',
      label: intl.formatMessage({ id: 'EditListingAvailabilityPlanForm.endTimePlaceholder' }),
      disabled: true,
    },
    ...filterEndTimes(availableEndTimes, entries, index).map(s => ({
      value: s,
      label: localizedTimeStrings(s, intl),
    })),
  ];
  return (
    <div className={css.segmentWrapper} key={name}>
      <div className={css.segment}>
        <label>
          <FormattedMessage id="EditListingAvailabilityPlanForm.selectTime" />
        </label>
        <div
          className={classNames(css.timeRangeRow, {
            [css.timeRangeRowRaised]: isAnyTimeSelectOpen,
          })}
        >
          <TimeSelectField
            id={`${name}.startTime`}
            name={`${name}.startTime`}
            rootClassName={css.hourField}
            label={startTimeAriaLabel}
            labelClassName={css.srOnlyLabel}
            selectClassName={classNames(css.fieldSelect, {
              [css.notSelected]: !isTimeSetFn('startTime'),
            })}
            isFixedUnitType={isFixedUnitType}
            options={startTimeOptions}
            onToggleActive={setIsStartTimeOpen}
          />
          <span className={css.dashBetweenTimes}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" fill="none">
              <path d="M3.5 8h10" strokeWidth="1.333" strokeLinecap="round" />
            </svg>
          </span>
          <TimeSelectField
            id={`${name}.endTime`}
            name={`${name}.endTime`}
            rootClassName={css.hourField}
            label={endTimeAriaLabel}
            labelClassName={css.srOnlyLabel}
            selectClassName={classNames(css.fieldSelect, {
              [css.notSelected]: !isTimeSetFn('endTime'),
            })}
            isFixedUnitType={isFixedUnitType}
            options={endTimeOptions}
            onToggleActive={setIsEndTimeOpen}
          />
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
