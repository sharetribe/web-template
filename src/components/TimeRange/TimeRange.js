import React from 'react';
import classNames from 'classnames';
import { isSameDay, formatDateIntoPartials } from '../../util/dates';
import { useIntl } from '../../util/reactIntl';
import { DATE_TYPE_DATE, DATE_TYPE_TIME, DATE_TYPE_DATETIME } from '../../util/types';

import css from './TimeRange.module.css';

// Sometimes we want to break string created by intl.formatDateTimeRange into
// shorter substrings. Intl uses special dash to separate date-time range.
const DASH = '–';
const BREAK_WORD_MIN_LENGTH = 27;

/**
 * A component that renders a time range.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Date} props.startDate - The start date
 * @param {Date} props.endDate - The end date
 * @param {DATE_TYPE_DATE|DATE_TYPE_TIME|DATE_TYPE_DATETIME} [props.dateType] - The date type
 * @param {string} [props.timeZone] - The time zone (e.g. 'America/New_York')
 * @returns {JSX.Element} Time range component
 */
export const TimeRange = props => {
  const intl = useIntl();
  const { rootClassName, className, startDate, endDate, dateType, timeZone } = props;
  const start = formatDateIntoPartials(startDate, intl, { timeZone });
  const end = formatDateIntoPartials(endDate, intl, { timeZone });
  const isSingleDay = isSameDay(startDate, endDate, timeZone);

  const dateFormatting = { month: 'short', day: 'numeric', timeZone };

  const classes = classNames(rootClassName || css.root, className);

  if (isSingleDay && dateType === DATE_TYPE_DATE) {
    return (
      <div className={classes}>
        <span className={css.dateSection}>{`${start.date}`}</span>
      </div>
    );
  } else if (dateType === DATE_TYPE_DATE) {
    const formatted = intl.formatDateTimeRange(startDate, endDate, dateFormatting);
    // For small words, we use the default from Intl,
    // but for longer words, we add correct word wraps by adding spans.
    const range =
      formatted.length > BREAK_WORD_MIN_LENGTH ? (
        formatted.split(DASH).map((rangePartial, i) => (
          <span key={`datespan${i}`} className={css.dateSection}>
            {rangePartial}
            {i == 0 ? DASH : null}
          </span>
        ))
      ) : (
        <span className={css.dateSection}>{formatted}</span>
      );
    return <div className={classes}>{range}</div>;
  } else if (isSingleDay && dateType === DATE_TYPE_TIME) {
    return (
      <div className={classes}>
        <span className={css.dateSection}>{`${start.time} - ${end.time}`}</span>
      </div>
    );
  } else if (dateType === DATE_TYPE_TIME) {
    const timeFormatting = { hour: 'numeric', minute: 'numeric' };
    const formatted = intl.formatDateTimeRange(startDate, endDate, {
      ...dateFormatting,
      ...timeFormatting,
    });
    // For small words, we use the default from Intl,
    // but for longer words, we add correct word wraps by adding spans.
    const range =
      formatted.length > BREAK_WORD_MIN_LENGTH ? (
        formatted.split(DASH).map((rangePartial, i) => (
          <span key={`datespan${i}`} className={css.dateSection}>
            {rangePartial}
            {i == 0 ? ` ${DASH} ` : null}
          </span>
        ))
      ) : (
        <span className={css.dateSection}>{formatted}</span>
      );
    return <div className={classes}>{range}</div>;
  } else if (isSingleDay && dateType === DATE_TYPE_DATETIME) {
    return (
      <div className={classes}>
        <span className={css.dateSection}>{`${start.date}, ${start.time} - ${end.time}`}</span>
      </div>
    );
  } else {
    return (
      <div className={classes}>
        <span className={css.dateSection}>{`${start.dateAndTime} - `}</span>
        <span className={css.dateSection}>{`${end.dateAndTime}`}</span>
      </div>
    );
  }
};

export default TimeRange;
