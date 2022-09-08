import React from 'react';
import { bool, func, node, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './MainPanelHeader.module.css';

const MainPanelHeader = props => {
  const {
    rootClassName,
    className,
    children,
    sortByComponent,
    isSortByActive,
    listingsAreLoaded,
    resultsCount,
    searchInProgress,
    noResultsInfo,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <div className={css.searchOptions}>
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

MainPanelHeader.defaultProps = {
  rootClassName: null,
  className: null,
  resultsCount: null,
  searchInProgress: false,
  sortByComponent: null,
};

MainPanelHeader.propTypes = {
  rootClassName: string,
  className: string,
  listingsAreLoaded: bool.isRequired,
  resultsCount: number,
  searchInProgress: bool,
  sortByComponent: node,
};

export default MainPanelHeader;
