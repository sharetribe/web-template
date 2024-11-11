/**
 * This component wraps React-Router's Link by providing name-based routing.
 *
 * The `name` prop should match a route in the flattened
 * routeConfiguration passed in context by the RoutesProvider
 * component. The `params` props is the route params for the route
 * path of the given route name.
 *
 * The `to` prop is an object with the same shape as Link requires,
 * but without `pathname` that will be generated from the given route
 * name.
 *
 * Some additional props can be passed for the <a> element like
 * `className` and `style`.
 *
 * The component can also be given the `activeClassName` prop that
 * will be added to the element className if the current URL matches
 * the one in the generated pathname of the link.
 */
import React from 'react';
import { any, object, shape, string } from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import classNames from 'classnames';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import { findRouteByRouteName, pathByRouteName } from '../../util/routes';

export const NamedLinkComponent = props => {
  const routeConfiguration = useRouteConfiguration();
  const { name, params = {}, title = null, active = null } = props;

  const onOver = () => {
    const { component: Page } = findRouteByRouteName(name, routeConfiguration);
    // Loadable Component has a "preload" function.
    if (Page.preload) {
      Page.preload();
    }
  };

  // Link props
  const { to = {}, children = null } = props;
  const pathname = pathByRouteName(name, routeConfiguration, params);
  const { match = {} } = props;
  const isActive = active !== null ? active : match.url && match.url === pathname;

  // <a> element props
  const { className = '', style = {}, activeClassName = 'NamedLink_active' } = props;
  const aElemProps = {
    className: classNames(className, { [activeClassName]: isActive }),
    style,
    title,
  };

  return (
    <Link onMouseOver={onOver} onTouchStart={onOver} to={{ pathname, ...to }} {...aElemProps}>
      {children}
    </Link>
  );
};

// This ensures a nice display name in snapshots etc.
NamedLinkComponent.displayName = 'NamedLink';

NamedLinkComponent.propTypes = {
  // name of the route in routeConfiguration
  name: string.isRequired,
  // params object for the named route
  params: object,
  // Link component props
  to: shape({ search: string, hash: string, state: object }),
  children: any,

  // generic props for the underlying <a> element
  className: string,
  style: object,
  activeClassName: string,
  title: string,

  // from withRouter
  match: object,
};

const NamedLink = withRouter(NamedLinkComponent);
NamedLink.displayName = 'NamedLink';

export default NamedLink;
