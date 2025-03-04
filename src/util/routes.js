import find from 'lodash/find';
import { matchPath } from 'react-router-dom';
import { compile } from 'path-to-regexp';
// NOTE: This file imports urlHelpers.js, which may lead to circular dependency
import { stringify } from './urlHelpers';

const findRouteByName = (nameToFind, routes) => find(routes, route => route.name === nameToFind);

/**
 * E.g. ```const toListingPath = toPathByRouteName('ListingPage', routes);```
 * Then we can generate listing paths with given params (```toListingPath({ id: uuidX })```)
 */
const toPathByRouteName = (nameToFind, routes) => {
  const route = findRouteByName(nameToFind, routes);
  if (!route) {
    throw new Error(`Path "${nameToFind}" was not found.`);
  }
  return compile(route.path);
};

/**
 * Shorthand for single path call. (```pathByRouteName('ListingPage', routes, { id: uuidX });```)
 */
export const pathByRouteName = (nameToFind, routes, params = {}) => {
  const hasEmptySlug = params && params.hasOwnProperty('slug') && params.slug === '';
  const pathParams = hasEmptySlug ? { ...params, slug: 'no-slug' } : params;
  return toPathByRouteName(nameToFind, routes)(pathParams);
};

/**
 * Find the matching routes and their params for the given pathname
 *
 * @param {String} pathname - Full URL path from root with possible
 * search params and hash included
 *
 * @return {Array<{ route, params }>} - All matches as { route, params } objects if matches has
 * exact flag set to false. If not, an array containing just the first matched exact route is returned.
 */
export const matchPathname = (pathname, routeConfiguration) => {
  const matchedRoutes = routeConfiguration.reduce((matches, route) => {
    const { path, exact = true } = route;
    const match = matchPath(pathname, { path, exact });
    if (match) {
      matches.push({
        route,
        params: match.params || {},
      });
    }
    return matches;
  }, []);

  const matchedExactRoute = matchedRoutes.find(r => {
    return r.exact === true || r.exact == null;
  });

  // We return matched 'exact' path route only if such exists
  // and all matches if no exact flag exists.
  return matchedExactRoute ? [matchedExactRoute] : matchedRoutes;
};

/**
 * ResourceLocatorString is used to direct webapp to correct page.
 * In contrast to Universal Resource Locator (URL), this doesn't contain protocol, host, or port.
 */
export const createResourceLocatorString = (
  routeName,
  routes,
  pathParams = {},
  searchParams = {},
  hash = ''
) => {
  const searchQuery = stringify(searchParams);
  const includeSearchQuery = searchQuery.length > 0 ? `?${searchQuery}` : '';
  const path = pathByRouteName(routeName, routes, pathParams);
  return `${path}${includeSearchQuery}${hash}`;
};

/**
 * Find component related to route name
 * E.g. `const PageComponent = findComponentByRouteName('CheckoutPage', routes);`
 * Then we can call static methods of given component:
 * `dispatch(PageComponent.setInitialValues({ listing, bookingDates }));`
 *
 * @param {String} nameToFind - Route name
 * @param {Array<{ route }>} routes - Route configuration as flat array.
 *
 * @return {Route} - Route that matches the given route name.
 */
export const findRouteByRouteName = (nameToFind, routes) => {
  const route = findRouteByName(nameToFind, routes);
  if (!route) {
    throw new Error(`Component "${nameToFind}" was not found.`);
  }
  return route;
};

/**
 * Get the canonical URL from the given location
 *
 * @param {Array<{ route }>} routes - Route configuration as flat array
 * @param {Object} location - location object from React Router
 *
 * @return {String} Canonical URL of the given location
 *
 */
export const canonicalRoutePath = (routes, location, pathOnly = false) => {
  const { pathname, search, hash } = location;

  const matches = matchPathname(pathname, routes);
  const isListingRoute = matches.length === 1 && matches[0].route.name === 'ListingPage';

  if (isListingRoute) {
    // Remove the dynamic slug from the listing page canonical URL

    // Remove possible trailing slash
    const cleanedPathName = pathname.replace(/\/$/, '');
    const parts = cleanedPathName.split('/');

    if (parts.length !== 4) {
      throw new Error('Expected ListingPage route to have 4 parts');
    }
    const canonicalListingPathname = `/${parts[1]}/${parts[3]}`;
    return pathOnly ? canonicalListingPathname : `${canonicalListingPathname}${search}${hash}`;
  }

  return pathOnly ? pathname : `${pathname}${search}${hash}`;
};

// Regex that replaces {userId}, {listingId} or {userEmail} in the href string
// with URI encoded user email and ID
export const replaceParamsInHref = (href, params) => {
  return href.replace(/{(userId|userEmail|listingId)}/g, (match, key) => {
    if (params[key] != null) {
      return encodeURIComponent(params[key]);
    }
    return match;
  });
};

// This function generates data required to render ExternalLink and InternalLink components.
// It is given a URL and it replaces the {userId} and {userEmail} placeholders
// with the corresponding user data, encodes the values, and determines whether the URL
// is internal or external. If it's an internal link, the function resolves the appropriate
// route and returns an object containing route information. For external links, it returns
// the processed link without route details.
export const generateLinkProps = (type, href, routeConfiguration, userId, userEmail, listingId) => {
  const params = { userId, userEmail, listingId };
  const processedLink = replaceParamsInHref(href, params);

  const isInternalLink = type === 'internal' || href.charAt(0) === '/';

  if (isInternalLink) {
    const testURL = new URL('http://my.marketplace.com' + processedLink);

    const matchedRoutes = matchPathname(testURL.pathname, routeConfiguration);
    if (matchedRoutes.length > 0) {
      const found = matchedRoutes[0];
      const to = { search: testURL.search, hash: testURL.hash };

      // Return an object with route info
      return {
        link: processedLink,
        route: {
          name: found.route?.name,
          params: found.params,
          to,
        },
      };
    }
  }
  // If not internal, return the processed external link without route info
  return {
    link: processedLink,
  };
};
