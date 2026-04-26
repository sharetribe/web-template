import React from 'react';

import css from './TopbarSearchForm.module.css';

const IconSearchDesktop = () => (
  <svg
    className={css.iconSvg}
    width="15"
    height="15"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <g
      className={css.iconSvgGroup}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="7" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
    </g>
  </svg>
);

export default IconSearchDesktop;
