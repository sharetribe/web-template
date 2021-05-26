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
    listingsAreLoaded,
    resultsCount,
    searchInProgress,
  } = props;

  const hasNoResult = listingsAreLoaded && resultsCount === 0;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <div className={css.searchOptions}>
        {listingsAreLoaded ? (
          <div className={css.searchResultSummary}>
            <span className={css.resultsFound}>
              <FormattedMessage
                id="MainPanelHeader.foundResults"
                values={{ count: resultsCount }}
              />
            </span>
          </div>
        ) : null}
        <div className={css.sortyByWrapper}>
          <span className={css.sortyBy}>
            <FormattedMessage id="MainPanelHeader.sortBy" />
          </span>
          {sortByComponent}
        </div>
      </div>

      {children}

      {hasNoResult ? (
        <div className={css.noSearchResults}>
          <FormattedMessage id="MainPanelHeader.noResults" />
        </div>
      ) : null}

      {searchInProgress ? (
        <div className={css.loadingResults}>
          <FormattedMessage id="MainPanelHeader.loadingResults" />
        </div>
      ) : null}
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
