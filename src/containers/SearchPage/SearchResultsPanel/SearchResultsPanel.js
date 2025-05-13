import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';

import { ListingCard, PaginationLinks } from '../../../components';
import { useHistory, useLocation } from 'react-router-dom';
import { updateProfile } from '../../ProfileSettingsPage/ProfileSettingsPage.duck';

import { handleToggleFavorites } from '../../ListingPage/ListingPage.shared';

import css from './SearchResultsPanel.module.css';

const SearchResultsPanel = props => {
  const location = useLocation();
  const history = useHistory();

  const {
    className,
    rootClassName,
    listings = [],
    pagination,
    routeConfiguration,
    params,
    search,
    setActiveListing,
    isMapVariant = true,
    listingTypeParam,
    currentUser, // <--- now pulled from Redux
    currentListing,
    onUpdateFavorites,
  } = props;

  const commonParams = { params, history, routes: routeConfiguration };

  const classes = classNames(rootClassName || css.root, className);
  const pageName = listingTypeParam ? 'SearchPageWithListingType' : 'SearchPage';

  const paginationLinks =
    pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName={pageName}
        pagePathParams={{ listingType: listingTypeParam }}
        pageSearchParams={search}
        pagination={pagination}
      />
    ) : null;

  const onToggleFavorites = handleToggleFavorites({
    ...commonParams,
    currentUser,
    onUpdateFavorites,
    location,
  });

  const cardRenderSizes = isMapVariant => {
    const panelMediumWidth = 50;
    const panelLargeWidth = 62.5;
    return isMapVariant
      ? [
          '(max-width: 767px) 100vw',
          `(max-width: 1023px) ${panelMediumWidth}vw`,
          `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
          `${panelLargeWidth / 3}vw`,
        ].join(', ')
      : [
          '(max-width: 549px) 100vw',
          '(max-width: 767px) 50vw',
          `(max-width: 1439px) 26vw`,
          `(max-width: 1920px) 18vw`,
          `14vw`,
        ].join(', ');
  };

  return (
    <div className={classes}>
      <div className={isMapVariant ? css.listingCardsMapVariant : css.listingCards}>
        {listings.map(l => (
          <ListingCard
            className={css.listingCard}
            key={l.id.uuid}
            listing={l}
            location={location}
            history={history}
            routeConfiguration={routeConfiguration}
            currentUser={currentUser}
            onToggleFavorites={onToggleFavorites}
            renderSizes={cardRenderSizes(isMapVariant)}
            setActiveListing={setActiveListing}
            showHeartIcon={true}
          />
        ))}
        {props.children}
      </div>
      {paginationLinks}
    </div>
  );
};

// {Faorite Button} Add this to pull currentUser from Redux:
const mapStateToProps = state => {
  return {
    currentUser: state.user.currentUser,
  };
};

const mapDispatchToProps = dispatch => ({
  onUpdateFavorites: payload => dispatch(updateProfile(payload)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsPanel);
