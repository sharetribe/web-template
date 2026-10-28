# Topbar config

Optional top bar extras: logo link, custom links, search visibility, and whether unauthenticated
users see “Post a new listing”. Console edits live in `/content/top-bar.json` and land on
`config.topbar`.

There is no local default. The top bar still shows if the hosted asset is missing — the asset only
adds those extras.

## `config.topbar` shape

```js
{
  logoLink, // optional { href } — external marketplace logo target
  customLinks, // optional [{ type, text, href, group? }]
  searchBar, // optional { display: 'always' | 'notLandingPage' | 'onlySearchPage' }
  postListingsLink, // optional { showToUnauthenticatedUsers: boolean }
}
```

`customLinks.type` is `internal` or `external`. `group` is `primary` or `secondary` when set
(primary links prefer the visible top bar).

Used by Topbar / TopbarSimplified, Footer logo linking, and `showCreateListingLinkForUser`.

## When something is wrong

Bad custom links, search display, or post-listings flag are dropped. Does not trigger
MaintenanceMode.
