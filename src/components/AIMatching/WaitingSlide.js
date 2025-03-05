import React, { useEffect } from 'react';
import { H2 } from '../../containers/PageBuilder/Primitives/Heading';
import SlideContentWrapper from './SlideContentWrapper';

const WaitingSlide = ({ swiperRef, instructorMatches }) => {

  useEffect(() => {
    if (instructorMatches) {
      swiperRef.current.slideNext();
    }
  }, [instructorMatches]);

  return (
    <SlideContentWrapper>
        <H2>Wait Just a Moment While We Find Your Matches...</H2>
    </SlideContentWrapper>
  );

};

export default WaitingSlide;
