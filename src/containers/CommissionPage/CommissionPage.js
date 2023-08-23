import React, { useState } from 'react';
import { bool, arrayOf, number, shape } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { PrimaryButton, SecondaryButton } from '../../components';


import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { REVIEW_TYPE_OF_PROVIDER, REVIEW_TYPE_OF_CUSTOMER, propTypes } from '../../util/types';
import { ensureCurrentUser, ensureUser } from '../../util/data';
import { withViewport } from '../../util/uiHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  H2,
  H4,
  Page,
  Footer,
  AvatarLarge,
  NamedLink,
  LayoutSingleColumnMidle,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import css from './CommissionPage.module.css';

const MAX_MOBILE_SCREEN_WIDTH = 768;

export const AsideContent = props => {
  const { user, displayName, isCurrentUser } = props;
  return (
    <div className={css.asideContent}>
      <AvatarLarge className={css.avatar} user={user} disableProfileLink />
      <H2 as="h1" className={css.mobileHeading}>
        {displayName ? (
          <FormattedMessage id="CommissionPage.mobileHeading" values={{ name: displayName }} />
        ) : null}
      </H2>
      {isCurrentUser ? (
        <>
          <NamedLink className={css.editLinkMobile} name="ProfileSettingsPage">
            <FormattedMessage id="CommissionPage.editProfileLinkMobile" />
          </NamedLink>
          <NamedLink className={css.editLinkDesktop} name="ProfileSettingsPage">
            <FormattedMessage id="CommissionPage.editProfileLinkDesktop" />
          </NamedLink>
        </>
      ) : null}
    </div>
  );
};

export const MainContent = props => {
  const {
    bio,
    displayName,
    listings,
    users,
    primaryButtonProps,
    viewport,
  } = props;

  const hasListings = listings.length > 0;
  const hasUsers = users.length > 0;
  // const hasUsers = 0;
  
  console.log('MainContent');
  console.log(hasUsers);
  console.log(users);
  
  const isMobileLayout = viewport.width < MAX_MOBILE_SCREEN_WIDTH;
  const hasBio = !!bio;

  const listingsContainerClasses = classNames(css.listingsContainer, {
    [css.withBioMissingAbove]: !hasBio,
  });

  console.log('listingsContainerClasses');
  console.log(listingsContainerClasses);

  const usersTableTitleClasses = classNames(css.usersTableTitle, css.user);

  return (
    <div>
      <H2 as="h1" className={css.desktopHeading}>
        <FormattedMessage id="CommissionPage.desktopHeading" values={{ name: displayName }} />
      </H2>
      {hasBio ? <p className={css.bio}>{bio}</p> : null}

      {hasUsers ? (
        <div className={listingsContainerClasses}>
          <H4 as="h2" className={css.listingsTitle}>
            <FormattedMessage id="CommissionPage.usersTitle" values={{ count: listings.length }} />
          </H4>
          <ul >
            <li>
              <ul className={usersTableTitleClasses}>
                <li>
                  <H4 as="h4"> {'Uer Name'} </H4>  
                </li>
                <li>
                  <H4 as="h4"> {'Uer Email'} </H4>  
                </li>
                <li>
                  <H4 as="h4"> {'Commission %'} </H4>  
                </li>
                <li>
                  <H4 as="h4" className={css.textCenter}> {'Action'} </H4>  
                </li>
              </ul>
            </li>
            {users.map(l => (
              
              <li key={l.id.uuid}>
                <ul className={css.user}>
                  <li>{l.attributes.profile.firstName} {l.attributes.profile.lastName}</li>
                  <li>{l.attributes.email}</li>
                  <li>{44}{'%'}</li>
                  <li>
                  <PrimaryButton
                    // inProgress={primaryButtonProps.inProgress}
                    // disabled={buttonsDisabled}
                    onClick={()=>{primaryButtonProps.onAction(l.id.uuid)}}
                  >
                    {'Edit Commission'}
                  </PrimaryButton>
                  </li>
                </ul>
                
                {console.log(l)}
                {/* <ListingCard listing={l} showAuthorInfo={false} /> */}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const goToEditCommission = (uId) => {
  console.log(uId);
  // const defaultRoutes = getDefaultRoutes();
  // const { baseUrl, fromParam, defaultReturnParam, defaultConfirmParam } = defaultRoutes;
  window.location.href = `/EditCommission/${uId}`;
};

const CommissionPageComponent = props => {
  const config = useConfiguration();
  const { scrollingDisabled, currentUser, userShowError, user, intl, ...rest } = props;
  // const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const profileUser = ensureUser(user);
  // const isCurrentUser =
  //   ensuredCurrentUser.id && profileUser.id && ensuredCurrentUser.id.uuid === profileUser.id.uuid;
  const { bio, displayName } = profileUser?.attributes?.profile || {};

  const schemaTitleVars = { name: displayName, marketplaceName: config.marketplaceName };
  const schemaTitle = intl.formatMessage({ id: 'CommissionPage.schemaTitle' }, schemaTitleVars);
  
  const primaryButtonProps = {
    onAction: goToEditCommission
  };

  if (userShowError && userShowError.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <Page
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'CommissionPage',
        name: schemaTitle,
      }}
    >
      <LayoutSingleColumnMidle
        sideNavClassName={css.aside}
        topbar={<TopbarContainer currentPage="CommissionPage" />}
        footer={<Footer />}
      >
        <MainContent bio={bio} displayName={displayName} primaryButtonProps={primaryButtonProps} userShowError={userShowError} {...rest} />
      </LayoutSingleColumnMidle>
    </Page>
  );
};

CommissionPageComponent.defaultProps = {
  currentUser: null,
  user: null,
  userShowError: null,
  queryListingsError: null,
  reviews: [],
  // queryReviewsError: null,
};

CommissionPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
  currentUser: propTypes.currentUser,
  user: propTypes.user,
  userShowError: propTypes.error,
  queryListingsError: propTypes.error,
  listings: arrayOf(propTypes.listing).isRequired,
  reviews: arrayOf(propTypes.review),
  // queryReviewsError: propTypes.error,

  // form withViewport
  viewport: shape({
    width: number.isRequired,
    height: number.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  
  const {
    userId,
    userShowError,
    queryListingsError,
    userListingRefs,
    users,
    reviews,
    // queryReviewsError,
  } = state.CommissionPage;

  const userMatches = getMarketplaceEntities(state, [{ type: 'user', id: userId }]);
  const user = userMatches.length === 1 ? userMatches[0] : null;
  const listings = getMarketplaceEntities(state, userListingRefs);
  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    user,
    users,
    userShowError,
    queryListingsError,
    listings,
    reviews,
    // queryReviewsError,
  };
};

const CommissionPage = compose(
  connect(mapStateToProps),
  withViewport,
  injectIntl
)(CommissionPageComponent);

export default CommissionPage;
