import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'become-a-host-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { becomePage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
