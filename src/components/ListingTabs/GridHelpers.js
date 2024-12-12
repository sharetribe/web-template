import React from 'react';

import { FormattedMessage } from '../../util/reactIntl';
import { LISTING_TAB_TYPES, LISTING_GRID_ROLE } from '../../util/types';

import { H3, PaginationLinks } from '../';

import css from './ListingTabs.module.css';

export function getTabsFeaturesForRole(role, hideReviews) {
  switch (role) {
    case LISTING_GRID_ROLE.FAVORITE:
      return {
        enableCategoryTabs: false,
        enableListingManagement: false,
        pageName: 'FavoriteListingsPage',
        tabs: [
          { key: LISTING_TAB_TYPES.PRODUCT, label: 'Shop' },
          { key: LISTING_TAB_TYPES.PROFILE, label: 'Creatives' },
        ],
      };
    case LISTING_GRID_ROLE.PROFILE:
      return {
        enableCategoryTabs: true,
        enableListingManagement: false,
        pageName: 'ManageListingsPage',
        tabs: [
          { key: LISTING_TAB_TYPES.PRODUCT, label: 'Shop' },
          { key: LISTING_TAB_TYPES.PORTFOLIO, label: 'Portfolio' },
          { key: LISTING_TAB_TYPES.PROFILE, label: 'About' },
          ...(hideReviews ? [] : [{ key: LISTING_TAB_TYPES.REVIEWS, label: 'Reviews' }]),
        ],
      };
    case LISTING_GRID_ROLE.MANAGE:
    default:
      return {
        enableCategoryTabs: true,
        enableListingManagement: true,
        pageName: 'ManageListingsPage',
        tabs: [
          { key: LISTING_TAB_TYPES.PRODUCT, label: 'Shop' },
          { key: LISTING_TAB_TYPES.PORTFOLIO, label: 'Portfolio' },
        ],
      };
  }
}

export const Loader = ({ messageId }) => {
  return (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id={messageId} />
      </H3>
    </div>
  );
};

export const Error = ({ messageId }) => {
  return (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id={messageId} />
      </H3>
    </div>
  );
};

export const Pagination = ({ pageName, pageSearchParams, pagination }) => {
  return (
    <PaginationLinks
      className={css.pagination}
      pageName={pageName}
      pageSearchParams={pageSearchParams}
      pagination={pagination}
    />
  );
};
