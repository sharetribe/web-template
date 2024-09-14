import React from 'react';
import { Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../../util/reactIntl';
import { InlineTextButton, IconClose, FieldSelect, FieldCheckbox } from '../../../../../components';

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
 * From all the available start hours, filter only those start hours that can be used
 * in the current entry creation.
 *
 * For start hours this mainly means situation where end hours is set first.
 *
 * @param {Array<string>} availableStartHours (hours are in format: '13:00')
 * @param {*} entries created entries: [{ startTime: '13:00', endTime: '17:00' }]
 * @param {*} index index in the Final Form Array: current dayOfWeek
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
 * @param {*} entries created entries: [{ startTime: '13:00', endTime: '17:00' }]
 * @param {*} index index in the Final Form Array: current dayOfWeek
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
 * @param {*} entries look like this [{ startTime: '13:00', endTime: '17:00' }]
 * @param {*} intl
 * @param {*} findStartHours find start hours (00:00 ... 23:00) or else (01:00 ... 24:00)
 * @returns array of reserved sharp hours. E.g. ['13:00', '14:00', '15:00', '16:00']
 */
const getEntryBoundaries = (entries, intl, findStartHours) => index => {
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
    intl,
  } = props;
  return (
    <div className={css.fieldWrapper} key={name}>
      <div className={css.formRow}>
        <FieldSelect
          id={`${name}.startTime`}
          name={`${name}.startTime`}
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
        <span className={css.dashBetweenTimes}>-</span>
        <FieldSelect
          id={`${name}.endTime`}
          name={`${name}.endTime`}
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
      <div className={css.fieldArrayRemove} onClick={onRemove} style={{ cursor: 'pointer' }}>
        <IconClose rootClassName={css.closeIcon} />
      </div>
    </div>
  );
};

// Hidden input field
const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

// For unitType: 'hour', set entire day (00:00 - 24:00) and hide the inputs from end user.
const TimeRangeHidden = props => {
  const { name } = props;
  return (
    <div className={css.formRowHidden}>
      <FieldHidden name={`${name}.startTime`} />
      <FieldHidden name={`${name}.endTime`} />
    </div>
  );
};

/**
 * Handle entries for the availability plan. These are modelled with Final Form Arrays (FieldArray)
 */
const AvailabilityPlanEntries = props => {
  const { dayOfWeek, useFullDays, values, formApi, intl } = props;
  const entries = values[dayOfWeek];
  const hasEntries = entries && entries[0];
  const getEntryStartTimes = getEntryBoundaries(entries, intl, true);
  const getEntryEndTimes = getEntryBoundaries(entries, intl, false);

  const checkboxName = `checkbox_${dayOfWeek}`;
  return (
    <div className={classNames(css.weekDay, hasEntries ? css.hasEntries : null)}>
      <div className={css.dayToggle}></div>
      <div className={css.dayOfWeek}>
        <FieldCheckbox
          key={checkboxName}
          id={checkboxName}
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
                formApi.mutators.push(dayOfWeek, { startTime: '00:00', endTime: '24:00' });
              } else {
                formApi.mutators.remove(dayOfWeek, 0);
              }
            } else {
              const shouldAddEntry = isChecked && !hasEntries;
              if (shouldAddEntry) {
                // The 'hour' unit is not initialized with any value,
                // because user need to pick them themselves.
                formApi.mutators.push(dayOfWeek, { startTime: null, endTime: null });
              } else if (!isChecked) {
                // If day of week checkbox is unchecked,
                // we'll remove all the entries for that day.
                formApi.mutators.removeBatch(dayOfWeek, entries);
              }
            }
          }}
        />
      </div>

      <div className={css.pickerArea}>
        <FieldArray name={dayOfWeek}>
          {({ fields }) => {
            return (
              <div className={css.timePicker}>
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
                  return useFullDays ? (
                    <TimeRangeHidden name={name} key={name} />
                  ) : (
                    <TimeRangeSelects
                      key={name}
                      name={name}
                      index={index}
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
    </div>
  );
};

export default AvailabilityPlanEntries;
