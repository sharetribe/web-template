import React, { Component, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { parse } from '../../util/urlHelpers';
import { getInSearchOfListingType, isInSearchOfListingType } from '../../util/inSearchOf';
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
import FilterDrawer from './FilterDrawer/FilterDrawer';
import ActiveFilterChips from './FilterDrawer/ActiveFilterChips';
import { getActiveChips, getDrawerFilters } from './FilterDrawer/FilterDrawer.helpers';
import SortBy from './SortBy/SortBy';
import SearchResultsPanel from './SearchResultsPanel/SearchResultsPanel';
import NoSearchResultsMaybe from './NoSearchResultsMaybe/NoSearchResultsMaybe';
import SearchPageAccessWrapper from './SearchPageAccessWrapper';
import SearchErrors from './SearchErrors';

import css from './SearchPage.module.css';

// SortBy component has its content in dropdown-popup.
// With this offset we move the dropdown a few pixels on desktop layout.
const FILTER_DROPDOWN_OFFSET = -14;

export class SearchPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isFilterDrawerOpen: false,
      currentQueryParams: validUrlQueryParamsFromProps(props),
    };

    this.openFilterDrawer = this.openFilterDrawer.bind(this);
    this.closeFilterDrawer = this.closeFilterDrawer.bind(this);

    // Filter functions
    this.resetAll = this.resetAll.bind(this);
    this.getHandleChangedValueFn = this.getHandleChangedValueFn.bind(this);

    // SortBy
    this.handleSortBy = this.handleSortBy.bind(this);
  }

  openFilterDrawer() {
    this.setState({ isFilterDrawerOpen: true });
  }

  closeFilterDrawer() {
    this.setState({ isFilterDrawerOpen: false });
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

    const drawerFilters = getDrawerFilters(availableFilters);
    const activeChips = getActiveChips({
      filters: drawerFilters,
      urlQueryParams: validQueryParams,
      listingCategories,
      intl,
      marketplaceCurrency,
    });
    const activeFiltersCount = activeChips.length;
    const handleChangeParams = this.getHandleChangedValueFn(true);

    // "Selling" / "In search of" switch is shown only when that listing type exists in Console
    const inSearchOfType = getInSearchOfListingType(config.listing?.listingTypes)?.listingType;
    const selectedListingType = parse(location.search).pub_listingType;
    const isInSearchOf = isInSearchOfListingType(selectedListingType);

    const renderFilter = filterConfig => (
      <FilterComponent
        key={`SearchFilterDrawer.${filterConfig.scope || 'built-in'}.${filterConfig.key}`}
        id={`SearchFilterDrawer.${filterConfig.key.toLowerCase()}`}
        config={filterConfig}
        containerId="SearchFilterDrawer"
        listingCategories={listingCategories}
        marketplaceCurrency={marketplaceCurrency}
        urlQueryParams={validQueryParams}
        initialValues={initialValues(this.props, this.state.currentQueryParams)}
        getHandleChangedValueFn={this.getHandleChangedValueFn}
        intl={intl}
        liveEdit
        showAsPopup={false}
        hideClearButton
      />
    );

    return (
      <Page
        scrollingDisabled={scrollingDisabled}
        description={description}
        title={title}
        schema={schema}
      >
        <TopbarContainer rootClassName={css.topbar} currentSearchParams={validQueryParams} />
        <div className={css.layoutWrapperContainer}>
          <div
            id="main-content"
            className={classNames(css.layoutWrapperMain, css.layoutWrapperMainFullWidth)}
            role="main"
          >
            <div className={css.searchResultContainer}>
              <div className={css.filterToolbar}>
                <button
                  type="button"
                  className={css.filtersButton}
                  onClick={this.openFilterDrawer}
                  aria-haspopup="dialog"
                  data-testid="openFilterDrawer"
                >
                  <svg
                    className={css.filtersButtonIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M4 7h10M18 7h2M4 17h4M12 17h8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="16"
                      cy="7"
                      r="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="10"
                      cy="17"
                      r="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <FormattedMessage id="FilterDrawer.openButton" />
                  {activeFiltersCount > 0 ? (
                    <span className={css.filtersButtonBadge}>{activeFiltersCount}</span>
                  ) : null}
                </button>

                {inSearchOfType ? (
                  <span className={css.listingTypePill}>
                    <FormattedMessage
                      id={`FilterDrawer.listingType.${isInSearchOf ? 'inSearchOf' : 'selling'}`}
                    />
                  </span>
                ) : null}

                <ActiveFilterChips
                  chips={activeChips}
                  onChangeParams={handleChangeParams}
                  onClearAll={e => this.handleResetAll(e)}
                />

                <h1 className={css.resultsCount}>
                  {searchInProgress ? (
                    <FormattedMessage id="MainPanelHeader.loadingResults" />
                  ) : (
                    <FormattedMessage
                      id="MainPanelHeader.foundResults"
                      values={{ count: totalItems }}
                    />
                  )}
                </h1>

                <div className={css.sortWrapper}>{sortBy('desktop')}</div>
              </div>

              {noResultsInfo}

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
        <FilterDrawer
          isOpen={this.state.isFilterDrawerOpen}
          onClose={this.closeFilterDrawer}
          filters={drawerFilters}
          renderFilter={renderFilter}
          listingCategories={listingCategories}
          inSearchOfType={inSearchOfType}
          urlQueryParams={{ ...validQueryParams, pub_listingType: selectedListingType }}
          onChangeParams={handleChangeParams}
          onResetAll={e => this.handleResetAll(e)}
          resultsCount={totalItems}
          searchInProgress={searchInProgress}
          onManageDisableScrolling={onManageDisableScrolling}
        />
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
