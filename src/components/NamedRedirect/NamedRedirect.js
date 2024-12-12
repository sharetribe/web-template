import React from 'react';
import { Redirect } from 'react-router-dom';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { pathByRouteName } from '../../util/routes';

/**
 * This component wraps React-Router's Redirect by providing name-based routing.
 * (Helps to narrow down the scope of possible format changes to routes.)
 *
 * @component
 * @param {Object} props
 * @param {string} props.name Route's name
 * @param {string?} props.search search params
 * @param {Object?} props.state history's state
 * @param {boolean?} props.push
 * @param {Object} props.params Path params
 * @returns {JSX.Element} redirect component to help navigation
 */
const NamedRedirect = props => {
  const routeConfiguration = useRouteConfiguration();
  const { name, search, state = {}, params = {}, push = false } = props;
  const pathname = pathByRouteName(name, routeConfiguration, params);
  return <Redirect to={{ pathname, search, state }} push={push} />;
};

export default NamedRedirect;
