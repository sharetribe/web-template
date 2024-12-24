import React, { useState, useEffect } from 'react';
import css from './DynamicCarousel.module.css';

const DynamicCarousel = () => {
  const [images, setImages] = useState([
    'https://picsum.photos/100/200?random=1',
    'https://picsum.photos/200/300?random=2',
    'https://picsum.photos/300/400?random=3',
    'https://picsum.photos/200/300?random=4',
    'https://picsum.photos/100/200?random=5',
  ]);

  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    let interval;

    if (hovering) {
      interval = setInterval(() => {
        setImages((prevImages) => {
          const newImages = [...prevImages];
          const shiftedImage = newImages.shift();
          newImages.push(shiftedImage);
          return newImages;
        });
      }, 800); // Adjust the interval speed here (in milliseconds)
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [hovering]);

  const handleMouseEnter = () => setHovering(true);
  const handleMouseLeave = () => setHovering(false);

  return (
    <div
      className={css.carousel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {images.map((src, index) => (
        <div
          key={index}
          className={`${css.image} ${
            index === 0
              ? css.leftFar
              : index === 1
              ? css.left
              : index === 2
              ? css.center
              : index === 3
              ? css.right
              : css.rightFar
          }`}
        >
          <img src={src} alt={`Image ${index + 1}`} />
        </div>
      ))}
    </div>
  );
};

export default DynamicCarousel;
