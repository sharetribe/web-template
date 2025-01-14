import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import moment from 'moment';
import css from './SurveyForm.module.css';
import { createResourceLocatorString } from '../../util/routes';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

// Import the images
import DuomoImage from '../../media/duomo.svg';
import MoleImage from '../../media/mole.svg';

function SurveyForm({ className, isTeamBuilding }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : null,
  );
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const searchPagePath = routeConfiguration
    ? isTeamBuilding
      ? createResourceLocatorString('teamSearchPage', routeConfiguration, {}, {})
      : createResourceLocatorString('SearchPage', routeConfiguration, {}, {})
    : '';

  const history = useHistory();
  const [joy, setJoy] = useState([]);
  const [moreThanEight, setMoreThanEight] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [location, setLocation] = useState(null);

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

  const emojiSets = {
    1: '🍽️🍰🥐',
    2: '🧘🤸🏽‍♂️🏌🏼‍♂️',
    3: '🎨🖍️🪁',
    4: '🧠✨🪄',
  };

  const dateSelectionEmojis = {
    thisWeek: '🤸🏽‍♂️',
    thisMonth: '📅',
    nextMonth: '⏩️',
  };

  const moreThanEightEmojiSets = {
    true: '👥👥➕',
    false: '👤',
  };

  const handleJoyChange = (value) => {
    if (joy.includes(value)) {
      setJoy(joy.filter((item) => item !== value));
    } else {
      setJoy([...joy, value]);
    }
  };

  const handleDateSelection = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentStep(2);
  };

  const mapJoyToPubJoy = () => {
    const pubJoyMapping = {
      1: '2,3,5',
      2: '4',
      3: '1,3,5,6,7',
      4: '1,2,3,4,5,6,7',
    };

    const selectedPubJoys = joy
      .filter((option) => pubJoyMapping[option])
      .map((option) => pubJoyMapping[option]);

    return selectedPubJoys.join(',');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (joy.length === 0) {
      alert('Please select at least one joy preference.');
      return;
    }

    const queryParts = [];
    const pubJoy = mapJoyToPubJoy();

    if (pubJoy) {
      queryParts.push(`pub_joy=has_any:${encodeURIComponent(pubJoy)}`);
    }

    if (moreThanEight !== null) {
      queryParts.push(`px=${moreThanEight}`);
    }

    if (startDate && endDate) {
      const startDateFormatted = startDate.format('YYYY-MM-DD');
      const endDateFormatted = endDate.format('YYYY-MM-DD');
      queryParts.push(`dates=${startDateFormatted}%2C${endDateFormatted}`);
    }

    // Add bounds based on location
    if (location === 'Milano') {
      queryParts.push('bounds=45.86603135%2C9.67783972%2C45.10253157%2C8.78794714');
    } else if (location === 'Torino') {
      queryParts.push('bounds=45.25790687%2C7.90646554%2C44.86359069%2C7.469759');
    }

    const searchParams = queryParts.join('&');
    if (routeConfiguration) {
      const queryString = `?${searchParams}`;
      const searchPageUrl = `${searchPagePath}${queryString}`;
      history.push(searchPageUrl);
    } else {
      console.error('Route configuration is undefined');
    }
  };

  const placeholders = {
    1: intl.formatMessage({ id: 'Survey.1.placeholder' }),
    2: intl.formatMessage({ id: 'Survey.2.placeholder' }),
    3: intl.formatMessage({ id: 'Survey.3.placeholder' }),
    4: intl.formatMessage({ id: 'Survey.4.placeholder' }),
  };

  const getToday = () => moment();
  const getThisWeek = () => ({
    start: getToday(),
    end: getToday().endOf('week'),
  });
  const getThisMonth = () => ({
    start: getToday().startOf('month'),
    end: getToday().endOf('month'),
  });
  const getNextMonth = () => ({
    start: getToday().add(1, 'months').startOf('month'),
    end: getToday().add(1, 'months').endOf('month'),
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={css.step}>
            {isMobile && <p>{intl.formatMessage({ id: 'Survey.step0.subtitle' })}</p>}
            <h2>{intl.formatMessage({ id: 'Survey.step00.title' })}</h2>
            <div className={css.cardContainer}>
              <div
                className={css.card}
                onClick={() => handleDateSelection(getThisWeek().start, getThisWeek().end)}
              >
                <span className={css.emoji}>{dateSelectionEmojis.thisWeek}</span>
                {intl.formatMessage({ id: 'ToDo.thisWeek' })}
              </div>
              <div
                className={css.card}
                onClick={() => handleDateSelection(getThisMonth().start, getThisMonth().end)}
              >
                <span className={css.emoji}>{dateSelectionEmojis.thisMonth}</span>
                {intl.formatMessage({ id: 'ToDo.thisMonth' })}
              </div>
              <div
                className={css.card}
                onClick={() => handleDateSelection(getNextMonth().start, getNextMonth().end)}
              >
                <span className={css.emoji}>{dateSelectionEmojis.nextMonth}</span>
                {intl.formatMessage({ id: 'ToDo.nextMonth' })}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={css.step}>
            {isMobile && <p>{intl.formatMessage({ id: 'Survey.step01.subtitle' })}</p>}
            <h2>{intl.formatMessage({ id: 'Survey.step01.title' })}</h2>
            <div className={css.cardContainer}>
              {['1', '2', '3', '4'].map((option) => (
                <div
                  key={option}
                  className={`${css.card} ${joy.includes(option) ? css.selected : ''}`}
                  onClick={() => handleJoyChange(option)}
                >
                  <span className={css.emoji}>{emojiSets[option]}</span>
                  <div className={css.placeholder}>{placeholders[option]}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setCurrentStep(1)} className={css.backButton}>
              {intl.formatMessage({ id: 'Survey.back' })}
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className={css.nextButton}
              disabled={joy.length < 2}
            >
              {intl.formatMessage({ id: 'Survey.next' })}
            </button>
          </div>
        );
      case 3:
        return (
          <div className={css.step}>
            <h2>{intl.formatMessage({ id: 'Survey.step2.title' })}</h2>
            <div className={css.cardContainer}>
              <div
                className={`${css.card} ${location === 'Milano' ? css.selected : ''}`}
                onClick={() => setLocation('Milano')}
              >
                <img src={DuomoImage} alt="Duomo in Milan" />
                {intl.formatMessage({ id: 'Survey.city.milan' })}
              </div>
              <div
                className={`${css.card} ${location === 'Torino' ? css.selected : ''}`}
                onClick={() => setLocation('Torino')}
              >
                <img src={MoleImage} alt="Mole in Turin" />
                {intl.formatMessage({ id: 'Survey.city.turin' })}
              </div>
            </div>
  
            <p>
              <a href="mailto:hello@clubjoy.it" className={css.emailLink}>
                {intl.formatMessage({ id: 'Survey.findCity' })}
              </a>
            </p>
            <button onClick={() => setCurrentStep(2)} className={css.backButton}>
              {intl.formatMessage({ id: 'Survey.back' })}
            </button>
            <button onClick={handleSubmit} className={css.submitButton} disabled={!location}>
              {intl.formatMessage({ id: 'Survey.submit' })}
            </button>
          </div>
        );
      default:
        return null;
    }
  };
  
  return <div className={`${css.surveyForm} ${className || ''}`}>{renderStep()}</div>;
  
}

export default SurveyForm;