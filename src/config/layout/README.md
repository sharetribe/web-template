# Layout config

Layout picks Search and Listing page variants and the listing-card image aspect ratio. Hosted asset
`/design/layout.json` maps to `config.layout`.

Unsupported or missing variants fall back to built-ins in [`defaultLayout.js`](./defaultLayout.js),
then to safe hard fallbacks (`grid`, `carousel`, `1/1`). Built-ins still use map + landscape `4/3`
so older marketplaces without a layout asset keep working.

## `config.layout` shape

```js
{
  searchPage: { variantType }, // 'map' | 'grid' (built-in: map; hard fallback: grid)
  listingPage: { variantType }, // 'coverPhoto' | 'carousel' (built-in / hard fallback: carousel)
  listingImage: {
    variantType, // 'cropImage' only
    aspectWidth, // from hosted aspectRatio, e.g. "4/3"
    aspectHeight,
    variantPrefix, // always from built-ins ('listing-card')
  },
}
```

## When something is wrong

Missing or unsupported page variants and bad aspect ratios use built-ins, then the hard fallback
above. Does not trigger MaintenanceMode.
