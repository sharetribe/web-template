import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'blog-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { blogPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
