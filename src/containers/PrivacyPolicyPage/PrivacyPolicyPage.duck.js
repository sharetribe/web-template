import { fetchPageAssets } from "../../ducks/hostedAssets.duck";

export const ASSET_NAME = "privacy-policy";

/**
 * @param {*} [params]
 * @param {*} [search]
 */
export const loadData = () => (dispatch) => {
	const pageAsset = { privacyPolicy: `content/pages/${ASSET_NAME}.json` };
	return dispatch(fetchPageAssets(pageAsset, true));
};
