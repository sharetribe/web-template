import * as stripe from './configStripe';
import * as listing from './configListing';
import * as search from './configSearch';
import * as maps from './configMaps';
import * as branding from './configBranding';
import * as layout from './configLayout';
import * as analytics from './configAnalytics';
import * as user from './configUser';

// NOTE: only expose configuration that should be visible in the
// client side, don't add any server secrets to this file.
const defaultConfig = {
  // Marketplace root url is the root or domain, where this app is currently running
  // It is needed in social media sharing and SEO optimization purposes and SSO etc.
  // It should be in environment variables (on localhost 'yarn run config' or edit .env file)
  marketplaceRootURL: process.env.REACT_APP_MARKETPLACE_ROOT_URL,

  // Marketplace currency.
  // The currency used in the Marketplace must be in ISO 4217 currency code. For example USD, EUR, CAD, AUD, etc. The default value is USD.
  // It should match one of the currencies listed in currencySettings.js
  // Note: The currency comes from localization asset nowadays by default.
  //       To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeCurrency func)
  currency: 'USD',

  // Listing minimum price in currency sub units, e.g. cents.
  // By default, always try to take the value of listingMinimumPriceSubUnits from the transaction-size.json asset.
  // - If there is no value, we use the value set on this file for listingMinimumPriceSubUnits
  // - If the value is 0, we use the value set on this file for listingMinimumPriceSubUnits
  //   This is due to backward compatibility
  // Note 1: 0 means no restriction to the price (Currently, Console won't show it.)
  // Note 2: To use only this built-in configuration, you need to remove the overwrite from configHelper.js (mergeConfig func)
  // Note 3: Stripe does have a minimum fee that depends on country, currency, etc!
  listingMinimumPriceSubUnits: 500,

  // Marketplace name is needed for microcopy (aka marketplace texts) and in meta tags (bots and social media sharing reads those)
  marketplaceName: process.env.REACT_APP_MARKETPLACE_NAME || 'Biketribe',

  // Modify Stripe configuration in configStripe.js
  // - picks REACT_APP_STRIPE_PUBLISHABLE_KEY from environment variables
  // - dayCountAvailableForBooking: Stripe can hold payments only limited time on Connect Account
  //                                This adds some restriction for bookings (payouts vs long bookings)
  // - defaultMCC: sets Default Merchant Category Code
  // - supportedCountries
  stripe,

  // Modify listing extended data and listing type in configListing.js
  listing,

  user,
  // Modify search settings data in configSearch.js
  search,
  // Modify settings for map providers in configMaps.js
  // This includes also default locations for location search
  maps,
  // Modify branding configs in configBranding.js
  branding,
  // Modify layout configs in configLayout.js
  layout,
  // Modify analytics configs in configAnalytics.js
  // By default, it doesn't add anything.
  analytics,

  // Note: Facebook app id is used for Facebook login, but it is also used for tracking:
  // Facebook counts shares with app or page associated by this id
  // Currently it is unset, but you can read more about fb:app_id from
  // https://developers.facebook.com/docs/sharing/webmasters#basic
  // You should create one to track social sharing in Facebook
  facebookAppId: process.env.REACT_APP_FACEBOOK_APP_ID,

  // If you want to change the language, remember to also change the
  // locale data and the messages in the app.js file.
  // Note: The localization comes from localization asset nowadays by default.
  //       To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeLocalizations func)
  localization: {
    locale: 'en-US',
    // First day of week
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo#return_value
    // 1: Monday
    // ...
    // 6: Saturday
    // 7: Sunday
    firstDayOfWeek: 1,
  },

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
    userTypes: '/users/user-types.json',
    userFields: '/users/user-fields.json',
    categories: '/listings/listing-categories.json',
    listingTypes: '/listings/listing-types.json',
    listingFields: '/listings/listing-fields.json',
    search: '/listings/listing-search.json',
    transactionSize: '/transactions/minimum-transaction-size.json',
    analytics: '/integrations/analytics.json',
    googleSearchConsole: '/integrations/google-search-console.json',
    maps: '/integrations/map.json',
    // These assets are not yet editable through Console.
    // However, Sharetribe onboarding might generate them.
    // You could still rely on built-in variables and comment these out.
    localization: '/general/localization.json',
    accessControl: '/general/access-control.json',
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
  // This creates meta tag for Google Search Console verification
  // I.e. <meta name=“google-site-verification” content=“GOOGLE_SITE_VERIFICATION_TOKEN”/>
  // Note: The googleSearchConsole comes from googleSearchConsole asset nowadays by default.
  //       To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeConfig func)
  googleSearchConsole: {
    googleSiteVerification: null, // Add google-site-verification token as a string
  },

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
