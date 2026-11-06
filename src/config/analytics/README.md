# Analytics config

Analytics wires Google Analytics 4 and/or Plausible. Console edits live in
`integrations/analytics.json` and land on `config.analytics`.

When a hosted provider is off or invalid, values from [`defaultAnalytics.js`](./defaultAnalytics.js)
(often env vars) are used.

## `config.analytics` shape

```js
{
  googleAnalyticsId?, // GA4 measurement id (e.g. "G-…"); from hosted or defaultAnalytics.js
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
built-in value is used if one is set. Does not trigger MaintenanceMode.
