import * as stripe from './stripeConfig';
import * as listing from './listingConfig';
import * as search from './searchConfig';
import * as maps from './mapsConfig';
import * as transaction from './transactionConfig';

// NOTE: only expose configuration that should be visible in the
// client side, don't add any server secrets in this file.
const defaultConfig = {

  // Canonical root url is the root or domain, where this app is currently running
  // It is needed in social media sharing and SEO optimization purposes and SSO etc.
  // It should be in environment variables (on localhost 'yarn run config' or edit .env file)
  canonicalRootURL: process.env.REACT_APP_CANONICAL_ROOT_URL,

  // Marketplace currency.
  // The currency used in the Marketplace must be in ISO 4217 currency code. For example USD, EUR, CAD, AUD, etc. The default value is USD.
  // It should match one of the currencies listed in currencySettings.js
  currency: 'USD',

  // Listing minimum price in currency sub units, e.g. cents.
  // 0 means no restriction to the price
  listingMinimumPriceSubUnits: 0,

  // Site title is needed in meta tags (bots and social media sharing reads those)
  siteTitle: 'Biketribe',

  // Facebook page is used in SEO schema (http://schema.org/Organization)
  siteFacebookPage: '@sharetribe',
  // Instagram page is used in SEO schema (http://schema.org/Organization)
  siteInstagramPage: 'https://www.instagram.com/sharetribe/',
  // Twitter handle is needed in meta tags (twitter:site). Start it with '@' character
  siteTwitterHandle: 'https://www.facebook.com/Sharetribe/',

  // Modify Stripe configuration in stripeConfig.js
  // - picks REACT_APP_STRIPE_PUBLISHABLE_KEY from environment variables
  // - dayCountAvailableForBooking: Stripe can hold payments only limited time on Connect Account
  //                                This adds some restriction for bookings (payouts vs long bookings)
  // - defaultMCC: sets Default Merchant Category Code
  // - supportedCountries
  stripe,

  // Modify listing extended data in listingConfig.js
  listing,
  // Modify search settings data in searchConfig.js
  search,
  // Modify settings for map providers in mapsConfig.js
  maps,
  // Modify order types in transactionConfig.js
  transaction,

  // Note: Facebook app id is also used for tracking:
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
    firstDayOfWeek: 0,
  },

  layout: {
    // There are 2 SearchPage variants that can be used:
    // 'map' & 'list'
    searchPageVariant: 'list',

    // ListingPage has 2 layout options: 'hero-image' and 'full-image'.
    // - 'hero-image' means a layout where there's a hero section with cropped image in the beginning of the page
    // - 'full-image' shows image carousel, where listing images are shown with the original aspect ratio
    listingPageVariant: 'full-image',

    listingImage: {
      // Aspect ratio for listing image variants
      aspectWidth: 400,
      aspectHeight: 400,
      // Listings have custom image variants, which are named here.
      variantPrefix: 'listing-card',
    },
  },

  // CDN assets for the app. Configurable through Flex Console.
  // Currently, only translation.json is available.
  // Note: the path must match the path defined in Asset Delivery API
  appCdnAssets: {
    translations: 'content/translations.json',
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
