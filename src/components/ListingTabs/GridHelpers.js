import React from 'react';

import { FormattedMessage } from '../../util/reactIntl';
import { LISTING_TYPES, LISTING_GRID_ROLE } from '../../util/types';

import { H3, PaginationLinks } from '../';

import css from './ListingTabs.module.css';

export function getTabsFeaturesForRole(role) {
  switch (role) {
    case LISTING_GRID_ROLE.FAVORITE:
      return {
        enableCategoryTabs: false,
        enableListingManagement: false,
        pageName: 'FavoriteListingsPage',
        tabs: [
          { key: LISTING_TYPES.PRODUCT, label: 'Shop'},
          { key: LISTING_TYPES.PROFILE, label: 'Creatives'},
        ]
      };
    case LISTING_GRID_ROLE.PROFILE:
      return {
        enableCategoryTabs: true,
        enableListingManagement: true,
        pageName: 'ManageListingsPage',
        tabs: [
          { key: LISTING_TYPES.PRODUCT, label: 'Shop' },
          { key: LISTING_TYPES.PORTFOLIO, label: 'Portfolio' },
        ]
      };
    case LISTING_GRID_ROLE.MANAGE:
    default:
      return {
        enableCategoryTabs: true,
        enableListingManagement: true,
        pageName: 'ManageListingsPage',
        tabs: [
          { key: LISTING_TYPES.PRODUCT, label: 'Shop' },
          { key: LISTING_TYPES.PORTFOLIO, label: 'Portfolio' },
        ]
      };
  }
}

export function getSearch(category, listingType = LISTING_TYPES.PRODUCT) {
  const params = new URLSearchParams();
  params.set('pub_categoryLevel1', category);
  params.set('pub_listingType', listingType);
  return params.toString();
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
