import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const TOS_ASSET_NAME = 'terms-of-service';
export const PRIVACY_POLICY_ASSET_NAME = 'privacy-policy';

export const loadData = (params, search) => dispatch => {
  const pageAsset = {
    termsOfService: `content/pages/${TOS_ASSET_NAME}.json`,
    privacyPolicy: `content/pages/${PRIVACY_POLICY_ASSET_NAME}.json`,
  };
  return dispatch(fetchPageAssets(pageAsset, true));
};
