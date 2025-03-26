import React from 'react';
import { FormattedMessage, FormattedDate } from '../../util/reactIntl';
import {
  DATE_TYPE_DATE,
  DATE_TYPE_TIME,
  DATE_TYPE_DATETIME,
  LINE_ITEM_DAY,
  LINE_ITEM_HOUR,
  LINE_ITEM_NIGHT,
  propTypes,
} from '../../util/types';
import { subtractTime, isDST } from '../../util/dates';

import css from './OrderBreakdown.module.css';

const DSTMaybe = props => {
  const { startDate, endDate, isStart, dateType, timeZone } = props;
  const isDayTimeRange = dateType === DATE_TYPE_DATETIME;
  if (!isDayTimeRange) {
    return null;
  }

  const isStartInDST = isDST(startDate, timeZone);
  const isEndInDST = isDST(endDate, timeZone);
  const isDSTChanged = isStartInDST !== isEndInDST;
  const showDSTMsgForStart = isDSTChanged && isStart && isStartInDST;
  const showDSTMsgForEnd = isDSTChanged && !isStart && isEndInDST;

  return showDSTMsgForStart || showDSTMsgForEnd ? (
    <div className={css.itemLabel}>
      <FormattedMessage id="OrderBreakdown.bookingWithDSTInEffect" />
    </div>
  ) : null;
};

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
          <DSTMaybe
            startDate={startDate}
            endDate={endDate}
            isStart={true}
            dateType={dateType}
            timeZone={timeZone}
          />
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
          <DSTMaybe
            startDate={startDate}
            endDate={endDate}
            isStart={false}
            dateType={dateType}
            timeZone={timeZone}
          />
        </div>
      </div>
    </>
  );
};

/**
 * A line-item to show booking period for the OrderBreakdown
 *
 * @component
 * @param {Object} props
 * @param {propTypes.booking?} props.booking
 * @param {LINE_ITEM_NIGHT | LINE_ITEM_DAY | LINE_ITEM_HOUR} props.code
 * @param {DATE_TYPE_DATE | DATE_TYPE_TIME | DATE_TYPE_DATETIME} props.dateType
 * @param {string} props.timeZone IANA time zone name
 * @returns {JSX.Element} line-item element for the order breakdown
 */
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

  const showInclusiveEndDate = [LINE_ITEM_DAY].includes(code);
  const endDay = showInclusiveEndDate ? subtractTime(localEndDateRaw, 1, 'days') : localEndDateRaw;

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

export default LineItemBookingPeriod;
