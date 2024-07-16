import { fetchPageAssets } from "../../ducks/hostedAssets.duck";

export const ASSET_NAME = "landing-page";

/**
 * @param {*} [params]
 * @param {*} [search]
 */
export const loadData = () => (dispatch) => {
	const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
	return dispatch(fetchPageAssets(pageAsset, true));
};
