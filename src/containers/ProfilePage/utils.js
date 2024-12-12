import {
  LISTING_GRID_DEFAULTS,
  LISTING_TAB_TYPES,
  LISTING_TABS_PRODUCT_CATEGORIES,
  REVIEW_TYPE_OF_PROVIDER,
  REVIEW_TYPE_OF_CUSTOMER,
} from '../../util/types';

function getSearch(category, listingType = LISTING_TAB_TYPES.PRODUCT) {
  let secondaryFilter = '';
  switch (listingType) {
    case LISTING_TAB_TYPES.REVIEWS:
      secondaryFilter = 'reviewsTab';
      break;
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

export const getLinks = (userId, listings, currentListingType, reviewTabsLabels) => {
  switch (currentListingType) {
    case LISTING_TAB_TYPES.REVIEWS: {
      return [
        {
          id: REVIEW_TYPE_OF_PROVIDER,
          name: 'ProfilePage',
          displayText: reviewTabsLabels.ofProvider,
          to: { search: getSearch(REVIEW_TYPE_OF_PROVIDER, currentListingType) },
          params: { id: userId },
        },
        {
          id: REVIEW_TYPE_OF_CUSTOMER,
          name: 'ProfilePage',
          displayText: reviewTabsLabels.ofCustomer,
          to: { search: getSearch(REVIEW_TYPE_OF_CUSTOMER, currentListingType) },
          params: { id: userId },
        },
      ];
    }
    case LISTING_TAB_TYPES.PROFILE: {
      return [];
    }
    case LISTING_TAB_TYPES.PORTFOLIO: {
      return listings.map(listing => ({
        id: listing.id.uuid,
        name: 'ProfilePage',
        displayText: listing.attributes.title,
        to: { search: getSearch(listing.id.uuid, currentListingType) },
        params: { id: userId },
      }));
    }
    case LISTING_TAB_TYPES.PRODUCT:
    default: {
      const listingTypeCategories = LISTING_TABS_PRODUCT_CATEGORIES;
      return listingTypeCategories.map(category => ({
        id: category.id,
        name: 'ProfilePage',
        displayText: category.name,
        to: { search: getSearch(category.id, currentListingType) },
        params: { id: userId },
      }));
    }
  }
};

export const getItems = (
  listings,
  currentListingType,
  currentCategory,
  creativeProfile,
  reviews
) => {
  switch (currentListingType) {
    case LISTING_TAB_TYPES.REVIEWS: {
      const parsedReviews = reviews.filter(r => r.attributes.type === currentCategory);
      return [...(!!parsedReviews ? [true] : [])];
    }
    case LISTING_TAB_TYPES.PROFILE: {
      return [...(!!creativeProfile ? [creativeProfile] : [])];
    }
    case LISTING_TAB_TYPES.PORTFOLIO: {
      const selectedListing = listings.find(listing => listing.id.uuid === currentCategory);
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
    case LISTING_TAB_TYPES.REVIEWS: {
      const defaultCategoryType = REVIEW_TYPE_OF_PROVIDER;
      return queryParams.reviewsTab || defaultCategoryType;
    }
    case LISTING_TAB_TYPES.PROFILE: {
      return null;
    }
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
    };
    createManageLocatorString(queryParams);
  }
  function updatePortfolioRoute(listingId) {
    const queryParams = {
      pub_listingType: LISTING_TAB_TYPES.PORTFOLIO,
      ...(listingId ? { pub_listingId: listingId } : {}),
    };
    createManageLocatorString(queryParams);
  }
  function updateReviewsRoute() {
    const queryParams = {
      pub_listingType: LISTING_TAB_TYPES.REVIEWS,
      reviewsTab: REVIEW_TYPE_OF_PROVIDER,
    };
    createManageLocatorString(queryParams);
  }
  function updateProfileRoute() {
    const queryParams = {
      pub_listingType: LISTING_TAB_TYPES.PROFILE,
    };
    createManageLocatorString(queryParams);
  }
  return {
    updateProductRoute,
    updatePortfolioRoute,
    updateReviewsRoute,
    updateProfileRoute,
  };
}

export const getMessageIds = currentListingType => {
  switch (currentListingType) {
    case LISTING_TAB_TYPES.REVIEWS: {
      return {
        noResultsMessageId: 'ProfilePage.noReviews',
        loadingMessageId: 'ProfilePage.loadingReviews',
      };
    }
    case LISTING_TAB_TYPES.PROFILE: {
      return {
        noResultsMessageId: 'ProfilePage.noResults',
        loadingMessageId: 'ProfilePage.loadingProfile',
      };
    }
    case LISTING_TAB_TYPES.PORTFOLIO:
    case LISTING_TAB_TYPES.PRODUCT:
    default: {
      return {
        noResultsMessageId: 'ProfilePage.noResults',
        loadingMessageId: 'ProfilePage.loadingListings',
      };
    }
  }
};

export const getQueryStatus = (
  currentListingType,
  creativeProfileQueryStatus,
  listingQueryStatus,
  reviewsQueryStatus
) => {
  switch (currentListingType) {
    case LISTING_TAB_TYPES.REVIEWS: {
      return reviewsQueryStatus;
    }
    case LISTING_TAB_TYPES.PROFILE: {
      return creativeProfileQueryStatus;
    }
    case LISTING_TAB_TYPES.PORTFOLIO:
    case LISTING_TAB_TYPES.PRODUCT:
    default: {
      return listingQueryStatus;
    }
  }
};
