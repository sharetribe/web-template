# Maps config

Map provider and API tokens come from hosted asset `/integrations/map.json` into `config.maps`.
Location-search (`search`) and fuzzy matching always come from built-ins in
[`defaultMaps.js`](./defaultMaps.js) — the hosted asset does not override them.

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

[`LocationAutocompleteInput`](../../components/LocationAutocompleteInput/LocationAutocompleteInput.js)
shows built-in location suggestions in its dropdown when the input is focused and the user has not
typed anything yet. Edit those places in
[`defaultLocationSearches.js`](./defaultLocationSearches.js). They land on
`config.maps.search.defaults` via [`defaultMaps.js`](./defaultMaps.js).

## When something is wrong

Unsupported provider or a missing/invalid token for the selected provider keeps the provider when
possible and fills the token from built-ins. Mapbox tokens must look like `pk.*.*`; Google keys must
be non-empty and at most 255 characters.

If the selected provider still has no usable token after merge, `console.error` logs a message in
the browser (or Node) developer console. That does not trigger MaintenanceMode.
