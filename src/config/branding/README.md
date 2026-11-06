# Branding config

Branding covers marketplace colors, logos, favicon, and social images. Console edits live in
`design/branding.json` and land on `config.branding`.

If a hosted value is missing or invalid, built-ins in [`defaultBranding.js`](./defaultBranding.js)
fill some gaps (for example main color and logo URL). Primary button color falls back to CSS
(`#138041`) when omitted. Hosted values win when they’re usable.

## `config.branding` shape

```js
{
  marketplaceColor, // hosted marketplaceColors.mainColor (+ Dark/Light HSL)
  marketplaceColorDark,
  marketplaceColorLight,
  colorPrimaryButton, // hosted marketplaceColors.primaryButton (+ Dark/Light); else CSS #138041
  colorPrimaryButtonDark,
  colorPrimaryButtonLight,
  logoImageDesktop, // hosted logo (required) or built-in URL
  logoImageMobile, // same logo asset as desktop
  logoSettings, // { format: 'image', height: 24 | 36 | 48 }
  brandImage, // hosted loginBackgroundImage; no built-in fallback
  facebookImage, // hosted socialSharingImage scaled1200 or built-in URL
  twitterImage, // hosted socialSharingImage scaled600 or built-in URL
  favicon?, // browser tab / bookmark icons
  appIcon?, // mobile home-screen / apple-touch icon (180×180)
}
```

Hosted-only notes:

- `marketplaceColors.notificationPrimaryButton` is dropped (email templates only).
- Other hosted keys are not copied onto `config.branding`.

## When something is wrong

- **Missing logo** → MaintenanceMode (`BRANDING_MISSING_LOGO`).
- Invalid main color hex → use the built-in marketplace color.
- Invalid primary button hex → omit; CSS default applies.
- Invalid `logoSettings` → `{ format: 'image', height: 24 }`.
- Missing or invalid favicon → omit favicon tags.
- Invalid social sharing image → built-in Facebook/Twitter image URLs.
