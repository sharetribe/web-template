# SearchPage

This page handles searches for listings. Most of the configuration comes from hosted assets that are
defined through Console. There you can configure

- **custom listing fields** with search schema of enum, multi-enum or text
  - Configured through listing-fields.json
- **categories**
  - Configured through both listing-search.json and listing-categories.json
  - Categories support nesting
  - It might use multiple query parameters: pub_categoryLevel1, pub_categoryLevel2,
    pub_categoryLevel3
- **built-in filters**: price, dates, keywords
  - Configured through listing-search.json

## Structure

There are 2 layout variants in use:

- SearchPageWithMap
  - Contains Topbar, main panel (for results and filters), and SearchMap
- SearchPageWithGrid
  - Contains Topbar, filter column, main panel for search results (ListingCards).

Searches can be made by each of these components.

- SearchPage.shared.js file contains shared functions for both page layout variants
- Topbar contains location search (LocationAutocompleteInput) or Keywords search
  - The main search type set through hosted asset: listing-search.json
- MainPanel has Filters that can fine-tune current location search
- SearchMap can create new location searches when the map's bounding box changes (i.e. moving,
  zooming, etc.)

## Topbar

Topbar contains location search (LocationAutocompleteInput).

In contrast to other pages, Topbar gets `currentSearchParams` among other props. This makes it
possible for Topbar to take current filters into account.

## Filter column (SearchPageWithGrid)

Contains all the filters in an order: primary filters, default filters, secondary filters. These
filters are in live-edit mode: chaning the values immediately fires a new search.

## Main panel (SearchPageWithGrid)

This UI section contains search results (ListingCards)

## Main panel (SearchPageWithMap)

This UI section has two functions: showing search results and filters. Filters are primarily added,
removed, reordered and configured through hosted config (Listing Fields).

There you can set some filters to be primary filters. They are shown always on top of SearchResults
as dropdown-selections on Desktop layout. We recommend that only 1 - 3 primary filters are passed in
since they start to take too much space on narrow screens.

If there are secondary filters, they create one more button to the space containing primary filters:
_More filters_. This more-filters button opens up a SearchFiltersSecondary component that can be
changed to show those extra filters passed to it.

You need to click "Apply" button to apply search filters on desktop layout.

On the mobile layout, all the filters are shown in separate mobile filters modal. The order of
filters is following the order of filters config in hosted config (Listing Fields). These work on
live-edit mode: chaning the values immediately fires a new search.

## SearchMap (SearchPageWithMap)

SearchMap listens to 'idle' event and SearchPage function `onIndle` can create a new location search
if SearchMap's bounds have changed enough.

## Other things to consider

### Search filters

See the
[filters documentation](https://www.sharetribe.com/docs/how-to/change-search-filters-in-template/).

In addition to enum, multi-enum, and text search schemas, Marketplace API supports also **long** and
**boolean** search schemas for extended data. However, this template does not yet have filter
components for those search schema types. (I.e. you need to build them yourself).

> **Note:** You can add public data to listing entity through your client app too, but to make it
> work as a search filter, see this article:
> https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-sharetribe-cli/

### SeachPage schema / SEO

Schema is created inside `createSearchResultSchema` in _SearchPage.helpers.js_. It needs listings
and address to make meaningful JSON-LD presentation for search engines.
