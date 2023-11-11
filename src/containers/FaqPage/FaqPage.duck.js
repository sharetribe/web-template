import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'faq-page';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { faqPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
