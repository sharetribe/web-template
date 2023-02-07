import React from 'react';
import { FormattedMessage, FormattedDate } from '../../util/reactIntl';
import { LINE_ITEM_NIGHT, DATE_TYPE_DATE, LINE_ITEM_HOUR, propTypes } from '../../util/types';
import { subtractTime } from '../../util/dates';

import css from './OrderBreakdown.module.css';

const BookingPeriod = props => {
  const { startDate, endDate, dateType, timeZone } = props;
  const timeZoneMaybe = timeZone ? { timeZone } : null;

  const timeFormatOptions =
    dateType === DATE_TYPE_DATE
      ? {
          weekday: 'long',
        }
      : {
          weekday: 'short',
          hour: 'numeric',
          minute: 'numeric',
        };

  const dateFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  return (
    <>
      <div className={css.bookingPeriod}>
        <div className={css.bookingPeriodSectionLeft}>
          <div className={css.dayLabel}>
            <FormattedMessage id="OrderBreakdown.bookingStart" />
          </div>
          <div className={css.dayInfo}>
            <FormattedDate value={startDate} {...timeFormatOptions} {...timeZoneMaybe} />
          </div>
          <div className={css.itemLabel}>
            <FormattedDate value={startDate} {...dateFormatOptions} {...timeZoneMaybe} />
          </div>
        </div>

        <div className={css.bookingPeriodSectionRight}>
          <div className={css.dayLabel}>
            <FormattedMessage id="OrderBreakdown.bookingEnd" />
          </div>
          <div className={css.dayInfo}>
            <FormattedDate value={endDate} {...timeFormatOptions} {...timeZoneMaybe} />
          </div>
          <div className={css.itemLabel}>
            <FormattedDate value={endDate} {...dateFormatOptions} {...timeZoneMaybe} />
          </div>
        </div>
      </div>
    </>
  );
};

const LineItemBookingPeriod = props => {
  const { booking, code, dateType, timeZone } = props;

  if (!booking) {
    return null;
  }
  // Attributes: displayStart and displayEnd can be used to differentiate shown time range
  // from actual start and end times used for availability reservation. It can help in situations
  // where there are preparation time needed between bookings.
  // Read more: https://www.sharetribe.com/api-reference/marketplace.html#bookings
  const { start, end, displayStart, displayEnd } = booking.attributes;
  const localStartDate = displayStart || start;
  const localEndDateRaw = displayEnd || end;

  const isNightly = code === LINE_ITEM_NIGHT;
  const isHour = code === LINE_ITEM_HOUR;
  const endDay = isNightly || isHour ? localEndDateRaw : subtractTime(localEndDateRaw, 1, 'days');

  return (
    <>
      <div className={css.lineItem}>
        <BookingPeriod
          startDate={localStartDate}
          endDate={endDay}
          dateType={dateType}
          timeZone={timeZone}
        />
      </div>
      <hr className={css.totalDivider} />
    </>
  );
};
LineItemBookingPeriod.defaultProps = { booking: null, dateType: null };

LineItemBookingPeriod.propTypes = {
  booking: propTypes.booking,
  dateType: propTypes.dateType,
};

export default LineItemBookingPeriod;
