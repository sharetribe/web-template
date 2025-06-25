import React from 'react';
import classNames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { handleToggleFavorites } from '../../../util/favorites';
import { GRID_STYLE_MASONRY, propTypes } from '../../../util/types';
import { ListingCard, PaginationLinks } from '../../../components';

import css from './SearchResultsPanel.module.css';
import MasonryGridWrapper from '../../../components/MasonryGridWrapper/MasonryGridWrapper';

/**
 * SearchResultsPanel component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {Array<propTypes.listing>} props.listings - The listings
 * @param {propTypes.pagination} props.pagination - The pagination
 * @param {Object} props.search - The search
 * @param {Function} props.setActiveListing - The function to handle the active listing
 * @param {boolean} [props.isMapVariant] - Whether the map variant is enabled
 * @returns {JSX.Element}
 */
const SearchResultsPanel = props => {
  const {
    className,
    rootClassName,
    listings = [],
    pagination,
    search,
    setActiveListing,
    isMapVariant = true,
    gridLayout = GRID_STYLE_MASONRY,
    currentUserFavorites,
    onUpdateFavorites,
    onFetchCurrentUser,
    listingTypeParam,
  } = props;
  const history = useHistory();
  const location = useLocation();
  const routeConfiguration = useRouteConfiguration();
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

  const cardRenderSizes = isMapVariant => {
    if (isMapVariant) {
      // Panel width relative to the viewport
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 767px) 100vw',
        `(max-width: 1023px) ${panelMediumWidth}vw`,
        `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
        `${panelLargeWidth / 3}vw`,
      ].join(', ');
    } else {
      return [
        '(max-width: 549px) 100vw',
        '(max-width: 767px) 50vw',
        `(max-width: 1439px) 26vw`,
        `(max-width: 1920px) 18vw`,
        `14vw`,
      ].join(', ');
    }
  };

  const renderListingCards = cssClass =>
    listings.map(listing => {
      const listingId = listing.id.uuid;
      const listingType = listing.attributes?.publicData?.listingType;
      const isFavorite = currentUserFavorites?.[listingType]?.includes(listingId);
      const routingParams = { params: {}, history, routes: routeConfiguration };
      const onToggleFavorites = handleToggleFavorites({
        ...routingParams,
        listingId,
        listingType,
        onUpdateFavorites,
        onFetchCurrentUser,
        location,
      });
      return (
        <ListingCard
          className={cssClass}
          key={listingId}
          listing={listing}
          renderSizes={cardRenderSizes(isMapVariant)}
          setActiveListing={setActiveListing}
          hidePrice
          isFavorite={isFavorite}
          onToggleFavorites={onToggleFavorites}
          gridLayout={gridLayout}
        />
      );
    });

  return (
    <div className={classes}>
      {gridLayout === GRID_STYLE_MASONRY ? (
        <MasonryGridWrapper>
          {renderListingCards()}
          {props.children}
        </MasonryGridWrapper>
      ) : (
        <div className={isMapVariant ? css.listingCardsMapVariant : css.listingCards}>
          {renderListingCards(css.listingCard)}
          {props.children}
        </div>
      )}

      {paginationLinks}
    </div>
  );
};

export default SearchResultsPanel;
