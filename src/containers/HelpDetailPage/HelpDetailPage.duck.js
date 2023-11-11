import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'help-detail-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { helpDetail: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
