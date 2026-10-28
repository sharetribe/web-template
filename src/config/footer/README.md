# Footer config

Optional marketplace footer (links, slogan, copyright, social icons). Hosted asset
`/content/footer.json` maps to `config.footer`.

There is no `defaultFooter.js` (no built-in fallback). If the hosted asset is missing or empty, the
footer is not shown.

## What renders it

Pages pass [`FooterContainer`](../../containers/FooterContainer/FooterContainer.js) into the layout
`footer` slot (e.g. `LayoutSingleColumn`). That container:

1. Reads `config.footer` (and `config.topbar.logoLink` for the logo target)
2. Returns `null` when `footer` is an empty object
3. Otherwise adds `sectionId` / `sectionType: 'footer'` and hands the section to **PageBuilder
   `SectionBuilder`**, which renders **`SectionFooter`**

So this config is PageBuilder section data — columns, blocks, social links, slogan, copyright,
appearance. The handler passes that object through; it does not re-validate every PageBuilder field.

## `config.footer` shape

Roughly (hosted asset keys may vary):

```js
{
  numberOfColumns?, // 1–4
  socialMediaLinks?,
  slogan?,
  copyright?,
  appearance?,
  blocks?, // footer / link blocks
}
```

## When something is wrong

Non-object hosted data is ignored (empty footer → not shown). Does not trigger MaintenanceMode.
