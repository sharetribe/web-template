import React from 'react';
import { createIntl, createIntlCache } from 'react-intl';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';

import {
  addDays,
  getDaysOfMonth,
  getISODateString,
  getMonths,
  getStartOfDay,
  removeTimezoneOffset,
} from './DatePicker.helpers';
import DatePicker from './DatePicker';
import SingleDatePicker from './SingleDatePicker';
import DateRangePicker from './DateRangePicker';

const { screen, userEvent, within } = testingLibrary;

const noop = () => {};
const today = getStartOfDay(new Date());
const cache = createIntlCache();
const intl = createIntl(
  {
    locale: 'en-US',
    messages: {
      'DatePicker.clearButton': 'Clear value',
      'DatePicker.screenreader.nextMonthButton': 'Next month',
      'DatePicker.screenreader.previousMonthButton': 'Previous month',
      'DatePicker.screenreader.blockedDate': '{date} is not available',
      'DatePicker.screenreader.chooseDate': 'Choose {date}',
      'DatePicker.screenreader.chooseEndDate': 'Choose {date} as an end date',
      'DatePicker.screenreader.chooseStartDate': 'Choose {date} as a start date',
      'DatePicker.screenreader.selectedDate': '{date} is selected',
      'DatePicker.screenreader.selectedEndDate': '{date} is selected as the end date',
      'DatePicker.screenreader.selectedStartDate': '{date} is selected as the start date',
      'DatePicker.todayButton': 'Show today',
    },
  },
  cache
);

const formatDate = d => {
  return intl.formatDate(d, { day: 'numeric', month: 'long' });
};
formatDatesOfMonth = (date, firstDayOfWeek) => {
  return getDaysOfMonth(date, true, firstDayOfWeek).map(d => formatDate(d));
};

describe('DatePicker', () => {
  const firstDayOfWeek = 1;
  const props = {
    firstDayOfWeek,
    minimumNights: 0,
    range: false,
    showMonthStepper: true,
    // showPreviousMonthStepper: false,
    // showClearButton: true,
    // showTodayButton: true,
    startDate: getISODateString(today),
    onChange: noop,
    isDayBlocked: () => false,
    isBlockedBetween: () => false,
    intl,
  };

  it('Initially shows the current month', () => {
    render(<DatePicker {...props} />);
    const currentMonthString = screen.getByText(
      `${getMonths(intl)[today.getMonth()]} ${today.getFullYear()}`
    );
    expect(currentMonthString).toBeInTheDocument();

    const months = screen.getAllByRole('presentation');

    const dates = formatDatesOfMonth(today, firstDayOfWeek);
    const currentMonthCal = within(months[1]);
    dates.map(date =>
      currentMonthCal.getByRole('button', {
        name: intl.formatMessage({ id: 'DatePicker.screenreader.chooseDate' }, { date }),
      })
    );
  });

  it('Shows configured start date', () => {
    const startDate = '2024-06-15';
    const localStartDate = removeTimezoneOffset(new Date(startDate));
    render(<DatePicker {...{ ...props, startDate }} />);

    const currentMonthString = screen.getByText(
      `${getMonths(intl)[localStartDate.getMonth()]} ${localStartDate.getFullYear()}`
    );
    expect(currentMonthString).toBeInTheDocument();
  });

  it('Shows weekday header, firstDayOfWeek=1', () => {
    render(<DatePicker {...props} />);
    const months = screen.getAllByRole('presentation');
    const currentMonthCal = within(months[1]);
    const weekdays = currentMonthCal.getAllByTestId('weekday');
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    weekdays.forEach((weekday, i) => {
      expect(within(weekday).getByText(order[i])).toBeInTheDocument();
    });
  });
  it('Shows weekday header, firstDayOfWeek=0', () => {
    render(<DatePicker {...{ ...props, firstDayOfWeek: 0 }} />);
    const months = screen.getAllByRole('presentation');
    const currentMonthCal = within(months[1]);
    const weekdays = currentMonthCal.getAllByTestId('weekday');
    const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach((weekday, i) => {
      expect(within(weekday).getByText(order[i])).toBeInTheDocument();
    });
  });

  it('Selects dates: June 15th, 25th, 26th, 19th', () => {
    const startDate = '2024-06-15';
    render(<DatePicker {...{ ...props, startDate }} />);
    userEvent.click(screen.getByRole('button', { name: 'Choose June 15' }));
    expect(screen.getByRole('button', { name: 'June 15 is selected' })).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Choose June 25' }));
    expect(screen.getByRole('button', { name: 'June 25 is selected' })).toBeInTheDocument();
    userEvent.keyboard('[ArrowRight][Enter]');
    expect(screen.getByRole('button', { name: 'June 26 is selected' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'June 25 is selected' })).not.toBeInTheDocument();
    userEvent.keyboard('[ArrowUp][Enter]');
    expect(screen.getByRole('button', { name: 'June 19 is selected' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'June 19 is selected' })).toHaveClass('dateCurrent');
    expect(screen.getByRole('button', { name: 'Choose June 15' })).not.toHaveClass('dateCurrent');
  });

  it('Highlights current date with keyboard selection', () => {
    const startDate = '2024-06-15';
    render(<DatePicker {...{ ...props, startDate }} />);
    userEvent.click(screen.getByRole('button', { name: 'Choose June 15' }));
    const clicked15 = screen.getByRole('button', { name: 'June 15 is selected' });
    expect(clicked15).toBeInTheDocument();
    expect(clicked15).toHaveClass('dateCurrent');
    userEvent.keyboard('[ArrowRight][Enter]');
    const selected16 = screen.getByRole('button', { name: 'June 16 is selected' });
    expect(selected16).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose June 15' })).not.toHaveClass('dateCurrent');
  });

  it('disables dates', () => {
    const startDate = '2024-08-11';
    const day = removeTimezoneOffset(new Date(startDate));
    const disabledDay = addDays(new Date(day), 5);
    const dateString = intl.formatDate(disabledDay, { day: 'numeric', month: 'long' });
    const isDayBlocked = date => {
      return date.getTime() === disabledDay.getTime();
    };

    render(<DatePicker {...{ ...props, startDate, isDayBlocked }} />);
    const disabledDateBtn = screen.getByRole('button', { name: `${dateString} is not available` });
    expect(disabledDateBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('changes months through key navigation', async () => {
    const startDate = '2024-08-11';
    const day = removeTimezoneOffset(new Date(startDate));
    const dateString = intl.formatDate(day, { day: 'numeric', month: 'long' });
    const onMonthChange = jest.fn();

    render(<DatePicker {...{ ...props, startDate, onMonthChange }} />);
    userEvent.click(screen.getByRole('button', { name: `Choose ${dateString}` }));
    userEvent.keyboard('[ArrowDown][ArrowDown][ArrowDown][ArrowDown][ArrowDown]');
    expect(onMonthChange).toHaveBeenCalled();
  });

  it('jumps to current month', async () => {
    const startDate = '2024-01-01';
    const showTodayButton = true;
    const localStartDate = removeTimezoneOffset(new Date(startDate));
    const getCurrentMonthString = (localDate, scr) =>
      scr.getByText(`${getMonths(intl)[localDate.getMonth()]} ${localDate.getFullYear()}`);

    render(<DatePicker {...{ ...props, startDate, showTodayButton }} />);
    const currentMonthString = getCurrentMonthString(localStartDate, screen);
    expect(currentMonthString).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: `DatePicker.todayButton` }));
    const currentMonthString2 = getCurrentMonthString(removeTimezoneOffset(new Date()), screen);
    expect(currentMonthString2).toBeInTheDocument();
  });

  it('clears its value', async () => {
    const startDate = '2024-06-15';
    const showClearButton = true;
    render(<DatePicker {...{ ...props, startDate, showClearButton }} />);
    userEvent.click(screen.getByRole('button', { name: 'Choose June 15' }));
    const clicked15 = screen.getByRole('button', { name: 'June 15 is selected' });
    expect(clicked15).toBeInTheDocument();
    expect(clicked15).toHaveClass('dateSelected');

    userEvent.click(screen.getByRole('button', { name: `DatePicker.clearButton` }));
    expect(clicked15).toBeInTheDocument();
    expect(clicked15).not.toHaveClass('dateSelected');
  });
});

