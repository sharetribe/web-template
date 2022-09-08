import * as stripe from './stripeConfig';
import * as listing from './defaultListingConfig';
import * as search from './defaultSearchConfig';
import * as maps from './defaultMapConfig';
import * as transaction from './defaultTransactionConfig';


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

  // Modify settings for map providers in defaultMapConfig.js
  maps,
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
  custom,
};

export default defaultConfig;
