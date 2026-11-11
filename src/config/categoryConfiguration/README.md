# Category configuration

Category trees for listings and search. Hosted asset `/listings/listing-categories.json` maps to
`config.categoryConfiguration`.

If the asset is missing, built-ins in
[`defaultCategoryConfiguration.js`](./defaultCategoryConfiguration.js) are used (empty by default).
If the hosted asset has an empty list, that empty list is kept — built-ins are not filled in.

Do not invent custom category key names. Search index keys are fixed as `categoryLevel1` …
`categoryLevel3` (max depth 3).

## `config.categoryConfiguration` shape

```js
{
  key: 'categoryLevel', // fixed — used for public data / search index keys
  scope: 'public',
  categoryLevelKeys, // ['categoryLevel1', …] from tree depth (max 3)
  categories: [
    {
      name,
      id,
      subcategories: [/* same shape, nested */],
    },
    // ...
  ],
}
```

Hosted asset shape before resolve:

```js
{ categories: [{ name, id, subcategories: [...] }, ...] }
```

Note: only category keys `categoryLevel1`…`categoryLevel3` are on the search index.

## When something is wrong

- Tree deeper than 3 levels → tree is kept, but deeper levels are not indexed.
- Missing/empty name, invalid id, or duplicate sibling id → that node is dropped (first of a
  duplicate pair is kept).

None of this triggers MaintenanceMode — the app boots with an empty category tree if needed.
