# SearchPage

> **Note:** _category_ and _amenities_ filters are not actually filtering anything by default. They
> are tied to [extended data](https://www.sharetribe.com/docs/references/extended-data/), which is
> likely to be customized in every marketplace. You can add public data to listing entity in your
> client app, but to make it work as a search filter, see this article:
> https://www.sharetribe.com/docs/flex-cli/manage-search-schemas-with-flex-cli/

## Structure

There are 2 layout variants in use:

- SearchPageWithMap
  - Contains Topbar, main panel (for results and filters), and SearchMap
- SearchPageWithGrid
  - Contains Topbar, filter column, main panel for search results (ListingCards).

Searches can be made by each of these components.

- Topbar contains location search (LocationAutocompleteInput)
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
[filters documentation](https://www.sharetribe.com/docs/cookbook-search/change-search-filters-in-ftw/).

### SeachPage schema / SEO

Schema is created inside `createSearchResultSchema` in _SearchPage.helpers.js_. It needs listings
and address to make meaningful JSON-LD presentation for search engines.
