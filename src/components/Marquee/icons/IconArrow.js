import React from 'react';

import css from '../Marquee.module.css';

const IconArrow = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="8"
      viewBox="0 0 13 8"
      fill="none"
      className={css.marqueeIcon}
    >
      <path
        d="M0 7.47213V0.532724C0 0.26624 0.255673 0.0742668 0.511579 0.148601L12.6555 3.67613C13.0419 3.78835 13.0395 4.33653 12.6522 4.44535L0.508192 7.85722C0.253052 7.92891 0 7.73715 0 7.47213Z"
        fill="black"
      />
    </svg>
  );
};

export default IconArrow;
