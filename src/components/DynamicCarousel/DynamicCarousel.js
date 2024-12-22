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

  const visibleItems = [
    { item: items[left2Index], position: styles['left-2'] },
    { item: items[left1Index], position: styles['left-1'] },
    { item: items[centerIndex], position: styles.center },
    { item: items[right1Index], position: styles['right-1'] },
    { item: items[right2Index], position: styles['right-2'] },
  ];

  return (
    <div className={css.carouselContainer}>
      <button onClick={handlePrev} className={`${styles['arrow-btn']} ${styles['left-arrow']}`}>&#9664;</button>
      <div className={css.carouselInner}>
        {visibleItems.map((vItem, idx) => (
          <div key={idx} className={`${styles['carousel-item']} ${vItem.position}`}>
            <img src={vItem.item} alt={`Item ${idx}`} style={{ width: '200px', height: '300px', objectFit: 'cover' }}/>
          </div>
        ))}
      </div>
      <button onClick={handleNext} className={`${styles['arrow-btn']} ${styles['right-arrow']}`}>&#9654;</button>
    </div>
  );
};

export default DynamicCarousel;