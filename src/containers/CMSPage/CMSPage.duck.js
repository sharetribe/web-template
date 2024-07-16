import { fetchPageAssets } from "../../ducks/hostedAssets.duck";

// (params, search) => (dispatch) => ...
export const loadData = (params) => (dispatch) => {
	const pageId = params.pageId;
	const pageAsset = { [pageId]: `content/pages/${pageId}.json` };
	const hasFallbackContent = false;
	return dispatch(fetchPageAssets(pageAsset, hasFallbackContent));
};
