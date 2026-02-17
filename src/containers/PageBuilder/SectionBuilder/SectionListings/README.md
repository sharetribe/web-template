# Featured Listings

The Sharetribe Web Template supports a "Featured Listings" section on content pages. This allows
operators to configure a featured listings section through the Console that is rendered on content
pages, i.e. the landing page, CMS pages, etc. The featured listings section can be toggled to either
fetch the 10 newest listings or you can use a query string that's used to make a call to the API.

Component specific files:

- `src/containers/PageBuilder/SectionBuilder/SectionListings/SectionListings.js`
- `src/containers/PageBuilder/SectionBuilder/SectionListings/SectionListings.module.css`
- `src/ducks/featuredListings.duck.js`

## Asset data structure

Examples of [asset data](https://www.sharetribe.com/docs/references/assets/) (i.e. the data
configured via Console) that the template uses to render the Featured Listings section.

Example 1, using the "newest" setting:

```json
{
  "title": {
    "fieldType": "heading2",
    "content": "Featured listings"
  },
  "description": {
    "fieldType": "paragraph"
  },
  "callToAction": {
    "fieldType": "none"
  },
  "appearance": {
    "fieldType": "defaultAppearance"
  },
  "numColumns": 4,
  "listingSelection": "newest",
  "sectionName": "Featured listings",
  "sectionType": "listings"
}
```

Example 2, using the "specific listings" setting:

```json
{
  "title": {
    "fieldType": "heading2",
    "content": "Featured listings"
  },
  "description": {
    "fieldType": "paragraph"
  },
  "callToAction": {
    "fieldType": "none"
  },
  "appearance": {
    "fieldType": "defaultAppearance"
  },
  "numColumns": 4,
  "listingSelection": "queryString",
  "listingSearchQuery": "price=10000%2C20001",
  "sectionName": "Featured listings",
  "sectionType": "listings"
}
```

`listingSelection` can be either `newest` or `queryString`. `queryString` uses a query string from
Console's "Manage Listings" to feature a filtered set of listings. `numColumns` can be either 3 or
4, and the template renders the carousel component accordingly.

To feature a specific set of listings via Console:

1. Go to Console > Manage > Listings
2. Use the filters to find the listings you want to feature
3. Click "Copy search query" to copy the query string
4. Paste the query string into the "Listing search query" field in the section settings in Pages

## Limitations

Limitations built into the template that can be modified:

- The template will render max 10 listings. See `const MAX_LISTING_COUNT = 10;` in
  `featuredListings.duck.js` to modify.
- Each page can have up to 10 featured listing sections. See `limitListingsSections` in `data.js` to
  modify.

## Carousel component height

The carousel container needs a pre-calculated height to avoid layout shifts while listings load.
This is handled by `calculateCarouselHeight` in `SectionListings.js`.

The function contains hardcoded values that mirror CSS properties in `ListingCard.module.css`. If
you modify ListingCard's font sizes, padding, margins, or layout, you must update
`calculateCarouselHeight` to match. The coupled properties are marked with `⚠️` comments in both
files.

Error and empty states return fixed heights (250px and 220px respectively).

## Query string examples

The `listingSearchQuery` value is a URL-encoded query string in the same format used by the
[Marketplace API `listings.query` endpoint](https://www.sharetribe.com/api-reference/marketplace.html#query-listings).
The operator copies it from Console's "Manage Listings" and it arrives to the template URL-encoded.

In `featuredListings.duck.js`, the query string is spread into the `sdk.listings.query()` call as
the first element of the params array, where it gets merged with the default params (`perPage`,
`minStock`, `include`, image variants, etc.). This is syntactic sugar for the
sharetribeSdk.util.queryString method. Read more about query parameter serialization in the SDK
docs: https://sharetribe.github.io/flex-sdk-js/query-parameter-serialization.html

Some examples:

Newest listings in a specific category:

```
pub_categoryLevel1=camping-and-outdoors
```

Listings within a price range (values in subunits, e.g. under \$200):

```
price=0%2C20001
```

Category + price range:

```
pub_categoryLevel1=camping-and-outdoors&price=0%2C5000
```

Keyword search:

```
keywords=vintage%20camera
```

Filters combinations not available in Console can still be entered manually as long as they are
valid API query parameters. See
[Marketplace API: Query listings](https://www.sharetribe.com/api-reference/marketplace.html#query-listings).

## Edge cases

- If a listing is closed, deleted, or out of stock, it won't appear (listings endpoint only returns
  open listings)
- A section may end up showing fewer than the expected number of listings (or even zero)
- If no listings match the query or all matching listings are unavailable, the section displays a
  message: _"We couldn't find any listings for this section."_ along with a CTA to browse all
  listings on the search page.
- If the API request fails, the section displays a generic error message.

## State management

State is organized by page and section. Sample of what state may look like:

```
featuredListings: {
  'landing-page': {
    'section-1': { selection: 'newest', listingIds: [...], fetched: true, inProgress: false },
    'section-3': { selection: 'queryString', listingIds: [...], fetched: true, inProgress: false }
  }
}
```

- If multiple sections on the same page use "newest" selection, they share the same API response to
  avoid redundant requests
- Each section with a custom query makes a new API call
- Listing entities are stored in the shared `marketplaceData` reducer (via `addMarketplaceEntities`)
  and retrieved by ID

## Lazy loading

Sections use LazyLoading and images are only loaded once the user scrolls down to the actual
section. When the section is rendered inside the modal on AuthenticationPage (if you add this
section to either the PrivacyPolicyPage or the TermsOfServicePage, a user can open these pages
wrapped inside a modal on the AuthenticationPage) LazyLoading is disabled.
