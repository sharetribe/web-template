import React, { useState, useEffect } from 'react';
import css from './VideoContainer.module.css';
import { useIntl } from 'react-intl';
import ActionTeamButtons from '../ActionTeamButtons/ActionTeamButtons';
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
    <div
      className={`${!isMobile ? css.videoContainer : css.videoContainerMobile} ${className || ''}`}
    >
      {isMobile ? (
        <>
          <iframe
            width="100%"
            height="500px"
            src="https://drive.google.com/file/d/1fDHvBfCx51WdVLjqbI3tg7nFIzK1hJfC/preview"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Team Building Video"
          ></iframe>
           <h1>
              Creatività che fa la differenza
              </h1>
              <p>
              I nostri workshop creativi aiutano il tuo team a riscoprire collaborazione,<br/>
              pensiero critico e empatia - competenze che l’AI non può replicare. <br/><br/>
              Rafforziamo ciò che rende i tuoi dipendenti unici, stimolando un pensiero laterale che nessun algoritmo può imitare. 
              Riportiamo i dipendenti al centro della creatività aziendale, trasformando idee in innovazioni concrete.<br/><br/>
              Prepara il tuo team per un futuro dove l’unicità umana fa la differenza.
              </p>
              <ActionTeamButtons />
              </>
      ) : (
  
        <iframe
          className={css.videoIframe}
          src="https://drive.google.com/file/d/1fDHvBfCx51WdVLjqbI3tg7nFIzK1hJfC/preview"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Team Building Video"
        ></iframe>
      )}
    </div>
  );
}

export default VideoContainer;
