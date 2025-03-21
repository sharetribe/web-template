import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './MainPanelHeader.module.css';

/**
 * MainPanelHeader component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {React.Node} props.children - The children
 * @param {React.Node} props.sortByComponent - The sort by component
 * @param {boolean} props.isSortByActive - Whether the sort by is active
 * @param {boolean} props.listingsAreLoaded - Whether the listings are loaded
 * @param {number} props.resultsCount - The results count
 * @param {boolean} props.searchInProgress - Whether the search is in progress
 * @param {React.Node} props.noResultsInfo - The no results info
 * @returns {JSX.Element}
 */
const MainPanelHeader = props => {
  const {
    rootClassName,
    className,
    children,
    sortByComponent,
    isSortByActive,
    listingsAreLoaded,
    resultsCount,
    searchInProgress = false,
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

export default MainPanelHeader;
