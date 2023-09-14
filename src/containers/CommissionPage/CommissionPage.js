import React, { useState } from 'react';
import { bool, arrayOf, number, shape } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';
// import { Link } from 'react-router-dom'
import { useHistory, useLocation } from 'react-router-dom';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';


import { PrimaryButton, SecondaryButton } from '../../components';

import SortComponent from './sortComponent';


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
    users,
    primaryButtonProps,
    viewport,
  } = props;


  // const sortByTitle = (usersss)=>(users)=>{
  //   console.log('sortByTitle - usersss');
  //   console.log(usersss);
  //   console.log('sortByTitle - users');
  //   console.log(users);
  // }

  // console.log('users.sort(sortByTitle)');
  // users.sort(sortByTitle);

  // const sortChoice = 'title';

  // switch (sortChoice) {
  //   case 'title':
  //     users.sort(sortByTitle('afsa'));
  //     break;

  //   case 'status':
  //     users.sort(sortByStatus);
  //     break;
  // }


  const hasUsers = users?.length > 0;
  // const hasUsers = 0;
  
  const isMobileLayout = viewport.width < MAX_MOBILE_SCREEN_WIDTH;
  const hasBio = !!bio;

  const listingsContainerClasses = classNames(css.listingsContainer, {
    [css.withBioMissingAbove]: !hasBio,
  });

  const usersTableTitleClasses = classNames(css.usersTableTitle, css.user);

  const calcCommission = l =>{
    return l.attributes.profile.metadata && l.attributes.profile.metadata.commission ? l.attributes.profile.metadata.commission:15;
  }

  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();

  return (
    <div>
      <H2 as="h1" className={css.desktopHeading}>
        <FormattedMessage id="CommissionPage.desktopHeading" values={{ name: displayName }} />
      </H2>
      {hasBio ? <p className={css.bio}>{bio}</p> : null}

      {hasUsers ? (
        <div className={listingsContainerClasses}>
          <H4 as="h2" className={css.listingsTitle}>
            <FormattedMessage id="CommissionPage.usersTitle" values={{ count: users.length }} />
          </H4>
          <ul >
            <li>
              <ul className={usersTableTitleClasses}>
                <li>
                  <H4 as="h4"> 
                    <SortComponent
                      history={history}
                      routeConfiguration={routeConfiguration}
                      sort={"name"}
                      title={'Uer Name'}
                    >
                    </SortComponent>
                    {/* <Link to={props.location.pathname} className={css.editLink} onClick={handleSortBy}>{'Uer Name'}</Link> */}
                  </H4>  
                </li>
                <li>
                  <H4 as="h4"> 
                    <SortComponent
                      history={history}
                      routeConfiguration={routeConfiguration}
                      sort={"email"}
                      title={'Uer Email'}
                    >
                    </SortComponent>
                  </H4>  
                </li>
                <li>
                  <H4 as="h4">  
                    <SortComponent
                      history={history}
                      routeConfiguration={routeConfiguration}
                      sort={"commission"}
                      title={'Commission %'}
                    >
                    </SortComponent>
                  </H4>  
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
                  <li>{calcCommission(l)}{'%'}</li>
                  <li>
                  <PrimaryButton
                    inProgress={false}
                    disabled={false}
                    onClick={()=>{primaryButtonProps.onAction(l.id.uuid)}}
                  >
                    {'Edit Commission'}
                  </PrimaryButton>
                  </li>
                </ul>
                
                {/* {console.log(l)} */}
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
        topbar={<TopbarContainer currentPage="CommissionPage" />}
        footer={<Footer />}
      >
        <MainContent bio={bio} displayName={displayName} primaryButtonProps={primaryButtonProps} {...rest} />
      </LayoutSingleColumnMidle>
    </Page>
  );
};

CommissionPageComponent.defaultProps = {
  currentUser: null,
  user: null,
  queryListingsError: null,
  listingData:null,
  // queryReviewsError: null,
};

CommissionPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
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
    users,
    listingData,
  } = state.CommissionPage;

  // console.log('state');
  // console.log(state);
  // console.log(state.CommissionPage);

  const getOwnListing = id => {
    const ref = { id, type: 'ownListing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    users,
    listingData,
    getOwnListing,
    // queryReviewsError,
  };
};

const CommissionPage = compose(
  connect(mapStateToProps),
  withViewport,
  injectIntl
)(CommissionPageComponent);

export default CommissionPage;
