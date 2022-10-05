# Configuration options

The 2 main files here are **defaultConfig.js** and **appSettings.js**.

## [configDefault.js](./configDefault.js)

These configurations are saved to React Context and therefore they could be overwritten through
configs received from Asset Delivery API.

Some of the content is splitted to separate files:

- **[configBranding.js](./configBranding.js)**
  - marketplaceColor, logo, etc.
- **[configLayout.js](./configLayout.js)**
  - layout for search and listing page
- **[configListing.js](./configListing.js)**
  - Extended data config (also used for enabling search filters)
- **[configSearch.js](./configSearch.js)**
  - mainSearchType, default filters, sort, etc.
- **[configMaps.js](./configMaps.js)**
  - mapProvider config, location search config (also in defaultLocationSearchesConfig.js)
- **[configStripe.js](./configStripe.js)**
  - Stripe publishable key, day count available for booking, default merchant categry code
- **[configTransaction.js](./configTransaction.js)**
  - transactionType (preset for supported transaction config combinations)

### [src/util/configHelpers.js](../util/configHelpers.js)

The src/util/configHelpers.js contains functions that validate some of the configurations. The most
important function there is **mergeConfig**, which is used on _src/app.js_ to merge possible config
assets and defaultConfigs.js

## [settings.js](./settings.js)

These contain variables that are baked into the app on build time. This one imports currencySettings
too.

## Search only listings that are supported by transaction type

SearchPage tries to restrict search results to listings with valid transactionType, process/alias,
and unitType. Validity is defined by transactionTypes array in _configTransaction.js_.

However, it only works if you have set 'enum' type search schema for the public data fields:

- transactionType
- transactionProcessAlias
- unitType

Read More:

- [Manage search schemas with Flex CLI](https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas)
- [SearchPage.duck.js](../containers/SearchPage/SearchPage.duck.js)
