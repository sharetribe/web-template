# Store-type Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a `vendedor-tienda` seller's `tipoTienda` values as colored tags overlaid on the bottom-left of the listing image, on `AVListingCard` (everywhere it renders) and on the ListingPage gallery image.

**Architecture:** A pure gate/helper `getStoreTypeTags(author, config)` in `configAV.js` resolves the tags (gated on `userType === 'vendedor-tienda'`, labels from `config.user.userFields`). A presentational `StoreTypeTags` component renders the chips with index-rotating colors; consumers position it via `className`. Two queries that strip `fields.user` (SearchPage, landing extension) gain the author publicData fields.

**Tech Stack:** React (functional + CSS Modules), Redux ducks, Jest + React Testing Library, sharetribe-flex-sdk.

---

### Task 1: `getStoreTypeTags` helper + constants in configAV

**Files:**
- Modify: `src/config/configAV.js`
- Test: `src/config/configAV.test.js`

- [ ] **Step 1: Write the failing tests**

Add to `src/config/configAV.test.js`. Update the import on line 1 and append a new describe block:

```js
// line 1 — extend the existing import
import {
  canShowOriginalPrice,
  defaultCountry,
  getStoreTypeTags,
  sellerUserTypes,
  storeSellerUserType,
} from './configAV';
```

```js
// append inside the top-level describe('configAV', () => { ... })
  describe('getStoreTypeTags', () => {
    const storeAuthor = (tipoTienda, userType = 'vendedor-tienda') => ({
      attributes: { profile: { publicData: { userType, tipoTienda } } },
    });
    const config = {
      user: {
        userFields: [
          {
            key: 'tipoTienda',
            schemaType: 'multi-enum',
            enumOptions: [
              { option: 'trending', label: 'Trending' },
              { option: 'holiday', label: 'Holiday' },
            ],
          },
        ],
      },
    };

    it('exposes the store seller userType', () => {
      expect(storeSellerUserType).toBe('vendedor-tienda');
    });

    it('maps tipoTienda values to configured labels', () => {
      expect(getStoreTypeTags(storeAuthor(['trending', 'holiday']), config)).toEqual([
        { key: 'trending', label: 'Trending' },
        { key: 'holiday', label: 'Holiday' },
      ]);
    });

    it('normalizes a single string value to one tag', () => {
      expect(getStoreTypeTags(storeAuthor('trending'), config)).toEqual([
        { key: 'trending', label: 'Trending' },
      ]);
    });

    it('falls back to the raw value when the field is not configured', () => {
      expect(getStoreTypeTags(storeAuthor(['x']), { user: { userFields: [] } })).toEqual([
        { key: 'x', label: 'x' },
      ]);
    });

    it('returns [] for non-store user types', () => {
      expect(getStoreTypeTags(storeAuthor(['trending'], 'comprador'), config)).toEqual([]);
    });

    it('returns [] when there is no tipoTienda or no author', () => {
      expect(getStoreTypeTags(storeAuthor(undefined), config)).toEqual([]);
      expect(getStoreTypeTags(null, config)).toEqual([]);
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test -- --watchAll=false --testPathPattern=configAV`
Expected: FAIL — `getStoreTypeTags`/`storeSellerUserType` are not exported (undefined).

- [ ] **Step 3: Implement the helper**

Append to `src/config/configAV.js`:

```js
// Store sellers (userType === storeSellerUserType) can tag listings with one or
// more `tipoTienda` values, rendered as colored tags over the listing image.
export const storeSellerUserType = 'vendedor-tienda';
export const storeTypeFieldKey = 'tipoTienda';

// Returns [{ key, label }] of store-type tags for the listing author, or [] when
// the author is not a store seller or has no tipoTienda set. Labels resolve from
// the hosted `tipoTienda` user-field enumOptions, falling back to the raw value.
export const getStoreTypeTags = (author, config) => {
  const publicData = author?.attributes?.profile?.publicData;
  if (publicData?.userType !== storeSellerUserType) {
    return [];
  }

  const raw = publicData?.[storeTypeFieldKey];
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (values.length === 0) {
    return [];
  }

  const fieldConfig = (config?.user?.userFields || []).find(f => f.key === storeTypeFieldKey);
  const options = fieldConfig?.enumOptions || [];
  return values.map(value => {
    const match = options.find(o => o.option === value);
    return { key: value, label: match?.label || value };
  });
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test -- --watchAll=false --testPathPattern=configAV`
Expected: PASS (all configAV tests green).

