import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

export const avHeroSecionId = 'av-hero';

export const loadData = (params, search) => dispatch => {
  const pageId = params.pageId;
  const pageAsset = { [pageId]: `content/pages/${pageId}.json` };
  const hasFallbackContent = false;
  return dispatch(fetchPageAssets(pageAsset, hasFallbackContent));
};
