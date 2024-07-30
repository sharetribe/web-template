import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import css from './LandingPageSection.module.css';
import landingCoverR from '../../media/landingCoverR.JPG';
import video from '../../media/video/video.mp4';
import video2 from '../../media/video/video2.mp4';
import landingPE from '../../media/landingPE.JPG';
import SurveyForm from '../SurveyForm/SurveyForm';
import VideoContainer from '../VideoContainer/VideoContainer';
import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink } from '..';
import ActionTeamButtons from '../ActionTeamButtons/ActionTeamButtons';

function LandingPageSection({ onSearchSubmit }) {
  const intl = useIntl();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : null,
  );
  const location = useLocation();
  const isTeamBuilding = location.pathname === '/p/teambuilding';

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



  const containerStyle2 = {
    position: 'relative',
    height: isMobile ? '725px' : '850px',
    backgroundColor: isTeamBuilding ? 'white' : 'none',
    backgroundImage: isTeamBuilding ? `url(${landingPE})` : 'none',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right',
    flex: '1 1 30%',
  };

  const containerStyle3 = {
    position: 'relative',
    height: isMobile ? '725px' : '850px',
    backgroundColor: 'white',
    backgroundImage: `url(${landingCoverR})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right',
    flex: '1 1 30%',
  };

  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 50000);

    return () => clearTimeout(timer);
  }, []);

  /*
  const tooltipMessage = isTeamBuilding
    ? intl.formatMessage({ id: 'Tooltip.public' })
    : intl.formatMessage({
      id: 'Tooltip.private',
    });

  const tooltipLink = isTeamBuilding ? (
    <NamedLink name="LandingPage" to="/" className={css.tooltipLink}>
      <FormattedMessage id="LandingPageSection.action" />
    </NamedLink>
  ) : (
    <NamedLink name="TeambuildingPage" to="/p/teambuilding" className={css.tooltipLink}>
      <FormattedMessage id="LandingPageSection.action" />
    </NamedLink>
  );

  const tooltip = showTooltip ? (
    <div className={css.tooltip}>
      {tooltipMessage}
      {tooltipLink}
    </div>
  ) : null;
  */

  return (
    <div >
      {/*tooltip
      {!isTeamBuilding ? (
        <div className={css.surveyContainer}>
          {!isMobile && (
            <div className={css.emptyDiv}>
              <h1 className={css.emptyText}>
                Scopri le migliori esperienze creative,
                <br /> in pochi click
              </h1>
            </div>
          )}
          <div className={css.surveyForm} style={containerStyle3}>
            <div style={{ paddingTop: '50px' }}>
              <SurveyForm />
            </div>
          </div>
        </div>
      ) : (
       */}

      <div className={css.mobileContainer}>
        <video
          autoPlay
          loop
          muted
          playsInline
          className={css.backgroundVideo}
        >
          <source
            src={isTeamBuilding ? video : video2}
            type="video/mp4"
          />
        </video>
        <div className={css.emptyDiv2}>
        <div className={css.contentContainer}>
        {isTeamBuilding ? (
          <>
              <h1 className={css.contentTitle}>
              Creatività che fa la differenza
              </h1>
              <p className={css.teamText}>
              I nostri workshop creativi aiutano il tuo team a riscoprire collaborazione,
              pensiero critico e empatia - competenze che l’AI non può replicare.
              Rafforziamo ciò che vi rende unici, 
              riportando le persone al centro della creatività aziendale e trasformando idee in innovazioni concrete.<br/><br/>
              </p>
              </>
              ) : (
                <>
              <h1 className={css.contentTitle}>
              Prova nuovi hobby, vicino a te
              </h1>
              <p className={css.teamText}>
              Scopri il piacere di creare qualcosa con le tue mani, senza pressioni o aspettative. 
Che tu venga da solo o con un paio di amici, i nostri workshop sono il posto perfetto per sporcarsi le mani, ridere degli errori, e creare qualcosa di unico. 
Ritrova quella parte di te che non vede l’ora di esplorare, sbagliare e brillare.
              </p>
              </>
            )}
          <ActionTeamButtons isTeamBuilding={isTeamBuilding}/>
          </div>
        </div>
      </div>

    </div>
  );
}

export default LandingPageSection;