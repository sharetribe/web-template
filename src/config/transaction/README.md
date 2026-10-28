# Transaction config

Marketplace transaction settings (not transaction _processes_ — those live in `src/transactions/`).
Currently this only covers the minimum listing price. Console edits live in
`transactions/minimum-transaction-size.json` and land on `config.transaction`.

## `config.transaction` shape

```js
{
  listingMinimumPrice: { type: 'subunit', amount: number },
}
```

## Top-level `listingMinimumPriceSubUnits`

Derived on the top-level app config in `mergeConfig`. If the hosted amount is missing or `0`, the
built-in from `configDefault.js` is used (Console no longer allows saving `0`, but older data may
still have it).

## When something is wrong

Without a valid `listingMinimumPrice` (`{ type: 'subunit', amount: <number> }`), the app shows
MaintenanceMode.
