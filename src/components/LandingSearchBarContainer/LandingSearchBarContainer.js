import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import css from './LandingSearchBar.module.css';
import landingCoverR from '../../media/landingCoverR.JPG';
import landingPE from '../../media/landingPE.JPG';
import SurveyForm from './SurveyForm';
import { NamedLink } from '..';

function LandingSearchBarContainer({ onSearchSubmit }) {
  const intl = useIntl();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : null,
  );
  const location = useLocation();
  const isTeamBuilding = location.pathname === '/p/teambuilding';
  console.log('Tooltip Mefssage:', intl.formatMessage({ id: 'Counter.title' }));

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
      Clicca qui!
    </NamedLink>
  ) : (
    <NamedLink name="TeambuildingPage" to="/p/teambuilding" className={css.tooltipLink}>
      Clicca qui!
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
            <div className={css.emptyDiv}>
              <h1 className={css.emptyText}>
                Scopri le migliori esperienze creative
                <br /> per il tuo gruppo,
                <br /> in pochi click
              </h1>
            </div>
          )}
          <div className={css.surveyForm} style={containerStyle2}>
            <div style={{ paddingTop: '50px' }}>
              <SurveyForm isTeamBuilding={isTeamBuilding} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingSearchBarContainer;
