import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';
import { format, isValid } from 'date-fns';
import { FieldDateRangePicker } from '../../../../../components';
import css from './MonthlyCalendar.module.css';

const MonthlyCalendar = props => {
  const {
    className,
    rootClassName,
    selectedDates,
    onDateSelect,
    timeZone,
  } = props;

  const intl = useIntl();
  const classes = classNames(rootClassName || css.root, className);

  // Convert ISO strings back to Date objects for the calendar
  const selectedDatesArray = selectedDates?.map(date => new Date(date)) || [];
  const startDate = selectedDatesArray[0] || null;
  const endDate = selectedDatesArray[selectedDatesArray.length - 1] || null;

  const handleAvailabilityChange = ({ startDate, endDate }) => {
    console.log('🔍 Date selection fired:');
    console.log('Start:', startDate);
    console.log('End:', endDate);
    // Only call onDateSelect if both dates are picked
    if (startDate && endDate) {
      const selectedDatesArray = [];
      let currentDate = new Date(startDate);
      const end = new Date(endDate);
      while (currentDate <= end) {
        selectedDatesArray.push(currentDate.toISOString());
        currentDate.setDate(currentDate.getDate() + 1);
      }
      console.log('Selected dates array:', selectedDatesArray);
      onDateSelect(selectedDatesArray);
    }
  };

  return (
    <FinalForm
      onSubmit={() => {}} // Stub onSubmit since we handle changes directly
      render={({ handleSubmit }) => (
        <form onSubmit={handleSubmit} className={classes}>
          <div className={css.calendarWrapper}>
            <FieldDateRangePicker
              id="availabilityDates"
              name="availabilityDates"
              startDateId="availability_start_date_id"
              endDateId="availability_end_date_id"
              startDateLabel={intl.formatMessage({ id: 'EditListingAvailabilityPanel.startDate' })}
              endDateLabel={intl.formatMessage({ id: 'EditListingAvailabilityPanel.endDate' })}
              onChange={handleAvailabilityChange}
              isOutsideRange={() => false}
              format={date => (isValid(date) ? format(date, 'MM/dd/yyyy') : '')}
              anchorDirection="left"
              openDirection="down"
              showClearDates={true}
              keepOpenOnDateSelect={true}
              noBorder={false}
              displayFormat="MM/dd/yyyy"
              startDatePlaceholderText="Start date"
              endDatePlaceholderText="End date"
            />
          </div>
        </form>
      )}
    />
  );
};

export default MonthlyCalendar; 