import React from 'react';

import css from './AIMatchingCarousel.module.css';

const SlideContentWrapper = ({ children }) => {
  return (
    <div className={css.swiperSlideContent}>
      {children}
    </div>
  );
};

export default SlideContentWrapper;
