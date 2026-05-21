import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { useIntl } from '../../util/reactIntl';
import {
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
} from '../../util/urlHelpers';
import { hasPermissionToInitiateTransactions, isUserAuthorized } from '../../util/userHelpers';
import { isErrorNoPermissionForInitiateTransactions } from '../../util/errors';
import { NamedRedirect } from '../../components';

/**
 * Shared access gating for CheckoutPage: pending approval and no transaction initiation rights.
 * Injects router/context props into the page component.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.PageComponent - Checkout page component receiving injected props
 * @param {Object} props.currentUser - Current user from Redux state
 * @param {Object} [props.initiateOrderError] - Error from initiating an order
 * @returns {JSX.Element}
 */
const CheckoutPageAccessWrapper = ({ PageComponent, currentUser, initiateOrderError, ...rest }) => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  if (currentUser && !isUserAuthorized(currentUser)) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  }

  if (
    currentUser &&
    (!hasPermissionToInitiateTransactions(currentUser) ||
      isErrorNoPermissionForInitiateTransactions(initiateOrderError))
  ) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_INITIATE_TRANSACTIONS }}
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
      initiateOrderError={initiateOrderError}
      {...rest}
    />
  );
};

export default CheckoutPageAccessWrapper;
