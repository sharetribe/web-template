import React from 'react';

import css from '../Marquee.module.css';

const IconCircle = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      className={css.marqueeIcon}
    >
      <circle cx="4" cy="4" r="4" transform="rotate(90 4 4)" fill="black" />
    </svg>
  );
};

export default IconCircle;
