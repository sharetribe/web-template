# Store-type tags on listing cards & ListingPage

**Date:** 2026-06-01
**Status:** Approved (design)

## Goal

Display the seller's `tipoTienda` ("store type") values as colored tags overlaid on
the bottom-left of a listing's image — but **only** for listings whose author is a
`vendedor-tienda` user. `tipoTienda` is a multi-enum user field, so a listing can show
several tags (rotating colors, like the reference mock: forest green / periwinkle blue /
pink). Shown on `AVListingCard` everywhere it renders and as an overlay on the
ListingPage gallery image.

## Background / current state

- `AVListingCard` (`src/components/AVListingCard/AVListingCard.js`) is rendered in:
  SearchResultsPanel, `SectionRecommendedListings`, `SectionSelectedListings`,
  `SectionTagCatListings`, and ProfilePage.
- Author `publicData` (`userType`, `tipoTienda`) is available wherever the query does
  **not** restrict `fields.user`:
  - **Stripped** on SearchPage (`SearchPage.duck.js`, `fields.user` ~line 446) and on
    landing/CMS sections (`src/extensions/landingPage/av/listings.js`, `fields.user`
    ~line 47). These must add the new fields.
  - **Available** on ProfilePage and ListingPage (no sparse `fields.user`). No change.
- Tag labels come from the `tipoTienda` enum options in `config.user.userFields`
  (hosted config). No new translation keys required; fall back to the raw value if the
  field/option is not configured.
- `vendedor-tienda` is a distinct userType, not in the existing
  `configAV.sellerUserTypes` (`['vendedor', 'vendedor-stock']`).

## Architecture

### 1. Gate + pure helper — `src/config/configAV.js`

Follows the established `sellerUserTypes` / `canShowOriginalPrice` gate pattern.

```js
export const storeSellerUserType = 'vendedor-tienda';
export const storeTypeFieldKey = 'tipoTienda';

// Returns [{ key, label }] of store-type tags, or [] when the author is not a
// vendedor-tienda or has no tipoTienda set.
export const getStoreTypeTags = (author, config) => { ... }
```

Behavior:
- Read `author?.attributes?.profile?.publicData?.userType`; return `[]` unless it
  equals `storeSellerUserType`.
- Read `publicData.tipoTienda`; normalize to an array (tolerate a single string).
- Map each value to `{ key, label }`, resolving `label` from
  `config?.user?.userFields?.find(f => f.key === storeTypeFieldKey)?.enumOptions`.
  Fall back to the raw value when the field or option is missing.
- SSR-safe and pure (no browser APIs, no side effects).

### 2. Presentational component — `src/components/StoreTypeTags/`

Files: `StoreTypeTags.js`, `StoreTypeTags.module.css`, `StoreTypeTags.test.js`.

- **Props:** `author` (user entity), `className?`, `max?` (default `3`).
- Calls `useConfiguration()` internally; delegates to `getStoreTypeTags(author, config)`.
- Returns `null` when there are no tags (cards without a store author render unchanged).
- Renders a flex-wrap container of chips, capped at `max`.
- **Color rotates by index:** `index % palette.length` selects a CSS-module modifier
  class (`.tag0`…`.tag3`). The component owns *chip appearance + color rotation*;
  the **consumer owns placement** via `className`.
- Registered in `src/components/index.js`.

**Palette** (`{bg, text}` pairs, tunable hexes):
- `.tag0` forest green / white
- `.tag1` periwinkle blue / white
- `.tag2` pink / white
- `.tag3` amber / dark

### 3. Placement

- **AVListingCard:** render `<StoreTypeTags author={author} className={css.storeTags} />`
  inside the `AspectRatioWrapper`, after the `<LazyImage>`. `css.storeTags` =
  `position: absolute; bottom/left` over the image (the wrapper provides the
  positioning context).
- **ListingPage gallery overlay (upstream edit):**
  - `src/containers/ListingPage/SectionGallery.js` (carousel variant)
  - `src/containers/ListingPage/SectionHero.js` (cover-photo variant)

  Each: wrap the image area with `position: relative` (or reuse the existing section
  wrapper) and render `<StoreTypeTags author={listing?.author} className={css...} />`
  overlaid bottom-left. Tag container uses `pointer-events: none` so it does not block
  gallery controls. These are upstream files — keep the edit additive/minimal and note
  it in the commit message per the repo's Upstream File Policy.

### 4. Query changes

Add `'profile.publicData.userType'` and `'profile.publicData.tipoTienda'` to `fields.user`:
- `src/containers/SearchPage/SearchPage.duck.js`
- `src/extensions/landingPage/av/listings.js`

## Testing

- `src/config/configAV.test.js`: `getStoreTypeTags` —
  - store author + configured field → labels resolved;
  - non-store userType → `[]`;
  - store author, unconfigured field → raw values as labels;
  - single string value → normalized to one tag.
- `src/components/StoreTypeTags/StoreTypeTags.test.js`:
  - store author → chips rendered with labels + snapshot;
  - non-store author → renders nothing;
  - color-class rotation across >1 tag;
  - respects `max`.
- `src/components/AVListingCard/AVListingCard.test.js`: add a store-author case asserting
  tags appear; confirm the existing non-store snapshot is unchanged.
- `src/containers/SearchPage/SearchPage.test.js`: update the expected `fields.user`
  array if it is asserted there.
- Run `yarn test -- --watchAll=false` before completion.

## Out of scope / non-goals

- No backend search-schema change; tags are render-only.
- No new translation keys (labels come from hosted user-field config).
- No change to ProfilePage / ListingPage data loading (author publicData already present).
- Tags are not clickable links.

## Upstream files touched (per policy)

- `src/containers/SearchPage/SearchPage.duck.js` — add 2 `fields.user` entries.
- `src/containers/ListingPage/SectionGallery.js` — gallery overlay (carousel).
- `src/containers/ListingPage/SectionHero.js` — gallery overlay (cover photo).
