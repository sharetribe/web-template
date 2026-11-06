# Localization config

Locale and first day of week live on `config.localization`. Marketplace currency is edited in the
same Console asset but ends up on top-level `config.currency` (same idea as minimum listing price
subunits).

Hosted: `/general/localization.json`. Gaps use [`defaultLocalization.js`](./defaultLocalization.js)
(`en-US`, Monday). Currency’s built-in default stays on `configDefault` (`USD`).

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
unsupported hosted codes are dropped and replaced with the built-in default.

## When something is wrong

Bad locale, first day of week (must be an integer 1…7 in the hosted asset), or currency falls back
to the built-in. Does not trigger MaintenanceMode.
