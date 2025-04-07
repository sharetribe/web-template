import React from 'react';

import css from './TopbarSearchForm.module.css';

const IconSearchDesktop = () => (
  <svg
    className={css.iconSvg}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
      <path
        d="M15 16C15.5573 16 16 15.5387 16 15C16 14.7475 15.1886 14.1767 15 14L11 10C11.8488 8.90584 13 7.47291 13 6C13 2.43977 9.62655 0 6 0C2.38202 0 0 2.43135 0 6C0 9.56023 2.37345 12 6 12C7.43176 12 8.91975 11.7575 10 11L14 15C14.1886 15.1852 14.7342 16 15 16ZM6 11C3.1708 11 1 8.77749 1 6C1 3.22251 3.1708 1 6 1C8.8292 1 11 3.22251 11 6C11 8.77749 8.8292 11 6 11Z"
        fill="#1026e5"
      />
  </svg>
);

export default IconSearchDesktop;
