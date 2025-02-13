import {
  LISTING_GRID_DEFAULTS,
  LISTING_TAB_TYPES,
  LISTING_TABS_PRODUCT_CATEGORIES,
} from '../../util/types';

function getSearch(category, listingType = LISTING_TAB_TYPES.PRODUCT) {
  let secondaryFilter = '';
  switch (listingType) {
    case LISTING_TAB_TYPES.PORTFOLIO:
      secondaryFilter = 'pub_listingId';
      break;

    case LISTING_TAB_TYPES.PRODUCT:
    default:
      secondaryFilter = 'pub_categoryLevel1';
      break;
  }
  const params = new URLSearchParams();
  params.set(secondaryFilter, category);
  params.set('pub_listingType', listingType);
  return params.toString();
}

export const getLinks = (listings, currentListingType) => {
  switch (currentListingType) {
    case LISTING_TAB_TYPES.PORTFOLIO: {
      return listings.map(listing => ({
        id: listing.id.uuid,
        name: 'ManageListingsPage',
        displayText: listing.attributes.title,
        to: { search: getSearch(listing.id.uuid, currentListingType) },
      }));
    }
    case LISTING_TAB_TYPES.PRODUCT:
    default: {
      const listingTypeCategories = LISTING_TABS_PRODUCT_CATEGORIES;
      return listingTypeCategories.map(category => ({
        id: category.id,
        name: 'ManageListingsPage',
        displayText: category.name,
        to: { search: getSearch(category.id, currentListingType) },
      }));
    }
  }
};

export const getItems = (listings, currentListingType, currentListingId) => {
  switch (currentListingType) {
    case LISTING_TAB_TYPES.PORTFOLIO: {
      const selectedListing = listings.find(listing => listing.id.uuid === currentListingId);
      const withImaged = selectedListing?.images && selectedListing?.images.length > 0;
      if (!withImaged) {
        return [];
      }
      return selectedListing.images.map(image => {
        let imgWithTitle = { ...image };
        imgWithTitle.attributes.title = selectedListing?.attributes?.title;
        return imgWithTitle;
      });
    }
    case LISTING_TAB_TYPES.PRODUCT:
    default: {
      return listings;
    }
  }
};

export const getCurrentCategory = (listings, currentListingType, queryParams) => {
  switch (currentListingType) {
    case LISTING_TAB_TYPES.PORTFOLIO: {
      const defaultCategoryType = LISTING_GRID_DEFAULTS.CATEGORY(listings);
      return queryParams.pub_listingId || (defaultCategoryType ? defaultCategoryType.uuid : null);
    }
    case LISTING_TAB_TYPES.PRODUCT:
    default: {
      const defaultCategoryType = LISTING_GRID_DEFAULTS.CATEGORY(LISTING_TABS_PRODUCT_CATEGORIES);
      return queryParams.pub_categoryLevel1 || defaultCategoryType;
    }
  }
};

export function routeHandler(createManageLocatorString) {
  function updateProductRoute() {
    const queryParams = {
      pub_listingType: LISTING_TAB_TYPES.PRODUCT,
      pub_categoryLevel1: LISTING_GRID_DEFAULTS.CATEGORY(LISTING_TABS_PRODUCT_CATEGORIES),
      page: 1,
    };
    createManageLocatorString(queryParams);
  }

  function updatePortfolioRoute(listingId) {
    const queryParams = {
      pub_listingType: LISTING_TAB_TYPES.PORTFOLIO,
      ...(listingId ? { pub_listingId: listingId } : {}),
      page: 1,
    };
    createManageLocatorString(queryParams);
  }

  return {
    updateProductRoute,
    updatePortfolioRoute,
  };
}
