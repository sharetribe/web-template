import React, { useState, useEffect } from 'react';
import { PrimaryButton } from '../Button/Button';
import css from './DynamicCarousel.module.css';
import { useHistory } from 'react-router-dom'; 

const DynamicCarousel = () => {
  const history = useHistory(); // Use useHistory hook
  const [images, setImages] = useState([
    'https://picsum.photos/100/200?random=1',
    'https://picsum.photos/200/300?random=2',
    'https://picsum.photos/300/400?random=3',
    'https://picsum.photos/200/300?random=4',
    'https://picsum.photos/100/200?random=5',
  ]);

  const [hovering, setHovering] = useState(false);

  const handleNavigate = () => {
    history.push('/ts'); // Use history.push for navigation
  };

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
    <>
      <h2 className={css.title}>I più amati da tutti</h2>
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
    <div className={css.buttonContainer}>
    <PrimaryButton type="submit" className={css.button} onClick={handleNavigate}>
    Esplora tutti i team building
    </PrimaryButton>
    </div>
    </>
  );

};

export default DynamicCarousel;
