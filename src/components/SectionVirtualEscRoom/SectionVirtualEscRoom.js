import React, { useState } from 'react';
import css from './SectionVirtualEscRoom.module.css';

const SectionVirtualEscRoom = props => {
  const { actions } = props;

  return (
    <div className={css.root}>
      <div>
        <div className={css.title}>Virtual escape room</div>
        <div className={css.subTitle}>X Game</div>
      </div>
      <div className={css.dateContainer}>
        <div className={css.dateAndTime}>
          <div className={css.date}>Mon, Oct 23</div>
          <div className={css.time}>5:30pm - 7:30pm</div>
        </div>
        <div className={css.editButton}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="13"
            viewBox="0 0 12 13"
            fill="none"
          >
            <path
              d="M8.50988 0.939897L7.37427 2.07542L10.4245 5.12537L11.5601 3.98985C12.1466 3.40332 12.1466 2.45314 11.5601 1.86661L10.6356 0.939897C10.049 0.353368 9.0988 0.353368 8.51222 0.939897H8.50988ZM6.844 2.60564L1.37477 8.07679C1.13075 8.32079 0.952436 8.62344 0.853891 8.95424L0.0233004 11.7766C-0.0353571 11.976 0.0186078 12.1895 0.164079 12.335C0.309549 12.4805 0.523063 12.5344 0.720152 12.4781L3.54275 11.6476C3.87358 11.5491 4.17626 11.3707 4.42027 11.1267L9.89419 5.6556L6.844 2.60564Z"
              fill="#227667"
            />
          </svg>
        </div>
      </div>
      <div className={css.image}></div>
      {actions && (
        <div className={css.buttons}>
          <div className={css.btnPrimary}>View</div>
          <div className={css.btnSecondary}>Cancel</div>
        </div>
      )}
    </div>
  );
};

export default SectionVirtualEscRoom;
