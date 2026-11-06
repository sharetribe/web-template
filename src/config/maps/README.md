# Maps config

Map provider and API tokens come from Console (`integrations/map.json`) into `config.maps`.
Location-search defaults and fuzzy matching always come from [`defaultMaps.js`](./defaultMaps.js) —
the hosted asset does not override them.

Tokens usually fall back to env vars in `defaultMaps.js`. Only the selected provider’s token is
validated.

## `config.maps` shape

```js
{
  mapProvider, // hosted provider → 'mapbox' | 'googleMaps'
  mapboxAccessToken, // hosted or built-in (often REACT_APP_MAPBOX_ACCESS_TOKEN)
  googleMapsAPIKey, // hosted googleMapsApiKey or built-in (often REACT_APP_GOOGLE_MAPS_API_KEY)
  search, // always from defaultMaps.js (suggestCurrentLocation, defaults, …)
  fuzzy, // always from defaultMaps.js
}
```

Default location suggestions live in [`defaultLocationSearches.js`](./defaultLocationSearches.js)
and are wired through `defaultMaps.js` → `config.maps.search.defaults`.

## When something is wrong

Unsupported provider or a missing/invalid token for the selected provider keeps the provider when
possible and fills the token from built-ins. Mapbox tokens must look like `pk.*.*`; Google keys must
be non-empty and at most 255 characters.

If the selected provider still has no usable token after merge, a console error is logged. That does
not trigger MaintenanceMode.
