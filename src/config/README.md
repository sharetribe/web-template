# Configuration options

The 2 main files here are **configDefault.js** and **settings.js**.

## [configDefault.js](./configDefault.js)

These configurations are saved to React Context and therefore they could be overwritten through
configs received from Asset Delivery API. The merging of hosted configs and these defaults happen in
_src/util/configHelpers.js_

Some of the content is splitted to separate files:

- **[configBranding.js](./configBranding.js)**
  - marketplaceColor, logo, etc.
- **[configLayout.js](./configLayout.js)**
  - layout for search and listing page
- **[configListing.js](./configListing.js)**
  - Extended data config (also used for enabling search filters)
  - Listing type (listingType) config
  - Besides custom extended data fields, listing's extended data can also contain other extra data.
  - Most notable ones are:
    - listingType
    - transactionProcessAlias
    - unitType
- **[configSearch.js](./configSearch.js)**
  - mainSearchType, default filters, sort, etc.
- **[configMaps.js](./configMaps.js)**
  - mapProvider config, location search config (also in defaultLocationSearchesConfig.js)
- **[configStripe.js](./configStripe.js)**
  - Stripe publishable key, day count available for booking, default merchant categry code

### Hosted app configs

This template assumes that certain configurations are set through Console. Those configs are then
retrieved through Asset Delivery API. The _configDefault.js_ has a property called **appCdnAssets**,
which defines those app-wide configs. It's taken into use in 2 places: _src/index.js_ (CSR) and
_server/dataLoader.js_ (SSR).

The data loading sequence works like this:

1. Fetch app-wide configs
   1. Extract translations and other configs
   2. Pass those as hostedTranslations and hostedConfig to the App
   3. src/app.js then saves those to the correct React Contexts
2. Page-specific data loading calls
3. Render the App

Server-side Rendering (SSR) makes the Asset Delivery API call with the "latest" alias. The version
of the retrieved assets is saved to the Redux store. Then client-side rendering (CSR) uses that
specific version instead of the alias. (The `yarn run dev` script uses the "latest" alias as it
doesn't run SSR.)

Provider commission is separately fetched when line-items are created for custom pricing. There are
3 server routes that use those:

- _/api/transaction-line-items_
- _/api/initiate-privileged_
- _/api/transition-privileged_

### Default listing field: **_listingType_**

Listing type is a custom set of configurations related to listing. It includes _type_, _label_,
_showStock_, and _transactionType_. Transaction type is a similar concept. It defines which process,
alias, unit type, etc. are releavant for each transaction entity. The **type** string of listing
type is saved to the listing's public data together with the **transaction process alias**, and
**unit type**. In addition, _transactionType_ data is saved to transaction's protected data. In the
future, we are going to allow marketplace operators to define listing type presets through Console.

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
important function there is **mergeConfig**, which is used on _src/app.js_ to merge hosted config
assets and defaultConfigs.js

## [settings.js](./settings.js)

These contain variables that are baked into the app on build time. This one imports currencySettings
too.

## Search only listings that are supported by listing type

SearchPage can restrict search results to listings with valid listingType. Validity is defined by
listingTypes array in _configListing.js_.

However, it only works if you have set 'enum' type search schema for the following public data
field: **_listingType_**.

You could even extend that validation to

- transactionProcessAlias
- unitType

If you have set the search schema for those public data fields, you can turn
`enforceValidListingType` config to true in [configListing.js](./configListing.js) file.

Read More:

- [Manage search schemas with Flex CLI](https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas)
- [SearchPage.duck.js](../containers/SearchPage/SearchPage.duck.js)
