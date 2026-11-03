# Search config

Search main type, default filters, and sort options. Console edits live in
`listings/listing-search.json` and land on `config.search`.

This handler must run after category and listing config, because filters and sort options depend on
them. Validate soft-checks the hosted asset only; resolve merges with built-ins from
[`defaultSearch.js`](./defaultSearch.js) (and resolved listing/categories) to fill `mainSearch`,
default filters, and `sortConfig` when hosted values are missing.

## `config.search` shape

```js
{
  mainSearch: { searchType }, // 'location' | 'keywords'
  defaultFilters: [
    // order: listingType?, category?, dates?, seats?, price?, keywords?
    // validated / filled from hosted + defaults + categoryConfiguration + listingTypes
  ],
  sortConfig: {
    active,
    queryParamName, // 'sort'
    relevanceKey,
    relevanceFilter,
    conflictingFilters,
    // options: defaultSearch.js list, filtered by hosted sorting flags;
    // listing fields with showSorting may prepend/append more based on the primary vs secondary flag.
    options,
  },
  // ...other hosted keys passed through
}
```

The category filter is included only when `categoryConfiguration.categories` is non-empty.

## When something is wrong

- Unsupported main search type → falls back to `keywords`.
- Price filter with negative bounds or `min >= max` → filter dropped.
- Keywords filter forced off when main search is already keywords.
- Seats filter forced off unless a date-range filter is enabled.

Does not trigger MaintenanceMode.