describe('SingleDatePicker', () => {
  const firstDayOfWeek = 1;
  const props = {
    id: 'test',
    firstDayOfWeek,
    minimumNights: 0,
    range: false,
    showMonthStepper: true,
    // showPreviousMonthStepper: false,
    // showClearButton: true,
    // showTodayButton: true,
    value: removeTimezoneOffset(new Date('2024-08-11')),
    onChange: noop,
    isDayBlocked: () => false,
    isBlockedBetween: () => false,
    intl,
  };

  it('shows selected date', () => {
    const startDay = removeTimezoneOffset(new Date('2024-08-11'));
    render(<SingleDatePicker {...props} />);

    const calendarDateString = intl.formatDate(startDay, { day: 'numeric', month: 'long' });
    expect(
      screen.queryByRole('button', { name: `${calendarDateString} is selected` })
    ).not.toBeInTheDocument();

    const inputDateFormatOptions = { day: 'numeric', month: 'short', weekday: 'short' };
    const todayInputString = intl.formatDate(startDay, inputDateFormatOptions);
    userEvent.click(screen.getByDisplayValue(todayInputString));

    const calendarDateBtn = screen.getByRole('button', {
      name: `${calendarDateString} is selected`,
    });
    expect(calendarDateBtn).toBeInTheDocument();
    expect(calendarDateBtn).toHaveAttribute('tabIndex', '0');
    expect(calendarDateBtn).toHaveClass('dateSelected');

    userEvent.keyboard('[ArrowRight][Enter]');
    const nextDayInputString = intl.formatDate(addDays(startDay, 1), inputDateFormatOptions);
    expect(screen.getByDisplayValue(nextDayInputString)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(todayInputString)).not.toBeInTheDocument();
  });
});

