# Smart Search API: frontend contract

This document is everything the frontend needs to build the smart search page. The backend
decides which listings match and in what order. The frontend sends what the buyer typed or
clicked, then shows exactly what comes back.

Backend design reasons are in [SMART_SEARCH_DECISIONS.md](../../../SMART_SEARCH_DECISIONS.md). You
don't need them to build the UI.

---

## 1. The idea in one minute

1. The buyer types something like *"vintage jacket for autumn, size L, under 60€"*.
2. The frontend sends it to `POST /api/smart-search`.
3. The backend returns:
   - **listings** to show, already in the right order,
   - a **state** object describing the search: filter chips such as "Size L" and "Under €60",
     plus preferences such as "vintage" and "autumn".
4. The frontend shows the chips and the listings.
5. When the buyer types again, clicks a chip, changes sort or changes page, the frontend sends
   the **state it received last time** back with the request.

The frontend keeps the latest `state` and always sends it back. It never builds a state from
scratch.

---

## 2. How to call it

Use the existing `post` helper in `src/util/api.js`. It already handles the request and response
format (`application/transit+json`), so you get normal JavaScript objects back. Listing IDs and
prices arrive as the same UUID and Money types the Sharetribe SDK uses.

Add this function to `src/util/api.js`, next to the other API helpers:

```js
// Smart search: send the buyer's text and/or the current search state, get ranked listings back.
export const smartSearch = body => {
  return post('/api/smart-search', body);
};
```

---

## 3. Request

```js
{
  q: string | null,        // what the buyer just typed. null when they clicked something instead
  state: object | null,    // the `state` from the previous response. null for a brand-new search
                           // with no filters picked (see "Starting state" below)
  page: number,            // 1, 2, 3… (default 1)
  perPage: number,         // default 24
  sort: 'relevance' | 'price-asc' | 'price-desc' | 'newest', // default 'relevance'
  image: {                 // card image size; take these from config.layout.listingImage
    variantPrefix: string, // e.g. 'listing-card'
    aspectWidth: number,   // e.g. 1
    aspectHeight: number,  // e.g. 1
  },
}
```

### Which values to send

| What the buyer did                                  | `q`                | `state`                         | `page` |
| --------------------------------------------------- | ------------------ | ------------------------------- | ------ |
| Typed a search on an empty page, no filters picked  | the text           | `null`                          | 1      |
| Picked filters first, then typed a search           | the text           | a starting state (see below)    | 1      |
| Typed again while results are showing ("cheaper")   | the new text       | the last `state`                | 1      |
| Removed, locked or added a chip                     | `null`             | the last `state`, edited (§6)   | 1      |
| Changed the sort                                    | `null`             | the last `state`                | 1      |
| Went to another page                                | `null`             | the last `state`                | new page |

The backend decides whether new text is a refinement ("cheaper", "in black") or a completely new
search ("now I need sneakers"). The frontend always sends the last state with new text.

### Starting state: filters picked before the first search

`state` is `null` only when there is no previous response **and** the buyer hasn't picked any
filters. If the buyer picks filters before typing (for example "Men" from the "+ Add filter"
menu), send a starting state that holds just those filters, built the same way as in §6
("Add or change a filter"):

```json
{
  "q": "black jeans size M",
  "state": {
    "q": "",
    "filters": [
      { "key": "categoryLevel1", "value": "men", "label": "Men",
        "mode": "hard", "locked": false, "source": "user", "op": "eq" }
    ],
    "preferences": [],
    "removed": [],
    "similarTo": null,
    "terms": []
  },
  "page": 1
}
```

The backend keeps these filters and adds the ones it reads from the text. The response's `state`
would contain Men, Size M and Black.

---

## 4. Response

```js
{
  state: SearchState,      // save this and send it back next time. Filter chips come from
                           // state.filters, preference tags from state.preferences
  results: Result[],       // one entry per listing on this page, in display order
  listings: {              // the listings themselves, in Sharetribe SDK format, same order
    data: Listing[],
    included: Array<Image | User>,
  },
  total: { best: number, related: number }, // counts across all pages
  page: number,
  perPage: number,
  totalPages: number,
  relaxation: {
    auto: null | { filter: Filter }, // the filter the backend dropped to find any results
    suggestions: Array<{ key: string, label: string, extra: number }>,
  },
  notices: Array<{ code: 'USER_FILTER_KEPT' | 'NO_RESULTS', params: object }>, // see §5
}
```

