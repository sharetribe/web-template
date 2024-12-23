import React, { useState } from 'react';
import css from './DynamicCarousel.module.css';



const DynamicCarousel = () => {

  const items = [
    'https://picsum.photos/200/300?random=1',
    'https://picsum.photos/200/300?random=2',
    'https://picsum.photos/200/300?random=3',
    'https://picsum.photos/200/300?random=4',
    'https://picsum.photos/200/300?random=5',
    'https://picsum.photos/200/300?random=6',
  ];
  const [centerIndex, setCenterIndex] = useState(0);
  const length = items.length;

  const wrapIndex = (index) => {
    return (index % length + length) % length;
  };

  const handleNext = () => {
    setCenterIndex((prev) => wrapIndex(prev + 1));
  };

  const handlePrev = () => {
    setCenterIndex((prev) => wrapIndex(prev - 1));
  };

  const left1Index = wrapIndex(centerIndex - 1);
  const left2Index = wrapIndex(centerIndex - 2);
  const right1Index = wrapIndex(centerIndex + 1);
  const right2Index = wrapIndex(centerIndex + 2);


  return (
    <div className={css.carouselContainer}>
I più amati da tutti
    </div>
  );
};

export default DynamicCarousel;