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
  - Besides custom extended data fields, listing's extended data can also contain other extra data.
  - Most notable ones are:
    - transactionType
    - transactionProcessAlias
    - unitType
- **[configSearch.js](./configSearch.js)**
  - mainSearchType, default filters, sort, etc.
- **[configMaps.js](./configMaps.js)**
  - mapProvider config, location search config (also in defaultLocationSearchesConfig.js)
- **[configStripe.js](./configStripe.js)**
  - Stripe publishable key, day count available for booking, default merchant categry code
- **[configTransaction.js](./configTransaction.js)**
  - transactionType (preset for supported transaction config combinations)

### Default listing field: **_transactionType_**

Transaction type is a custom set of configurations related to transactions. Transaction type defines
which process, alias, unit type, showStock, etc. It is saved to the listing's public data. In the
future, we are going to allow marketplace operators to define these presets through Console.

### Default listing field: **_transactionProcessAlias_**

The transaction is initiated with _transactionProcessAlias_, which is a string with the format:
`process-name/alias`.

Essentially, transactionProcessAlias is a contract between _listing_, existing processes in the
_marketplace environment_, and the _client app_. If the client app supports process name and alias
saved to the listing's extended data (_src/util/transaction.js_), it assumes that its own codebase
is capable to render transaction-related UIs for that listing - and it expects that process with the
same name is also created in connected marketplace environment on Flex backend.

A developer/customizer is therefore responsible for keeping these 3 things in sync. If a process is
added/discarded/edited on the Flex backend, the client app also needs to be updated and listings
might need to be updated (which can be made with Integration API).

### Default listing field: **_unitType_**

The unit type's main functionality is to work as a pricing unit. Changing unit type should always
also mean that pricing needs to be updated.

Some processes could support multiple unit types. E.g. booking process supports _day_, _night_, and
_hour_.

We recommend that you don't use the same unit types with different processes. By default, the
_"item"_ is for the product selling process; and _"day"_, _"night"_, and _"hour"_ are for the
booking process.

### [src/util/configHelpers.js](../util/configHelpers.js)

The src/util/configHelpers.js contains functions that validate some of the configurations. The most
important function there is **mergeConfig**, which is used on _src/app.js_ to merge possible config
assets and defaultConfigs.js

## [settings.js](./settings.js)

These contain variables that are baked into the app on build time. This one imports currencySettings
too.

## Search only listings that are supported by transaction type

SearchPage can restrict search results to listings with valid transactionType. Validity is defined
by transactionTypes array in _configTransaction.js_.

However, it only works if you have set 'enum' type search schema for the following public data
field: **_transactionType_**.

You could even extend that validation to

- transactionProcessAlias
- unitType

If you have set the search schema for those public data fields, you can turn
`enforceValidTransactionType` config to true in [configTransaction.js](./configTransaction.js) file.

Read More:

- [Manage search schemas with Flex CLI](https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas)
- [SearchPage.duck.js](../containers/SearchPage/SearchPage.duck.js)
