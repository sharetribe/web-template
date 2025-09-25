import React, { useRef, useCallback, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, A11y } from 'swiper/modules';
import classNames from 'classnames';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import css from './MediaSlider.module.css';

const AutoPlayVideo = ({ url, className }) => {
  const videoRef = useRef(null);
  if (!url) {
    return null;
  }
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      });
    });
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [videoRef]);

  return (
    <video
      ref={videoRef}
      src={url}
      muted
      playsInline
      className={className}
      controls
      loop
      preload="metadata"
    />
  );
};

const MediaSlider = ({ media = [], className, rootClassName }) => {
  const isVideo = useCallback(url => {
    return url.includes('video%2Fmp4') || url.includes('video/mp4');
  }, []);

  if (!media || media.length === 0) {
    return null;
  }

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <Swiper
        modules={[Navigation, Pagination, Keyboard, A11y]}
        spaceBetween={0}
        slidesPerView={1}
        loop
        navigation={media.length > 1}
        pagination={media.length > 1 ? { clickable: true } : false}
        keyboard={{
          enabled: true,
        }}
        className={css.swiper}
      >
        {media.map((item, index) => {
          const isVideoFile = isVideo(item.url);

          return (
            <SwiperSlide key={item.id} className={css.slide}>
              {isVideoFile ? (
                <AutoPlayVideo className={css.media} url={item.url} />
              ) : (
                <img
                  className={css.media}
                  src={item.url}
                  alt={`Media ${index + 1}`}
                  loading="lazy"
                />
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default MediaSlider;
