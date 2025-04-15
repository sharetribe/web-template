import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { useIntl } from '../../util/reactIntl';
import { LISTING_TYPES, propTypes } from '../../util/types';
import {
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
  PROFILE_PAGE_PENDING_APPROVAL_VARIANT,
} from '../../util/urlHelpers';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
  isNotFoundError,
} from '../../util/errors';
import {
  hasPermissionToViewData,
  isUserAuthorized,
  isCreativeSellerApproved,
} from '../../util/userHelpers';

import { isScrollingDisabled } from '../../ducks/ui.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { Page, NamedRedirect } from '../../components';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import { handleToggleFavorites } from '../../containers/ListingPage/ListingPage.shared';
import { updateProfile } from '../../containers/ProfileSettingsPage/ProfileSettingsPage.duck';

import BasicProfilePage from './BasicProfilePage';
import SellerProfilePage from './SellerProfilePage/SellerProfilePage';

/**
 * ProfilePageComponent
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {boolean} props.useCurrentUser - Whether to use the current user
 * @param {propTypes.user|propTypes.currentUser} props.user - The user
 * @param {propTypes.error} props.userShowError - The user show error
 * @param {propTypes.error} props.queryListingsError - The query listings error
 * @param {Array<propTypes.listing|propTypes.ownListing>} props.listings - The listings
 * @param {Array<propTypes.review>} props.reviews - The reviews
 * @param {propTypes.error} props.queryReviewsError - The query reviews error
 * @returns {JSX.Element} ProfilePageComponent
 */
