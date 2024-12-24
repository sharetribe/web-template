import React from 'react';
import css from './DynamicCarousel.module.css';

const DynamicCarousel = () => {
  const images = [
    'https://picsum.photos/300/400?random=1',
    'https://picsum.photos/200/300?random=2',
    'https://picsum.photos/300/400?random=3',
    'https://picsum.photos/200/300?random=4',
    'https://picsum.photos/100/200?random=5',
  ];

  return (
    <div className={css.carousel}>
      <div className={`${css.image} ${css.leftFar}`}>
        <img src={images[4]} alt="Left Far" />
      </div>
      <div className={`${css.image} ${css.left}`}>
        <img src={images[1]} alt="Left" />
      </div>
      <div className={`${css.image} ${css.center}`}>
        <img src={images[2]} alt="Center" />
      </div>
      <div className={`${css.image} ${css.right}`}>
        <img src={images[3]} alt="Right" />
      </div>
      <div className={`${css.image} ${css.rightFar}`}>
        <img src={images[0]} alt="Right Far" />
      </div>
    </div>
  );
};

export default DynamicCarousel;
