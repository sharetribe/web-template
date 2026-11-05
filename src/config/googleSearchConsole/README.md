# Google Search Console config

Optional Google site-verification meta tag. Console edits live in
`/integrations/google-search-console.json` and land on
`config.googleSearchConsole.googleSiteVerification`.

Console allows an empty string (`pattern: ^\S*$`) — that means unset, same as omitting the field.
Tokens with whitespace are invalid. Missing/empty falls back to the built-in in
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