export const ProfilePageComponent = props => {
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const history = useHistory();
  const intl = useIntl();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    scrollingDisabled,
    currentUser,
    useCurrentUser,
    user,
    userShowError,
    creativeProfile,
    queryCreativeProfileInProgress,
    queryCreativeProfileError,
    pagination,
    queryParams,
    queryInProgress,
    queryListingsError,
    queryReviewsInProgress,
    queryReviewsError,
    listings,
    reviews,
    onUpdateFavorites,
    onFetchCurrentUser,
    params: pathParams,
    location,
  } = props;
  const isVariant = pathParams.variant?.length > 0;
  const isPreview = isVariant && pathParams.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;

  // Stripe's onboarding needs a business URL for each seller, but the profile page can be
  // too empty for the provider at the time they are creating their first listing.
  // To remedy the situation, we redirect Stripe's crawler to the landing page of the marketplace.
  // TODO: When there's more content on the profile page, we should consider by-passing this redirection.
  const searchParams = location?.search;
  const isStorefront = searchParams
    ? new URLSearchParams(searchParams)?.get('mode') === 'storefront'
    : false;
  if (isStorefront) {
    return <NamedRedirect name="LandingPage" />;
  }

  const isCurrentUser = currentUser?.id && currentUser?.id?.uuid === pathParams.id;
  const profileUser = useCurrentUser ? currentUser : user;
  const { displayName } = profileUser?.attributes?.profile || {};
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const isUnauthorizedOnPrivateMarketplace = isPrivateMarketplace && isUnauthorizedUser;
  const hasUserPendingApprovalError = isErrorUserPendingApproval(userShowError);
  const hasNoViewingRightsUser = currentUser && !hasPermissionToViewData(currentUser);
  const hasNoViewingRightsOnPrivateMarketplace = isPrivateMarketplace && hasNoViewingRightsUser;

  const isDataLoaded = isPreview
    ? currentUser != null || userShowError != null
    : hasNoViewingRightsOnPrivateMarketplace
    ? currentUser != null || userShowError != null
    : user != null || userShowError != null;

  const schemaTitleVars = { name: displayName, marketplaceName: config.marketplaceName };
  const schemaTitle = intl.formatMessage({ id: 'ProfilePage.schemaTitle' }, schemaTitleVars);

  if (!isDataLoaded) {
    return null;
  } else if (!isPreview && isNotFoundError(userShowError)) {
    return <NotFoundPage staticContext={props.staticContext} />;
  } else if (!isPreview && (isUnauthorizedOnPrivateMarketplace || hasUserPendingApprovalError)) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (
    (!isPreview && hasNoViewingRightsOnPrivateMarketplace && !isCurrentUser) ||
    isErrorNoViewingPermission(userShowError)
  ) {
    // Someone without viewing rights on a private marketplace is trying to
    // view a profile page that is not their own – redirect to NoAccessPage
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  } else if (!isPreview && isForbiddenError(userShowError)) {
    // This can happen if private marketplace mode is active, but it's not reflected through asset yet.
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  } else if (isPreview && mounted && !isCurrentUser) {
    // Someone is manipulating the URL, redirect to current user's profile page.
    return isCurrentUser === false ? (
      <NamedRedirect name="ProfilePage" params={{ id: currentUser?.id?.uuid }} />
    ) : null;
  } else if ((isPreview || isPrivateMarketplace) && !mounted) {
    // This preview of the profile page is not rendered on server-side
    // and the first pass on client-side should render the same UI.
    return null;
  }

  const creativeProfileId = creativeProfile?.id?.uuid;
  const currentUserFavorites = currentUser?.attributes?.profile?.privateData?.favorites || {};
  const isFavorite = currentUserFavorites?.[LISTING_TYPES.PROFILE]?.includes(creativeProfileId);
  const commonParams = { params: { id: creativeProfileId }, history, routes: routeConfiguration };
  const onToggleFavorites = handleToggleFavorites({
    ...commonParams,
    listingType: LISTING_TYPES.PROFILE,
    onUpdateFavorites,
    onFetchCurrentUser,
    location,
  });
  const userProfile = profileUser?.attributes?.profile || {};
  const isSeller = isCreativeSellerApproved(userProfile);
  const ProfilePageContent = isSeller ? SellerProfilePage : BasicProfilePage;

  return (
    <Page
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'ProfilePage',
        name: schemaTitle,
      }}
    >
      <ProfilePageContent
        isCurrentUser={isCurrentUser}
        profileUser={profileUser}
        userShowError={userShowError}
        creativeProfile={creativeProfile}
        queryCreativeProfileInProgress={queryCreativeProfileInProgress}
        queryCreativeProfileError={queryCreativeProfileError}
        pagination={pagination}
        queryParams={queryParams}
        queryInProgress={queryInProgress}
        queryListingsError={queryListingsError}
        queryReviewsInProgress={queryReviewsInProgress}
        queryReviewsError={queryReviewsError}
        hideReviews={hasNoViewingRightsOnPrivateMarketplace}
        onToggleFavorites={onToggleFavorites}
        isFavorite={isFavorite}
        listings={listings}
        reviews={reviews}
        pathParams={pathParams}
      />
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    userId,
    userShowInProgress,
    userShowError,
    creativeProfileListingId,
    queryCreativeProfileInProgress,
    queryCreativeProfileError,
    pagination,
    queryParams,
    queryInProgress,
    queryListingsError,
    currentPageResultIds,
    queryReviewsInProgress,
    queryReviewsError,
    reviews = [],
  } = state.ProfilePage;
  function getCreativeProfile(id, queryInProgress) {
    if (queryInProgress) return null;
    const profileListing = getMarketplaceEntities(state, [{ type: 'listing', id }]);
    return profileListing.length === 1 ? profileListing[0] : null;
  }
  function getUser(id, queryInProgress) {
    if (queryInProgress) return null;
    const userMatches = getMarketplaceEntities(state, [{ type: 'user', id }]);
    return userMatches.length === 1 ? userMatches[0] : null;
  }
  const creativeProfile = getCreativeProfile(
    creativeProfileListingId,
    queryCreativeProfileInProgress
  );
  const listings = getMarketplaceEntities(state, currentPageResultIds);
  const user = getUser(userId, userShowInProgress);
  // Show currentUser's data if it's not approved yet
  const isCurrentUser = userId?.uuid === currentUser?.id?.uuid;
  const useCurrentUser =
    isCurrentUser && !(isUserAuthorized(currentUser) && hasPermissionToViewData(currentUser));
  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    useCurrentUser,
    user,
    userShowError,
    creativeProfile,
    queryCreativeProfileInProgress,
    queryCreativeProfileError,
    pagination,
    queryParams,
    queryInProgress,
    queryListingsError,
    queryReviewsInProgress,
    queryReviewsError,
    listings,
    reviews,
  };
};

const mapDispatchToProps = dispatch => ({
  onUpdateFavorites: payload => dispatch(updateProfile(payload)),
  onFetchCurrentUser: () => dispatch(fetchCurrentUser({})),
});

const ProfilePage = compose(connect(mapStateToProps, mapDispatchToProps))(ProfilePageComponent);

export default ProfilePage;
