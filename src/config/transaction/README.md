# Transaction config

Marketplace transaction settings (not transaction _processes_ — those live in `src/transactions/`).
Currently this only covers the minimum listing price. Hosted asset
`/transactions/minimum-transaction-size.json` maps to `config.transaction`.

## `config.transaction` shape

```js
{
  listingMinimumPrice: { type: 'subunit', amount: number },
}
```

## Top-level `listingMinimumPriceSubUnits`

Derived on the top-level app config in `mergeConfig`. If the hosted amount is missing or `0`, the
built-in in [`configDefault.js`](../configDefault.js) is used (Marketplace Console no longer allows
saving `0`, but older assets may still have it).

## When something is wrong

Without a valid `listingMinimumPrice` (`{ type: 'subunit', amount: <number> }`), the app shows
MaintenanceMode.
