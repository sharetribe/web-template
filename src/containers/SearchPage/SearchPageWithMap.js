import React, { Component, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'lodash/debounce';
import classNames from 'classnames';

import { isOriginInUse } from '../../util/search';
import { parse } from '../../util/urlHelpers';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { makeGetListingsByIdSelector } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';

import { ModalInMobile, Page } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import { setActiveListing } from './SearchPage.duck';
import {
  initialValues,
  validUrlQueryParamsFromProps,
  validFilterParams,
  getSearchPageResourceLocatorStringParams,
  getDerivedRenderData,
  onResetAll,
  onApplyFilters,
  createFilterValueChangeHandler,
  onSortBy,
} from './SearchPage.shared';

import FilterComponent from './FilterComponent';
import SearchMap from './SearchMap/SearchMap';
import MainPanelHeader from './MainPanelHeader/MainPanelHeader';
import SearchFiltersSecondary from './SearchFiltersSecondary/SearchFiltersSecondary';
import SearchFiltersPrimary from './SearchFiltersPrimary/SearchFiltersPrimary';
import SearchFiltersMobile from './SearchFiltersMobile/SearchFiltersMobile';
import SortBy from './SortBy/SortBy';
import SearchResultsPanel from './SearchResultsPanel/SearchResultsPanel';
import NoSearchResultsMaybe from './NoSearchResultsMaybe/NoSearchResultsMaybe';
import SearchPageAccessWrapper from './SearchPageAccessWrapper';
import SearchErrors from './SearchErrors';

import css from './SearchPage.module.css';

const MODAL_BREAKPOINT = 768; // Search is in modal on mobile layout
const SEARCH_WITH_MAP_DEBOUNCE = 300; // Little bit of debounce before search is initiated.

// Primary filters have their content in dropdown-popup.
// With this offset we move the dropdown to the left a few pixels on desktop layout.
const FILTER_DROPDOWN_OFFSET = -14;

export class SearchPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSearchMapOpenOnMobile: false,
      isMobileModalOpen: false,
      currentQueryParams: validUrlQueryParamsFromProps(props),
      isSecondaryFiltersOpen: false,
    };

    this.onMapMoveEnd = debounce(this.onMapMoveEnd.bind(this), SEARCH_WITH_MAP_DEBOUNCE);
    this.onOpenMobileModal = this.onOpenMobileModal.bind(this);
    this.onCloseMobileModal = this.onCloseMobileModal.bind(this);

    // Filter functions
    this.applyFilters = this.applyFilters.bind(this);
    this.cancelFilters = this.cancelFilters.bind(this);
    this.resetAll = this.resetAll.bind(this);
    this.getHandleChangedValueFn = this.getHandleChangedValueFn.bind(this);

    // SortBy
    this.handleSortBy = this.handleSortBy.bind(this);
  }

  // Callback to determine if new search is needed
  // when map is moved by user or viewport has changed
  onMapMoveEnd(viewportBoundsChanged, data) {
    const { viewportBounds, viewportCenter } = data;
    const { params: currentPathParams } = this.props;

    const routes = this.props.routeConfiguration;
    const searchPagePath = currentPathParams.listingType
      ? pathByRouteName('SearchPageWithListingType', routes, currentPathParams)
      : pathByRouteName('SearchPage', routes);
    const currentPath =
      typeof window !== 'undefined' && window.location && window.location.pathname;

    // When using the ReusableMapContainer onMapMoveEnd can fire from other pages than SearchPage too
    const isSearchPage = currentPath === searchPagePath;

    // If mapSearch url param is given
    // or original location search is rendered once,
    // we start to react to "mapmoveend" events by generating new searches
    // (i.e. 'moveend' event in Mapbox and 'bounds_changed' in Google Maps)
    if (viewportBoundsChanged && isSearchPage) {
      const { history, location, config } = this.props;
      const { listingFields: listingFieldsConfig } = config?.listing || {};
      const { defaultFilters: defaultFiltersConfig } = config?.search || {};
      const activeListingTypes = config?.listing?.listingTypes.map(config => config.listingType);
      const listingCategories = config.categoryConfiguration.categories;
      const filterConfigs = {
        listingFieldsConfig,
        defaultFiltersConfig,
        listingCategories,
        activeListingTypes,
        currentPathParams,
      };

      // parse query parameters, including a custom attribute named category
      // when onMapMoveEnd is called, pagination needs to be reset.
      const { address, bounds, mapSearch, page, ...rest } = parse(location.search, {
        latlng: ['origin'],
        latlngBounds: ['bounds'],
      });

      const originMaybe = isOriginInUse(this.props.config) ? { origin: viewportCenter } : {};
      const dropNonFilterParams = false;

      const searchParams = {
        address,
        ...originMaybe,
        bounds: viewportBounds,
        mapSearch: true,
        ...validFilterParams(rest, filterConfigs, dropNonFilterParams),
      };

      const { routeName, pathParams } = getSearchPageResourceLocatorStringParams(routes, location);

      history.push(createResourceLocatorString(routeName, routes, pathParams, searchParams));
    }
  }

  // Invoked when a modal is opened from a child component,
  // for example when a filter modal is opened in mobile view
  onOpenMobileModal() {
    this.setState({ isMobileModalOpen: true });
  }

  // Invoked when a modal is closed from a child component,
  // for example when a filter modal is opened in mobile view
  onCloseMobileModal() {
    this.setState({ isMobileModalOpen: false });
  }

  // Apply the filters by redirecting to SearchPage with new filters.
  applyFilters() {
    const { history, routeConfiguration, config, params: currentPathParams, location } = this.props;
    onApplyFilters({
      history,
      routeConfiguration,
      config,
      location,
      currentPathParams,
      urlQueryParams: validUrlQueryParamsFromProps(this.props),
      currentQueryParams: this.state.currentQueryParams,
    });
  }

  // Close the filters by clicking cancel, revert to the initial params
  cancelFilters() {
    this.setState({ currentQueryParams: {} });
  }

  // Reset all filter query parameters
  resetAll(e) {
    const { history, routeConfiguration, config, location } = this.props;
    onResetAll({
      history,
      routeConfiguration,
      config,
      location,
      urlQueryParams: validUrlQueryParamsFromProps(this.props),
      setState: this.setState.bind(this),
    });
  }

  getHandleChangedValueFn(useHistoryPush) {
    const {
      history,
      routeConfiguration,
      config,
      location,
      params: currentPathParams = {},
    } = this.props;

    return createFilterValueChangeHandler(
      {
        history,
        routeConfiguration,
        config,
        location,
        currentPathParams,
        urlQueryParams: validUrlQueryParamsFromProps(this.props),
        setState: this.setState.bind(this),
        getState: () => this.state,
      },
      useHistoryPush
    );
  }

  handleSortBy(urlParam, values) {
    const { history, routeConfiguration, location } = this.props;
    onSortBy({
      history,
      routeConfiguration,
      location,
      urlQueryParams: validUrlQueryParamsFromProps(this.props),
      urlParam,
      values,
    });
  }

  render() {
    const {
      intl,
      listings = [],
      location,
      onManageDisableScrolling,
      pagination,
      scrollingDisabled,
      searchInProgress,
      searchListingsError,
      searchParams = {},
      activeListingId,
      onActivateListing,
      routeConfiguration,
      config,
      params: currentPathParams = {},
      currentUser,
    } = this.props;

    const {
      listingTypePathParam,
      sortConfig,
      validQueryParams,
      searchParamsInURL,
      customSecondaryFilters,
      availablePrimaryFilters,
      availableFilters,
      hasSecondaryFilters,
      selectedFilters,
      selectedFiltersCountForMobile,
      isValidDatesFilter,
      selectedSecondaryFiltersCount,
      totalItems,
      listingsAreLoaded,
      conflictingFilterActive,
      showCreateListingsLink,
      title,
      description,
      schema,
      marketplaceCurrency,
      listingCategories,
    } = getDerivedRenderData({
      intl,
      location,
      config,
      routeConfiguration,
      searchParams,
      pagination,
      listings,
      searchInProgress,
      currentPathParams,
      currentUser,
    });

    const isWindowDefined = typeof window !== 'undefined';
    const isMobileLayout = isWindowDefined && window.innerWidth < MODAL_BREAKPOINT;
    const shouldShowSearchMap =
      !isMobileLayout || (isMobileLayout && this.state.isSearchMapOpenOnMobile);

    const isSecondaryFiltersOpen = !!hasSecondaryFilters && this.state.isSecondaryFiltersOpen;
    const propsForSecondaryFiltersToggle = hasSecondaryFilters
      ? {
          isSecondaryFiltersOpen: this.state.isSecondaryFiltersOpen,
          toggleSecondaryFiltersOpen: isOpen => {
            this.setState({ isSecondaryFiltersOpen: isOpen, currentQueryParams: {} });
          },
          selectedSecondaryFiltersCount,
        }
      : {};

    const sortBy = mode => {
      return sortConfig.active ? (
        <SortBy
          sort={validQueryParams[sortConfig.queryParamName]}
          isConflictingFilterActive={!!conflictingFilterActive}
          hasConflictingFilters={!!(sortConfig.conflictingFilters?.length > 0)}
          selectedFilters={selectedFilters}
          onSelect={this.handleSortBy}
          showAsPopup
          mode={mode}
          labelId={`${mode}-search-page-sort-by`}
          contentPlacementOffset={FILTER_DROPDOWN_OFFSET}
        />
      ) : null;
    };
    const noResultsInfo = (
      <NoSearchResultsMaybe
        listingsAreLoaded={listingsAreLoaded}
        totalItems={totalItems}
        location={location}
        resetAll={this.resetAll}
        showCreateListingsLink={showCreateListingsLink}
      />
    );

    const { bounds, origin } = searchParamsInURL || {};

    // Set topbar class based on if a modal is open in
    // a child component
    const topbarClasses = this.state.isMobileModalOpen
      ? classNames(css.topbarBehindModal, css.topbar)
      : css.topbar;

    // N.B. openMobileMap button is sticky.
    // For some reason, stickyness doesn't work on Safari, if the element is <button>
    return (
      <Page
        scrollingDisabled={scrollingDisabled}
        description={description}
        title={title}
        schema={schema}
      >
        <TopbarContainer rootClassName={topbarClasses} currentSearchParams={validQueryParams} />
        <div id="main-content" className={css.container} role="main">
          <div className={css.searchResultContainer}>
            <SearchFiltersMobile
              className={css.searchFiltersMobileMap}
              urlQueryParams={validQueryParams}
              sortByComponent={sortBy('mobile')}
              listingsAreLoaded={listingsAreLoaded}
              resultsCount={totalItems}
              searchInProgress={searchInProgress}
              searchListingsError={searchListingsError}
              showAsModalMaxWidth={MODAL_BREAKPOINT}
              onMapIconClick={() => this.setState({ isSearchMapOpenOnMobile: true })}
              onManageDisableScrolling={onManageDisableScrolling}
              onOpenModal={this.onOpenMobileModal}
              onCloseModal={this.onCloseMobileModal}
              resetAll={this.resetAll}
              selectedFiltersCount={selectedFiltersCountForMobile}
              noResultsInfo={noResultsInfo}
              location={location}
              isMapVariant
            >
              {availableFilters.map(filterConfig => {
                const key = `SearchFiltersMobile.${filterConfig.scope || 'built-in'}.${
                  filterConfig.key
                }`;
                const filterId = `SearchFiltersMobile.${filterConfig.key.toLowerCase()}`;
                return (
                  <FilterComponent
                    key={key}
                    id={filterId}
                    config={filterConfig}
                    containerId="SearchPage_MobileFilters"
                    listingCategories={listingCategories}
                    marketplaceCurrency={marketplaceCurrency}
                    urlQueryParams={validQueryParams}
                    initialValues={initialValues(this.props, this.state.currentQueryParams)}
                    getHandleChangedValueFn={this.getHandleChangedValueFn}
                    intl={intl}
                    liveEdit
                    showAsPopup={false}
                  />
                );
              })}
            </SearchFiltersMobile>
            <MainPanelHeader
              className={css.mainPanelMapVariant}
              sortByComponent={sortBy('desktop')}
              isSortByActive={sortConfig.active}
              listingsAreLoaded={listingsAreLoaded}
              resultsCount={totalItems}
              searchInProgress={searchInProgress}
              searchListingsError={searchListingsError}
              noResultsInfo={noResultsInfo}
            >
              <SearchFiltersPrimary {...propsForSecondaryFiltersToggle}>
                {availablePrimaryFilters.map(filterConfig => {
                  const key = `SearchFiltersPrimary.${filterConfig.scope || 'built-in'}.${
                    filterConfig.key
                  }`;
                  const filterId = `SearchFiltersPrimary.${filterConfig.key.toLowerCase()}`;
                  return (
                    <FilterComponent
                      key={key}
                      id={filterId}
                      config={filterConfig}
                      containerId="SearchPageWithMap_PrimaryFilters"
                      listingCategories={listingCategories}
                      marketplaceCurrency={marketplaceCurrency}
                      urlQueryParams={validQueryParams}
                      initialValues={initialValues(this.props, this.state.currentQueryParams)}
                      getHandleChangedValueFn={this.getHandleChangedValueFn}
                      intl={intl}
                      showAsPopup
                      contentPlacementOffset={FILTER_DROPDOWN_OFFSET}
                    />
                  );
                })}
              </SearchFiltersPrimary>
            </MainPanelHeader>
            {isSecondaryFiltersOpen ? (
              <div className={classNames(css.searchFiltersPanel)}>
                <SearchFiltersSecondary
                  urlQueryParams={validQueryParams}
                  listingsAreLoaded={listingsAreLoaded}
                  applyFilters={this.applyFilters}
                  cancelFilters={this.cancelFilters}
                  resetAll={this.resetAll}
                  onClosePanel={() => this.setState({ isSecondaryFiltersOpen: false })}
                >
                  {customSecondaryFilters.map(filterConfig => {
                    const key = `SearchFiltersSecondary.${filterConfig.scope || 'built-in'}.${
                      filterConfig.key
                    }`;
                    const filterId = `SearchFiltersSecondary.${filterConfig.key.toLowerCase()}`;
                    return (
                      <FilterComponent
                        key={key}
                        id={filterId}
                        config={filterConfig}
                        containerId="SearchPageWithMap_SecondaryFilters"
                        listingCategories={listingCategories}
                        marketplaceCurrency={marketplaceCurrency}
                        urlQueryParams={validQueryParams}
                        initialValues={initialValues(this.props, this.state.currentQueryParams)}
                        getHandleChangedValueFn={this.getHandleChangedValueFn}
                        intl={intl}
                        showAsPopup={false}
                      />
                    );
                  })}
                </SearchFiltersSecondary>
              </div>
            ) : (
              <div
                className={classNames(css.listingsForMapVariant, {
                  [css.newSearchInProgress]: !(listingsAreLoaded || searchListingsError),
                })}
              >
                <SearchErrors
                  searchListingsError={searchListingsError}
                  isValidDatesFilter={isValidDatesFilter}
                />
                <SearchResultsPanel
                  className={css.searchListingsPanel}
                  listings={listings}
                  pagination={listingsAreLoaded ? pagination : null}
                  search={parse(location.search)}
                  setActiveListing={onActivateListing}
                  isMapVariant
                  listingTypeParam={listingTypePathParam}
                  intl={intl}
                />
              </div>
            )}
          </div>
          <ModalInMobile
            className={css.mapPanel}
            id="SearchPage_map"
            isModalOpenOnMobile={this.state.isSearchMapOpenOnMobile}
            onClose={() => this.setState({ isSearchMapOpenOnMobile: false })}
            showAsModalMaxWidth={MODAL_BREAKPOINT}
            onManageDisableScrolling={onManageDisableScrolling}
          >
            <div className={css.mapWrapper} data-testid="searchMapContainer">
              {shouldShowSearchMap ? (
                <SearchMap
                  reusableContainerClassName={css.map}
                  rootClassName={css.mapRoot}
                  activeListingId={activeListingId}
                  bounds={bounds}
                  center={origin}
                  isSearchMapOpenOnMobile={this.state.isSearchMapOpenOnMobile}
                  location={location}
                  listings={listings || []}
                  onMapMoveEnd={this.onMapMoveEnd}
                  onCloseAsModal={() => {
                    onManageDisableScrolling('SearchPage_map', false);
                  }}
                  messages={intl.messages}
                />
              ) : null}
            </div>
          </ModalInMobile>
        </div>
      </Page>
    );
  }
}

