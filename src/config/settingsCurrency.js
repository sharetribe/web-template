// See: https://en.wikipedia.org/wiki/ISO_4217
// See: https://stripe.com/docs/currencies
export const stripeSupportedCurrencies = [
  'AUD',
  'BGN',
  'CAD',
  'CHF',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'INR',
  'JPY',
  'MXN',
  'NOK',
  'NZD',
  'PLN',
  'RON',
  'SEK',
  'SGD',
  'USD',
];

// Note: This template is designed to support currencies with subunit divisors of 100 or smaller.
// While currencies with larger subunit divisors (e.g., 1000, such as the Iraqi Dinar) could be supported,
// they are not currently compatible with the existing email templates, which assume a divisor of 100.
// If you add support for currencies with a subunit divisor of 1000, be sure to
// update the email templates to correctly format these currencies.
export const subUnitDivisors = {
  // Stripe supported currencies
  AUD: 100, // Australian dollar
  BGN: 100, // Bulgarian lev
  CAD: 100, // Canadian dollar
  CHF: 100, // Swiss franc
  CZK: 100, // Czech koruna
  DKK: 100, // Danish krone
  EUR: 100, // Euro
  GBP: 100, // British pound
  HKD: 100, // Hong Kong dollar
  INR: 100, // Indian rupee
  JPY: 1, // Japanese yen
  MXN: 100, // Mexican peso
  NOK: 100, // Norwegian krone
  NZD: 100, // New Zealand dollar
  PLN: 100, // Polish złoty
  RON: 100, // Romanian leu
  SEK: 100, // Swedish krona
  SGD: 100, // Singapore dollar
  USD: 100, // United States dollar
  // Not supported by Stripe
  AED: 100, // United Arab Emirates dirham
  AFN: 100, // Afghan afghani
  ALL: 100, // Albanian lek
  AMD: 100, // Armenian dram
  ANG: 100, // Netherlands Antillean guilder
  AOA: 100, // Angolan kwanza
  ARS: 100, // Argentine peso
  AWG: 100, // Aruban florin
  AZN: 100, // Azerbaijani manat
  BAM: 100, // Bosnia and Herzegovina convertible mark
  BBD: 100, // Barbadian dollar
  BDT: 100, // Bangladeshi taka
  BIF: 100, // Burundian franc
  BMD: 100, // Bermudian dollar
  BND: 100, // Brunei dollar
  BOB: 100, // Bolivian boliviano
  BRL: 100, // Brazilian real
  BSD: 100, // Bahamian dollar
  BTN: 100, // Bhutanese ngultrum
  BWP: 100, // Botswana pula
  BYN: 100, // Belarusian ruble
  BZD: 100, // Belize dollar
  CDF: 100, // Congolese franc
  CLP: 100, // Chilean peso
  CNY: 10, // Renminbi
  COP: 100, // Colombian peso
  CRC: 100, // Costa Rican colón
  CUP: 100, // Cuban peso
  CVE: 100, // Cape Verdean escudo
  DJF: 100, // Djiboutian franc
  DOP: 100, // Dominican peso
  DZD: 100, // Algerian dinar
  EGP: 100, // Egyptian pound
  ERN: 100, // Eritrean nakfa
  ETB: 100, // Ethiopian birr
  FJD: 100, // Fijian dollar
  FKP: 100, // Falkland Islands pound
  GEL: 100, // Georgian lari
  GHS: 100, // Ghanaian cedi
  GIP: 100, // Gibraltar pound
  GMD: 100, // Gambian dalasi
  GNF: 100, // Guinean franc
  GTQ: 100, // Guatemalan quetzal
  GYD: 100, // Guyanese dollar
  HNL: 100, // Honduran lempira
  HTG: 100, // Haitian gourde
  HUF: 100, // Hungarian forint
  IDR: 100, // Indonesian rupiah
  ILS: 100, // Israeli new shekel
  IRR: 1, // Iranian rial
  ISK: 100, // Icelandic króna
  JMD: 100, // Jamaican dollar
  JOD: 100, // Jordanian dinar
  KES: 100, // Kenyan shilling
  KGS: 100, // Kyrgyz som
  KHR: 100, // Cambodian riel
  KMF: 100, // Comorian franc
  KPW: 100, // North Korean won
  KRW: 100, // South Korean won
  KYD: 100, // Cayman Islands dollar
  KZT: 100, // Kazakhstani tenge
  LAK: 100, // Lao kip
  LBP: 100, // Lebanese pound
  LKR: 100, // Sri Lankan rupee
  LRD: 100, // Liberian dollar
  LSL: 100, // Lesotho loti
  MAD: 100, // Moroccan dirham
  MDL: 100, // Moldovan leu
  MKD: 100, // Macedonian denar
  MMK: 100, // Burmese kyat
  MNT: 100, // Mongolian tögrög
  MOP: 100, // Macanese pataca
  MUR: 100, // Mauritian rupee
  MVR: 100, // Maldivian rufiyaa
  MWK: 100, // Malawian kwacha
  MYR: 100, // Malaysian ringgit
  MZN: 100, // Mozambican metical
  NAD: 100, // Namibian dollar
  NGN: 100, // Nigerian naira
  NIO: 100, // Nicaraguan córdoba
  NPR: 100, // Nepalese rupee
  PAB: 100, // Panamanian balboa
  PEN: 100, // Peruvian sol
  PGK: 100, // Papua New Guinean kina
  PHP: 100, // Philippine peso
  PKR: 100, // Pakistani rupee
  PYG: 100, // Paraguayan guaraní
  QAR: 100, // Qatari riyal
  RSD: 100, // Serbian dinar
  RUB: 100, // Russian ruble
  RWF: 100, // Rwandan franc
  SAR: 100, // Saudi riyal
  SBD: 100, // Solomon Islands dollar
  SCR: 100, // Seychellois rupee
  SDG: 100, // Sudanese pound
  SHP: 100, // Saint Helena pound
  SLE: 100, // Sierra Leonean leone
  SOS: 100, // Somali shilling
  SRD: 100, // Surinamese dollar
  SSP: 100, // South Sudanese pound
  STN: 100, // São Tomé and Príncipe dobra
  SYP: 100, // Syrian pound
  SZL: 100, // Swazi lilangeni
  THB: 100, // Thai baht
  TJS: 100, // Tajikistani somoni
  TMT: 100, // Turkmenistani manat
  TOP: 100, // Tongan paʻanga
  TRY: 100, // Turkish lira
  TTD: 100, // Trinidad and Tobago dollar
  TWD: 100, // New Taiwan dollar
  TZS: 100, // Tanzanian shilling
  UAH: 100, // Ukrainian hryvnia
  UGX: 1, // Ugandan shilling
  UYU: 100, // Uruguayan peso
  UZS: 100, // Uzbekistani sum
  VED: 100, // Venezuelan digital bolívar
  VES: 100, // Venezuelan sovereign bolívar
  VND: 10, // Vietnamese đồng
  VUV: 100, // Vanuatu vatu
  WST: 100, // Samoan tālā
  XAF: 100, // Central African CFA franc
  XCD: 100, // Eastern Caribbean dollar
  XOF: 100, // West African CFA franc
  XPF: 100, // CFP franc
};

/**
 * Currency formatting options.
 * See: https://github.com/yahoo/react-intl/wiki/API#formatnumber
 *
 * @param {string} currency
 */
export const currencyFormatting = (currency, options) => {
  const { enforceSupportedCurrencies = true } = options || {};
  if (enforceSupportedCurrencies && !subUnitDivisors[currency]) {
    const currencies = Object.keys(subUnitDivisors);
    throw new Error(
      `Configuration missing for currency: ${currency}. Supported currencies: ${currencies.join(
        ', '
      )}.`
    );
  }

  return subUnitDivisors[currency] === 1
    ? {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
        useGrouping: true,
        // If the currency is not using subunits (like JPY), remove fractions.
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    : {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
        useGrouping: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };
};
