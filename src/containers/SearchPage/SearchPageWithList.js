import React, { Component } from 'react';
import { array, bool, func, oneOf, object, shape, string } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import omit from 'lodash/omit';
import classNames from 'classnames';

import config from '../../config';
import { injectIntl, intlShape, FormattedMessage } from '../../util/reactIntl';
import routeConfiguration from '../../routing/routeConfiguration';
import { createResourceLocatorString } from '../../util/routes';
import { isAnyFilterActive, isMainSearchTypeKeywords, getQueryParamNames } from '../../util/search';
import { parse, stringify } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/UI.duck';

import { Footer, Page } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import {
  pickSearchParamsOnly,
  validURLParamsForExtendedData,
  validFilterParams,
  createSearchResultSchema,
} from './SearchPage.shared';

import FilterComponent from './FilterComponent';
import MainPanelHeader from './MainPanelHeader/MainPanelHeader';
import SearchFiltersMobile from './SearchFiltersMobile/SearchFiltersMobile';
import SortBy from './SortBy/SortBy';
import SearchResultsPanel from './SearchResultsPanel/SearchResultsPanel';
import NoSearchResultsMaybe from './NoSearchResultsMaybe/NoSearchResultsMaybe';

import css from './SearchPage.module.css';

const MODAL_BREAKPOINT = 768; // Search is in modal on mobile layout

// SortBy component has its content in dropdown-popup.
// With this offset we move the dropdown a few pixels on desktop layout.
const FILTER_DROPDOWN_OFFSET = -14;

const validUrlQueryParamsFromProps = props => {
  const { location, listingExtendedDataConfig, defaultFiltersConfig } = props;
  // eslint-disable-next-line no-unused-vars
  const { mapSearch, page, ...searchInURL } = parse(location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });
  // urlQueryParams doesn't contain page specific url params
  // like mapSearch, page or origin (origin depends on config.sortSearchByDistance)
  return validURLParamsForExtendedData(
    searchInURL,
    listingExtendedDataConfig,
    defaultFiltersConfig
  );
};

const cleanSearchFromConflictingParams = (
  searchParams,
  listingExtendedDataConfig,
  defaultFiltersConfig,
  sortConfig
) => {
  // Single out filters that should disable SortBy when an active
  // keyword search sorts the listings according to relevance.
  // In those cases, sort parameter should be removed.
  const sortingFiltersActive = isAnyFilterActive(
    sortConfig.conflictingFilters,
    searchParams,
    listingExtendedDataConfig,
    defaultFiltersConfig
  );
  return sortingFiltersActive
    ? { ...searchParams, [sortConfig.queryParamName]: null }
    : searchParams;
};

