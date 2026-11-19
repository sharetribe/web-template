# Analytics config

Analytics wires Google Analytics 4 and/or Plausible. Hosted asset `/integrations/analytics.json`
maps to `config.analytics`.

When a hosted provider is off or invalid, built-ins in
[`defaultAnalytics.js`](./defaultAnalytics.js) (often env vars) are used.

## `config.analytics` shape

```js
{
  googleAnalyticsId?, // GA4 measurement id (e.g. "G-…"); from hosted or built-in
  plausibleDomains?, // comma-joined domains; hosted and/or built-in
}
```

Hosted asset (before merge) looks like:

```js
{
  googleAnalytics?: { enabled, measurementId }, // measurementId must start with "G-"
  plausible?: { enabled, domain }, // non-empty domain, no http(s):// prefix
}
```

## When something is wrong

If GA or Plausible is enabled without a valid id/domain, that hosted provider is ignored and the
built-in is used if one is set. Does not trigger MaintenanceMode.
