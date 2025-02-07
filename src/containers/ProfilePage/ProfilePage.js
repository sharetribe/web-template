import React, { useEffect, useState } from 'react';
import { bool, arrayOf, oneOfType } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  REVIEW_TYPE_OF_PROVIDER,
  REVIEW_TYPE_OF_CUSTOMER,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_YOUTUBE,
  propTypes,
} from '../../util/types';
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
import { pickCustomFieldProps } from '../../util/fieldHelpers';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { richText } from '../../util/richText';

import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  Heading,
  H2,
  H3,
  H4,
  Page,
  AvatarLarge,
  NamedLink,
  ListingCard,
  Reviews,
  ReviewRating,
  ButtonTabNavHorizontal,
  LayoutSideNavigation,
  NamedRedirect,
} from '../../components';
import { convertListingPrices } from '../../extensions/MultipleCurrency/utils/currency';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import css from './ProfilePage.module.css';
import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionTextMaybe from './SectionTextMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import SectionYoutubeVideoMaybe from './SectionYoutubeVideoMaybe';
import { Star, ShieldCheck, CalendarClock, Globe } from "lucide-react";

const MAX_MOBILE_SCREEN_WIDTH = 768;
const MIN_LENGTH_FOR_LONG_WORDS = 20;

export const AsideContent = props => {
  const { user, displayName, showLinkToProfileSettingsPage, reviews, listings } = props;
  
  const isVerified = user.attributes?.profile?.metadata?.verified === true;

  //console.log('about user verified', isVerified)

  const avgRating = reviews.reduce((acc, review) => {
    return acc + review.attributes.rating;
  }, 0) / (reviews.length || 1); // Avoid division by zero by using || 1
  return (
    <div className={css.asideContent}>
      <AvatarLarge className={css.avatar} user={user} disableProfileLink />
      {isVerified ? (
        <div className={css.verifiedBadge}>
          <ShieldCheck />
        </div>
      ) : null}
      <div>
        <H2 as="h1" className={css.mobileHeading}>
          {displayName ? (
            <FormattedMessage id="ProfilePage.mobileHeading" values={{ name: displayName }} />
          ) : null}
        </H2>
        
        {avgRating ? (
          <div className={css.avgRating}>
            
            <div className={css.starRating}>
              <div className={css.stars}>
                { Array.from({ length: 5 }, (_, index) => (
                    <Star key={`empty-star-${index}`} strokeWidth={0} />
                ))}
              </div>
              <div className={`${css.stars} ${css.rating}`} style={{width: Math.round(avgRating * 20) + '%'}}>
                { Array.from({ length: 5 }, (_, index) => (
                    <Star key={`filled-star-${index}`} strokeWidth={0} />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className={css.asideStats}>
          <div className={css.asideStatsItem}>
            <h4>{reviews.length}</h4>
            <p><FormattedMessage id="ProfilePage.statsLabel.reviews" values={{ count: reviews.length }} /></p>
          </div>
          <div className={css.asideStatsItem}>
            <h4>{listings.length}</h4>
            <p><FormattedMessage id="ProfilePage.statsLabel.listings" values={{ count: listings.length }} /></p>
          </div>
        </div>

      </div>

      {showLinkToProfileSettingsPage ? (
        <>
          <NamedLink className={css.editLinkMobile} name="ProfileSettingsPage">
            <FormattedMessage id="ProfilePage.editProfileLinkMobile" />
          </NamedLink>
          <NamedLink className={css.editLinkDesktop} name="ProfileSettingsPage">
            <FormattedMessage id="ProfilePage.editProfileLinkDesktop" />
          </NamedLink>
        </>
      ) : null}

      
      

    </div>
  );
};

export const ReviewsErrorMaybe = props => {
  const { queryReviewsError } = props;
  return queryReviewsError ? (
    <p className={css.error}>
      <FormattedMessage id="ProfilePage.loadingReviewsFailed" />
    </p>
  ) : null;
};

export const CardReviews = props => {
  const { reviews, queryReviewsError } = props;
  
  return (
    <div className={css.mobileReviews}>
      <H4 as="h2" className={css.mobileReviewsTitle}>
        <FormattedMessage
          id="ProfilePage.reviewsTitle"
          values={{ count: reviews.length }}
        />
      </H4>
      <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />

  <Reviews reviews={reviews} />
      
      
    </div>
  );
};

/*
export const MobileReviews = props => {
  const { reviews, queryReviewsError } = props;
  const reviewsOfProvider = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_PROVIDER);
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);
  return (
    <div className={css.mobileReviews}>
      <H4 as="h2" className={css.mobileReviewsTitle}>
        <FormattedMessage
          id="ProfilePage.reviewsFromMyCustomersTitle"
          values={{ count: reviewsOfProvider.length }}
        />
      </H4>
      <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
      <Reviews reviews={reviewsOfProvider} />
      <H4 as="h2" className={css.mobileReviewsTitle}>
        <FormattedMessage
          id="ProfilePage.reviewsAsACustomerTitle"
          values={{ count: reviewsOfCustomer.length }}
        />
      </H4>
      <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
      <Reviews reviews={reviewsOfCustomer} />
    </div>
  );
};

export const DesktopReviews = props => {
  const [showReviewsType, setShowReviewsType] = useState(REVIEW_TYPE_OF_PROVIDER);
  const { reviews, queryReviewsError } = props;
  const reviewsOfProvider = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_PROVIDER);
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);
  const isReviewTypeProviderSelected = showReviewsType === REVIEW_TYPE_OF_PROVIDER;
  const isReviewTypeCustomerSelected = showReviewsType === REVIEW_TYPE_OF_CUSTOMER;
  const desktopReviewTabs = [
    {
      text: (
        <Heading as="h3" rootClassName={css.desktopReviewsTitle}>
          <FormattedMessage
            id="ProfilePage.reviewsFromMyCustomersTitle"
            values={{ count: reviewsOfProvider.length }}
          />
        </Heading>
      ),
      selected: isReviewTypeProviderSelected,
      onClick: () => setShowReviewsType(REVIEW_TYPE_OF_PROVIDER),
    },
    {
      text: (
        <Heading as="h3" rootClassName={css.desktopReviewsTitle}>
          <FormattedMessage
            id="ProfilePage.reviewsAsACustomerTitle"
            values={{ count: reviewsOfCustomer.length }}
          />
        </Heading>
      ),
      selected: isReviewTypeCustomerSelected,
      onClick: () => setShowReviewsType(REVIEW_TYPE_OF_CUSTOMER),
    },
  ];

  return (
    <div className={css.desktopReviews}>
      <div className={css.desktopReviewsWrapper}>
        <ButtonTabNavHorizontal className={css.desktopReviewsTabNav} tabs={desktopReviewTabs} />

        <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />

        {isReviewTypeProviderSelected ? (
          <Reviews reviews={reviewsOfProvider} />
        ) : (
          <Reviews reviews={reviewsOfCustomer} />
        )}
      </div>
    </div>
  );
};

export const CustomUserFields = props => {
  const { publicData, metadata, userFieldConfig } = props;

  const shouldPickUserField = fieldConfig => fieldConfig?.showConfig?.displayInProfile !== false;
  const propsForCustomFields =
    pickCustomFieldProps(publicData, metadata, userFieldConfig, 'userType', shouldPickUserField) ||
    [];

  return (
    <>
      <SectionDetailsMaybe {...props} />
      {propsForCustomFields.map(customFieldProps => {
        const { schemaType, ...fieldProps } = customFieldProps;
        return schemaType === SCHEMA_TYPE_MULTI_ENUM ? (
          <SectionMultiEnumMaybe {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_TEXT ? (
          <SectionTextMaybe {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_YOUTUBE ? (
          <SectionYoutubeVideoMaybe {...fieldProps} />
        ) : null;
      })}
    </>
  );
};
*/
export const MainContent = props => {
  const {
    userShowError,
    bio,
    displayName,
    createdAt,
    listings,
    queryListingsError,
    reviews,
    queryReviewsError,
    publicData,
    metadata,
    userFieldConfig,
    intl,
    hideReviews,
  } = props;

  const hasListings = listings.length > 0;
  const hasMatchMedia = typeof window !== 'undefined' && window?.matchMedia;
  const isMobileLayout = hasMatchMedia
    ? window.matchMedia(`(max-width: ${MAX_MOBILE_SCREEN_WIDTH}px)`)?.matches
    : true;

  const hasBio = !!bio;
  const bioWithLinks = richText(bio, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
  });

  const listingsContainerClasses = classNames(css.listingsContainer, {
    [css.withBioMissingAbove]: !hasBio,
  });

  const isVerified = metadata?.verified === true;
  console.log('reviews', reviews)
  const hasBuyerReview = reviews.some(review => review.attributes.type === REVIEW_TYPE_OF_PROVIDER);
  const isVerifiedSeller = isVerified && hasBuyerReview;

  if (userShowError || queryListingsError) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProfilePage.loadingDataFailed" />
      </p>
    );
  }
  return (
    <div>
      <H3 as="h1" className={css.desktopHeading}>
        <FormattedMessage id="ProfilePage.desktopHeading" values={{ name: displayName }} />
      </H3>

      <div className={css.twoColumnSection}>
        <div className={css.leftColumn}>
          {isVerifiedSeller && (
            <div className={css.iconLine}>
              <ShieldCheck />
              <span><FormattedMessage id="ProfilePage.label.verfiedSeller" /></span>
            </div>
          )}

          <div className={css.iconLine}>
            <CalendarClock />
            <span>
            <FormattedMessage id="ProfilePage.label.joined" /> {createdAt ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(createdAt)) : 'n/a'}
            </span>
          </div>

          <div className={css.iconLine}>
            <Globe />
            <span><FormattedMessage id="ProfilePage.label.from" /> {publicData?.userLocation}</span>
          </div>
        </div>
        <div className={css.rightColumn}>
          {hasBio ? <p className={css.bio}>{bioWithLinks}</p> : null}
        </div>
      </div>

      {displayName && false ? (
        <CustomUserFields
          publicData={publicData}
          metadata={metadata}
          userFieldConfig={userFieldConfig}
          intl={intl}
        />
      ) : null}

      {hideReviews ? null 
        : <CardReviews reviews={reviews} queryReviewsError={queryReviewsError} />
      }
      
      {hasListings ? (
        <div className={listingsContainerClasses}>
          <H4 as="h2" className={css.listingsTitle}>
            <FormattedMessage id="ProfilePage.listingsTitle" values={{ count: listings.length }} />
          </H4>
          <ul className={css.listings}>
            {listings.map(l => (
              <li className={css.listing} key={l.id.uuid}>
                <div className={classNames(css.listingWrapper, { 
                  [css.soldListing]: l.currentStock?.attributes?.quantity === 0 
                })}>
                  <ListingCard 
                    listing={l} 
                    showAuthorInfo={false}
                  />
                  {l.currentStock?.attributes?.quantity === 0 && (
                    <div className={css.soldBadge}>
                      <FormattedMessage id="ProfilePage.sold" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      
    </div>
  );
};

export const ProfilePageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    scrollingDisabled,
    params: pathParams,
    currentUser,
    useCurrentUser,
    userShowError,
    user,
    ...rest
  } = props;
  const isVariant = pathParams.variant?.length > 0;
  const isPreview = isVariant && pathParams.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;

  // Stripe's onboarding needs a business URL for each seller, but the profile page can be
  // too empty for the provider at the time they are creating their first listing.
  // To remedy the situation, we redirect Stripe's crawler to the landing page of the marketplace.
  // TODO: When there's more content on the profile page, we should consider by-passing this redirection.
  const searchParams = rest?.location?.search;
  const isStorefront = searchParams
    ? new URLSearchParams(searchParams)?.get('mode') === 'storefront'
    : false;
  if (isStorefront) {
    return <NamedRedirect name="LandingPage" />;
  }

  const isCurrentUser = currentUser?.id && currentUser?.id?.uuid === pathParams.id;
  const profileUser = useCurrentUser ? currentUser : user;

  const { bio, displayName, publicData, metadata } = profileUser?.attributes?.profile || {};
  const createdAt = profileUser?.attributes?.createdAt;
  const { userFields } = config.user;
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
  // This is rendering normal profile page (not preview for pending-approval)
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
      <LayoutSideNavigation
        sideNavClassName={css.aside}
        topbar={<TopbarContainer />}
        sideNav={
          <AsideContent
            user={profileUser}
            showLinkToProfileSettingsPage={mounted && isCurrentUser}
            displayName={displayName}
            {...rest}
          />
        }
        footer={<FooterContainer />}
      >
        <MainContent
          bio={bio}
          displayName={displayName}
          createdAt={createdAt}
          userShowError={userShowError}
          publicData={publicData}
          metadata={metadata}
          //userFieldConfig={userFields}
          hideReviews={hasNoViewingRightsOnPrivateMarketplace}
          intl={intl}
          {...rest}
        />
      </LayoutSideNavigation>
    </Page>
  );
};

ProfilePageComponent.defaultProps = {
  currentUser: null,
  user: null,
  userShowError: null,
  queryListingsError: null,
  reviews: [],
  queryReviewsError: null,
};

ProfilePageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
  currentUser: propTypes.currentUser,
  useCurrentUser: bool.isRequired,
  user: oneOfType([propTypes.user, propTypes.currentUser]),
  userShowError: propTypes.error,
  queryListingsError: propTypes.error,
  listings: arrayOf(oneOfType([propTypes.listing, propTypes.ownListing])).isRequired,
  reviews: arrayOf(propTypes.review),
  queryReviewsError: propTypes.error,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    userId,
    userShowError,
    queryListingsError,
    userListingRefs,
    reviews,
    queryReviewsError,
  } = state.ProfilePage;
  const { uiCurrency } = state.ui;
  const { exchangeRate } = state.ExchangeRate;
  const userMatches = getMarketplaceEntities(state, [{ type: 'user', id: userId }]);
  const user = userMatches.length === 1 ? userMatches[0] : null;

  // Show currentUser's data if it's not approved yet
  const isCurrentUser = userId?.uuid === currentUser?.id?.uuid;
  const useCurrentUser =
    isCurrentUser && !(isUserAuthorized(currentUser) && hasPermissionToViewData(currentUser));

  const convertedListings = convertListingPrices(
    getMarketplaceEntities(state, userListingRefs),
    uiCurrency,
    exchangeRate
  );


  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    useCurrentUser,
    user,
    userShowError,
    queryListingsError,
    listings: convertedListings,
    reviews,
    queryReviewsError,
  };
};

const ProfilePage = compose(connect(mapStateToProps))(ProfilePageComponent);

export default ProfilePage;
