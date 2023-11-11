import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'helpcenter-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { helpCenterPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
