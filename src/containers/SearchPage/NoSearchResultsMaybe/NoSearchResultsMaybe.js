import React from 'react';
import { FormattedMessage } from '../../../util/reactIntl';
import css from './NoSearchResultsMaybe.module.css';

const NoSearchResultsMaybe = props => {
  const { listingsAreLoaded, totalItems, location, resetAll } = props;
  const hasNoResult = listingsAreLoaded && totalItems === 0;
  const hasSearchParams = location.search?.length > 0;
  return hasNoResult ? (
    <div className={css.noSearchResults}>
      <FormattedMessage id="SearchPage.noResults" />
      <br />
      {hasSearchParams ? (
        <button className={css.resetAllFiltersButton} onClick={e => resetAll(e)}>
          <FormattedMessage id={'SearchPage.resetAllFilters'} />
        </button>
      ) : null}
    </div>
  ) : null;
};

export default NoSearchResultsMaybe;
