# Configuration options

Marketplace config comes from three places:

1. **Hosted assets** — fetched from the Asset Delivery API on full page load
2. **Built-in defaults** — [`configDefault.js`](./configDefault.js) and the `default*.js` files in
   each domain folder (fill gaps or stand in when hosted data is missing)
3. **Build-time settings** — [`settings.js`](./settings.js) (and currency helpers), baked in at
   build

## Top-level files (what to open)

**Start here (customize):**

- Domain folders (`listing/`, `search/`, …) — per-domain defaults + handlers
- [`appCdnAssets.js`](./appCdnAssets.js) — which hosted assets this app fetches
- [`settings.js`](./settings.js) — build-time env (SDK, currency helpers, …)
- [`configDefault.js`](./configDefault.js) — assembles defaults + top-level marketplace fields

**Usually leave alone:**

- [`mergeConfig.js`](./mergeConfig.js) — combines hosted config (from assets) with built-in defaults
  into the final `appConfig` the app uses
- [`loadAppConfig.js`](./loadAppConfig.js) — async-loads defaults and `mergeConfig` (for bundle
  splitting only)

Details for each domain live in that folder’s README.

Listing-type UI helpers such as `displayDescription` and `requireListingFiles` live in
[`src/util/configHelpers.js`](../util/configHelpers.js) (used by listing cards, edit wizard, etc.).

## Domain folders

- [branding/](./branding/README.md) — marketplace colors, logos, favicon, social images
  (`config.branding`)
- [layout/](./layout/README.md) — Search/Listing page variants and listing-card image aspect ratio
  (`config.layout`)
- [listing/](./listing/README.md) — listing types and custom listing fields (`config.listing`)
- [search/](./search/README.md) — main search type, default filters, and sort options
  (`config.search`)
- [maps/](./maps/README.md) — map provider, API tokens, and location-search defaults (`config.maps`)
- [categoryConfiguration/](./categoryConfiguration/README.md) — listing category tree
  (`config.categoryConfiguration`)
- [analytics/](./analytics/README.md) — Google Analytics 4 and/or Plausible (`config.analytics`)
- [googleSearchConsole/](./googleSearchConsole/README.md) — optional site-verification meta tag
  (`config.googleSearchConsole`)
- [accessControl/](./accessControl/README.md) — private marketplace, file upload, and permission
  flags (`config.accessControl`)
- [localization/](./localization/README.md) — locale and first day of week (`config.localization`);
  marketplace currency elevated to top-level `config.currency`
- [topbar/](./topbar/README.md) — optional logo link, custom links, search visibility, post-listing
  CTA (`config.topbar`)
- [footer/](./footer/README.md) — optional marketplace footer (links, slogan, social)
  (`config.footer`)
- [user/](./user/README.md) — user types and custom user fields (`config.user`)
- [transaction/](./transaction/README.md) — minimum listing price (`config.transaction`); elevated
  to top-level `listingMinimumPriceSubUnits`
- [stripe/](./stripe/README.md) — Stripe publishable key, booking horizon, Connect countries
  (`config.stripe`; built-in/env only, no hosted asset)

Transaction _processes_ (booking, purchase, etc.) are separate from these configs — see
[`src/transactions/`](../transactions/).

## Hosted assets

[`appCdnAssets.js`](./appCdnAssets.js) lists app-wide asset paths (also on
`defaultConfig.appCdnAssets`). They are fetched from `src/index.js` (client) and
`server/dataLoader.js` (SSR), then passed into the app as hosted config and translations.
[`loadAppConfig.js`](./loadAppConfig.js) loads built-in defaults + `mergeConfig` in parallel with
that fetch (bundle-splitting only).

Typical load order:

1. Fetch app-wide configs and translations
2. Merge into React Context via `src/app.js`
3. Load page-specific data
4. Render

SSR fetches with the `"latest"` alias and stores the asset version in Redux. The client then loads
that same version (so SSR and CSR stay in sync). `yarn run dev` skips SSR and always uses
`"latest"`.

Provider commission is fetched separately when line-items are created for custom pricing
(`/api/transaction-line-items`, `/api/initiate-privileged`, `/api/transition-privileged`).

## Listing type, process alias, and unit type

Listing types (configured under [listing/](./listing/README.md)) tie a listing to a transaction
process. The listing’s public data stores:

- **`listingType`** — id of the listing type
- **`transactionProcessAlias`** — `process-name/alias` (e.g. how the transaction is started)
- **`unitType`** — pricing unit for that process

Those three must stay in sync with:

1. What hosted listing config defines
2. Processes that exist in the marketplace environment (Sharetribe backend)
3. What this client app supports (`src/transactions/`, formerly also referenced from
   `src/util/transaction.js`)

If you add, remove, or change a process on the backend, update the client and possibly existing
listings (you can use the Integration API to do this).

**Unit type** is mainly a pricing unit — changing it usually means pricing must change too. Prefer
not reusing the same unit type across different processes. Defaults in this template:

- default-purchase: `item`
- default-booking: `day`, `night`, `hour`, `fixed`
- default-negotiation: `request`, `offer`
- default-inquiry: `inquiry`
- default-download: `file`

## Enforce valid listing types in search

SearchPage can restrict results to listings whose `listingType` is in the configured listing types.
That only works if you have an `enum` search schema on public data field **`listingType`**. You can
extend the same idea to `transactionProcessAlias` and `unitType`, then set `enforceValidListingType`
in [`listing/defaultListing.js`](./listing/defaultListing.js).

More:

- [Manage search schemas with Flex CLI](https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas)
- [`SearchPage.duck.js`](../containers/SearchPage/SearchPage.duck.js)

## Build-time settings

[`settings.js`](./settings.js) holds values baked in at build time (including currency subunit
helpers from `settingsCurrency.js`). These are not overridden by hosted assets.
