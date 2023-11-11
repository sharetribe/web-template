import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'blog-article-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { blogArticlePage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
