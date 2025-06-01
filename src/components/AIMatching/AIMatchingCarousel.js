import React from 'react';

// Import Swiper core and required modules
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

import css from './AIMatchingCarousel.module.css';
import PromptSlide from './PromptSlide';
import WaitingSlide from './WaitingSlide';
import ResultsSlide from './ResultsSlide';
import { useEffect, useRef, useState } from 'react';
import { aiBackend } from '../../util/api';
import { H1 } from '../Heading/Heading';

const AIMatchingCarousel = () => {
  const [instructorMatches, setInstructorMatches] = useState(null);
  const swiperRef = useRef(null);
  const [stCookie, setStCookie] = useState(null);
  const screenCenterRef = useRef(null);


  useEffect(() => {
    const getSTCookie = () => {
      const cookies = document.cookie.split(';');
      const stCookie = cookies.find(cookie => cookie.trim().startsWith('st-'));
      return stCookie ? stCookie.split('=')[1] : null;
    };

    setStCookie(getSTCookie());
  }, []);

  useEffect(() => {
    if (screenCenterRef.current) {
      // Calculate the position to scroll to
      const { offsetLeft, offsetTop, offsetWidth, offsetHeight } =
        screenCenterRef.current;
      const scrollX = offsetLeft + offsetWidth / 2 - window.innerWidth / 2;
      const scrollY = offsetTop + offsetHeight / 2 - window.innerHeight / 2;

      // Scroll the window to center the element
      window.scrollTo({
        top: scrollY,
        left: scrollX
      });
    }
  }, [stCookie]);

  const fetchInstructorMatches = async (additionalUserInput) => {
    try {
      // Simulating API call
      const instructorResponse = await aiBackend.instructors({ additionalUserInput: additionalUserInput });
      if (!instructorMatches) {
        setInstructorMatches(JSON.parse(instructorResponse));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const continueToNextSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  return (
    <div ref={screenCenterRef} className={css.swiperWrapper}>
      {stCookie ? (
        <div className={css.swiperContainer}>
          <Swiper
            modules={[Navigation, Pagination, Scrollbar, A11y]}
            slidesPerView={1}
            allowTouchMove={false} // Prevent manual swiping
            allowSlidePrev={false} // Disable sliding back
            onSwiper={(swiper) => {
              swiperRef.current = swiper; // Store Swiper instance
            }}
          >
            <SwiperSlide>
              <PromptSlide
                continueToNextSlide={continueToNextSlide}
                startInstructorLookup={fetchInstructorMatches}
              />
            </SwiperSlide>
            <SwiperSlide>
              <WaitingSlide
                swiperRef={swiperRef}
                instructorMatches={instructorMatches}
              />
            </SwiperSlide>
            <SwiperSlide>
              <ResultsSlide
                swiperRef={swiperRef}
                instructorMatches={instructorMatches}
              />
            </SwiperSlide>
          </Swiper>
        </div>
      ) : (
        <H1 style={{ width: '40%' }}>
          Thanks for visiting! Unfortunately, to use this feature you must have an account and be
          logged in!
        </H1>
      )}
    </div>
  );
};

export default AIMatchingCarousel;
