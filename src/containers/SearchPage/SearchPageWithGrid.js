import React, { Component, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { parse } from '../../util/urlHelpers';
import { makeGetListingsByIdSelector } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';

import { Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import {
  initialValues,
  validUrlQueryParamsFromProps,
  getDerivedRenderData,
  onResetAll,
  createFilterValueChangeHandler,
  onSortBy,
} from './SearchPage.shared';

import FilterComponent from './FilterComponent';
import MainPanelHeader from './MainPanelHeader/MainPanelHeader';
import SearchFiltersMobile from './SearchFiltersMobile/SearchFiltersMobile';
import SortBy from './SortBy/SortBy';
import SearchResultsPanel from './SearchResultsPanel/SearchResultsPanel';
import NoSearchResultsMaybe from './NoSearchResultsMaybe/NoSearchResultsMaybe';
import SearchPageAccessWrapper from './SearchPageAccessWrapper';
import SearchErrors from './SearchErrors';

import css from './SearchPage.module.css';

const MODAL_BREAKPOINT = 768; // Search is in modal on mobile layout

// SortBy component has its content in dropdown-popup.
// With this offset we move the dropdown a few pixels on desktop layout.
const FILTER_DROPDOWN_OFFSET = -14;

export class SearchPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isMobileModalOpen: false,
      currentQueryParams: validUrlQueryParamsFromProps(props),
    };

    this.onOpenMobileModal = this.onOpenMobileModal.bind(this);
    this.onCloseMobileModal = this.onCloseMobileModal.bind(this);

    // Filter functions
    this.resetAll = this.resetAll.bind(this);
    this.getHandleChangedValueFn = this.getHandleChangedValueFn.bind(this);

    // SortBy
    this.handleSortBy = this.handleSortBy.bind(this);
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

  // Reset all filter query parameters
  handleResetAll(e) {
    this.resetAll(e);

    // blur event target if event is passed
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
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
      routeConfiguration,
      config,
      params: currentPathParams = {},
      currentUser,
    } = this.props;

    const {
      listingTypePathParam,
      sortConfig,
      validQueryParams,
      availableFilters,
      selectedFilters,
      isValidDatesFilter,
      selectedFiltersCountForMobile,
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
        <div className={css.layoutWrapperContainer}>
          <aside className={css.layoutWrapperFilterColumn} data-testid="filterColumnAside">
            <div className={css.filterColumnContent}>
              {availableFilters.map(filterConfig => {
                const key = `SearchFiltersDesktop.${filterConfig.scope || 'built-in'}.${
                  filterConfig.key
                }`;
                const filterId = `SearchFiltersDesktop.${filterConfig.key.toLowerCase()}`;
                return (
                  <FilterComponent
                    key={key}
                    id={filterId}
                    className={css.filter}
                    config={filterConfig}
                    containerId="SearchPageWithGrid_DesktopFilters"
                    listingCategories={listingCategories}
                    marketplaceCurrency={marketplaceCurrency}
                    urlQueryParams={validQueryParams}
                    initialValues={initialValues(this.props, this.state.currentQueryParams)}
                    getHandleChangedValueFn={this.getHandleChangedValueFn}
                    intl={intl}
                    liveEdit
                    showAsPopup={false}
                    isDesktop
                  />
                );
              })}
              <button className={css.resetAllButton} onClick={e => this.handleResetAll(e)}>
                <FormattedMessage id={'SearchFiltersMobile.resetAll'} />
              </button>
            </div>
          </aside>

          <div id="main-content" className={css.layoutWrapperMain} role="main">
            <div className={css.searchResultContainer}>
              <SearchFiltersMobile
                className={css.searchFiltersMobileList}
                urlQueryParams={validQueryParams}
                sortByComponent={sortBy('mobile')}
                listingsAreLoaded={listingsAreLoaded}
                resultsCount={totalItems}
                searchInProgress={searchInProgress}
                searchListingsError={searchListingsError}
                showAsModalMaxWidth={MODAL_BREAKPOINT}
                onManageDisableScrolling={onManageDisableScrolling}
                onOpenModal={this.onOpenMobileModal}
                onCloseModal={this.onCloseMobileModal}
                resetAll={this.resetAll}
                selectedFiltersCount={selectedFiltersCountForMobile}
                isMapVariant={false}
                noResultsInfo={noResultsInfo}
                location={location}
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
                className={css.mainPanel}
                sortByComponent={sortBy('desktop')}
                isSortByActive={sortConfig.active}
                listingsAreLoaded={listingsAreLoaded}
                resultsCount={totalItems}
                searchInProgress={searchInProgress}
                searchListingsError={searchListingsError}
                noResultsInfo={noResultsInfo}
              />
              <div
                className={classNames(css.listingsForGridVariant, {
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
                  isMapVariant={false}
                  listingTypeParam={listingTypePathParam}
                  intl={intl}
                />
              </div>
            </div>
          </div>
        </div>
        <FooterContainer />
      </Page>
    );
  }
}

/**
 * SearchPage "container" (grid layout): selects Redux state and dispatch handlers, then passes the
 * same prop surface as before to `SearchPageComponent` via `SearchPageAccessWrapper`.
 *
 * @param {Object} props - Router / route props from `routeConfiguration.js` and `Routes.js`
 * @returns {JSX.Element}
 */
const SearchPage = props => {
  const dispatch = useDispatch();
  const selectListingsById = useMemo(makeGetListingsByIdSelector, []);

  const currentUser = useSelector(state => state.user?.currentUser);
  const { pagination, searchInProgress, searchListingsError, searchParams } = useSelector(
    state => state.SearchPage
  );
  const listings = useSelector(state =>
    selectListingsById(state, state.SearchPage.currentPageResultIds)
  );
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const onManageDisableScrolling = useCallback(
    (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    [dispatch]
  );

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
      onManageDisableScrolling={onManageDisableScrolling}
    />
  );
};

export default SearchPage;
