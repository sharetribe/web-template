import React from 'react';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import moment from 'moment';
import { PrimaryButton } from '../Button/Button';
import css from './ToDo.module.css';
import { createResourceLocatorString } from '../../util/routes';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

function ToDo({ isTeamBuilding }) {
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const searchPagePath = routeConfiguration
    ? isTeamBuilding
      ? createResourceLocatorString('teamSearchPage', routeConfiguration, {}, {})
      : createResourceLocatorString('SearchPage', routeConfiguration, {}, {})
    : '';

  const handleButtonClick = (startDate, endDate) => {
    const startDateFormatted = startDate.format('YYYY-MM-DD');
    const endDateFormatted = endDate.format('YYYY-MM-DD');
    const searchParams = `?dates=${startDateFormatted}%2C${endDateFormatted}`;

    if (routeConfiguration) {
      const searchPageUrl = `${searchPagePath}${searchParams}`;
      history.push(searchPageUrl);
    } else {
      console.error('Route configuration is undefined');
    }
  };

  const getToday = () => moment();
  const getThisWeek = () => ({
    start: getToday(),
    end: getToday().endOf('week'),
  });
  const getThisWeekend = () => ({
    start: getToday().day(5), // Friday
    end: getToday().endOf('week'), // Sunday
  });
  const getThisMonth = () => ({
    start: getToday(),
    end: getToday().clone().add(30, 'days'),
  });

  return (
    <div className={css.container}>
      <div className={css.title}>{intl.formatMessage({ id: 'ToDo.title' })}</div>
      <div className={css.subContainer}>
        <div className={css.header}>
          <PrimaryButton
            className={css.primaryButton}
            onClick={() => handleButtonClick(getThisWeek().start, getThisWeek().end)}
          >
            {intl.formatMessage({ id: 'ToDo.thisWeek' })}
          </PrimaryButton>
        </div>
        <div className={css.header}>
          <PrimaryButton
            className={css.primaryButton}
            onClick={() => handleButtonClick(getThisWeekend().start, getThisWeekend().end)}
          >
            {intl.formatMessage({ id: 'ToDo.thisWeekend' })}
          </PrimaryButton>
        </div>
        <div className={css.header}>
          <PrimaryButton
            className={css.primaryButton}
            onClick={() => handleButtonClick(getThisMonth().start, getThisMonth().end)}
          >
            {intl.formatMessage({ id: 'ToDo.thisMonth' })}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default ToDo;
