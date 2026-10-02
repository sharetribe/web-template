# Smart Search: decision log

Key functional decisions for the smart search solution, with the reasoning behind each one. The API
shape is in [server/api/smart-search/CONTRACT.md](server/api/smart-search/CONTRACT.md); this file
records why things are the way they are.

Each entry has a status: **Accepted**, **Superseded** (link to the replacement) or **Rejected**.

---

## D1. Two-stage ranking: initial ranking for every candidate, then a Claude rerank of the top 20

**Status:** Accepted

### Decision

Every search request ranks results in two stages:

1. **Initial ranking** scores every candidate that passed the hard filters, using cheap
   precomputed signals.
2. **Reranking** sends the top `min(20, perPage)` candidates to Claude Sonnet, which grades each
   one against the request and writes a one-line reason.

Reranking runs only for page 1 with `sort: 'relevance'`. Everything else uses the initial-ranking
order.

### How the initial ranking works

```
semantic    = cosine(queryVector, listingVector)
              listing vectors are built offline from title + description + enriched searchText;
              only the query is embedded at request time (local model)
keyword     = BM25(expanded query terms, enriched listing text)
preferences = share of soft preferences matched by enriched tags (style, season, warmth, colour, brand)

Each signal is normalised to 0–1 within the candidate set, then:
score = 0.5·semantic + 0.3·keyword + 0.2·preferences   (starting weights; tuned with the eval)
```

It's arithmetic over precomputed data: milliseconds per request, no API cost, and it scales to
thousands of listings.

### Why reranking is needed

The initial ranking scores each signal on its own. None of them can judge whether a listing fits
the request as a whole. Examples from the current marketplace data:

| Query                        | Initial ranking alone                                                                             | With the reranker                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| "vintage jacket for autumn"  | *Kids' jeans & denim jacket bundle, 11y* ranks #2, because the keyword "jacket" matches strongly | Graded **weak**: "Includes a denim jacket, but it's a kids' 11y bundle". It moves down.        |
| "vintage jacket for autumn"  | *Brown and white wool cardigan S* has a middling score and no explanation                         | Graded **partial**: "Not a jacket, but a warm wool layer for autumn"                           |
| "something for a wedding"    | *Toddler white dress & shoes bundle* scores well on the word "dress"                              | Understands the occasion: *Dress shoes, sunglasses & tie bundle* moves up                      |
| "warm but not wool"          | Embeddings largely ignore "not", so wool sweaters rank high                                       | Reads the negation and demotes the wool items                                                  |

Illustrative initial scores for "vintage jacket for autumn":

| #   | Listing                                 | semantic | keyword | prefs | score    |
| --- | --------------------------------------- | -------- | ------- | ----- | -------- |
| 1   | Bronze bomber jacket L                  | 0.92     | 1.00    | 0.9   | **0.94** |
| 2   | Kids' jeans & denim jacket bundle, 11y  | 0.71     | 0.85    | 0.3   | **0.67** |
| 3   | Brown and white wool cardigan S         | 0.68     | 0.10    | 0.8   | **0.53** |
| 4   | Beige wool sweater M                    | 0.64     | 0.00    | 0.8   | **0.48** |

Row 2 is the failure the reranker fixes. The reranker also produces the **reasons** shown on the
result cards, which the initial ranking can't.

### Why keep the initial ranking if we rerank

The reranker sees only 20 listings. The initial ranking does everything else:

1. **It picks which 20 the reranker sees.** Reranking can only reorder what it's given. A relevant
   listing ranked #35 is never seen. The initial ranking's job is therefore **recall** (get every
   good listing into the top 20), and the reranker's job is **precision** (put the best first).
2. **It orders everything after the top 20:** page 2 onwards and the "Also possibly relevant" tier.
3. **It's the fallback** when the rerank call fails or times out, or when `rerank: false`.
4. **It drives relaxation counts.** "3 more without Size L" counts listings whose initial score is
   above the relevance threshold. A Claude call per possible relaxation would be too slow and costly.
5. **It keeps cost flat.** Reranking the whole catalog would mean one Sonnet call over thousands of
   listings. The initial ranking caps the expensive step at 20.

### Rules that protect accuracy

