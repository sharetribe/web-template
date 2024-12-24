import React, { useState, useEffect } from 'react';
import { PrimaryButton } from '../Button/Button';
import { useHistory } from 'react-router-dom';
import css from './DynamicCarousel.module.css';

const DynamicCarousel = () => {
  const history = useHistory();

  const [images, setImages] = useState([
    'https://picsum.photos/100/200?random=1',
    'https://picsum.photos/200/300?random=2',
    'https://picsum.photos/300/400?random=3',
    'https://picsum.photos/200/300?random=4',
    'https://picsum.photos/100/200?random=5',
  ]);

  // For desktop hover effect
  const [hovering, setHovering] = useState(false);

  // For mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // For mobile carousel index
  const [currentIndex, setCurrentIndex] = useState(0);

  // If hovered on desktop, cycle images
  useEffect(() => {
    let interval;

    // Only run the auto-rotate if NOT mobile
    if (!isMobile && hovering) {
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
  }, [hovering, isMobile]);

  // Detect if we are on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // adjust breakpoint as needed
    };

    // Run on mount + whenever window resizes
    window.addEventListener('resize', handleResize);
    handleResize(); // check initial screen size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mobile: go to next image
  const handleNextMobile = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Mobile: go to previous image
  const handlePrevMobile = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Handle button navigation
  const handleNavigate = () => {
    history.push('/ts');
  };

  // ======================
  // RENDER (Mobile vs. Desktop)
  // ======================

  if (isMobile) {
    // MOBILE VIEW: Single image, center, with arrows
    return (
      <>
        <h2 className={css.title}>I più amati da tutti</h2>
        <div className={css.mobileCarousel}>
          <button onClick={handlePrevMobile} className={css.arrow}>
            &#8249;
          </button>

          <img
            className={css.mobileImage}
            src={images[currentIndex]}
            alt={`Mobile Image ${currentIndex + 1}`}
          />

          <button onClick={handleNextMobile} className={css.arrow}>
            &#8250;
          </button>
        </div>

        <div className={css.buttonContainer}>
          <PrimaryButton
            type="submit"
            className={css.button}
            onClick={handleNavigate}
          >
            Esplora tutti i team building
          </PrimaryButton>
        </div>
      </>
    );
  } else {
    // DESKTOP/TABLET VIEW: Original multi-image carousel
    return (
      <>
        <h2 className={css.title}>I più amati da tutti</h2>
        <div
          className={css.carousel}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
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
              <img src={src} alt={`Desktop Image ${index + 1}`} />
            </div>
          ))}
        </div>

        <div className={css.buttonContainer}>
          <PrimaryButton
            type="submit"
            className={css.button}
            onClick={handleNavigate}
          >
            Esplora tutti i team building
          </PrimaryButton>
        </div>
      </>
    );
  }
};

export default DynamicCarousel;
