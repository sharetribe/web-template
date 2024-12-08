import React, { useState, useEffect } from 'react';
import css from './VideoContainer.module.css';
import { useIntl } from 'react-intl';

function VideoContainer({ className, isTeamBuilding }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : null
  );
  const intl = useIntl();

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1025);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return (
    <div className={`${css.videoContainer} ${className || ''}`}>
        {isMobile ?
              <iframe
                width="100%"
                height="500px"
                src="https://drive.google.com/file/d/1fDHvBfCx51WdVLjqbI3tg7nFIzK1hJfC/preview"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Team Building Video"
              >   </iframe>
              : 
              <iframe
        className={css.videoIframe}
        src="https://drive.google.com/file/d/1fDHvBfCx51WdVLjqbI3tg7nFIzK1hJfC/preview"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="Team Building Video"
      ></iframe>}
            
              {isMobile &&  <p >
                Boost Creativity in Your Workplace Team Building with Club Joy
                Take team-building to the next level with creative, hands-on workshops that come straight to your office. Whether it’s pottery or painting, our experiences are designed to help your team collaborate, unwind, and reignite their creativity.
          With hassle-free planning and engaging activities, we make sure your event is fun, memorable, and completely stress-free—all while delivering real results.
              </p>}
    </div>
  );
}

export default VideoContainer;