- The reranker **grades and reorders. It never removes.** Listings graded `weak` move to the "Also
  possibly relevant" tier and stay visible.
- It only reorders within the top 20, so no candidate below it is lost.
- If the call fails or times out (~2 s budget), the initial ranking is returned and
  `meta.warnings` contains `RERANK_SKIPPED` (D6).

### Trade-offs accepted

- About **$0.016 and 1–2 seconds** per reranked search (Sonnet, 20 listings).
- With today's 27 listings, the top 20 is often the whole candidate set, so the initial ranking
  matters mostly for the fallback, relaxation and scaling. It becomes essential as the catalog grows.

### How we verify it

The eval runs every query with `rerank: false` and `rerank: true`. If reranking stops improving
recall@10 / precision@5 for the test queries, revisit this decision.

---

## D2. The server returns ranked listings, fetched once with images and authors

**Status:** Accepted (replaces the earlier draft where the server returned IDs only and the browser
loaded the listings with `listings.query({ ids })`)

### Decision

`POST /api/smart-search` returns the page's listings in the SDK response shape (`data` +
`included`), in display order, alongside `results` (tier, grade, reason). The server fetches
candidates **once** per request, including images and authors, and uses that one fetch for
filtering, ranking and the response.

### Why not return IDs only

The server already fetches fresh listing data to filter and rank. Returning only IDs makes the
browser fetch the same data again, and that second fetch caused three problems:

| Problem with IDs only                                                                                  | With listings in the response                     |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Two round trips: our API, then Sharetribe                                                              | One                                               |
| `listings.query({ ids })` returns listings in its own order, so the browser had to re-sort them        | Order is correct by construction                  |
| A price could change between our response and the browser's fetch, so an "Under €60" chip could sit above a €70 card | What was filtered is exactly what is shown |

### Why one fetch, not a second one for images

Images and authors are cheap to include. Like the default SearchPage, the fetch uses
`include: ['author', 'images']` with `'limit.images': 1`, so each listing brings one image and an
author with only `displayName`. The server ignores them while filtering and ranking, then copies
only the current page's images and authors into `listings.included`.

### How it fits the template

- The response is `application/transit+json`, as the comment in `src/util/api.js` asks for when
  returning SDK data. It carries UUID and Money types.
- The page duck dispatches `addMarketplaceEntities({ data: response.listings }, { listingFields })`,
  stores the result IDs in server order, and reads cards with `getListingsById`, the same pattern
  `SearchPage` uses. `ListingCard` works unchanged.
- The browser sends the card image variant (`config.layout.listingImage`) in the request, because
  the server needs it before the fetch.

### Trade-offs accepted

- Fetching images for every candidate gets wasteful with thousands of candidates. At that point
  the server would fetch images only for the current page in a second server-side call. That isn't
  needed at hackathon scale.
- Responses are larger than an ID list, at about 24 listings with one image each.

---

## D3. The client holds the search state; the server keeps no memory

**Status:** Accepted

### Decision

Every response returns a `SearchState` (filters, preferences, removed keys, `similarTo`, expanded
terms). The frontend stores it, keeps it in the URL, and sends it back with the next request. The
server stores nothing between requests.

### Why

- **Follow-ups need context.** "Cheaper", "in black" or "not bundles" mean nothing without the
  search they refer to.
- **Chat history isn't enough.** Removed chips, filters picked from a menu, locked chips and
  "more like this" clicks are never typed, so they exist only in the state.
- **Shareable and testable.** The state is the URL, so a refined search can be bookmarked,
  reloaded and replayed by the eval script.

### Server rules for the state

1. A `source: 'user'` filter always beats an inferred one for the same key. If the text conflicts
   with it, the user's filter wins and the response carries a `USER_FILTER_KEPT` notice.
