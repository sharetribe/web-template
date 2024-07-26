import React from 'react';
import { array, bool, node, object, string } from 'prop-types';
import classNames from 'classnames';

import { propTypes } from '../../../util/types';
import { ListingCard, PaginationLinks } from '../../../components';

import css from './SearchResultsPanel.module.css';

const SearchResultsPanel = props => {
  const {
    className,
    rootClassName,
    listings,
    pagination,
    search,
    setActiveListing,
    isMapVariant,
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
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 767px) 100vw',
        `(max-width: 1023px) ${panelMediumWidth}vw`,
        `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
        `${panelLargeWidth / 3}vw`,
      ].join(', ');
    } else {
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 549px) 100vw',
        '(max-width: 767px) 50vw',
        `(max-width: 1439px) 26vw`,
        `(max-width: 1920px) 18vw`,
        `14vw`,
      ].join(', ');
    }
  };

  const handleCardClick = listingId => {
    if (typeof fbq !== 'undefined') {
      fbq('track', 'ViewContent', { listing_id: listingId });
    } else {
      console.error('Meta Pixel no está definido');
    }
  };

  const handleButtonClick = () => {
    if (typeof fbq !== 'undefined') {
      fbq('track', 'ContactTextArticlesGeneral');
      setTimeout(() => {
        window.open('https://wa.me/5492944232664', '_blank');
      }, 300);
    } else {
      console.error('Meta Pixel no está definido');
    }
  };
  return (
    <div className={classes}>
      <div className={classNames(css.stickyButtonContainer)}>
        <button style={{position:'static'}}
          className={classNames(css.stickyButton, css.whatsappButton)}
          onClick={handleButtonClick}
        >
          Si no encontrás lo que necesitás, ¡escribinos por acá!
        </button>
      </div>

      <div className={isMapVariant ? css.listingCardsMapVariant : css.listingCards}>
        {listings.map(l => (
          <button
            key={l.id.uuid}
            onClick={() => handleCardClick(l.id.uuid)}
            style={{ border: 'none', background: 'none', padding: 0, margin: 0, width: '100%' }}
          >
            <ListingCard
              className={css.listingCard}
              listing={l}
              renderSizes={cardRenderSizes(isMapVariant)}
              setActiveListing={setActiveListing}
            />
          </button>
        ))}
        {props.children}
      </div>
      {/* Botón debajo de todos los productos */}
      <div className={classNames(css.stickyButtonContainer)}>
        <button
          className={classNames(css.stickyButton, css.whatsappButton)}
          onClick={handleButtonClick}
        >
          Si no encontrás lo que necesitás, ¡escribinos por acá!
        </button>
      </div>
      {paginationLinks}
    </div>
  );
};

SearchResultsPanel.defaultProps = {
  children: null,
  className: null,
  listings: [],
  pagination: null,
  rootClassName: null,
  search: null,
  isMapVariant: true,
};

SearchResultsPanel.propTypes = {
  children: node,
  className: string,
  listings: array,
  pagination: propTypes.pagination,
  rootClassName: string,
  search: object,
  isMapVariant: bool,
};

export default SearchResultsPanel;