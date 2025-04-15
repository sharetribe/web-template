import React from 'react';
import { FormattedMessage } from '../../../util/reactIntl';
import { isCreativeSellerApproved } from '../../../util/userHelpers';
import { NamedLink } from '../../../components';
import { BASE_CREATE_LISTING_SEARCH_QUERY_PARAMS } from '../../TopbarContainer/Topbar/TopbarDesktop/CustomLinksMenu/PriorityLinks';

import css from './NoSearchResultsMaybe.module.css';

const NoSearchResultsMaybe = props => {
  const { currentUser, listingsAreLoaded, totalItems, location, resetAll } = props;
  const hasNoResult = listingsAreLoaded && totalItems === 0;
  const hasSearchParams = location.search?.length > 0;
  const isSeller = isCreativeSellerApproved(currentUser?.attributes?.profile);

  return hasNoResult ? (
    <div className={css.noSearchResults}>
      <FormattedMessage id="SearchPage.noResults" />
      <br />

      {hasSearchParams ? (
        <button className={css.resetAllFiltersButton} onClick={e => resetAll(e)}>
          <FormattedMessage id={'SearchPage.resetAllFilters'} />
        </button>
      ) : null}

      {isSeller && (
        <p>
          <NamedLink
            name="ManageListingsPage"
            to={{ search: BASE_CREATE_LISTING_SEARCH_QUERY_PARAMS }}
            className={css.createListingLink}
          >
            <FormattedMessage id="SearchPage.yourListingsLink" />
          </NamedLink>
        </p>
      )}
    </div>
  ) : null;
};

export default NoSearchResultsMaybe;
