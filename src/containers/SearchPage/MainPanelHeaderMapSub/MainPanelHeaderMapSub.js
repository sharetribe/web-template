import React from 'react';
import { bool, func, node, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import SearchFiltersPrimary from '../SearchFiltersPrimary/SearchFiltersPrimary';
import FilterComponent from '../FilterComponent';


import css from './MainPanelHeaderMapSub.module.css';

const MainPanelHeaderMapSub = props => {
  const {
    intl,
    rootClassName,
    className,
    children,
    sortByComponent,
    isSortByActive,
    listingsAreLoaded,
    resultsCount,
    searchInProgress,
    noResultsInfo,
    propsForSecondaryFiltersToggle,
    availablePrimaryFilters,
    marketplaceCurrency,
    initialValues,
    getHandleChangedValueFn,
    contentPlacementOffset,
    validQueryParams
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
    <div className={css.searchResultSummary}>
        <span className={css.resultsFound}>
          {searchInProgress ? (
            <FormattedMessage id="MainPanelHeader.loadingResults" />
          ) : (
            <FormattedMessage
              id="MainPanelHeader.foundResults"
              values={{ count: resultsCount }}
            />
          )}
        </span>
      </div>
      <div className={css.searchOptions}>
        <SearchFiltersPrimary {...propsForSecondaryFiltersToggle}>
          {availablePrimaryFilters.map(config => {
            return (
              <FilterComponent
                key={`SearchFiltersPrimary.${config.key}`}
                idPrefix="SearchFiltersPrimary"
                config={config}
                marketplaceCurrency={marketplaceCurrency}
                urlQueryParams={validQueryParams}
                initialValues={initialValues}
                getHandleChangedValueFn={getHandleChangedValueFn}
                intl={intl}
                showAsPopup
                contentPlacementOffset={contentPlacementOffset}
              />
            );
          })}
        </SearchFiltersPrimary>
        {isSortByActive ? (
          <div className={css.sortyByWrapper}>
            <span className={css.sortyBy}>
              <FormattedMessage id="MainPanelHeader.sortBy" />
            </span>
            {sortByComponent}
          </div>
        ) : null}
      </div>

      {children}

      {noResultsInfo ? noResultsInfo : null}
    </div>
  );
};

MainPanelHeaderMapSub.defaultProps = {
  rootClassName: null,
  className: null,
  resultsCount: null,
  searchInProgress: false,
  sortByComponent: null,
};

MainPanelHeaderMapSub.propTypes = {
  rootClassName: string,
  className: string,
  listingsAreLoaded: bool.isRequired,
  resultsCount: number,
  searchInProgress: bool,
  sortByComponent: node,
};

export default MainPanelHeaderMapSub;
