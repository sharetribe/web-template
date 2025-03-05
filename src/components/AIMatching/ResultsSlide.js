import React, { useEffect } from 'react';
import { H2 } from '../Heading/Heading';
import SlideContentWrapper from './SlideContentWrapper';
import { Ingress } from '../../containers/PageBuilder/Primitives/Ingress';

import css from './AIMatchingCarousel.module.css';
import ResultsSwipe from './ResultsSwipe/ResultsSwipe';

const ResultsSlide = ({instructorMatches}) => {

  return (
    <SlideContentWrapper>
      <H2>Your Results are Ready!</H2>
      <Ingress style={{ maxWidth: '700px' }}>Here are some options we think you'll like. Swipe each card with your finger or mouse to read why we think they're a good match for you!</Ingress>
      <Ingress style={{ maxWidth: '700px' }}>You can also learn more about them by clicking their names!</Ingress>
      <div className={css.swiperResults}>
        {instructorMatches?.length > 0 ? (
          instructorMatches.map((instructorMatch, index) => (
            <ResultsSwipe
              key={instructorMatch.id || index}
              instructorMatch={instructorMatch}
            />
          ))
        ) : (
          <p>No instructor matches available.</p>
        )}
      </div>
    </SlideContentWrapper>
  );
};

export default ResultsSlide;
