import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import css from './DateTimeModal.module.css';

export const DateTimeModal = props => {
  const { onContinue } = props;
  const [dateValue, setDateValue] = useState(new Date());

  return (
    <div className={css.modalbody}>
      <div className={css.calendar}>
        <Calendar onChange={setDateValue} value={dateValue} className={css.calendar} />
      </div>
      <div className={css.availablebtn}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="13"
          viewBox="0 0 10 13"
          fill="none"
        >
          <g clip-path="url(#clip0_1049_3813)">
            <path
              d="M9.7899 3.35254C10.0689 3.64551 10.0689 4.12129 9.7899 4.41426L4.07561 10.4143C3.7966 10.7072 3.34347 10.7072 3.06445 10.4143L0.20731 7.41426C-0.0717076 7.12129 -0.0717076 6.64551 0.20731 6.35254C0.486328 6.05957 0.939453 6.05957 1.21847 6.35254L3.57115 8.82051L8.78097 3.35254C9.05999 3.05957 9.51311 3.05957 9.79213 3.35254H9.7899Z"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_1049_3813">
              <rect width="10" height="12" fill="white" transform="translate(0 0.882812)" />
            </clipPath>
          </defs>
        </svg>
        Available
      </div>
      <div className={css.description}>
        Reserve with a deposit. Modify headcount or cancel for a full refund through 10/10.
      </div>
      <div className={css.continuebtn} onClick={onContinue}>
        Continue
      </div>
    </div>
  );
};

export default DateTimeModal;
