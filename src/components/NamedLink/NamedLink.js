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
import { Link, withRouter } from 'react-router-dom';
import classNames from 'classnames';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import { pathByRouteName, findRouteByRouteName } from '../../util/routes';

/**
 * This component wraps React-Router's Link by providing name-based routing.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.activeClassName class applied, when the link is the current link
 * @param {string?} props.name - name of the route in routeConfiguration
 * @param {Object?} props.params - path params for the named route and its pathname prop
 * @param {Object?} props.to - props for the React Router Link
 * @param {string?} props.to.search - search params for the React Router Link
 * @param {string?} props.to.hash - hash for the React Router Link
 * @param {Object?} props.to.state - state for the React Router Link (history.pushstate)
 * @param {any} props.children - the content of the link
 * @param {Object?} props.style - inline css for the link
 * @param {string?} props.title - title attribute for the 'a' element.
 * @param {Object?} props.match - match from React Router
 * @returns {JSX.Element} containing form that allows adding availability exceptions
 */
export const NamedLink = withRouter(props => {
  const routeConfiguration = useRouteConfiguration();
  const {
    name,
    params = {}, // pathParams
    title,
    // Link props
    to = {},
    children,
    match = {},
    // <a> element props
    className,
    style = {},
    activeClassName = 'NamedLink_active',
  } = props;

  const onOver = () => {
    const { component: Page } = findRouteByRouteName(name, routeConfiguration);
    // Loadable Component has a "preload" function.
    if (Page.preload) {
      Page.preload();
    }
  };

  // Link props
  const pathname = pathByRouteName(name, routeConfiguration, params);
  const active = match.url && match.url === pathname;

  // <a> element props
  const aElemProps = {
    className: classNames(className, { [activeClassName]: active }),
    style,
    title,
  };

  return (
    <Link onMouseOver={onOver} onTouchStart={onOver} to={{ pathname, ...to }} {...aElemProps}>
      {children}
    </Link>
  );
});

export default NamedLink;