export class SearchPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSearchMapOpenOnMobile: props.tab === 'map',
      isMobileModalOpen: false,
      currentQueryParams: validUrlQueryParamsFromProps(props),
    };

    this.searchMapListingsInProgress = false;

    this.onOpenMobileModal = this.onOpenMobileModal.bind(this);
    this.onCloseMobileModal = this.onCloseMobileModal.bind(this);

    // Filter functions
    this.resetAll = this.resetAll.bind(this);
    this.initialValues = this.initialValues.bind(this);
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
    const { history, listingExtendedDataConfig, defaultFiltersConfig } = this.props;
    const urlQueryParams = validUrlQueryParamsFromProps(this.props);
    const filterQueryParamNames = getQueryParamNames(
      listingExtendedDataConfig,
      defaultFiltersConfig
    );

    // Reset state
    this.setState({ currentQueryParams: {} });

    // Reset routing params
    const queryParams = omit(urlQueryParams, filterQueryParamNames);
    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, queryParams));
  }

  initialValues(queryParamNames, isLiveEdit) {
    const urlQueryParams = validUrlQueryParamsFromProps(this.props);

    // Query parameters that are in state (user might have not yet clicked "Apply")
    const currentQueryParams = this.state.currentQueryParams;

    // Get initial value for a given parameter from state if its there.
    const getInitialValue = paramName => {
      const currentQueryParam = currentQueryParams[paramName];
      const hasQueryParamInState = typeof currentQueryParam !== 'undefined';
      return hasQueryParamInState && !isLiveEdit ? currentQueryParam : urlQueryParams[paramName];
    };

    // Return all the initial values related to given queryParamNames
    // InitialValues for "amenities" filter could be
    // { amenities: "has_any:towel,jacuzzi" }
    const isArray = Array.isArray(queryParamNames);
    return isArray
      ? queryParamNames.reduce((acc, paramName) => {
          return { ...acc, [paramName]: getInitialValue(paramName) };
        }, {})
      : {};
  }

  getHandleChangedValueFn(useHistoryPush) {
    const { history, sortConfig, listingExtendedDataConfig, defaultFiltersConfig } = this.props;
    const urlQueryParams = validUrlQueryParamsFromProps(this.props);

    return updatedURLParams => {
      const updater = prevState => {
        const { address, bounds, keywords } = urlQueryParams;
        const mergedQueryParams = { ...urlQueryParams, ...prevState.currentQueryParams };

        // Address and bounds are handled outside of MainPanel.
        // I.e. TopbarSearchForm && search by moving the map.
        // We should always trust urlQueryParams with those.
        // The same applies to keywords, if the main search type is keyword search.
        const keywordsMaybe = isMainSearchTypeKeywords(config) ? { keywords } : {};
        return {
          currentQueryParams: {
            ...mergedQueryParams,
            ...updatedURLParams,
            ...keywordsMaybe,
            address,
            bounds,
          },
        };
      };

      const callback = () => {
        if (useHistoryPush) {
          const searchParams = this.state.currentQueryParams;
          const search = cleanSearchFromConflictingParams(
            searchParams,
            listingExtendedDataConfig,
            defaultFiltersConfig,
            sortConfig
          );
          history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, search));
        }
      };

      this.setState(updater, callback);
    };
  }

  handleSortBy(urlParam, values) {
    const { history } = this.props;
    const urlQueryParams = validUrlQueryParamsFromProps(this.props);

    const queryParams = values
      ? { ...urlQueryParams, [urlParam]: values }
      : omit(urlQueryParams, urlParam);

    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, queryParams));
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
      listings,
      activeProcesses,
      listingExtendedDataConfig,
      defaultFiltersConfig,
      sortConfig,
      location,
      onManageDisableScrolling,
      pagination,
      scrollingDisabled,
      searchInProgress,
      searchListingsError,
      searchParams,
    } = this.props;
    // eslint-disable-next-line no-unused-vars
    const { mapSearch, page, ...searchInURL } = parse(location.search, {
      latlng: ['origin'],
      latlngBounds: ['bounds'],
    });

    // urlQueryParams doesn't contain page specific url params
    // like mapSearch, page or origin (origin depends on config.sortSearchByDistance)
    const urlQueryParams = pickSearchParamsOnly(
      searchInURL,
      listingExtendedDataConfig,
      defaultFiltersConfig,
      sortConfig
    );

    // Page transition might initially use values from previous search
    const urlQueryString = stringify(urlQueryParams);
    const paramsQueryString = stringify(
      pickSearchParamsOnly(
        searchParams,
        listingExtendedDataConfig,
        defaultFiltersConfig,
        sortConfig
      )
    );
    const searchParamsAreInSync = urlQueryString === paramsQueryString;

    const validQueryParams = validURLParamsForExtendedData(
      searchInURL,
      listingExtendedDataConfig,
      defaultFiltersConfig
    );

    const isKeywordSearch = isMainSearchTypeKeywords(config);
    const defaultFilters = isKeywordSearch
      ? defaultFiltersConfig.filter(f => f.key !== 'keywords')
      : defaultFiltersConfig;
    const groupConfigs = configs =>
      configs.reduce(
        (grouped, config) => {
          const [primary, secondary] = grouped;
          const { includeForProcessAliases, indexForSearch, searchPageConfig } = config;
          const isIndexed = indexForSearch === true;
          const isActiveProcess = includeForProcessAliases.every(p =>
            activeProcesses.includes(p.split('/')[0])
          );
          const isPrimary = searchPageConfig?.group === 'primary';
          return isActiveProcess && isIndexed && isPrimary
            ? [[...primary, config], secondary]
            : isActiveProcess && isIndexed
            ? [primary, [...secondary, config]]
            : grouped;
        },
        [[], []]
      );
    const [customPrimaryFilters, customSecondaryFilters] = groupConfigs(listingExtendedDataConfig);
    const availableFilters = [
      ...customPrimaryFilters,
      ...defaultFilters,
      ...customSecondaryFilters,
    ];

    // Selected aka active filters
    const selectedFilters = validFilterParams(
      validQueryParams,
      listingExtendedDataConfig,
      defaultFiltersConfig
    );
    const keysOfSelectedFilters = Object.keys(selectedFilters);
    const selectedFiltersCountForMobile = isKeywordSearch
      ? keysOfSelectedFilters.filter(f => f !== 'keywords').length
      : keysOfSelectedFilters.length;

    const hasPaginationInfo = !!pagination && pagination.totalItems != null;
    const totalItems =
      searchParamsAreInSync && hasPaginationInfo
        ? pagination.totalItems
        : pagination?.paginationUnsupported
        ? listings.length
        : 0;
    const listingsAreLoaded =
      !searchInProgress &&
      searchParamsAreInSync &&
      (hasPaginationInfo || pagination?.paginationUnsupported);

    const sortBy = mode => {
      const conflictingFilterActive = isAnyFilterActive(
        sortConfig.conflictingFilters,
        validQueryParams,
        listingExtendedDataConfig,
        defaultFiltersConfig
      );

      const mobileClassesMaybe =
        mode === 'mobile'
          ? {
              rootClassName: css.sortBy,
              menuLabelRootClassName: css.sortByMenuLabel,
            }
          : { className: css.sortByDesktop };
      return sortConfig.active ? (
        <SortBy
          {...mobileClassesMaybe}
          sort={validQueryParams[sortConfig.queryParamName]}
          isConflictingFilterActive={!!conflictingFilterActive}
          hasConflictingFilters={!!(sortConfig.conflictingFilters?.length > 0)}
          selectedFilters={selectedFilters}
          onSelect={this.handleSortBy}
          showAsPopup
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
      />
    );

    const { title, description, schema } = createSearchResultSchema(
      listings,
      searchInURL || {},
      intl
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
        <TopbarContainer
          className={topbarClasses}
          currentPage="SearchPage"
          currentSearchParams={urlQueryParams}
        />
        <div className={css.layoutWrapperContainer}>
          <aside className={css.layoutWrapperFilterColumn}>
            <div className={css.filterColumnContent}>
              {availableFilters.map(config => {
                return (
                  <FilterComponent
                    key={`SearchFiltersMobile.${config.key}`}
                    idPrefix="SearchFiltersMobile"
                    className={css.filter}
                    config={config}
                    urlQueryParams={urlQueryParams}
                    initialValues={this.initialValues}
                    getHandleChangedValueFn={this.getHandleChangedValueFn}
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

          <div className={css.layoutWrapperMain} role="main">
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
              >
                {availableFilters.map(config => {
                  return (
                    <FilterComponent
                      key={`SearchFiltersMobile.${config.key}`}
                      idPrefix="SearchFiltersMobile"
                      config={config}
                      urlQueryParams={validQueryParams}
                      initialValues={this.initialValues}
                      getHandleChangedValueFn={this.getHandleChangedValueFn}
                      liveEdit
                      showAsPopup={false}
                    />
                  );
                })}
              </SearchFiltersMobile>
              <MainPanelHeader
                className={css.mainPanel}
                sortByComponent={sortBy('desktop')}
                listingsAreLoaded={listingsAreLoaded}
                resultsCount={totalItems}
                searchInProgress={searchInProgress}
                searchListingsError={searchListingsError}
                noResultsInfo={noResultsInfo}
              />
              <div
                className={classNames(css.listings, {
                  [css.newSearchInProgress]: !listingsAreLoaded,
                })}
              >
                {searchListingsError ? (
                  <h2 className={css.error}>
                    <FormattedMessage id="SearchPage.searchError" />
                  </h2>
                ) : null}
                <SearchResultsPanel
                  className={css.searchListingsPanel}
                  listings={listings}
                  pagination={listingsAreLoaded ? pagination : null}
                  search={parse(location.search)}
                  isMapVariant={false}
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </Page>
    );
  }
}

SearchPageComponent.defaultProps = {
  listings: [],
  pagination: null,
  searchListingsError: null,
  searchParams: {},
  tab: 'listings',
  activeProcesses: config.custom.processes,
  listingExtendedDataConfig: config.custom.listingExtendedData,
  defaultFiltersConfig: config.custom.defaultFilters,
  sortConfig: config.custom.sortConfig,
};

SearchPageComponent.propTypes = {
  listings: array,
  onManageDisableScrolling: func.isRequired,
  pagination: propTypes.pagination,
  scrollingDisabled: bool.isRequired,
  searchInProgress: bool.isRequired,
  searchListingsError: propTypes.error,
  searchParams: object,
  tab: oneOf(['filters', 'listings', 'map']).isRequired,
  activeProcesses: array,
  listingExtendedDataConfig: propTypes.listingExtendedDataConfig,
  defaultFiltersConfig: propTypes.defaultFiltersConfig,
  sortConfig: propTypes.sortConfig,

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string.isRequired,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    currentPageResultIds,
    pagination,
    searchInProgress,
    searchListingsError,
    searchParams,
  } = state.SearchPage;
  const listings = getListingsById(state, currentPageResultIds);

  return {
    listings,
    pagination,
    scrollingDisabled: isScrollingDisabled(state),
    searchInProgress,
    searchListingsError,
    searchParams,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const SearchPage = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(SearchPageComponent);

export default SearchPage;
