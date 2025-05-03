import React from 'react';
import classNames from 'classnames';

import { GRID_STYLE_MASONRY, propTypes } from '../../../util/types';
import { ListingCard, PaginationLinks } from '../../../components';

import css from './SearchResultsPanel.module.css';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

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
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  const paginationLinks =
    pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="SearchPage"
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

  const renderListingCards = () =>
    listings.map(l => (
      <ListingCard
        className={css.listingCard}
        key={l.id.uuid}
        listing={l}
        renderSizes={cardRenderSizes(isMapVariant)}
        setActiveListing={setActiveListing}
        hidePrice
        gridLayout={gridLayout}
      />
    ));

  return (
    <div className={classes}>
      {gridLayout === GRID_STYLE_MASONRY ? (
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
          gutterBreakpoints={{ 350: '12px', 750: '16px', 900: '24px' }}
        >
          <Masonry>
            {renderListingCards()}
            {props.children}
          </Masonry>
        </ResponsiveMasonry>
      ) : (
        <div className={isMapVariant ? css.listingCardsMapVariant : css.listingCards}>
          {renderListingCards()}
          {props.children}
        </div>
      )}

      {paginationLinks}
    </div>
  );
};

export default SearchResultsPanel;
