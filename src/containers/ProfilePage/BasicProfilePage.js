import React, { useEffect, useState } from 'react';
import { bool, arrayOf, oneOfType } from 'prop-types';

import { FormattedMessage } from '../../util/reactIntl';
import { REVIEW_TYPE_OF_CUSTOMER, propTypes } from '../../util/types';
import { richText } from '../../util/richText';

import {
  Heading,
  H2,
  H4,
  AvatarLarge,
  NamedLink,
  Reviews,
  ButtonTabNavHorizontal,
  LayoutSideNavigation,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ProfilePage.module.css';

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
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);
  return (
    <div className={css.mobileReviews}>
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
  const { reviews, queryReviewsError } = props;
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);
  const desktopReviewTabs = [
    {
      text: (
        <Heading as="h3" rootClassName={css.desktopReviewsTitle}>
          <FormattedMessage
            id="ProfilePage.reviewsAsACustomerTitle"
            values={{ count: reviewsOfCustomer.length }}
          />
        </Heading>
      ),
      selected: true,
      onClick: () => ({}),
    },
  ];
  return (
    <div className={css.desktopReviews}>
      <div className={css.desktopReviewsWrapper}>
        <ButtonTabNavHorizontal className={css.desktopReviewsTabNav} tabs={desktopReviewTabs} />
        <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
        <Reviews reviews={reviewsOfCustomer} />
      </div>
    </div>
  );
};

const MainContent = props => {
  const [mounted, setMounted] = useState(false);
  const { userShowError, bio, displayName, reviews = [], queryReviewsError, hideReviews } = props;

  useEffect(() => {
    setMounted(true);
  }, []);

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
  if (userShowError) {
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
      {hideReviews ? null : isMobileLayout ? (
        <MobileReviews reviews={reviews} queryReviewsError={queryReviewsError} />
      ) : (
        <DesktopReviews reviews={reviews} queryReviewsError={queryReviewsError} />
      )}
    </div>
  );
};

function BasicProfilePage({
  isCurrentUser = false,
  profileUser,
  hideReviews = false,
  reviews = [],
  queryReviewsError,
  userShowError,
}) {
  const [mounted, setMounted] = useState(false);

  const { bio, displayName } = profileUser?.attributes?.profile || {};

  useEffect(() => {
    setMounted(true);
  }, []);

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
        hideReviews={hideReviews}
        reviews={reviews}
        queryReviewsError={queryReviewsError}
      />
    </LayoutSideNavigation>
  );
}

BasicProfilePage.propTypes = {
  isCurrentUser: bool.isRequired,
  profileUser: oneOfType([propTypes.user, propTypes.currentUser]),
  hideReviews: bool.isRequired,
  reviews: arrayOf(propTypes.review),
  queryReviewsError: propTypes.error,
  userShowError: propTypes.error,
};

export default BasicProfilePage;
