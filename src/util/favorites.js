import { createResourceLocatorString } from './routes';

export const handleToggleFavorites = parameters => async isFavorite => {
  const { onFetchCurrentUser, routes, location, history } = parameters;
  const currentUser = await onFetchCurrentUser();
  // Only allow signed-in users to save favorites
  if (!currentUser || Object.keys(currentUser).length === 0) {
    const state = {
      from: `${location.pathname}${location.search}${location.hash}`,
    };
    // Sign up and return back to the listing page.
    history.push(createResourceLocatorString('SignupPage', routes, {}, {}), state);
  } else {
    const { listingId, listingType, onUpdateFavorites } = parameters;
    const {
      attributes: { profile },
    } = currentUser;
    const { privateData } = profile;
    const favorites = privateData?.favorites;
    const categoryFavorites = favorites?.[listingType];
    const noPrivateData = !privateData;
    const noFavorites = !favorites;
    const noFavoritesCategory = !categoryFavorites;
    let payload;
    if (noPrivateData || noFavorites) {
      payload = {
        privateData: {
          favorites: {
            [listingType]: [listingId],
          },
        },
      };
    } else if (noFavoritesCategory) {
      payload = {
        privateData: {
          favorites: {
            ...favorites,
            [listingType]: [listingId],
          },
        },
      };
    } else {
      if (isFavorite) {
        payload = {
          privateData: {
            favorites: {
              ...favorites,
              [listingType]: categoryFavorites.filter(f => f !== listingId),
            },
          },
        };
      } else {
        payload = {
          privateData: {
            favorites: {
              ...favorites,
              [listingType]: [...categoryFavorites, listingId],
            },
          },
        };
      }
    }
    onUpdateFavorites(payload);
  }
};