### `Result`

```js
{
  id: UUID,                     // same id as the listing in listings.data
  tier: 'best' | 'related',     // which section the card goes in (§5)
  reason: string | null,        // one line explaining the match. Show it on the card if present
}
```

### `SearchState`

You **read** `filters` and `preferences` to draw chips. You **edit** it only as described in §6.
Never change `q` or `terms`.

```js
{
  q: string,                    // the search text (read-only)
  filters: Filter[],            // filter chips
  preferences: string[],        // soft wishes, e.g. ["vintage", "autumn"]
  removed: string[],            // filter keys the buyer removed (you add to this, §6)
  similarTo: string | null,     // listing id for "More like this" (optional feature)
  terms: string[],              // internal to the backend. Send back unchanged
}
```

### `Filter`

```js
{
  key: string,                  // which field, e.g. 'size', 'price', 'color' (list below)
  value: any,                   // the filter value. Don't interpret it; use `label` for display
  label: string,                // chip text, e.g. "Size L", "Under €60", "No bundles"
  mode: 'hard' | 'soft',        // hard = results must match. soft = matches are only ranked higher
  locked: boolean,              // buyer pinned this chip
  source: 'user' | 'inferred',  // 'user' = the buyer set it in the UI. 'inferred' = read from the text
  op: string,                   // internal to the backend. Send back unchanged
}
```

Possible `key` values. These are the marketplace's existing listing fields, so the same names
appear in the config (`config.listing.listingFields` and the listing categories).

| `key`             | What it is                                              | Example `value` → `label`                       |
| ----------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `categoryLevel1`  | Main category: who the item is for                      | `'men'` → "Men" (also `women`, `kids`, `accessories`) |
| `categoryLevel2`  | Subcategory inside the main category: the type of item  | `'men-shoes'` → "Shoes" (also tops, bottoms, accessories, bundles) |
| `size`            | Clothing size for adult tops and bottoms                | `'l'` → "Size L"                                |
| `shoeSize`        | Shoe size, EU                                           | `'38'` → "EU 38"                                |
| `kidsSize`        | Kids' clothing size by age                              | `'5y'` → "5 years"                              |
| `price`           | Price range, in cents                                   | `{ max: 6000 }` → "Under €60"                   |
| `color`           | Colour                                                  | `'black'` → "Black"                             |
| `brand`           | Brand                                                   | `'Nike'` → "Nike"                               |
| `condition`       | Item condition                                          | `'like-new'` → "Like new"                       |
| `petFreeHome`     | Comes from a pet-free home                              | `'yes'` → "Pet-free home"                       |
| `smokeFreeHome`   | Comes from a smoke-free home                            | `'yes'` → "Smoke-free home"                     |
| `shippingEnabled` | The seller can ship the item                            | `true` → "Can be shipped"                       |

Categories have two levels. For example, "Shoes" under "Men" is `categoryLevel1: 'men'` plus
`categoryLevel2: 'men-shoes'`. Subcategory values always start with their main category, so
`women-shoes` and `men-shoes` are different values.

For chips that come back from the backend, always display `label`. The only time you create a
label is when the buyer adds a filter from the "+ Add filter" menu (§6). Then use the option's
label from the config.

---

## 5. What the page shows

```
┌──────────────────────────────────────────────────────────┐
│ [ vintage jacket for autumn, size L, under 60€       🔍 ] │  ← search box (q)
│ Size L ✕   Under €60 ✕   + Add filter                     │  ← state.filters
│ Prefers: vintage · outerwear · autumn ✕                   │  ← state.preferences
│ 3 more without "Size L" → [Remove]                        │  ← relaxation.suggestions
├──────────────────────────────────────────────────────────┤
│ Best matches                                              │  ← results with tier 'best'
│ [card] Bronze bomber jacket L · €45                       │
│        "Retro bomber, mid-weight: good for autumn"        │  ← result.reason
│                                                           │
│ Also possibly relevant                                    │  ← results with tier 'related'
│ [card] …                                                  │
└──────────────────────────────────────────────────────────┘
```

