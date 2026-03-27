import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import { useIntl } from '../../util/reactIntl';
import { LISTING_STATE_PENDING_APPROVAL } from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
} from '../../util/errors';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
  createSlug,
} from '../../util/urlHelpers';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { ensureListing, ensureOwnListing } from '../../util/data';

import { NamedRedirect } from '../../components';

const { UUID } = sdkTypes;

/**
 * Shared access gating for ListingPage variants: forbidden, private marketplace,
 * pending approval, and no viewing rights. Injects router/context props into the page component.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.PageComponent - Listing page component receiving injected props
 * @param {Object} props - Remaining props from Redux `connect`
 * @returns {JSX.Element}
 */
const ListingPageAccessWrapper = ({ PageComponent, ...rest }) => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  const showListingError = rest.showListingError;
  const isVariant = rest.params?.variant != null;
  const currentUser = rest.currentUser;
  if (isForbiddenError(showListingError) && !isVariant && !currentUser) {
    // This can happen if private marketplace mode is active
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);
  const hasUserPendingApprovalError = isErrorUserPendingApproval(showListingError);

  if ((isPrivateMarketplace && isUnauthorizedUser) || hasUserPendingApprovalError) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  }
  if (
    (hasNoViewingRights && isForbiddenError(showListingError)) ||
    isErrorNoViewingPermission(showListingError)
  ) {
    // If the user has no viewing rights, fetching anything but their own listings
    // will return a 403 error. If that happens, redirect to NoAccessPage.
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  }

  const rawParams = rest.params || {};
  const isPendingApprovalVariant = rawParams.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
  const isDraftVariant = rawParams.variant === LISTING_PAGE_DRAFT_VARIANT;
  const listingId = new UUID(rawParams.id);
  const currentListing =
    isPendingApprovalVariant || isDraftVariant || hasNoViewingRights
      ? ensureOwnListing(rest.getOwnListing(listingId))
      : ensureListing(rest.getListing(listingId));
  const isApproved =
    currentListing.id && currentListing.attributes.state !== LISTING_STATE_PENDING_APPROVAL;

  // If a /pending-approval or /draft URL is shared, the UI may first fetch from own listings.
  // If that returns 403 for another user's listing, redirect to the public listing page.
  const pendingOtherUsersListing =
    (isPendingApprovalVariant || isDraftVariant) &&
    showListingError &&
    showListingError.status === 403;
  const shouldShowPublicListingPage =
    (isPendingApprovalVariant && isApproved) || pendingOtherUsersListing;

  if (shouldShowPublicListingPage) {
    const listingSlug = rawParams.slug || createSlug(currentListing.attributes.title || '');
    return (
      <NamedRedirect
        name="ListingPage"
        params={{ slug: listingSlug, ...rawParams }}
        search={location.search}
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
      showOwnListingsOnly={hasNoViewingRights}
      {...rest}
    />
  );
};

export default ListingPageAccessWrapper;
