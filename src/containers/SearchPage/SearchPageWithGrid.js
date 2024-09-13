import React, { Component } from 'react';
import { array, bool, func, oneOf, object, shape, string, arrayOf } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { useHistory, useLocation } from 'react-router-dom';
import omit from 'lodash/omit';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import { useIntl, intlShape, FormattedMessage } from '../../util/reactIntl';
import {
  isAnyFilterActive,
  isMainSearchTypeKeywords,
  isOriginInUse,
  getQueryParamNames,
} from '../../util/search';
import {
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
  parse,
} from '../../util/urlHelpers';
import { createResourceLocatorString } from '../../util/routes';
import { propTypes } from '../../util/types';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
} from '../../util/errors';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';

import { H3, H5, NamedRedirect, Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import {
  groupListingFieldConfigs,
  initialValues,
  searchParamsPicker,
  validUrlQueryParamsFromProps,
  validFilterParams,
  cleanSearchFromConflictingParams,
  createSearchResultSchema,
  pickListingFieldFilters,
  omitLimitedListingFieldParams,
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
    const { history, routeConfiguration, config } = this.props;
    const { listingFields: listingFieldsConfig } = config?.listing || {};
    const { defaultFilters: defaultFiltersConfig } = config?.search || {};

    const urlQueryParams = validUrlQueryParamsFromProps(this.props);
    const filterQueryParamNames = getQueryParamNames(listingFieldsConfig, defaultFiltersConfig);

    // Reset state
    this.setState({ currentQueryParams: {} });

    // Reset routing params
    const queryParams = omit(urlQueryParams, filterQueryParamNames);
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams));
  }

  getHandleChangedValueFn(useHistoryPush) {
    const { history, routeConfiguration, config } = this.props;
    const { listingFields: listingFieldsConfig } = config?.listing || {};
    const { defaultFilters: defaultFiltersConfig, sortConfig } = config?.search || {};
    const listingCategories = config.categoryConfiguration.categories;
    const filterConfigs = {
      listingFieldsConfig,
      defaultFiltersConfig,
      listingCategories,
    };

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
          currentQueryParams: omitLimitedListingFieldParams(
            {
              ...mergedQueryParams,
              ...updatedURLParams,
              ...keywordsMaybe,
              address,
              bounds,
            },
            filterConfigs
          ),
        };
      };

      const callback = () => {
        if (useHistoryPush) {
          const searchParams = this.state.currentQueryParams;
          const search = cleanSearchFromConflictingParams(searchParams, filterConfigs, sortConfig);
          history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, search));
        }
      };

      this.setState(updater, callback);
    };
  }

  handleSortBy(urlParam, values) {
    const { history, routeConfiguration } = this.props;
    const urlQueryParams = validUrlQueryParamsFromProps(this.props);

    const queryParams = values
      ? { ...urlQueryParams, [urlParam]: values }
      : omit(urlQueryParams, urlParam);

    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams));
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
      location,
      onManageDisableScrolling,
      pagination,
      scrollingDisabled,
      searchInProgress,
      searchListingsError,
      searchParams,
      routeConfiguration,
      config,
    } = this.props;

    const { listingFields } = config?.listing || {};
    const { defaultFilters: defaultFiltersConfig, sortConfig } = config?.search || {};
    const activeListingTypes = config?.listing?.listingTypes.map(config => config.listingType);
    const marketplaceCurrency = config.currency;
    const categoryConfiguration = config.categoryConfiguration;
    const listingCategories = categoryConfiguration.categories;
    const listingFieldsConfig = pickListingFieldFilters({
      listingFields,
      locationSearch: location.search,
      categoryConfiguration,
    });
    const filterConfigs = {
      listingFieldsConfig,
      defaultFiltersConfig,
      listingCategories,
    };

    // Page transition might initially use values from previous search
    // urlQueryParams doesn't contain page specific url params
    // like mapSearch, page or origin (origin depends on config.maps.search.sortSearchByDistance)
    const { searchParamsAreInSync, urlQueryParams, searchParamsInURL } = searchParamsPicker(
      location.search,
      searchParams,
      filterConfigs,
      sortConfig,
      isOriginInUse(config)
    );
    const validQueryParams = urlQueryParams;

    const isKeywordSearch = isMainSearchTypeKeywords(config);
    const builtInPrimaryFilters = defaultFiltersConfig.filter(f =>
      ['categoryLevel'].includes(f.key)
    );
    const builtInFilters = isKeywordSearch
      ? defaultFiltersConfig.filter(f => !['keywords', 'categoryLevel'].includes(f.key))
      : defaultFiltersConfig.filter(f => !['categoryLevel'].includes(f.key));
    const [customPrimaryFilters, customSecondaryFilters] = groupListingFieldConfigs(
      listingFieldsConfig,
      activeListingTypes
    );
    const availableFilters = [
      ...builtInPrimaryFilters,
      ...customPrimaryFilters,
      ...builtInFilters,
      ...customSecondaryFilters,
    ];

    // Selected aka active filters
    const selectedFilters = validQueryParams;
    const isValidDatesFilter =
      searchParamsInURL.dates == null ||
      (searchParamsInURL.dates != null && searchParamsInURL.dates === selectedFilters.dates);
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
      !!(hasPaginationInfo || pagination?.paginationUnsupported);

    const conflictingFilterActive = isAnyFilterActive(
      sortConfig.conflictingFilters,
      validQueryParams,
      filterConfigs
    );
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
      searchParamsInURL || {},
      intl,
      routeConfiguration,
      config
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
                return (
                  <FilterComponent
                    key={key}
                    idPrefix="SearchFiltersDesktop"
                    className={css.filter}
                    config={filterConfig}
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
                {availableFilters.map(filterConfig => {
                  const key = `SearchFiltersMobile.${filterConfig.scope || 'built-in'}.${
                    filterConfig.key
                  }`;

                  return (
                    <FilterComponent
                      key={key}
                      idPrefix="SearchFiltersMobile"
                      config={filterConfig}
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
                {searchListingsError ? (
                  <H3 className={css.error}>
                    <FormattedMessage id="SearchPage.searchError" />
                  </H3>
                ) : null}
                {!isValidDatesFilter ? (
                  <H5>
                    <FormattedMessage id="SearchPage.invalidDatesFilter" />
                  </H5>
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
        <FooterContainer />
      </Page>
    );
  }
}

SearchPageComponent.defaultProps = {
  listings: [],
  pagination: null,
  searchListingsError: null,
  searchParams: {},
};

SearchPageComponent.propTypes = {
  listings: array,
  onManageDisableScrolling: func.isRequired,
  pagination: propTypes.pagination,
  scrollingDisabled: bool.isRequired,
  searchInProgress: bool.isRequired,
  searchListingsError: propTypes.error,
  searchParams: object,

  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
  // from useLocation
  location: shape({
    search: string.isRequired,
  }).isRequired,

  // from useIntl
  intl: intlShape.isRequired,

  // from useConfiguration
  config: object.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

const EnhancedSearchPage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  const searchListingsError = props.searchListingsError;
  if (isForbiddenError(searchListingsError)) {
    // This can happen if private marketplace mode is active
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  const { currentUser, ...restOfProps } = props;
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const hasNoViewingRightsUser = currentUser && !hasPermissionToViewData(currentUser);
  const hasUserPendingApprovalError = isErrorUserPendingApproval(searchListingsError);
  const hasNoViewingRightsError = isErrorNoViewingPermission(searchListingsError);

  if ((isPrivateMarketplace && isUnauthorizedUser) || hasUserPendingApprovalError) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (hasNoViewingRightsUser || hasNoViewingRightsError) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  }

  return (
    <SearchPageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      location={location}
      {...restOfProps}
    />
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    currentPageResultIds,
    pagination,
    searchInProgress,
    searchListingsError,
    searchParams,
  } = state.SearchPage;
  const listings = getListingsById(state, currentPageResultIds);

  return {
    currentUser,
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
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EnhancedSearchPage);

export default SearchPage;