describe('DateRangePicker', () => {
  const firstDayOfWeek = 1;
  const props = {
    startDateId: 'test_start',
    endDateId: 'test_end',
    firstDayOfWeek,
    minimumNights: 0,
    showMonthStepper: true,
    // showPreviousMonthStepper: false,
    // showClearButton: true,
    // showTodayButton: true,
    value: [removeTimezoneOffset(new Date('2024-08-11'))], // [start, end]
    onChange: noop,
    isDayBlocked: () => false,
    isBlockedBetween: () => false,
    intl,
  };

  it('shows selected date range: single day with minimumNights: 0', () => {
    const startDate = '2024-08-11';
    render(<DateRangePicker {...{ ...props, startDate }} />);

    const startDay = removeTimezoneOffset(new Date(startDate));
    const calendarStartDayString = intl.formatDate(startDay, { day: 'numeric', month: 'long' });
    expect(
      screen.queryByRole('button', { name: `${calendarStartDayString} is selected` })
    ).not.toBeInTheDocument();

    const inputDateFormatOptions = { day: 'numeric', month: 'short', weekday: 'short' };
    const startDayInputString = intl.formatDate(startDay, inputDateFormatOptions);
    userEvent.click(screen.getByDisplayValue(startDayInputString));
    const calendarDate = screen.getByRole('button', {
      name: `${calendarStartDayString} is selected`,
    });
    expect(calendarDate).toBeInTheDocument();
    expect(calendarDate).toHaveAttribute('tabIndex', '0');
    expect(calendarDate).toHaveClass('dateSelected');
    expect(calendarDate).toHaveClass('dateStart');
    expect(calendarDate).toHaveClass('dateInRange');

    userEvent.keyboard('[ArrowRight][ArrowLeft][Enter]');
    const endDay = startDay;
    const endDayInputString = intl.formatDate(endDay, inputDateFormatOptions);
    // These are the same
    expect(screen.queryAllByDisplayValue(startDayInputString)).toHaveLength(2);
    expect(screen.queryAllByDisplayValue(endDayInputString)).toHaveLength(2);

    userEvent.click(screen.queryAllByDisplayValue(startDayInputString)[0]);
    const calendarStartDate = screen.getByRole('button', {
      name: `${calendarStartDayString} is selected`,
    });
    const calendarEndDate = calendarStartDate;
    expect(calendarStartDate).toBeInTheDocument();
    expect(calendarStartDate).toHaveClass('dateSelected');
    expect(calendarStartDate).toHaveClass('dateStart');
    expect(calendarStartDate).toHaveClass('dateInRange');
    expect(calendarEndDate).toBeInTheDocument();
    expect(calendarEndDate).toHaveClass('dateSelected');
    expect(calendarEndDate).toHaveClass('dateEnd');
    expect(calendarEndDate).toHaveClass('dateInRange');
  });

  it('shows selected date range: minimumNights: 1', () => {
    const startDate = '2024-08-11';
    render(<DateRangePicker {...{ ...props, startDate, minimumNights: 1 }} />);

    const startDay = removeTimezoneOffset(new Date(startDate));
    const calendarStartDayString = intl.formatDate(startDay, { day: 'numeric', month: 'long' });
    expect(
      screen.queryByRole('button', { name: `${calendarStartDayString} is selected` })
    ).not.toBeInTheDocument();

    const inputDateFormatOptions = { day: 'numeric', month: 'short', weekday: 'short' };
    const startDayInputString = intl.formatDate(startDay, inputDateFormatOptions);
    userEvent.click(screen.getByDisplayValue(startDayInputString));
    const calendarDate = screen.getByRole('button', {
      name: `${calendarStartDayString} is selected`,
    });
    expect(calendarDate).toBeInTheDocument();
    expect(calendarDate).toHaveAttribute('tabIndex', '0');
    expect(calendarDate).toHaveClass('dateSelected');
    expect(calendarDate).toHaveClass('dateStart');
    expect(calendarDate).toHaveClass('dateInRange');

    // Try to select the same day
    userEvent.keyboard('[ArrowRight][ArrowLeft][Enter]');
    const faultyEndDay = addDays(startDay, 1);
    const faultyEndDayInputString = intl.formatDate(faultyEndDay, inputDateFormatOptions);
    expect(screen.getByDisplayValue(startDayInputString)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(faultyEndDayInputString)).not.toBeInTheDocument();

    userEvent.keyboard('[ArrowRight][Enter]');
    const endDay = addDays(startDay, 1);
    const endDayInputString = intl.formatDate(endDay, inputDateFormatOptions);
    const calendarEndDayString = intl.formatDate(endDay, { day: 'numeric', month: 'long' });
    expect(screen.getByDisplayValue(startDayInputString)).toBeInTheDocument();
    expect(screen.getByDisplayValue(endDayInputString)).toBeInTheDocument();

    userEvent.click(screen.getByDisplayValue(startDayInputString));
    const calendarStartDate = screen.getByRole('button', {
      name: `${calendarStartDayString} is selected as the start date`,
    });
    const calendarEndDate = screen.getByRole('button', {
      name: `${calendarEndDayString} is selected as the end date`,
    });
    expect(calendarStartDate).toBeInTheDocument();
    expect(calendarStartDate).toHaveClass('dateSelected');
    expect(calendarStartDate).toHaveClass('dateStart');
    expect(calendarStartDate).toHaveClass('dateInRange');
    expect(calendarEndDate).toBeInTheDocument();
    expect(calendarEndDate).toHaveClass('dateSelected');
    expect(calendarEndDate).toHaveClass('dateEnd');
    expect(calendarEndDate).toHaveClass('dateInRange');
  });
});