2. Keys in `removed` are never re-inferred until the buyer sets them again or starts a new search.
3. A new search (`state: null`, or Claude's follow-up parse returns `new_search`) resets inferred
   filters, preferences, `removed` and `similarTo`. Filters with `source: 'user'` are kept.
4. Inferred `color` and `brand` default to **soft**, because many listings lack them and a hard
   filter would hide those listings. They become hard only when the buyer locks the chip. All
   other inferred filters are hard, but can be relaxed.

### When Claude is called

| Request                                      | Intent (Haiku) | Rerank (Sonnet) |
| -------------------------------------------- | -------------- | --------------- |
| New text (new search or follow-up)           | yes            | yes             |
| Chip edit (`q: null`, edited state)          | **no**         | yes             |
| Page 2+, or `sort` other than `relevance`    | no             | **no**          |

Chip edits skip the intent call because the state is already structured, so there is no text to
interpret. Reranking runs only for page 1 with relevance sort. It reorders the top
`min(20, perPage)` results, all on page 1, so later pages continue in initial-ranking order
without overlap.

---

## D4. No caching; every request uses fresh listing data

**Status:** Accepted (replaces an earlier draft with intent, grade and response caches)

### Decision

Nothing is cached between requests. Every request, including paging and sort changes, fetches
candidates from the Marketplace API, filters them, and returns that same data (D2).

### Why

- Caching added complexity the PoC doesn't need.
- Cached result sets go stale on filter membership. If a price rises from €50 to €70, a cached
  "Under €60" response would still include it. With fresh data, what is filtered is what is shown.

### Trade-offs accepted

- Every reranked request makes one Sonnet call (about $0.016), including chip edits.
- Eval runs pay for the intent call every time. Tuning runs use `rerank: false` (about $0.12 per
  30-query run).
- One staleness window remains. AI-enriched fields (`colorDetected`, normalised `brand`, `season`)
  update when the indexer processes the listing's `listing/updated` event, polled about every 60
  seconds. They are soft by default, so this affects ranking, not which listings appear.

---

## D5. Relaxation: always return results, and show what each filter costs

**Status:** Accepted

### Decision

- The server applies inferred hard filters **in memory** to the candidate set it fetched with
  only user-set filters and the listing type. "What if this filter were removed?" is then a
  cheap re-check with no extra API calls.
- `relaxation.suggestions[].extra` counts **relevant** listings (initial score above the relevance
  threshold) that removing that one filter would add, not every listing.
- If the strict search has **0 results**, the server drops the one inferred filter that recovers
  the most relevant listings and reports it in `relaxation.auto` as the full `Filter` object, so
  the frontend's Undo can put it back with `locked: true`. It never drops a user-set or locked
  filter, and price is dropped last. If that still gives 0, it falls back to the closest matches
  with no inferred filters.
- The server returns no results only when there are truly no candidates (`NO_RESULTS`).

### Why

The case asks that simplicity never come at the cost of accuracy. Relaxation shows the buyer
exactly which filter is hiding matching listings and lets them remove it in one click.

### Scaling note

At thousands of candidates, the server would apply all hard filters through Sharetribe and count
each relaxation with a parallel `listings.query` without that filter (`meta.totalItems`). The
contract stays the same.

---

## D6. Failure handling and backend-only fields

**Status:** Accepted

- A failure in Claude or the embedding step is **not** an error. The server returns `200` and adds
  a code to `meta.warnings`: `INTENT_FALLBACK` (searched the raw text without inferred filters) or
  `RERANK_SKIPPED` (initial-ranking order, ~2 s rerank timeout). Only a failed Sharetribe query
  returns an error (`502 UPSTREAM_ERROR`).
- **`notices` are for the buyer only**, so there are just two: `USER_FILTER_KEPT` (`params:
  { label }`) and `NO_RESULTS`. Technical events go to `meta.warnings`, which the buyer never sees.
  An earlier draft also had an `AUTO_RELAXED` notice. It was removed because `relaxation.auto`
  already says the same thing, and the UI would have shown it twice.
- **Notices carry a `code` and `params`, not English text.** The frontend writes the message from
  its translation files, as AGENTS.md requires for user-facing copy. Filter `label`s are still
  English from the backend; translating them is out of scope for the PoC.
- Results contain only published `sell-used-products` listings, so "In search of" buyer requests
  never appear.
- Backend-only fields are **not** in the frontend contract:
  - request `rerank` (default `true`) and `debug` (per-signal scores), used by the eval script,
  - response `meta` (`tookMs`, `reranked`, `intent`, `warnings`), and per-result `grade` and
    `score`.

  The server may send them. The frontend ignores them.
