# Google Search Console config

Optional Google site-verification meta tag. Hosted asset `/integrations/google-search-console.json`
maps to `config.googleSearchConsole`.

Note: the asset allows an empty string — that means unset, same as omitting the field. Tokens with
whitespace are invalid. Missing/empty falls back to built-ins in
[`defaultGoogleSearchConsole.js`](./defaultGoogleSearchConsole.js) (usually `null`), so no meta tag
is rendered.

## `config.googleSearchConsole` shape

```js
{
  googleSiteVerification, // string token or null
}
```

Used by `src/util/seo.js` to render: `<meta name="google-site-verification" content="…" />`.

Missing or invalid tokens fall back to the built-in. Does not trigger MaintenanceMode.
