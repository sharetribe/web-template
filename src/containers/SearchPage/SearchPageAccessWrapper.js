import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import { useIntl } from '../../util/reactIntl';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
} from '../../util/errors';
import {
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
} from '../../util/urlHelpers';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';

import { NamedRedirect } from '../../components';

/**
 * Shared access gating for SearchPage variants: forbidden, private marketplace,
 * pending approval, and no viewing rights. Injects router/context props into the page component.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.PageComponent - Search page class receiving injected props
 * @param {Object} props - Remaining props from Redux `connect`
 * @returns {JSX.Element}
 */
const SearchPageAccessWrapper = ({ PageComponent, ...rest }) => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  const searchListingsError = rest.searchListingsError;
  if (isForbiddenError(searchListingsError)) {
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  const { currentUser, ...restOfProps } = rest;
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const hasNoViewingRightsUser = currentUser && !hasPermissionToViewData(currentUser);
  const hasUserPendingApprovalError = isErrorUserPendingApproval(searchListingsError);
  const hasNoViewingRightsError = isErrorNoViewingPermission(searchListingsError);

  if ((isPrivateMarketplace && isUnauthorizedUser) || hasUserPendingApprovalError) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  }
  if (hasNoViewingRightsUser || hasNoViewingRightsError) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  }

  return (
    <PageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      location={location}
      currentUser={currentUser}
      {...restOfProps}
    />
  );
};

export default SearchPageAccessWrapper;
