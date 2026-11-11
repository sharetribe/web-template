# Localization config

Locale and first day of week live on `config.localization`. Hosted asset
`/general/localization.json` also carries marketplace currency, which is elevated to top-level
`config.currency` (same idea as minimum listing price subunits).

Gaps use built-ins in [`defaultLocalization.js`](./defaultLocalization.js) (`en-US`, Monday).
Currency’s built-in stays in [`configDefault.js`](../configDefault.js) (`USD`).

## `config.localization` shape

```js
{
  locale, // string, e.g. 'en-US'
  firstDayOfWeek, // 0–6 after resolve (hosted 7 → 0 for Sunday)
  currency, // optional ISO code from hosted asset (also elevated to config.currency if valid)
}
```

## Top-level `config.currency`

Elevated in `mergeConfig` via `getMarketplaceCurrency`. Call sites use `config.currency`. Invalid or
unsupported hosted codes are dropped and replaced with the built-in.

## When something is wrong

Bad locale, first day of week (must be an integer 1…7 in the hosted asset), or currency falls back
to built-ins. Does not trigger MaintenanceMode.
