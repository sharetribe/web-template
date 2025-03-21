import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';

import { useRouteConfiguration } from '../context/routeConfigurationContext';
import { propTypes } from '../util/types';
import * as log from '../util/log';
import { canonicalRoutePath } from '../util/routes';
import { useConfiguration } from '../context/configurationContext';

import { locationChanged } from '../ducks/routing.duck';

import { NamedRedirect } from '../components';
import NotFoundPage from '../containers/NotFoundPage/NotFoundPage';

import LoadableComponentErrorBoundary from './LoadableComponentErrorBoundary/LoadableComponentErrorBoundary';

const isBanned = currentUser => {
  const isBrowser = typeof window !== 'undefined';
  // Future todo: currentUser?.attributes?.state === 'banned'
  return isBrowser && currentUser?.attributes?.banned === true;
};

const canShowComponent = props => {
  const { isAuthenticated, currentUser, route } = props;
  const { auth } = route;
  return !auth || (isAuthenticated && !isBanned(currentUser));
};

const callLoadData = props => {
  const { match, location, route, dispatch, logoutInProgress, config } = props;
  const { loadData, name } = route;
  const shouldLoadData =
    typeof loadData === 'function' && canShowComponent(props) && !logoutInProgress;

  if (shouldLoadData) {
    dispatch(loadData(match.params, location.search, config))
      .then(() => {
        if (props.logLoadDataCalls) {
          // This gives good input for debugging issues on live environments, but with test it's not needed.
          console.log(`loadData success for ${name} route`);
        }
      })
      .catch(e => {
        log.error(e, 'load-data-failed', { routeName: name });
      });
  }
};

const setPageScrollPosition = (location, delayed) => {
  if (!location.hash) {
    // No hash, scroll to top
    window.scroll({
      top: 0,
      left: 0,
    });
  } else {
    const el = document.querySelector(location.hash);
    if (el) {
      // Found element from the current page with the given fragment identifier,
      // scrolling to that element.
      //
      // NOTE: This only works on in-app navigation within the same page.
      // If smooth scrolling is needed between different pages, one needs to wait
      //   1. loadData fetch and
      //   2. code-chunk fetch
      // before making el.scrollIntoView call.

      el.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    } else {
      // A naive attempt to make a delayed call to scrollIntoView
      // Note: 300 milliseconds might not be enough, but adding too much delay
      // might affect user initiated scrolling.
      delayed = window.setTimeout(() => {
        const reTry = document.querySelector(location.hash);
        reTry?.scrollIntoView({
          block: 'start',
          behavior: 'smooth',
        });
      }, 300);
    }
  }
};

const handleLocationChanged = (dispatch, location, routeConfiguration, delayed) => {
  setPageScrollPosition(location, delayed);
  const path = canonicalRoutePath(routeConfiguration, location);
  dispatch(locationChanged(location, path));
};

/**
 * RouteComponentRenderer handles loadData calls on client-side.
 * It also checks authentication and redirects unauthenticated users
 * away from routes that are for authenticated users only
 * (aka "auth: true" is set in routeConfiguration.js)
 *
 * This component is a container: it needs to be connected to Redux.
 *
 * @component
 * @param {Object} props - The props
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {boolean} props.logoutInProgress - Whether the logout is in progress
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {propTypes.route} props.route - The route
 * @param {Array<propTypes.route} props.routeConfiguration - The route configuration
 * @param {Object} props.match - The match
 * @param {Object} props.match.params - The match params
 * @param {string} props.match.url - The match url
 * @param {Object} props.location - The location
 * @param {Object} props.location.search - The location search
 * @param {Object} props.staticContext - The static context
 * @param {Function} props.dispatch - The dispatch function of
 * @returns {JSX.Element} The RouteComponentRenderer component
 */
class RouteComponentRenderer extends Component {
  componentDidMount() {
    const { dispatch, location, routeConfiguration } = this.props;
    this.delayed = null;
    // Calling loadData on initial rendering (on client side).
    callLoadData(this.props);
    handleLocationChanged(dispatch, location, routeConfiguration, this.delayed);
  }

  componentDidUpdate(prevProps) {
    const { dispatch, location, routeConfiguration } = this.props;
    // Call for handleLocationChanged affects store/state
    // and it generates an unnecessary update.
    if (prevProps.location !== this.props.location) {
      // Calling loadData after initial rendering (on client side).
      // This makes it possible to use loadData as default client side data loading technique.
      // However it is better to fetch data before location change to avoid "Loading data" state.
      callLoadData(this.props);
      handleLocationChanged(dispatch, location, routeConfiguration, this.delayed);
    }
  }

  componentWillUnmount() {
    if (this.delayed) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    const { route, match, location, staticContext = {}, currentUser } = this.props;
    const { component: RouteComponent, authPage = 'SignupPage', extraProps } = route;
    const canShow = canShowComponent(this.props);
    if (!canShow) {
      staticContext.unauthorized = true;
    }

    const hasCurrentUser = !!currentUser?.id;
    const restrictedPageWithCurrentUser = !canShow && hasCurrentUser;
    // Banned users are redirected to LandingPage
    const isBannedFromAuthPages = restrictedPageWithCurrentUser && isBanned(currentUser);
    return canShow ? (
      <LoadableComponentErrorBoundary>
        <RouteComponent
          params={match.params}
          location={location}
          staticContext={staticContext}
          {...extraProps}
        />
      </LoadableComponentErrorBoundary>
    ) : isBannedFromAuthPages ? (
      <NamedRedirect name="LandingPage" />
    ) : (
      <NamedRedirect
        name={authPage}
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }
}

const mapStateToProps = state => {
  const { isAuthenticated, logoutInProgress } = state.auth;
  const { currentUser } = state.user;
  return { isAuthenticated, logoutInProgress, currentUser };
};
const RouteComponentContainer = compose(connect(mapStateToProps))(RouteComponentRenderer);

/**
 * Routes component creates React Router rendering setup.
 * It needs routeConfiguration (named as "routes") through props.
 * Using that configuration it creates navigation on top of page-level
 * components. Essentially, it's something like:
 * <Switch>
 *   <Route render={pageA} />
 *   <Route render={pageB} />
 * </Switch>
 */
const Routes = (props, context) => {
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const { isAuthenticated, logoutInProgress, logLoadDataCalls } = props;

  const toRouteComponent = route => {
    const renderProps = {
      isAuthenticated,
      logoutInProgress,
      route,
      routeConfiguration,
      config,
      logLoadDataCalls,
    };

    // By default, our routes are exact.
    // https://reacttraining.com/react-router/web/api/Route/exact-bool
    const isExact = route.exact != null ? route.exact : true;
    return (
      <Route
        key={route.name}
        path={route.path}
        exact={isExact}
        render={matchProps => (
          <RouteComponentContainer
            {...renderProps}
            match={matchProps.match}
            location={matchProps.location}
            staticContext={matchProps.staticContext}
          />
        )}
      />
    );
  };

  return (
    <Switch>
      {routeConfiguration.map(toRouteComponent)}
      <Route component={NotFoundPage} />
    </Switch>
  );
};

export default withRouter(Routes);