Rules:

- **Show results in the order they arrive.** Never sort, filter or regroup them on the frontend.
  Split them into the two sections by `tier` without changing the order inside each section.
- **Chips:** one chip per entry in `state.filters`. Show `mode: 'soft'` chips with a lighter style
  than `'hard'` ones, and show locked chips with a pin icon.
- **Preferences:** one small removable tag per entry in `state.preferences`.
- **`relaxation.suggestions`:** for each one, show *"{extra} more without "{label}""* with a
  button that removes that filter (§6, "Remove a chip").
- **`relaxation.auto`:** when it isn't `null`, nothing matched every filter, so the backend
  removed one filter (`relaxation.auto.filter`) to show something. Show a line at the top of the
  results, e.g. *"No results with "Size L". Showing results without it."*, using
  `relaxation.auto.filter.label`, with an **Undo** button (§6, "Undo an automatic relaxation").
- **`notices`:** short messages about how the search was handled. They are not errors, and
  results are still shown. There are only two codes:

  | `code`             | When                                                              | What to show                                                                  | `params`        |
  | ------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------- |
  | `USER_FILTER_KEPT` | The text asked for something that conflicts with a filter the buyer set (e.g. "black jeans" while the colour chip is Blue) | Info line: *"Kept your filter "{label}"."* | `{ label }`     |
  | `NO_RESULTS`       | Nothing matched, even after relaxation                            | Empty state: *"No listings match your search. Try different words."*          | `{}`            |

  Write the text with translations (`SmartSearchPage.noticeUserFilterKept`,
  `SmartSearchPage.noticeNoResults`) and fill in `params`. Ignore any other code.
- **Sort dropdown and pagination:** send a new request (§3). Don't reorder on the frontend.

---

## 6. Editing the state when the buyer clicks something

Copy the last `state`, change it as below, then send it with `q: null` and `page: 1`.

| Buyer action                  | Change to the state                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Remove a chip                 | Delete that filter from `filters`. Add its `key` to `removed`.                           |
| Lock a chip                   | Set `locked: true` and `mode: 'hard'` on that filter.                                    |
| Add or change a filter        | Put `{ key, value, label, mode: 'hard', locked: false, source: 'user', op: 'eq' }` in `filters` (replace any filter with the same `key`). Remove the `key` from `removed` if it's there. |
| Remove a preference           | Delete it from `preferences`.                                                            |
| Undo an automatic relaxation  | Add `relaxation.auto.filter` back to `filters` with `locked: true`, so it isn't dropped again. |
| "More like this" (optional)   | Set `similarTo` to the listing's id.                                                     |

For price filters, use `op: 'range'` and `value: { max: 6000 }` (amount in cents). For category
exclusions such as "No bundles", the backend creates the filter; the frontend only removes it.

---

## 7. Putting the listings into Redux

The response's `listings` has the same shape as a Sharetribe SDK response, so the existing
`ListingCard` component works without changes. In the page's duck file:

1. Store the listings in the shared marketplace data store:

   ```js
   import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

   const listingFields = config?.listing?.listingFields;
   dispatch(addMarketplaceEntities({ data: response.listings }, { listingFields }));
   ```

   The `{ data: … }` wrapper is needed: `addMarketplaceEntities` expects the same shape the SDK
   returns.

2. Save in the page's own state:
   - `resultIds`: `response.results.map(r => r.id)`, **in this order**,
   - `resultMeta`: tier and reason for each id,
   - `searchState`: `response.state`,
   - `relaxation`, `notices`, `total`, `page`, `totalPages`.

3. In the page component, get the listings with `getListingsById(state, resultIds)` from
   `src/ducks/marketplaceData.duck.js`. It returns them in the order of `resultIds`.

Load data through the page's duck `loadData` function, registered in
`src/containers/pageDataLoadingAPI.js` and the route configuration, the same way the existing
`SearchPage` does. Don't fetch in a `useEffect`.

---

## 8. URL

Keep the search in the URL so it survives reloads and can be shared:

```
/smart-search?q=<text>&s=<state>&page=<n>&sort=<sort>
```

