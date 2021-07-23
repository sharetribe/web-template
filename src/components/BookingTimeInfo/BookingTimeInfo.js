import React from 'react';
import { bool } from 'prop-types';
import classNames from 'classnames';
import { txIsEnquired } from '../../util/transaction';
import {
  timeOfDayFromTimeZoneToLocal,
  daysBetween,
  formatDateIntoPartials,
  subtractTime,
} from '../../util/dates';
import { injectIntl, intlShape } from '../../util/reactIntl';
import {
  LINE_ITEM_DAY,
  LINE_ITEM_NIGHT,
  LINE_ITEM_UNITS,
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
  propTypes,
} from '../../util/types';

import css from './BookingTimeInfo.module.css';

const orderData = (unitType, tx, intl) => {
  // Attributes: displayStart and displayEnd can be used to differentiate shown time range
  // from actual start and end times used for availability reservation. It can help in situations
  // where there are preparation time needed between bookings.
  // Read more: https://www.sharetribe.com/api-reference/marketplace.html#bookings
  const { start, end, displayStart, displayEnd } = tx.booking.attributes;
  const apiTimeZone = 'Etc/UTC';
  const startDate = timeOfDayFromTimeZoneToLocal(displayStart || start, apiTimeZone);
  const endDateRaw = timeOfDayFromTimeZoneToLocal(displayEnd || end, apiTimeZone);
  const isDaily = unitType === LINE_ITEM_DAY;
  const isNightly = unitType === LINE_ITEM_NIGHT;
  const isUnits = unitType === LINE_ITEM_UNITS;
  const isSingleDay = !isNightly && daysBetween(startDate, endDateRaw) <= 1;
  const bookingStart = formatDateIntoPartials(startDate, intl);
  // Shift the exclusive API end date with daily bookings
  const endDate = isDaily || isUnits ? subtractTime(endDateRaw, 1, 'days') : endDateRaw;
  const bookingEnd = formatDateIntoPartials(endDate, intl);
  return { bookingStart, bookingEnd, isSingleDay };
};

const BookingTimeInfoComponent = props => {
  const { bookingClassName, intl, tx, unitType, dateType } = props;
  const isEnquiry = txIsEnquired(tx);

  if (isEnquiry) {
    return null;
  }

  const bookingTimes = orderData(unitType, tx, intl);

  const { bookingStart, bookingEnd, isSingleDay } = bookingTimes;

  if (isSingleDay && dateType === DATE_TYPE_DATE) {
    return (
      <div className={classNames(css.bookingInfo, bookingClassName)}>
        <span className={css.dateSection}>{`${bookingStart.date}`}</span>
      </div>
    );
  } else if (dateType === DATE_TYPE_DATE) {
    return (
      <div className={classNames(css.bookingInfo, bookingClassName)}>
        <span className={css.dateSection}>{`${bookingStart.date} -`}</span>
        <span className={css.dateSection}>{`${bookingEnd.date}`}</span>
      </div>
    );
  } else if (isSingleDay && dateType === DATE_TYPE_DATETIME) {
    return (
      <div className={classNames(css.bookingInfo, bookingClassName)}>
        <span className={css.dateSection}>
          {`${bookingStart.date}, ${bookingStart.time} - ${bookingEnd.time}`}
        </span>
      </div>
    );
  } else {
    return (
      <div className={classNames(css.bookingInfo, bookingClassName)}>
        <span className={css.dateSection}>{`${bookingStart.dateAndTime} - `}</span>
        <span className={css.dateSection}>{`${bookingEnd.dateAndTime}`}</span>
      </div>
    );
  }
};

BookingTimeInfoComponent.defaultProps = { dateType: null };

BookingTimeInfoComponent.propTypes = {
  intl: intlShape.isRequired,
  tx: propTypes.transaction.isRequired,
  unitType: propTypes.lineItemUnitType.isRequired,
  dateType: propTypes.dateType,
};

const BookingTimeInfo = injectIntl(BookingTimeInfoComponent);

export default BookingTimeInfo;
