/**
 * Which hosted assets this app fetches on full page load.
 *
 * Paths must match Asset Delivery API. If you drop a hosted asset and
 * rely on built-in defaults (or custom code) instead, remove that entry here.
 *
 * Also exposed on `defaultConfig.appCdnAssets` after merge.
 */
const appCdnAssets = {
  translations: '/content/translations.json',
  footer: '/content/footer.json',
  topbar: '/content/top-bar.json',
  branding: '/design/branding.json',
  layout: '/design/layout.json',
  localization: '/general/localization.json',
  accessControl: '/general/access-control.json',
  userTypes: '/users/user-types.json',
  userFields: '/users/user-fields.json',
  categories: '/listings/listing-categories.json',
  listingTypes: '/listings/listing-types.json',
  listingFields: '/listings/listing-fields.json',
  search: '/listings/listing-search.json',
  minimumTransactionSize: '/transactions/minimum-transaction-size.json',
  analytics: '/integrations/analytics.json',
  googleSearchConsole: '/integrations/google-search-console.json',
  maps: '/integrations/map.json',
  // NOTE: we don't fetch commission configuration here but on the server-side
};

export default appCdnAssets;
