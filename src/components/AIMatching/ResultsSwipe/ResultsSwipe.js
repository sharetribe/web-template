import React from 'react';
import { EffectCards } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import InstructorPlaceholder from '../../../assets/instructor-placeholder.jpg';

import styled from 'styled-components';

import css from './ResultsSwipe.module.css';

import 'swiper/css/effect-cards';
import 'swiper/css';

const CardSwiperSlide = styled(SwiperSlide)`
  @media (max-width: 550px) {
    font-size: 16px;
    .swiper-slide {
      height: 90%;
    }
  }

  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-size: 22px;
  font-weight: bold;
  color: #fff;

  &:nth-child(1n) {
    background-color: rgb(48, 158, 163);
  }
;

  &:nth-child(2n) {
    background-color: rgb(11, 38, 64);
  }
;
`;

const ResultsSwipe = ({ instructorMatch }) => {

  const instructorImage = instructorMatch.profileImageURL === '' ? InstructorPlaceholder : instructorMatch.profileImageURL;

  return (
    <>
      <Swiper
        effect={'cards'}
        grabCursor={true}
        modules={[EffectCards]}
        className={css.swiper}
      >
        <CardSwiperSlide>
          <a style={{all: "unset", cursor: "pointer"}} href={`/u/${instructorMatch.instructorId}`}>
            <div style={{ position: 'absolute', width: '90%', bottom: 30 }}>
              <div className={css.gradientNameBar}>{instructorMatch.instructorName}</div>
            </div>
          </a>
          <img style={{ height: '90%', width: '90%', borderRadius: '15px' }} src={instructorImage}
               alt={'Pilot Picture'} />
        </CardSwiperSlide>
        <CardSwiperSlide>{instructorMatch.instructorChoiceReasoning}</CardSwiperSlide>
      </Swiper>
    </>
  );
};

export default ResultsSwipe;
