import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import css from './LandingPageSection.module.css';
import landingCoverR from '../../media/landingCoverR.JPG';
import landingPE from '../../media/landingPE.JPG';
import SurveyForm from '../SurveyForm/SurveyForm';
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

  const containerStyle = {
    position: 'relative',
    height: isMobile ? '725px' : '850px',
    backgroundColor: isTeamBuilding ? 'white' : 'none',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right',
    flex: '1 1 30%',
  };

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

  return (
    <div className={css.isTeamBuildingContainer} style={containerStyle}>
      {tooltip}
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
        <div className={css.surveyContainer}>
          {!isMobile && (
            <div className={css.emptyDiv2}>
              <p className={css.emptyText}>
              Boost Creativity in Your Workplace Team Building with Club Joy
Take team-building to the next level with creative, hands-on workshops that come straight to your office.<br/> Whether it’s pottery or painting, our experiences are designed to help your team collaborate, unwind, and reignite their creativity.
<br/>With hassle-free planning and engaging activities, we make sure your event is fun, memorable, and completely stress-free—all while delivering real results.
              </p>
              <ActionTeamButtons />
            </div>
          )}
          <div className={css.surveyForm}>
          <div style={{ padding: '50px', marginLeft: '50px', background: 'white' }}>
              <iframe
                width="100%"
                height="500px"
                src="https://drive.google.com/file/d/1fDHvBfCx51WdVLjqbI3tg7nFIzK1hJfC/preview"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Team Building Video"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPageSection;