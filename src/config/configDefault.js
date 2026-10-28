import * as stripe from './stripe/defaultStripe';
import * as listing from './listing/defaultListing';
import * as search from './search/defaultSearch';
import * as maps from './maps/defaultMaps';
import * as branding from './branding/defaultBranding';
import * as layout from './layout/defaultLayout';
import * as analytics from './analytics/defaultAnalytics';
import * as googleSearchConsole from './googleSearchConsole/defaultGoogleSearchConsole';
import * as accessControl from './accessControl/defaultAccessControl';
import * as localization from './localization/defaultLocalization';
import * as user from './user/defaultUser';
import * as categoryConfiguration from './categoryConfiguration/defaultCategoryConfiguration';

// NOTE: only expose configuration that should be visible in the
// client side, don't add any server secrets to this file.
const defaultConfig = {
  // Marketplace root url is the root or domain, where this app is currently running
  // It is needed in social media sharing and SEO optimization purposes and SSO etc.
  // It should be in environment variables (on localhost 'yarn run config' or edit .env file)
  marketplaceRootURL: process.env.REACT_APP_MARKETPLACE_ROOT_URL,

  // Marketplace currency.
  // The currency used in the Marketplace must be in ISO 4217 currency code. For example USD, EUR, etc.
  // It must be a key in settingsCurrency.subUnitDivisors.
  // Note: The currency comes from localization asset nowadays by default.
  //       I.e. this setting is not in use anymore.
  // (see localization/localization.js).
  currency: 'USD',

  // Listing minimum price in currency sub units, e.g. cents.
  // Derived in mergeConfig from config.transaction.listingMinimumPrice (minimumTransactionSize asset).
  // - If there is no value, we use the value set on this file for listingMinimumPriceSubUnits
  // - If the value is 0, we use the value set on this file for listingMinimumPriceSubUnits
  //   This is due to backward compatibility
  // Note 1: 0 means no restriction to the price (Currently, Console won't show it.)
  // Note 2: To use only this built-in configuration, omit/ignore the hosted minimumTransactionSize asset
  //         (see transaction/transaction.js + getListingMinimumPriceSubUnits in mergeConfig).
  // Note 3: Stripe does have a minimum fee that depends on country, currency, etc!
  listingMinimumPriceSubUnits: 500,

  // Marketplace name is needed for microcopy (aka marketplace texts) and in meta tags (bots and social media sharing reads those)
  marketplaceName: process.env.REACT_APP_MARKETPLACE_NAME || '[Marketplace Name]',

  // Modify Stripe configuration in stripe/defaultStripe.js
  // - picks REACT_APP_STRIPE_PUBLISHABLE_KEY from environment variables
  // - dayCountAvailableForBooking: Stripe can hold payments only limited time on Connect Account
  //                                This adds some restriction for bookings (payouts vs long bookings)
  // - defaultMCC: sets Default Merchant Category Code
  // - supportedCountries
  stripe,

  // Modify listing extended data and listing type in listing/defaultListing.js
  listing,

  user,
  // Modify search settings data in search/defaultSearch.js
  search,
  // Modify settings for map providers in maps/defaultMaps.js
  // This includes also default locations for location search
  maps,
  // Modify branding configs in branding/defaultBranding.js
  branding,
  // Modify layout configs in layout/defaultLayout.js
  layout,
  // Modify analytics configs in analytics/defaultAnalytics.js
  // By default, it doesn't add anything.
  analytics,
  // Modify category tree in categoryConfiguration/defaultCategoryConfiguration.js
  // Hosted listing-categories.json takes priority when present.
  categoryConfiguration,

  // Modify Google Search Console configs in hosted asset
  // or built-in defaults in googleSearchConsole/defaultGoogleSearchConsole.js
  googleSearchConsole,

  // Modify access control in hosted asset or accessControl/defaultAccessControl.js
  // (private marketplace, file upload/download disabled)
  accessControl,

  // Modify localization in hosted asset (or built-in defaults in localization/defaultLocalization.js)
  // (locale, firstDayOfWeek)
  // Note: The currency elevates to top-level config.currency
  localization,

  // Note: Facebook app id is used for Facebook login, but it is also used for tracking:
  // Facebook counts shares with app or page associated by this id
  // Currently it is unset, but you can read more about fb:app_id from
  // https://developers.facebook.com/docs/sharing/webmasters#basic
  // You should create one to track social sharing in Facebook
  facebookAppId: process.env.REACT_APP_FACEBOOK_APP_ID,

  // CDN assets for the app. Configurable through Sharetribe Console.
  // Note 1: The path must match the path defined in Asset Delivery API
  // Note 2: If you customize the app and rely on custom code instead of a config assets,
  //         you should remove the unnecessary config asset from this list.
  appCdnAssets: {
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
  },

  // Optional
  // Online presence of the same organization:
  // Facebook page is used in SEO schema (http://schema.org/Organization)
  siteFacebookPage: null, // e.g. 'https://www.facebook.com/Sharetribe/',
  // Instagram page is used in SEO schema (http://schema.org/Organization)
  siteInstagramPage: null, // e.g. 'https://www.instagram.com/sharetribe/',
  // Twitter handle is needed in meta tags (twitter:site). Start it with '@' character
  siteTwitterHandle: null, // e.g. '@sharetribe',

  // Optional
  // Address information is used in SEO schema for Organization (http://schema.org/PostalAddress)
  // Note: Google doesn't recognize this:
  // https://developers.google.com/search/docs/advanced/structured-data/logo#structured-data-type-definitions
  address: {
    addressCountry: null, // 'FI',
    addressRegion: null, // 'Helsinki',
    postalCode: null, // '00130',
    streetAddress: null, // 'Erottajankatu 19 B',
  },
};

export default defaultConfig;
