/* Stripe related configuration.

NOTE: REACT_APP_STRIPE_PUBLISHABLE_KEY is mandatory environment variable.
This variable is set in a hidden file: .env
To make Stripe connection work, you also need to set Stripe's private key in the Sharetribe Console.
*/

export const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// A maximum number of days forwards during which a booking can be made.
// This is limited due to Stripe holding funds up to 90 days from the
// moment they are charged. However, US accounts can hold funds up to 2 years.
// https://docs.stripe.com/connect/manual-payouts
//
// If your marketplace is for US only, you should also be aware that available
// time slots can only be fetched for 366 days into the future.
// https://www.sharetribe.com/api-reference/marketplace.html#query-time-slots
export const dayCountAvailableForBooking = 90;

/**
 * Default merchant category code (MCC)
 * MCCs are used to classify businesses by the type of goods or services they provide.
 *
 * In this template, we use code 5734 Computer Software Stores as a default for all the connected accounts.
 *
 * See the whole list of MCC codes from https://stripe.com/docs/connect/setting-mcc#list
 */
export const defaultMCC = '5734';

/*
Stripe only supports payments in certain countries, see full list
at https://stripe.com/global

You can find the bank account formats from https://stripe.com/docs/connect/payouts-bank-accounts
*/

export const supportedCountries = [
  {
    //Australia
    code: 'AU',
    currency: 'AUD',
    accountConfig: {
      bsb: true,
      accountNumber: true,
    },
  },
  {
    // Austria
    code: 'AT',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Belgium
    code: 'BE',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    //Bulgraia
    code: 'BG',
    currency: 'BGN',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Canada
    code: 'CA',
    currency: 'CAD',
    accountConfig: {
      transitNumber: true,
      institutionNumber: true,
      accountNumber: true,
    },
  },
  {
    //Cyprus
    code: 'CY',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    //	Czech Republic
    code: 'CZ',
    currency: 'CZK',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Denmark
    code: 'DK',
    currency: 'DKK',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Estionia
    code: 'EE',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Finland
    code: 'FI',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // France
    code: 'FR',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Germany
    code: 'DE',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Greece
    code: 'GR',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Hong Kong
    code: 'HK',
    currency: 'HKD',
    accountConfig: {
      clearingCode: true,
      branchCode: true,
      accountNumber: true,
    },
  },
  {
    // Ireland
    code: 'IE',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Italy
    code: 'IT',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Japan
    code: 'JP',
    currency: 'JPY',
    accountConfig: {
      bankName: true,
      branchName: true,
      bankCode: true,
      branchCode: true,
      accountNumber: true,
      accountOwnerName: true,
    },
  },
  {
    // Latvia
    code: 'LV',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Lithuania
    code: 'LT',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Luxembourg
    code: 'LU',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Malta
    code: 'MT',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Mexico
    code: 'MX',
    currency: 'MXN',
    accountConfig: {
      clabe: true,
    },
  },
  {
    // Netherlands
    code: 'NL',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // New Zealand
    code: 'NZ',
    currency: 'NZD',
    accountConfig: {
      accountNumber: true,
    },
  },
  {
    // Norway
    code: 'NO',
    currency: 'NOK',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Poland
    code: 'PL',
    currency: 'PLN',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Portugal
    code: 'PT',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Romania
    code: 'RO',
    currency: 'RON',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Singapore
    code: 'SG',
    currency: 'SGD',
    accountConfig: {
      bankCode: true,
      branchCode: true,
      accountNumber: true,
    },
  },
  {
    // Slovakia
    code: 'SK',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Slovenia
    code: 'SI',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Spain
    code: 'ES',
    currency: 'EUR',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Sweden
    code: 'SE',
    currency: 'SEK',
    accountConfig: {
      iban: true,
    },
  },
  {
    // Switzerland
    code: 'CH',
    currency: 'CHF',
    accountConfig: {
      iban: true,
    },
  },
  {
    // United Kingdom
    code: 'GB',
    currency: 'GBP',
    accountConfig: {
      sortCode: true,
      accountNumber: true,
    },
  },
  {
    // United States
    code: 'US',
    currency: 'USD',
    accountConfig: {
      routingNumber: true,
      accountNumber: true,
    },
  },
];
