import defaultLocationSearches from './defaultLocationSearchesConfig';
import * as stripe from './stripeConfig';
import * as listing from './defaultListingConfig';
import * as search from './defaultSearchConfig';
import * as transaction from './defaultTransactionConfig';

// Should search results be ordered by distance to origin.
// NOTE 1: This doesn't affect if the main search type is 'keywords'
// NOTE 2: If this is set to true add parameter 'origin' to every location in default-location-searches.js
//         Without the 'origin' parameter, search will not work correctly
// NOTE 3: Keyword search and ordering search results by distance can't be used at the same time. You can turn keyword
//         search off by removing keyword filter config from filters array in marketplace-custom-config.js
const sortSearchByDistance = false;

// Listing management type. Currently only 'stock' is supported.
//
// With the default 'stock', availability and bookings are not used, and
// listings have a specific numeric stock.
//
// TODO: this is only used on SearchPage and there the value be decided based on available transaction configs
//       (if bookings are used or not).
const listingManagementType = 'availability'; // 'stock'

// A maximum number of days forwards during which a booking can be made.
// This is limited due to Stripe holding funds up to 90 days from the
// moment they are charged. Also note that available time slots can only
// be fetched for 180 days in the future.
const dayCountAvailableForBooking = 90;

// Marketplace currency.
// The currency used in the Marketplace must be in ISO 4217 currency code. For example USD, EUR, CAD, AUD, etc. The default value is USD.
// It should match one of the currencies listed in currencySettings.js
const currency = 'USD';

// Listing minimum price in currency sub units, e.g. cents.
// 0 means no restriction to the price
const listingMinimumPriceSubUnits = 0;

// Canonical root url is needed in social media sharing and SEO optimization purposes.
const canonicalRootURL = process.env.REACT_APP_CANONICAL_ROOT_URL;

// Site title is needed in meta tags (bots and social media sharing reads those)
const siteTitle = 'Sneakertime';

// Twitter handle is needed in meta tags (twitter:site). Start it with '@' character
const siteTwitterHandle = '@sharetribe';

// Instagram page is used in SEO schema (http://schema.org/Organization)
const siteInstagramPage = 'https://www.instagram.com/sharetribe/';

// Facebook page is used in SEO schema (http://schema.org/Organization)
const siteFacebookPage = 'https://www.facebook.com/Sharetribe/';

// Social logins & SSO

// Note: Facebook app id is also used for tracking:
// Facebook counts shares with app or page associated by this id
// Currently it is unset, but you can read more about fb:app_id from
// https://developers.facebook.com/docs/sharing/webmasters#basic
// You should create one to track social sharing in Facebook
const facebookAppId = process.env.REACT_APP_FACEBOOK_APP_ID;

const maps = {
  mapboxAccessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
  googleMapsAPIKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,

  // Choose map provider: 'MAPBOX', 'GOOGLE_MAPS'
  // Note: you need to have REACT_APP_MAPBOX_ACCESS_TOKEN or REACT_APP_GOOGLE_MAPS_API_KEY
  //       set depending on which one you use in this config.
  mapProvider: 'MAPBOX',

  // The location search input can be configured to show default
  // searches when the user focuses on the input and hasn't yet typed
  // anything. This reduces typing and avoids too many Geolocation API
  // calls for common searches.
  search: {
    // When enabled, the first suggestion is "Current location" that
    // uses the browser Geolocation API to query the user's current
    // location.
    suggestCurrentLocation: true,

    // Distance in meters for calculating the bounding box around the
    // current location.
    currentLocationBoundsDistance: 1000,

    // This affects location search.
    // Example location can be edited in the
    // `defaultLocationSearchesConfig.js` file.
    defaults: defaultLocationSearches || [],

    // Limit location autocomplete to a one or more countries
    // using ISO 3166 alpha 2 country codes separated by commas.
    // If you want to limit the autocomplete, uncomment this value:
    // countryLimit: ['AU'],
  },

  // When fuzzy locations are enabled, coordinates on maps are
  // obfuscated randomly around the actual location.
  //
  // NOTE: This only hides the locations in the UI level, the actual
  // coordinates are still accessible in the HTTP requests and the
  // Redux store.
  fuzzy: {
    enabled: false,

    // Amount of maximum offset in meters that is applied to obfuscate
    // the original coordinates. The actual value is random, but the
    // obfuscated coordinates are withing a circle that has the same
    // radius as the offset.
    offset: 500,

    // Default zoom level when showing a single circle on a Map. Should
    // be small enough so the whole circle fits in.
    defaultZoomLevel: 13,

    // Color of the circle on the Map component.
    circleColor: '#c0392b',
  },
};

// NOTE: only expose configuration that should be visible in the
// client side, don't add any server secrets in this file.
const defaultConfig = {
  listingManagementType,

  // CDN assets for the app. Configurable through Flex Console.
  // Currently, only translation.json is available.
  // Note: the path must match the path defined in Asset Delivery API
  appCdnAssets: {
    translations: 'content/translations.json',
  },
  // Modify Stripe configuration in stripeConfig.js
  // - picks REACT_APP_STRIPE_PUBLISHABLE_KEY from environment variables
  // - dayCountAvailableForBooking: Stripe can hold payments only limited time on Connect Account
  //                                This adds some restriction for bookings (payouts vs long bookings)
  // - defaultMCC: sets Default Merchant Category Code
  // - supportedCountries
  stripe,

  // If you want to change the language, remember to also change the
  // locale data and the messages in the app.js file.
  localization: {
    locale: 'en',
    i18n: {
      /*
        0: Sunday
        1: Monday
        ...
        6: Saturday
      */
      firstDayOfWeek: 0,
    },
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
  listing,
  search,
  transaction,
  dayCountAvailableForBooking,
  sortSearchByDistance,
  currency,
  listingMinimumPriceSubUnits,
  },
  canonicalRootURL, // TODO

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
  siteTitle,
  siteFacebookPage,
  siteInstagramPage,
  siteTwitterHandle,
  facebookAppId,
  maps,
  custom,
};

export default defaultConfig;
