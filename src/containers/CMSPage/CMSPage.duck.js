import { createSlice } from '@reduxjs/toolkit';
import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { denormalizeAssetData } from '../../util/data';

export const avHeroSecionId = 'av-hero';
export const avPriceSelectorSecionId = 'av-price-selector';

// Asset path for pricing plans JSON in Sharetribe hosted assets.
// Create this asset in Console > Content > Assets.
// See README.md for the expected JSON schema.
const PRICING_PLANS_ASSET_PATH = 'content/pricing-plans.json';

// ================ Slice ================ //

const cmsPageSlice = createSlice({
  name: 'CMSPage',
  initialState: {
    pricingPlansData: null,
  },
  reducers: {
    setPricingPlansData(state, action) {
      state.pricingPlansData = action.payload;
    },
  },
});

export const { setPricingPlansData } = cmsPageSlice.actions;
export default cmsPageSlice.reducer;

// ================ Thunks ================ //

export const loadData = (params, search) => (dispatch, getState, sdk) => {
  const pageId = params.pageId;

  // Fetch the CMS page asset (required)
  const pageFetch = dispatch(fetchPageAssets({ [pageId]: `content/pages/${pageId}.json` }, false));

  // Fetch the pricing plans asset (optional).
  // This uses the SDK directly to avoid the race condition in fetchPageAssets
  // when multiple dispatches run concurrently. The data is stored in the
  // CMSPage's own slice rather than hostedAssets.
  const version = getState()?.hostedAssets?.version;
  const fetchAsset =
    version != null
      ? path => sdk.assetByVersion({ path, version })
      : path => sdk.assetByAlias({ path, alias: 'latest' });

  const pricingFetch = fetchAsset(PRICING_PLANS_ASSET_PATH)
    .then(response => {
      const data = denormalizeAssetData(response.data);
      dispatch(setPricingPlansData(data));
    })
    .catch(() => {
      // Asset doesn't exist yet — fall back to intl-based pricing.
      // This is expected until the asset is created in Console.
    });

  return Promise.all([pageFetch, pricingFetch]);
};
