import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'policy-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { policyPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
