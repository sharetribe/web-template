import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'booking-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { bookingPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
