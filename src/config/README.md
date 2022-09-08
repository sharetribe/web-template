# Configuration options

The 2 main files here are **defaultConfig.js** and **appSettings.js**.

## defaultConfig.js

These configurations are saved to React Context and therefore they could be overwritten through configs received from Asset Delivery API.

Some of the content is splitted to separate files:
- stripeConfig.js
- listingConfig.js
- searchConfig.js
- mapsConfig.js
  - defaultLocationSearchesConfig.js
- transactionConfig.js

## appSettings.js
These contain variables that are baked into the app on build time.
This one imports currencySettings too.