- [ ] **Step 5: Commit**

```bash
git add src/config/configAV.js src/config/configAV.test.js
git commit -m "feat: add getStoreTypeTags gate helper to configAV

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `StoreTypeTags` presentational component

**Files:**
- Create: `src/components/StoreTypeTags/StoreTypeTags.js`
- Create: `src/components/StoreTypeTags/StoreTypeTags.module.css`
- Create: `src/components/StoreTypeTags/StoreTypeTags.test.js`
- Modify: `src/components/index.js`

- [ ] **Step 1: Write the failing test**

Create `src/components/StoreTypeTags/StoreTypeTags.test.js`:

```js
import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import StoreTypeTags from './StoreTypeTags';

const { screen } = testingLibrary;

// No userFields configured here, so labels fall back to the raw values
// (label resolution is unit-tested in configAV.test.js).
const author = (tipoTienda, userType = 'vendedor-tienda') => ({
  attributes: { profile: { publicData: { userType, tipoTienda } } },
});

describe('StoreTypeTags', () => {
  it('renders a chip per tipoTienda value', () => {
    render(<StoreTypeTags author={author(['trending', 'holiday'])} />);
    expect(screen.getByText('trending')).toBeInTheDocument();
    expect(screen.getByText('holiday')).toBeInTheDocument();
  });

  it('renders nothing for non-store authors', () => {
    const { container } = render(<StoreTypeTags author={author(['trending'], 'comprador')} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('caps the number of chips at max', () => {
    render(<StoreTypeTags author={author(['trending', 'holiday', 'birthday'])} max={2} />);
    expect(screen.getByText('trending')).toBeInTheDocument();
    expect(screen.getByText('holiday')).toBeInTheDocument();
    expect(screen.queryByText('birthday')).not.toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<StoreTypeTags author={author(['trending', 'holiday'])} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test -- --watchAll=false --testPathPattern=StoreTypeTags`
Expected: FAIL — cannot resolve `./StoreTypeTags`.

- [ ] **Step 3: Implement the component**

Create `src/components/StoreTypeTags/StoreTypeTags.js`:

```js
import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { getStoreTypeTags } from '../../config/configAV';

import css from './StoreTypeTags.module.css';

const PALETTE_SIZE = 4;
const DEFAULT_MAX = 3;

/**
 * StoreTypeTags
 *
 * Renders the listing author's `tipoTienda` values as colored chips, rotating
 * through a fixed palette by index. Renders nothing unless the author is a
 * store seller (see getStoreTypeTags). The consumer positions the group via
 * `className` (e.g. an absolute overlay on the listing image).
 *
 * @param {Object} props
 * @param {Object} props.author listing author (user entity)
 * @param {string?} props.className positioning/layout class from the consumer
 * @param {number?} props.max maximum chips to render (default 3)
 */
const StoreTypeTags = props => {
  const { author, className, max = DEFAULT_MAX } = props;
  const config = useConfiguration();
  const tags = getStoreTypeTags(author, config);

  if (!tags.length) {
    return null;
  }

  const visible = max > 0 ? tags.slice(0, max) : tags;

  return (
    <div className={classNames(css.root, className)}>
      {visible.map((tag, index) => (
        <span key={tag.key} className={classNames(css.tag, css[`tag${index % PALETTE_SIZE}`])}>
          {tag.label}
        </span>
      ))}
    </div>
  );
};

export default React.memo(StoreTypeTags);
```

Create `src/components/StoreTypeTags/StoreTypeTags.module.css`:

```css
.root {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

/* Rotating palette, matching the reference: forest green / periwinkle / pink / amber */
.tag0 {
  background-color: #33503f;
  color: #ffffff;
}
.tag1 {
  background-color: #6f93c4;
  color: #ffffff;
}
.tag2 {
  background-color: #e87fb0;
  color: #ffffff;
}
.tag3 {
  background-color: #f0c14b;
  color: #2a2300;
}
```

- [ ] **Step 4: Register the component**

In `src/components/index.js`, add near the other AV exports (after line 137, the `AVListingCard` export):

```js
export { default as StoreTypeTags } from './StoreTypeTags/StoreTypeTags';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn test -- --watchAll=false --testPathPattern=StoreTypeTags`
Expected: PASS (4 tests, 1 snapshot written).

- [ ] **Step 6: Commit**

```bash
git add src/components/StoreTypeTags src/components/index.js
git commit -m "feat: add StoreTypeTags component with rotating color chips

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wire StoreTypeTags into AVListingCard

**Files:**
- Modify: `src/components/AVListingCard/AVListingCard.js`
- Modify: `src/components/AVListingCard/AVListingCard.module.css`
- Test: `src/components/AVListingCard/AVListingCard.test.js`

- [ ] **Step 1: Write the failing test**

In `src/components/AVListingCard/AVListingCard.test.js`, extend the `testData` import (line 4) to include `createUser`:

```js
import { createListing, createUser } from '../../util/testData';
```

Append this test inside `describe('AVListingCard', () => { ... })`:

```js
  it('shows store-type tags for vendedor-tienda authors', () => {
    const listing = createListing(
      'av-store-card',
      {
        publicData: {
          listingType: 'product-selling',
          transactionProcessAlias: 'default-purchase/release-1',
          unitType: 'item',
        },
      },
      {
        author: createUser('store-1', {
          profile: {
            displayName: 'Store One',
            abbreviatedName: 'SO',
            publicData: { userType: 'vendedor-tienda', tipoTienda: ['trending', 'holiday'] },
          },
        }),
      }
    );

    render(<AVListingCard listing={listing} showAuthorInfo={false} />, {
      config,
      messages: {
        'ListingCard.price': '{priceValue}{pricePerUnit}',
        'ListingCard.perUnit': ' per {unitType}',
      },
    });

    expect(screen.getByText('trending')).toBeInTheDocument();
    expect(screen.getByText('holiday')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test -- --watchAll=false --testPathPattern=AVListingCard`
Expected: FAIL — `trending`/`holiday` not in the document (tags not rendered yet).

- [ ] **Step 3: Render StoreTypeTags inside the image wrapper**

In `src/components/AVListingCard/AVListingCard.js`, add `StoreTypeTags` to the components import (line 16):

```js
import { AspectRatioWrapper, NamedLink, ResponsiveImage, AvatarSmall, StoreTypeTags } from '../../components';
```

Then add the overlay inside the `AspectRatioWrapper`, immediately after the `<LazyImage ... />` element (currently lines 154-160), before the closing `</AspectRatioWrapper>`:

```js
          <LazyImage
            rootClassName={css.rootForImage}
            alt={title}
            image={firstImage}
            variants={variants}
            sizes={renderSizes}
          />
          <StoreTypeTags author={author} className={css.storeTags} />
```

- [ ] **Step 4: Add the overlay positioning CSS**

Append to `src/components/AVListingCard/AVListingCard.module.css` (the `AspectRatioWrapper` root is already `position: relative`):

```css
.storeTags {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 1;
  max-width: calc(100% - 16px);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn test -- --watchAll=false --testPathPattern=AVListingCard`
Expected: PASS (existing tests + the new store-tag test).

- [ ] **Step 6: Commit**

```bash
git add src/components/AVListingCard/AVListingCard.js src/components/AVListingCard/AVListingCard.module.css src/components/AVListingCard/AVListingCard.test.js
git commit -m "feat: overlay store-type tags on AVListingCard image

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Fetch author publicData where it is stripped

**Files:**
- Modify: `src/containers/SearchPage/SearchPage.duck.js`
- Modify: `src/extensions/landingPage/av/listings.js`
- Test: `src/containers/SearchPage/SearchPage.test.js`

- [ ] **Step 1: Update the SearchPage test expectation (failing first)**

In `src/containers/SearchPage/SearchPage.test.js`, change the asserted `fields.user` (line 314) to:

```js
    'fields.user': [
      'profile.displayName',
      'profile.abbreviatedName',
      'profile.publicData.userType',
      'profile.publicData.tipoTienda',
    ],
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test -- --watchAll=false --testPathPattern=SearchPage.test`
Expected: FAIL — actual query still has the 2-entry `fields.user`.

- [ ] **Step 3: Add the fields in SearchPage.duck.js**

In `src/containers/SearchPage/SearchPage.duck.js`, change the `'fields.user'` array (currently `['profile.displayName', 'profile.abbreviatedName']`) to:

```js
      'fields.user': [
        'profile.displayName',
        'profile.abbreviatedName',
        // AV: needed by StoreTypeTags overlay on AVListingCard
        'profile.publicData.userType',
        'profile.publicData.tipoTienda',
      ],
```

- [ ] **Step 4: Add the fields in the landing extension**

In `src/extensions/landingPage/av/listings.js`, change the `'fields.user'` line (currently `['profile.displayName', 'profile.abbreviatedName', 'profile.image']`) to:

```js
    'fields.user': [
      'profile.displayName',
      'profile.abbreviatedName',
      'profile.image',
      // AV: needed by StoreTypeTags overlay on AVListingCard
      'profile.publicData.userType',
      'profile.publicData.tipoTienda',
    ],
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn test -- --watchAll=false --testPathPattern=SearchPage.test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/containers/SearchPage/SearchPage.duck.js src/containers/SearchPage/SearchPage.test.js src/extensions/landingPage/av/listings.js
git commit -m "feat: fetch author tipoTienda/userType for store-type tags

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Overlay tags on the ListingPage gallery (both variants)

**Files:**
- Modify: `src/containers/ListingPage/SectionGallery.js` (carousel variant)
- Modify: `src/containers/ListingPage/SectionHero.js` (cover-photo variant)
- Modify: `src/containers/ListingPage/ListingPage.module.css`

> Upstream files — additive, minimal edits (note in commit message per Upstream File Policy). No new test: the existing ListingPage test fixtures have no store author, so `StoreTypeTags` returns `null` and the rendered DOM is unchanged.

- [ ] **Step 1: Add the overlay to SectionGallery**

In `src/containers/ListingPage/SectionGallery.js`:

Add the import after the existing imports (after line 2):

```js
import { StoreTypeTags } from '../../components';
```

Render the overlay inside the `<section>`, before `<ListingImageGallery ... />`:

```js
    <section className={css.productGallery} data-testid="carousel">
      <StoreTypeTags author={listing?.author} className={css.galleryStoreTags} />
      <ListingImageGallery
        images={images}
        imageSlots={imageSlots}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
      />
    </section>
```

- [ ] **Step 2: Add the overlay to SectionHero**

In `src/containers/ListingPage/SectionHero.js`:

Add `StoreTypeTags` to the existing components import (line 4):

```js
import { ResponsiveImage, Modal, StoreTypeTags } from '../../components';
```

Render the overlay inside `.imageWrapperForSectionHero`, as the first child:

```js
      <div className={css.imageWrapperForSectionHero} onClick={handleViewPhotosClick}>
        <StoreTypeTags author={listing?.author} className={css.heroStoreTags} />
        {mounted && listing.id ? (
```

- [ ] **Step 3: Add positioning CSS**

In `src/containers/ListingPage/ListingPage.module.css`:

Add `position: relative;` to `.imageWrapperForSectionHero` (after `composes: heroHeight;`):

```css
.imageWrapperForSectionHero {
  composes: heroHeight;
  position: relative;
  background-color: var(--colorGrey100); /* Loading BG color */

  /* Image carousel can be opened from the image, therefore we should show a pointer */
  cursor: pointer;
}
```

Add `position: relative;` to `.productGallery` (after the opening brace, before `margin`):

```css
.productGallery {
  position: relative;
  margin: 0 0 36px 0;
```

Append the shared overlay rule at the end of the file:

```css
/* AV: store-type tags overlaid on the ListingPage gallery image */
.heroStoreTags,
.galleryStoreTags {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 1;
  pointer-events: none;
}
```

- [ ] **Step 4: Run the ListingPage tests to verify nothing regressed**

Run: `yarn test -- --watchAll=false --testPathPattern=ListingPage`
Expected: PASS (unchanged — no store author in fixtures, overlay renders `null`).

- [ ] **Step 5: Commit**

```bash
git add src/containers/ListingPage/SectionGallery.js src/containers/ListingPage/SectionHero.js src/containers/ListingPage/ListingPage.module.css
git commit -m "feat: overlay store-type tags on ListingPage gallery image

Upstream files (SectionGallery/SectionHero/ListingPage.module.css) — additive
overlay + position:relative only.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Full suite verification

- [ ] **Step 1: Run the entire frontend test suite**

Run: `yarn test -- --watchAll=false`
Expected: PASS — all suites green, including the new configAV, StoreTypeTags, AVListingCard, and SearchPage assertions. If any snapshot legitimately changed, review the diff and run `yarn test -- --watchAll=false -u` only for the intended change.

- [ ] **Step 2: Format**

Run: `yarn run format`
Expected: files formatted (commit if anything changed).

```bash
git add -A
git commit -m "style: prettier formatting for store-type tags" || echo "nothing to format"
```
