import { addDays, getISODateString, getStartOfDay, isDateInRange } from './DatePicker.helpers';
import DatePicker from './DatePicker';
import { SingleDatePicker } from './SingleDatePicker';
import { DateRangePicker } from './DateRangePicker';

const today = getStartOfDay(new Date());
const disabledDay = addDays(new Date(today), 5);

// DateRangePicker
export const Dropdown_DateRangePicker = {
  component: DateRangePicker,
  props: {
    formId: 'DateRangePicker_dropdown',
    startDateId: 'DateRangePicker_start',
    endDateId: 'DateRangePicker_end',
    // disabled: true,
    // theme: 'light',
    // firstDayOfWeek: 1,
    labelStart: 'Start date',
    labelEnd: 'End date',
    //value: [addDays(disabledDay, 5), addDays(disabledDay, 9)],
    onChange: values => {
      console.log(
        Array.isArray(values) ? values.map(d => d?.toDateString() || null) : values?.toDateString()
      );
    },
    isDayBlocked: date => {
      const outOfRange =
        !isDateInRange(date, { from: today, to: addDays(today, 89) }) ||
        date.getTime() === disabledDay.getTime();
      return outOfRange;
    },
    isBlockedBetween: ([start, end]) => {
      return !end
        ? false
        : start.getTime() < disabledDay.getTime() && disabledDay.getTime() < end.getTime();
    },
  },
  group: 'inputs',
};

export const Dropdown_SingleDatePicker = {
  component: SingleDatePicker,
  props: {
    id: 'SingleDatePicker_dropdown',
    // disabled: true,
    firstDayOfWeek: 1,
    placeholder: 'Thu, Jul 25',
    // value: addDays(disabledDay, 5),
    onChange: values =>
      console.log(
        Array.isArray(values) ? values.map(d => d?.toDateString() || null) : values?.toDateString()
      ),
    isDayBlocked: date => {
      const outOfRange =
        !isDateInRange(date, { from: today, to: addDays(today, 89) }) ||
        date.getTime() === disabledDay.getTime();
      return outOfRange;
    },
    isBlockedBetween: ([start, end]) => {
      return !end
        ? false
        : start.getTime() < disabledDay.getTime() && disabledDay.getTime() < end.getTime();
    },
  },
  group: 'inputs',
};

// Plain calendar on a single date picking mode
export const Plain_SingleDate = {
  component: DatePicker,
  props: {
    formId: 'SingleDay_plain',
    // disabled: true,
    // theme: 'light',
    firstDayOfWeek: 1,
    minimumNights: 0,
    range: false,
    showClearButton: true,
    showMonthStepper: true,
    showPreviousMonthStepper: false,
    showTodayButton: true,
    startDate: getISODateString(today),
    // value,
    onChange: values =>
      console.log(
        Array.isArray(values) ? values.map(d => d?.toDateString() || null) : values?.toDateString()
      ),
    isDayBlocked: date => {
      const outOfRange =
        !isDateInRange(date, { from: today, to: addDays(today, 89) }) ||
        date.getTime() === disabledDay.getTime();
      return outOfRange;
    },
    isBlockedBetween: ([start, end]) => {
      return !end
        ? false
        : start.getTime() < disabledDay.getTime() && disabledDay.getTime() < end.getTime();
    },
  },
  group: 'inputs',
};

// Plain calendar on a date range picking mode
export const Plain_DateRange = {
  component: DatePicker,
  props: {
    formId: 'DateRange_plain',
    // disabled: true,
    theme: 'light',
    firstDayOfWeek: 1,
    minimumNights: 0,
    range: true,
    showClearButton: false,
    showMonthStepper: true,
    showTodayButton: false,
    startDate: getISODateString(today),
    // value,
    onChange: values =>
      console.log(
        Array.isArray(values) ? values.map(d => d?.toDateString() || null) : values?.toDateString()
      ),
    isDayBlocked: date => {
      const outOfRange =
        !isDateInRange(date, { from: today, to: addDays(today, 89) }) ||
        date.getTime() === disabledDay.getTime();
      return outOfRange;
    },
    isBlockedBetween: ([start, end]) => {
      return !end
        ? false
        : start.getTime() < disabledDay.getTime() && disabledDay.getTime() < end.getTime();
    },
  },
  group: 'inputs',
};