- `s` is the state: `JSON.stringify(state)`, base64url-encoded.
- On page load, `loadData` reads these parameters and sends them as the request: `q` from the
  URL, `state` decoded from `s` (or `null` if there's no `s`).
- After every response, update the URL with the new `state`.

---

## 9. Errors

Failed requests reject with `{ code, message }`:

| Status | `code`            | What to show                                                     |
| ------ | ----------------- | ---------------------------------------------------------------- |
| 400    | `INVALID_REQUEST` | "Something went wrong with this search." and a link to start over |
| 400    | `QUERY_TOO_LONG`  | "Please shorten your search (max 300 characters)."               |
| 429    | `RATE_LIMITED`    | "Too many searches. Try again in a moment."                      |
| 502    | `UPSTREAM_ERROR`  | "Search is temporarily unavailable. Try again."                  |
| 500    | `INTERNAL_ERROR`  | Same as 502                                                      |

All user-facing text must use `FormattedMessage` / `intl.formatMessage()`, with keys added to
`src/translations/en.json` (pattern `SmartSearchPage.someKey`).

---

## 10. Full example

A complete, unshortened response built from real marketplace listings is in
[sample-response.json](sample-response.json). It's the answer to
*"vintage jacket for autumn, size M, under 40€"*: two results, and a suggestion to remove
"Size M". In that file, SDK types are written as `{ "_sdkType": "UUID", "uuid": "…" }` and
`{ "_sdkType": "Money", "amount": 1800, "currency": "EUR" }`. In the real response, `post()`
turns them into the SDK's own UUID and Money objects, so `listing.id.uuid` and
`listing.attributes.price.amount` work the same way in both.

**Request: new search**

```json
{
  "q": "vintage jacket for autumn, size L, under 60€",
  "state": null,
  "page": 1,
  "perPage": 24,
  "sort": "relevance",
  "image": { "variantPrefix": "listing-card", "aspectWidth": 1, "aspectHeight": 1 }
}
```

**Response (shortened)**

```json
{
  "state": {
    "q": "vintage jacket for autumn, size L, under 60€",
    "filters": [
      { "key": "size", "value": "l", "label": "Size L", "mode": "hard", "locked": false, "source": "inferred", "op": "eq" },
      { "key": "price", "value": { "max": 6000 }, "label": "Under €60", "mode": "hard", "locked": false, "source": "inferred", "op": "range" }
    ],
    "preferences": ["vintage", "outerwear", "autumn"],
    "removed": [],
    "similarTo": null,
    "terms": ["jacket", "coat", "bomber", "outerwear"]
  },
  "results": [
    { "id": "6633a7c2-…", "tier": "best", "reason": "Retro bomber, mid-weight: good for autumn" }
  ],
  "listings": {
    "data": [
      { "id": "6633a7c2-…", "type": "listing", "attributes": { "title": "Bronze bomber jacket L", "price": "…" },
        "relationships": { "images": { "data": [{ "id": "…", "type": "image" }] }, "author": { "data": { "id": "…", "type": "user" } } } }
    ],
    "included": [
      { "id": "…", "type": "image", "attributes": { "variants": { "listing-card": { "url": "…" } } } },
      { "id": "…", "type": "user", "attributes": { "profile": { "displayName": "Maria" } } }
    ]
  },
  "total": { "best": 1, "related": 2 },
  "page": 1, "perPage": 24, "totalPages": 1,
  "relaxation": { "auto": null, "suggestions": [{ "key": "size", "label": "Size L", "extra": 3 }] },
  "notices": []
}
```

**Next request: the buyer clicks "Remove" on "Size L"**

```json
{
  "q": null,
  "state": {
    "q": "vintage jacket for autumn, size L, under 60€",
    "filters": [
      { "key": "price", "value": { "max": 6000 }, "label": "Under €60", "mode": "hard", "locked": false, "source": "inferred", "op": "range" }
    ],
    "preferences": ["vintage", "outerwear", "autumn"],
    "removed": ["size"],
    "similarTo": null,
    "terms": ["jacket", "coat", "bomber", "outerwear"]
  },
  "page": 1,
  "perPage": 24,
  "sort": "relevance",
  "image": { "variantPrefix": "listing-card", "aspectWidth": 1, "aspectHeight": 1 }
}
```
