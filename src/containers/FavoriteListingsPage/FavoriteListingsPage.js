import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Tabs } from 'antd';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { LISTING_TYPES, propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import {
  H3,
  Page,
  PaginationLinks,
  UserNav,
  LayoutSingleColumn,
  ListingCard,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './FavoriteListingsPage.module.css';
import { getListingsById } from '../../ducks/marketplaceData.duck';











// console.warn('\n\n\n*******************************');
// console.warn('\n[createUppyInstance] - process.env.REACT_APP_TRANSLOADIT_SERVICE_URL:', process.env.REACT_APP_TRANSLOADIT_SERVICE_URL);
// console.warn('\n*******************************\n\n\n');







// rafael+seller+2024+11+13+1@theluupe.com
// rafael+buyer+2024+11+13+1@theluupe.com
// TheLuupe_123





/**
 * [TODO:]
 *  - Revisar los links en los menus y poner favoritos y quitar el raro de agregar listing.....
 *  - Poner vista de "VACIO" en la vista de favoritos!
 *
 *
 *  - Hacer perfil de comprador y vendedor
 *    - Trabajar en el componente para la navegacion de listing types
 *      - Reutilizar en:
 *          - Perfil vendedor
 *          - Mis Listings (vendedor unicamente)
 *          - Favoritos
 *
 *  - Revisar que no pueda abrir la vista de editar ni de mis listings ni de otros
 *  - Revisar que SI pueda abrir la vista de detalle de todos los productos (SOLAMENTE LOS PRODUCTOS)
 *
 *  - Revisar problemas del build. Probablemente tenga que ver con la version de React
 *
 *  - Leer los chats - ProdSupport
 */







export const FavoriteListingsPageComponent = props => {
  const {
    listings,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    scrollingDisabled,
    intl,
  } = props;
  const routeConfiguration = useRouteConfiguration();
  const history = useHistory();
  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;
  const defaultListingType = LISTING_TYPES.PRODUCT;
  const currentListingType = queryParams.pub_listingType || defaultListingType;

  useEffect(() => {
    const validListingType = !queryParams.pub_listingType;
    const shouldUpdateRoute = validListingType;
    if (shouldUpdateRoute) {
      const pathParams = {};
      const queryParams = { pub_listingType: defaultListingType };
      const destination = createResourceLocatorString(
        'FavoriteListingsPage',
        routeConfiguration,
        pathParams,
        queryParams
      );
      history.replace(destination);
    }
  }, []);

  const onTabChange = key => {
    const pathParams = {};
    const queryParams = { pub_listingType: key };
    const destination = createResourceLocatorString(
      'FavoriteListingsPage',
      routeConfiguration,
      pathParams,
      queryParams
    );
    history.push(destination);
  };

  const loadingResults = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.loadingFavoriteListings" />
      </H3>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.queryError" />
      </H3>
    </div>
  );

  const noResults =
    listingsAreLoaded && pagination.totalItems === 0 ? (
      <H3 as="h1" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.noResults" />
      </H3>
    ) : null;

  const heading =
    listingsAreLoaded && pagination.totalItems > 0 ? (
      <H3 as="h1" className={css.heading}>
        <FormattedMessage
          id="FavoriteListingsPage.youHaveListings"
          values={{ count: pagination.totalItems }}
        />
      </H3>
    ) : (
      noResults
    );

  const page = queryParams ? queryParams.page : 1;
  const paginationLinks =
    listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="FavoriteListingsPage"
        pageSearchParams={{ page }}
        pagination={pagination}
      />
    ) : null;

  const title = intl.formatMessage({ id: 'FavoriteListingsPage.title' });

  const panelWidth = 62.5;
  // Render hints for responsive image
  const renderSizes = [
    `(max-width: 767px) 100vw`,
    `(max-width: 1920px) ${panelWidth / 2}vw`,
    `${panelWidth / 3}vw`,
  ].join(', ');

  const listingRenderer = (
    <div className={css.listingCards}>
      {listings.map(l => (
        <ListingCard
          className={css.listingCard}
          key={l.id.uuid}
          listing={l}
          renderSizes={renderSizes}
        />
      ))}
    </div>
  );

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer currentPage="FavoriteListingsPage" />
            <UserNav currentPage="FavoriteListingsPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        {queryInProgress ? loadingResults : null}
        {queryFavoritesError ? queryError : null}
        <div className={css.listingPanel}>
          {heading}
          <div className={css.favoriteCardsTabs}>
            <Tabs
              defaultActiveKey={currentListingType}
              onChange={onTabChange}
              items={[
                { key: LISTING_TYPES.PRODUCT, label: 'Shop', children: listingRenderer },
                { key: LISTING_TYPES.PROFILE, label: 'Creatives', children: listingRenderer },
              ]}
            />
            {paginationLinks}
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

FavoriteListingsPageComponent.defaultProps = {
  listings: [],
  pagination: null,
  queryFavoritesError: null,
  queryParams: null,
};

const { arrayOf, bool, object } = PropTypes;

FavoriteListingsPageComponent.propTypes = {
  listings: arrayOf(propTypes.listing),
  pagination: propTypes.pagination,
  queryInProgress: bool.isRequired,
  queryFavoritesError: propTypes.error,
  queryParams: object,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
  } = state.FavoriteListingsPage;
  const listings = getListingsById(state, currentPageResultIds);
  return {
    currentPageResultIds,
    listings,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const FavoriteListingsPage = compose(
  connect(mapStateToProps),
  injectIntl
)(FavoriteListingsPageComponent);

export default FavoriteListingsPage;
