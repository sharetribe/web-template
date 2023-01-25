import * as stripe from './configStripe';
import * as listing from './configListing';
import * as search from './configSearch';
import * as maps from './configMaps';
import * as branding from './configBranding';
import * as layout from './configLayout';

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
  currency: 'USD',

  // Listing minimum price in currency sub units, e.g. cents.
  // 0 means no restriction to the price
  // Note: Stripe does have minimum fee that depends on country, currency, etc.
  listingMinimumPriceSubUnits: 500,

  // Marketplace name is needed for microcopy and in meta tags (bots and social media sharing reads those)
  marketplaceName: 'Biketribe',

  // Modify Stripe configuration in stripeConfig.js
  // - picks REACT_APP_STRIPE_PUBLISHABLE_KEY from environment variables
  // - dayCountAvailableForBooking: Stripe can hold payments only limited time on Connect Account
  //                                This adds some restriction for bookings (payouts vs long bookings)
  // - defaultMCC: sets Default Merchant Category Code
  // - supportedCountries
  stripe,

  // Modify listing extended data and listing type in listingConfig.js
  listing,
  // Modify search settings data in searchConfig.js
  search,
  // Modify settings for map providers in mapsConfig.js
  // This includes also default locations for location search
  maps,
  // Modify branding configs in brandingConfig.js
  branding,
  // Modify layout configs in layoutConfig.js
  layout,

  // TODO: Footer configuration will come from hosted assets at some point,
  //       but, at the moment, it needs to be customized directly in
  //       src/components/Footer/

  // Note: Facebook app id is used for Facebook login, but it is also used for tracking:
  // Facebook counts shares with app or page associated by this id
  // Currently it is unset, but you can read more about fb:app_id from
  // https://developers.facebook.com/docs/sharing/webmasters#basic
  // You should create one to track social sharing in Facebook
  facebookAppId: process.env.REACT_APP_FACEBOOK_APP_ID,

  // If you want to change the language, remember to also change the
  // locale data and the messages in the app.js file.
  localization: {
    locale: 'en',
    // First day of week
    // 0: Sunday
    // 1: Monday
    // ...
    // 6: Saturday
    firstDayOfWeek: 1,
  },

  // CDN assets for the app. Configurable through Flex Console.
  // Currently, only translation.json is available.
  // Note: the path must match the path defined in Asset Delivery API
  appCdnAssets: {
    translations: 'content/translations.json',
  },

  // Optional
  // Online presence of the same organization:
  // Facebook page is used in SEO schema (http://schema.org/Organization)
  siteFacebookPage: null, // e.g. '@sharetribe',
  // Instagram page is used in SEO schema (http://schema.org/Organization)
  siteInstagramPage: null, // e.g. 'https://www.instagram.com/sharetribe/',
  // Twitter handle is needed in meta tags (twitter:site). Start it with '@' character
  siteTwitterHandle: null, // e.g. 'https://www.facebook.com/Sharetribe/',

  // Optional
  // Note that Google Analytics might need advanced opt-out option / cookie consent
  // depending on jurisdiction (e.g. EU countries), since it relies on cookies.
  googleAnalyticsId: process.env.REACT_APP_GOOGLE_ANALYTICS_ID,

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