/**
 * SearchPage "container" (map layout): selects Redux state and dispatch handlers, then passes the
 * same prop surface as before to `SearchPageComponent` via `SearchPageAccessWrapper`.
 *
 * @param {Object} props - Router / route props from `routeConfiguration.js` and `Routes.js`
 * @returns {JSX.Element}
 */
const SearchPage = props => {
  const dispatch = useDispatch();
  const selectListingsById = useMemo(makeGetListingsByIdSelector, []);

  const currentUser = useSelector(state => state.user?.currentUser);
  const {
    pagination,
    searchInProgress,
    searchListingsError,
    searchParams,
    activeListingId,
  } = useSelector(state => state.SearchPage);
  const listings = useSelector(state =>
    selectListingsById(state, state.SearchPage.currentPageResultIds)
  );
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const onManageDisableScrolling = useCallback(
    (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    [dispatch]
  );
  const onActivateListing = useCallback(listingId => dispatch(setActiveListing(listingId)), [
    dispatch,
  ]);

  return (
    <SearchPageAccessWrapper
      {...props}
      PageComponent={SearchPageComponent}
      currentUser={currentUser}
      listings={listings}
      pagination={pagination}
      scrollingDisabled={scrollingDisabled}
      searchInProgress={searchInProgress}
      searchListingsError={searchListingsError}
      searchParams={searchParams}
      activeListingId={activeListingId}
      onManageDisableScrolling={onManageDisableScrolling}
      onActivateListing={onActivateListing}
    />
  );
};

export default SearchPage;
