import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { withRouter } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
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
import getZodiacSign from '../../util/getZodiacSign';

import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  Heading,
  H2,
  H4,
  Page,
  AvatarLarge,
  NamedLink,
  ListingCard,
  Reviews,
  ButtonTabNavHorizontal,
  LayoutSideNavigation,
  NamedRedirect,
  IconSocialMediaInstagram,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import css from './ProfilePage.module.css';
import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionTextMaybe from './SectionTextMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import SectionYoutubeVideoMaybe from './SectionYoutubeVideoMaybe';

const MAX_MOBILE_SCREEN_WIDTH = 768;
const MIN_LENGTH_FOR_LONG_WORDS = 20;

export const AsideContent = props => {
  const { user, displayName, showLinkToProfileSettingsPage } = props;
  return (
    <div className={css.asideContent}>
      <AvatarLarge className={css.avatar} user={user} disableProfileLink />
      <H2 as="h1" className={css.mobileHeading}>
        {displayName ? (
          <FormattedMessage id="ProfilePage.mobileHeading" values={{ name: displayName }} />
        ) : null}
      </H2>
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
        const { schemaType, key, ...fieldProps } = customFieldProps;
        return schemaType === SCHEMA_TYPE_MULTI_ENUM ? (
          <SectionMultiEnumMaybe key={key} {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_TEXT ? (
          <SectionTextMaybe key={key} {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_YOUTUBE ? (
          <SectionYoutubeVideoMaybe key={key} {...fieldProps} />
        ) : null;
      })}
    </>
  );
};

export const MainContent = props => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    userShowError,
    bio,
    displayName,
    listings,
    queryListingsError,
    reviews = [],
    queryReviewsError,
    user,
    userFieldConfig,
    intl,
    hideReviews,
  } = props;
  const { zodiacSign } = user?.attributes?.protectedData || {};
  const { instagramHandle } = user?.attributes?.profile?.publicData || {};

  // Calculate zodiac sign from birthday data in publicData
  const { birthdayMonth, birthdayDay } = user?.attributes?.profile?.publicData || {};
  const calculatedZodiacSign = birthdayMonth && birthdayDay ? getZodiacSign(birthdayMonth, birthdayDay) : null;
  const zodiacSignToDisplay = calculatedZodiacSign || zodiacSign;

  console.log('Zodiac:', zodiacSignToDisplay);
  console.log('Instagram:', instagramHandle);
  console.log('Full user object:', user);
  console.log('User attributes:', user?.attributes);
  console.log('User profile:', user?.attributes?.profile);
  console.log('Protected data:', user?.attributes?.protectedData);
  console.log('Public data:', user?.attributes?.profile?.publicData);
  console.log('User attributes keys:', user?.attributes ? Object.keys(user.attributes) : 'No attributes');
  console.log('User profile keys:', user?.attributes?.profile ? Object.keys(user.attributes.profile) : 'No profile');
  console.log('User profile full object:', JSON.stringify(user?.attributes?.profile, null, 2));

  const hasListings = listings.length > 0;
  const hasMatchMedia = typeof window !== 'undefined' && window?.matchMedia;
  const isMobileLayout =
    mounted && hasMatchMedia
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

  if (userShowError || queryListingsError) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProfilePage.loadingDataFailed" />
      </p>
    );
  }
  return (
    <div>
      <H2 as="h1" className={css.desktopHeading}>
        <FormattedMessage id="ProfilePage.desktopHeading" values={{ name: displayName }} />
      </H2>
      {hasBio ? <div className={css.bio}>{bioWithLinks}</div> : null}

      <div className={css.zodiacAndInstagram}>
        {zodiacSignToDisplay && user?.attributes?.profile?.publicData?.userType === 'lender' ? (
          <span className={css.zodiac}>
            <span className={css.zodiacValue}>{getZodiacEmoji(zodiacSignToDisplay)} {zodiacSignToDisplay}</span>
          </span>
        ) : null}
        {instagramHandle && user?.attributes?.profile?.publicData?.userType === 'lender' && (
          <a
            href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={css.instagram}
          >
            <IconSocialMediaInstagram className={css.instagramIcon} />
            @{instagramHandle.replace('@', '')}
          </a>
        )}
      </div>

      <CustomUserFields
        publicData={user.attributes.profile.publicData}
        metadata={user.attributes.profile.metadata}
        userFieldConfig={userFieldConfig}
      />

      {hasListings ? (
        <div className={listingsContainerClasses}>
          <H4 as="h2" className={css.listingsTitle}>
            <FormattedMessage id="ProfilePage.listingsTitle" values={{ count: listings.length }} />
          </H4>
          <ul className={css.listings}>
            {listings.map(l => (
              <li className={css.listing} key={l.id.uuid}>
                <ListingCard listing={l} showAuthorInfo={false} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hideReviews ? null : isMobileLayout ? (
        <MobileReviews reviews={reviews} queryReviewsError={queryReviewsError} />
      ) : (
        <DesktopReviews reviews={reviews} queryReviewsError={queryReviewsError} />
      )}
    </div>
  );
};

// Function to get zodiac emoji
const getZodiacEmoji = (zodiacSign) => {
  const zodiacEmojis = {
    'Aries': '♈️',
    'Taurus': '♉️',
    'Gemini': '♊️',
    'Cancer': '♋️',
    'Leo': '♌️',
    'Virgo': '♍️',
    'Libra': '♎️',
    'Scorpio': '♏️',
    'Sagittarius': '♐️',
    'Capricorn': '♑️',
    'Aquarius': '♒️',
    'Pisces': '♓️'
  };
  return zodiacEmojis[zodiacSign] || '';
};

/**
 * ProfilePageComponent
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {propTypes.user|propTypes.currentUser} props.user - The user
 * @param {propTypes.error} props.userShowError - The user show error
 * @param {propTypes.error} props.queryListingsError - The query listings error
 * @param {Array<propTypes.listing|propTypes.ownListing>} props.listings - The listings
 * @param {Array<propTypes.review>} props.reviews - The reviews
 * @param {propTypes.error} props.queryReviewsError - The query reviews error
 * @returns {JSX.Element} ProfilePageComponent
 */
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
    userListingRefs,
    listings,
    queryListingsError,
    queryReviewsError,
    reviews,
  } = props;
  const isVariant = pathParams.variant?.length > 0;
  const isPreview = isVariant && pathParams.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;

  // Stripe's onboarding needs a business URL for each seller, but the profile page can be
  // too empty for the provider at the time they are creating their first listing.
  // To remedy the situation, we redirect Stripe's crawler to the landing page of the marketplace.
  // TODO: When there's more content on the profile page, we should consider by-passing this redirection.
  const searchParams = props?.location?.search;
  const isStorefront = searchParams
    ? new URLSearchParams(searchParams)?.get('mode') === 'storefront'
    : false;
  if (isStorefront) {
    return <NamedRedirect name="LandingPage" />;
  }

  const isCurrentUser = currentUser?.id && currentUser?.id?.uuid === pathParams.id;
  const profileUser = useCurrentUser ? currentUser : user;
  
  // For debugging: log which user we're using
  console.log('🔍 [ProfilePage] isCurrentUser:', isCurrentUser);
  console.log('🔍 [ProfilePage] useCurrentUser:', useCurrentUser);
  console.log('🔍 [ProfilePage] profileUser type:', profileUser === currentUser ? 'currentUser' : 'user');
  
  const { bio, displayName, publicData, privateData, metadata } =
    profileUser?.attributes?.profile || {};
  const { zodiacSign } = profileUser?.attributes?.protectedData || {};
  const { instagramHandle } = publicData || {};
  
  // Calculate zodiac sign from birthday data in publicData
  const { birthdayMonth, birthdayDay } = publicData || {};
  const calculatedZodiacSign = birthdayMonth && birthdayDay ? getZodiacSign(birthdayMonth, birthdayDay) : null;
  const zodiacSignToDisplay = calculatedZodiacSign || zodiacSign;

  const { userFields } = config.user;
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const isUnauthorizedOnPrivateMarketplace = isPrivateMarketplace && isUnauthorizedUser;
  const hasUserPendingApprovalError = isErrorUserPendingApproval(userShowError);
  const hasNoViewingRightsUser = currentUser && !hasPermissionToViewData(currentUser);
  const hasNoViewingRightsOnPrivateMarketplace = isPrivateMarketplace && hasNoViewingRightsUser;
  const hideReviews = hasNoViewingRightsOnPrivateMarketplace;

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
          />
        }
        footer={<FooterContainer />}
      >
        <MainContent
          bio={bio}
          displayName={displayName}
          listings={listings}
          queryListingsError={queryListingsError}
          reviews={reviews}
          queryReviewsError={queryReviewsError}
          user={profileUser}
          userFieldConfig={userFields}
          intl={intl}
          hideReviews={hideReviews}
        />
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    userId,
    userShowError,
    queryListingsError,
    userListingRefs,
    reviews = [],
    queryReviewsError,
  } = state.ProfilePage;
  const userMatches = getMarketplaceEntities(state, [{ type: 'user', id: userId }]);
  const user = userMatches.length === 1 ? userMatches[0] : null;
  
  // Calculate zodiac sign from birthday data in publicData
  const { birthdayMonth, birthdayDay } = user?.attributes?.profile?.publicData || {};
  const calculatedZodiacSign = birthdayMonth && birthdayDay ? getZodiacSign(birthdayMonth, birthdayDay) : null;
  const zodiac = calculatedZodiacSign || user?.attributes?.protectedData?.zodiacSign;

  // Process userListingRefs into actual listings
  const listings = userListingRefs.map(l => {
    const listingMatches = getMarketplaceEntities(state, [{ type: l.type, id: l.id }]);
    return listingMatches.length === 1 ? listingMatches[0] : null;
  }).filter(Boolean);

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
    queryListingsError,
    userListingRefs,
    listings,
    reviews,
    queryReviewsError,
    zodiac,
  };
};

const ProfilePage = compose(connect(mapStateToProps))(ProfilePageComponent);

export default ProfilePage;
