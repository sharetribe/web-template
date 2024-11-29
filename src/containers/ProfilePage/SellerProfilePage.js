import React, { useEffect, useState } from 'react';
import { bool, arrayOf, oneOfType } from 'prop-types';
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
import { pickCustomFieldProps } from '../../util/fieldHelpers';
import { richText } from '../../util/richText';

import {
  Heading,
  H2,
  H4,
  AvatarLarge,
  NamedLink,
  ListingCard,
  Reviews,
  ButtonTabNavHorizontal,
  LayoutSideNavigation,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ProfilePage.module.css';
import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionTextMaybe from './SectionTextMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import SectionYoutubeVideoMaybe from './SectionYoutubeVideoMaybe';

const MAX_MOBILE_SCREEN_WIDTH = 768;
const MIN_LENGTH_FOR_LONG_WORDS = 20;

const AsideContent = props => {
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

const ReviewsErrorMaybe = props => {
  const { queryReviewsError } = props;
  return queryReviewsError ? (
    <p className={css.error}>
      <FormattedMessage id="ProfilePage.loadingReviewsFailed" />
    </p>
  ) : null;
};

const MobileReviews = props => {
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

const DesktopReviews = props => {
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

const CustomUserFields = props => {
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

const MainContent = props => {
  const {
    userShowError,
    bio,
    displayName,
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
      {hasBio ? <p className={css.bio}>{bioWithLinks}</p> : null}

      {displayName ? (
        <CustomUserFields
          publicData={publicData}
          metadata={metadata}
          userFieldConfig={userFieldConfig}
          intl={intl}
        />
      ) : null}

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

function SellerProfilePage({
  isCurrentUser,
  profileUser,
  hideReviews,
  reviews,
  queryReviewsError,
  userShowError,
  listings,
  queryListingsError,
}) {
  const [mounted, setMounted] = useState(false);
  const config = useConfiguration();
  const intl = useIntl();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { bio, displayName, publicData, metadata } = profileUser?.attributes?.profile || {};
  const { userFields } = config.user;

  return (
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
        userShowError={userShowError}
        publicData={publicData}
        metadata={metadata}
        userFieldConfig={userFields}
        hideReviews={hideReviews}
        intl={intl}
        reviews={reviews}
        queryReviewsError={queryReviewsError}
        listings={listings}
        queryListingsError={queryListingsError}
      />
    </LayoutSideNavigation>
  );
}

SellerProfilePage.defaultProps = {
  isCurrentUser: false,
  profileUser: null,
  hideReviews: false,
  reviews: [],
  queryReviewsError: null,
  userShowError: null,
  queryListingsError: null,
};

SellerProfilePage.propTypes = {
  isCurrentUser: bool.isRequired,
  profileUser: oneOfType([propTypes.user, propTypes.currentUser]),
  hideReviews: bool.isRequired,
  reviews: arrayOf(propTypes.review),
  queryReviewsError: propTypes.error,
  userShowError: propTypes.error,
  listings: arrayOf(oneOfType([propTypes.listing, propTypes.ownListing])).isRequired,
  queryListingsError: propTypes.error,
};

export default SellerProfilePage;
