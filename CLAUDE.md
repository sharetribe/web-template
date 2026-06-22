# CLAUDE.md

Guidance for Claude Code working in this repository.

## Overview

Customized marketplace ("Archivo Vintach") built on the [Sharetribe Web Template](https://github.com/sharetribe/web-template) (React + Express SSR). Fork of `sharetribe/web-template`, deployed to Heroku (production) and Render.com (staging). Stripe Connect payments via Sharetribe Marketplace API.

- GitHub: https://github.com/honekun/sharetribe-web-template
- Upstream: https://github.com/sharetribe/web-template
- Staging: https://archivo-vintach.onrender.com/
- Docs: https://www.sharetribe.com/docs/

## Commands

```sh
yarn run dev              # Frontend (3000) + backend API (3500) concurrently
yarn run dev-frontend     # Frontend only (webpack-dev-server)
yarn run dev-backend      # Backend API server only (nodemon)
yarn run dev-server       # Production-like SSR with hot reload (4000)
yarn start                # Production server (node server/index.js)

yarn run build            # build-web && build-server
yarn run clean            # Remove build directory

yarn test                                  # Frontend tests, interactive watch
yarn test -- --watchAll=false              # Run all tests once
yarn test -- --testPathPattern=auth        # Match "auth" in path
yarn test -- --testNamePattern="login"     # Match "login" in name
yarn test-server                           # Server tests only
yarn test-ci                               # CI: server then client (--runInBand)

yarn run format / format-ci                # Prettier (write / check)
yarn run config                            # Config validation/setup wizard
yarn run translate                         # Translation management
```

**Node:** `>=18.20.1 <23.2.0` | **Package manager:** Yarn

## Architecture

**Routing & data loading** — Routes in `src/routing/routeConfiguration.js`: each has `path`, `name` (for `NamedLink`/`NamedRedirect`), a `@loadable/component`, and an optional `loadData` thunk. `loadData` runs on both server (`server/dataLoader.js`, before render) and client (`RouteComponentRenderer` in `Routes.js`, on mount/nav). Each container exports `loadData` via `src/containers/pageDataLoadingAPI.js`.

**Redux ducks** — Self-contained modules (`@reduxjs/toolkit` `createSlice`/`createAsyncThunk`). Global ducks in `src/ducks/` (`auth`, `user`, `ui`, `stripe`, `marketplaceData`, …); container ducks colocated. SDK injected as `thunkAPI.extra`. Entities normalized in `marketplaceData.duck.js` (containers hold IDs). Errors via `storableError()`.

**SSR** — Express in `/server/`: `index.js` (middleware/CSP/routes/renderer), `renderer.js` (store + `StaticRouter` → HTML), `dataLoader.js`, `auth.js` (Passport social), `api-util/sdk.js` (cookie token store), `api-util/cache.js` (in-memory LRU, Heroku-safe), `csp.js`. **Guard all browser APIs (`window`/`document`/`localStorage`) behind `typeof window !== 'undefined'`.**

**Container/Page pattern** — `PageName.js` (component + `mapStateToProps` + `compose(connect(...))`), `PageName.duck.js` (state + `loadData`), `PageName.module.css`, optional sub-components.

**PageBuilder** (`src/containers/PageBuilder/`) — Renders dynamic pages from Sharetribe hosted assets. `SectionBuilder.js` maps section configs → components (delegates token parsing to `extensions/pageBuilder/av/sectionStyles.js`); `AVSectionContainer.js` is the AV drop-in replacement for upstream `SectionContainer`, handling all display-option tokens. Section appearance encoded in `sectionName` via `- Token` flags (see Section Display-Option Tokens). Custom sections registered via `options.sectionComponents`.

**Transaction processes** (`src/transactions/transaction.js`) — `default-purchase` (ITEM), `default-booking` (DAY/NIGHT/HOUR/FIXED), `default-inquiry` (INQUIRY), `default-negotiation` (OFFER/REQUEST). State machines in `transactionProcess*.js`. CheckoutPage → `CheckoutPageWithPayment` (Stripe) or `CheckoutPageWithInquiryProcess`.

**SDK** — `sharetribe-flex-sdk`; client wrapper `src/util/sdkLoader.js`, server `server/api-util/sdk.js`. Tokens in HttpOnly cookies (auto-refresh). Hosted assets via `sdk.assets.search()`, cached 1hr server-side.

**Config** (`src/config/`) — Built-in config merged with hosted Sharetribe config at runtime via `util/configHelpers.js`; access via `useConfiguration()`. AV-specific:
- `configListingDisplay.js` — client-only render override map swapping inputs for hosted listing fields (`all_sizes`→`groupedMultiSelect`, `color`→`colorGridPicker`, `brand`→`searchableSelect`). Read by `EditListingDetailsForm`; does NOT change backend search schema.
- `configAV.js` — AV defaults kept out of upstream files: `defaultCountry` (Stripe payment/payout, `REACT_APP_AV_DEFAULT_COUNTRY`); `sellerUserTypes` + `canShowOriginalPrice()` (originalPrice gate); `storeSellerUserType`/`storeTypeFieldKey`/`getStoreTypeTags()` (StoreTypeTags gate/labels); `welcomePopupUserTypes`/`canShowWelcomePopup()`/`welcomePopupSuppressedPaths` (AVWelcomePopup gate). The three gates are intentionally separate.

**Styling** — CSS Modules (`*.module.css`, `className={css.root}`). Globals in `src/styles/`: `marketplaceDefaults.css`, `avBrandOverrides.css`, `customMediaQueries.css`. Theme vars `--marketplaceColor[Dark|Light]`. Dark theme via `css.darkTheme` (section `textColor: 'white'`). **Topbar breakpoint:** desktop topbar shows at `--viewportLarge` (1024px); pages passing `mobileRootClassName={css.mobileTopbar}` must hide `.mobileTopbar` at `--viewportLarge` too (not `--viewportWide`/1600px) or both topbars render on tablet.

**CSS placement (keep upstream files clean).** Never edit an upstream `*.module.css` just to restyle it. Instead:
- **Restyle an existing upstream class/element** (color, spacing, font, layout) → add a global override to `src/styles/avBrandOverrides.css`. Reach scoped classes with `:root [class*='Component_localClass__'] { … }` — the `:root` raises specificity to (0,2,0) so it beats the module's own `.localClass` (0,1,0) regardless of source order (CSS Modules load after the globals). Brand vars (`--av*`) and global element rules also live here.
- **Add a new component-specific class** consumed by JS → put it in a new co-located AV module (`<Component>.av.module.css`) imported by the (already-forked) component, not in the upstream `.module.css`. A global override can't apply a class the module never declares.
- Pristine upstream baseline for diffing/reverting a file: `git diff a252774a -- <file>` (the `upstream/main` merge-base); empty diff = clean. The big forked files (TopbarDesktop/MobileMenu/SearchForm + CustomLinksMenu, SectionBuilder, BlockDefault, SectionFeatures/Footer, vendored `image-gallery.css`) are intentionally kept as-is.

## Custom AV Components

`src/components/`:
- `AVListingCard/` — listing card; overlays `StoreTypeTags` for `vendedor-tienda` authors
- `AVUserCard/` — profile card for `SectionSelectedUser`
- `AVCategoryCard/` — category card for `SectionSelectedCat`; links to `/s?pub_categoryLevel1=<id>`
- `FieldSwatch/` — color swatch display (14 color mappings)
- `FieldColorDropdown/` — dropdown color picker (reuses FieldSwatch colors); Final Form
- `FieldGroupedMultiSelect/` — grouped multi-select, removable yellow chips (`all_sizes`)
- `FieldSearchableSelect/` — searchable single-select combobox (`brand`)
- `NewsletterForm/` — Brevo subscribe; posts `/api/brevo/subscribe`
- `PricingToggle/` — shared pricing card UI (BlockPriceSelector + SectionPriceSelector)
- `StoreTypeTags/` — colored tag chips for `vendedor-tienda`; values from `tipoTienda` user field; gate/labels in `configAV.getStoreTypeTags()`; needs `profile.publicData.{userType,tipoTienda}` in `fields.user` (added to `SearchPage.duck.js` + `extensions/landingPage/av/listings.js`)
- `AVWelcomePopup/` — one-time onboarding modal for new sellers, rendered by `TopbarContainer`; all content via `AVWelcomePopup.<userType>.*` translation keys (empty = hidden); dismissal persists `publicData.onboardingCompleted` via `markVendedorOnboarded`. See `memory/welcome-popup`.
- `IconChat/` — chat bubble SVG; the carousel's "Chat" button (OrderPanel `secondaryCtaButton`)
- `BalanceSummary/`, `PayoutItem/`, `TransactionFilters/` — MyBalancePage UI

**Shared field-controls pattern** (FieldGroupedMultiSelect, FieldColorDropdown, FieldSearchableSelect): clear (×) + toggle (▼/▲) in `.controls` flex group, 32×32px, `border-radius: 4px`. Required translation keys: `expand`/`collapse` (all three); `clearAll` (grouped + color); `clear` (searchable).

`src/containers/ListingPage/AVListingDetails/` — curated attribute summary (brand/sizes/condition/colors/category/género) as `/s?pub_*` links + description excerpt with show more/less; rendered via OrderPanel `detailsSlot`.

**Custom pages:** `MakeOfferPage`, `RequestQuotePage`, `ManageAccountPage` (negotiation); `MyPurchasesPage`, `MySalesPage`, `MyBalancePage`; `BulkImportPage` (`/admin/bulk-import`, admin CSV+image import — see `docs/bulk-import.md`).

### Custom PageBuilder sections (`SectionBuilder/`)

| Section | type / sectionId prefix | Notes |
|---|---|---|
| `SectionHeroCustom2` | `avHero2` / `av-hero2-*` | 2 CTAs, optional mobile bg + bgLink |
| `SectionHeroCustom3` | `avHero3` / `av-hero3-*` | block-based; each block = image strip + overlay |
| `SectionVideoSection` | `avVideo` / `av-video-*` | 50/50 video+text; URL from translation key |
| `SectionPriceSelector` | — | data from `content/pricing-plans.json` |
| `SectionSelectedListings` | `av-selections` | block `blockName` = listing UUID |
| `SectionRecommendedListings` | `av-recommendeds` | block names = listing UUIDs |
| `SectionTagCatListings` | `av-tag-listings` | first block `blockName` = `tag:<v>`/`cat:<v>`/plain |
| `SectionSelectedCat` | `av-selected-cats` | AVCategoryCard; block = category id + title + media |
| `SectionSelectedUser` | `avSelectedUsers` / `av-selected-users-*` | block names = user UUIDs |
| `SectionInstaGrid` | `avInstaGrid` / `av-insta-grid-*` | 2–6 col image grid |

**Custom blocks** (`BlockBuilder/`): `BlockPriceSelector`, `BlockDefault`. `BlockDefault` blockName tokens (parsed in `extensions/pageBuilder/av/blocks.js` `createBlockCustomProps`): `smallerTitles ::` (mirrors `- SmallerTitles`), `mediaTitle ::` (renders media between the title and the rest of the content: title → media → text/CTA), `blueTitle ::` (mirrors `- BlueTitle` but colors only that block's own title, not body-markdown headings); `fullLinks ::` (applies `word-break: keep-all` to links in the block's body `<p>` elements so a word/URL is never broken mid-character — a too-long link overflows at full size instead of splitting).

### ListingPage carousel layout (AVListingPageCarousel)

`src/containers/ListingPage/AVListingPageCarousel.js` is active when `layoutConfig.listingPage?.variantType === 'carousel'`, else `ListingPageCoverPhoto`. (Unused non-AV `ListingPageCarousel.js` also exists.) OrderPanel becomes a fixed bottom-bar modal below 1024px, so the order column is desktop-only. **Sticky-gallery gotcha:** `.reviewsBlock` is kept a sibling *outside* `.galleryColumn` (full-width grid row 2) so it can't inflate the sticky gallery's containing block. OrderPanel accepts `detailsSlot`/`footerSlot`/`hideAuthor`/`secondaryCtaButton` props to restructure without forking. Full detail: `memory/listing-page-carousel-layout`.

### My Purchases / Sales / Balance

`/my-purchases` + `/my-sales` reuse `InboxItem` + `getStateData` from InboxPage; ducks hard-code `only: 'order'` / `only: 'sale'`. `/my-balance` is a seller financial dashboard: **no direct Stripe balance API** — totals computed client-side from transaction `payoutTotal` via `Promise.all` of paginated + 3 summary `sdk.transactions.query()` calls. Shared util `src/transactions/transactionHelpers.js`: `getStatusFromLastTransition`, `getCompletedTransitions`, `getRefundedTransitions`, `buildFilteredQueryParams`. All three registered in `routeConfiguration.js`/`pageDataLoadingAPI.js`/`reducers.js`; linked from TopbarDesktop, TopbarMobileMenu, UserNav.

## Extensions

AV keeps upstream files unmodified via extension architecture in `src/extensions/`. Hooks: `loadDataExtension`, `selectExtensionProps`, `getPageBuilderOptions`, `transformPageData`.

- `landingPage/av/` — `constants.js`, `sections.js`, `listings.js` (`queryListingsByIds`/`queryListingsByFilter`/`parseFilterFromBlockName`), `transform.js`, `index.js` (registers AV sections + wires hooks). `LandingPage.js`/`LandingPage.duck.js` contain **only the extension wiring** (the `mapStateToProps`/`loadData` seam) — add features via the registry, never inline.
- `pageBuilder/av/` — registers `avHero2`/`avHero3`/`avVideo`/`price-columns` for CMSPage; `sectionStyles.js` (`parseSectionCustomOptions`, `parseSectionCtaClass`); `constants.js`; `transform.js`.
- `accountNav/` (`getAccountSettingsTabs()`), `topbar/` (custom link config), `searchFilters/`.
- Redux: `src/ducks/avExtension.duck.js` — `avLandingExtension` slice (`tagListingIds`), SSR-safe, registered in `ducks/index.js`.

## AV-noti: Notifications (Welcome Email + WhatsApp)

Server-side in `server/services/`. `eventPoller.js` polls the Integration API every 5 min (started in `server/index.js`, guarded by `SHARETRIBE_INTEGRATION_CLIENT_ID`; in-memory cursor resets on restart → first boot polls last 10 min). `welcomeEmailService.js` (Brevo email + PDF), `pdfGenerator.js` (PDFKit → `Promise<Buffer>`), `whatsappService.js` (Meta Cloud API, all sends via `sendWhatsApp({phone,templateName,params})`, no-ops if phone/env missing).

Events: `user/created` → welcome email + admin & user WhatsApp; `transaction/transitioned` → buyer/seller WhatsApp by transition; `message/created` → other party. **Never import `server/services/*` in client code.**

Env vars: `SHARETRIBE_INTEGRATION_CLIENT_ID`, `SHARETRIBE_INTEGRATION_CLIENT_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ADMIN_PHONE` (E.164), `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`.

WhatsApp templates (need Meta approval): `av_welcome_user`, `av_admin_new_user`, `av_purchase_confirmed`, `av_sale_received`, `av_delivered`, `av_cancelled`, `av_booking_accepted`, `av_booking_declined`, `av_new_message`.

## Listing Form Customizations (Edit Listing Wizard)

- **Two-column grid** — Details/Delivery/Location panels use `.fieldsGrid` (1fr 1fr at `--viewportMedium`); full-width fields use `.fullWidth`.
- **Photos in Details** — when `requireListingImage(listingTypeConfig)`, the Photos step is hidden and a `PhotoGallerySection` (free-form, max 10, drag-reorder via `@dnd-kit`; merge logic in `reconcileOrderedImages.js`) goes in Details. Otherwise standalone `EditListingPhotosPanel` + `ImageSlot` (4 labeled slots → `publicData.imageSlots`, captions rendered by `ListingImageGallery.js`).
- **Original price** — `publicData.originalPrice` `{amount,currency}`, must exceed `price`; renders as strike-through "was" in OrderPanel + cards.
- **EarningsEstimator** — fee breakdown below price input (simple price only). Fees from `config.earningsEstimate` (`configDefault.js`), env overrides `REACT_APP_PROVIDER_COMMISSION_PERCENTAGE` (10), `REACT_APP_STRIPE_FEE_PERCENTAGE` (2.9), `REACT_APP_STRIPE_FEE_FIXED_AMOUNT` (30¢).

**CMSPage pricing asset:** `CMSPage.duck.js` fetches `content/pricing-plans.json` → `state.CMSPage.pricingPlansData` (intl fallback). Schema in `docs/ai_notes.md` §4.

## Testing Conventions

Every new AV component/page ships a co-located `.test.js`. Use `renderWithProviders` from `src/util/testHelpers` (RTL + Redux store + router).

```js
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import '@testing-library/jest-dom';
const { screen } = testingLibrary;
```

Minimum: `AV*` components → render + props + snapshot; `*Page/` containers → smoke + snapshot; `util/*.js` → unit tests per export; `extensions/*` → registry/detection tests. Ducks/utils → pure unit tests. Always run `yarn test -- --watchAll=false` before declaring done.

**Gotchas (upstream v11.x merges):**
- `formatMoney(intl, money)` (`util/currency.js`) uses `new Intl.NumberFormat('en-US')` directly — ignores `intl`. Assert formatted strings (`'$20.00'`; negatives `-$2.00`).
- `currencyDisplay: 'narrowSymbol'` → MXN renders as `$` (not `MX$`) in en-US. Regenerate old snapshots (`yarn test -u`).
- `validSchemaOptions` needs `enumOptions[].option` to be a **string** — `{ option: '29', label: '29' }`, not numeric (silently dropped + warns).
- `ResponsiveImage` builds `srcset`, not `src`. Assert `'srcset'`; mocked variant keys must match the consumer's `variants` prop.
- `ProfileSettingsForm` renders `bioHeadingVendedor`/`bioHeadingTienda` per-userType (no single `bioHeading`, no `bioLabel` — textarea uses a placeholder).
- `Unsupported listing extended data configurations detected` warning (`configHelpers.js:874`) is upstream signal, not noise — fires when narrow test listingTypes don't intersect default fixtures. Don't broaden fixtures.

## Section Display-Option Tokens

Encode in `sectionName` as `- Token` suffixes (space-dash-space). Parsed by `parseSectionCustomOptions()` in `extensions/pageBuilder/av/sectionStyles.js` — **never read `sectionName` directly in section components.**

Operator-facing reference for the full set lives in `docs/operator-guide.md` §5.1.

| Token | Property | Effect |
|-------|----------|--------|
| `- Large` | `isLarge` | Wider content area (max 1370px) |
| `- FullW` | `isFullW` | Full width, edge to edge |
| `- FullWHeader` | `isFullWHeader` | Header children span full width |
| `- ShortHero` | `isShortHero` | Reduced hero height (avHero2; consumed in SectionHeroCustom2) |
| `- 2/3 cols` | `isTwoThirdsCols` | One-third/two-thirds split (SectionColumns) |
| `- AvFeature` / `- ReverseFeature` | `isAvFeature` / `isReverseFeature` | Feature layout (SectionFeatures); AvFeature also sets full-bleed in AVSectionContainer |
| `- BlueTitle` / `- WhiteTitle` | `isBlueTitle` / `isWhiteTitle` | Title color |
| `- CenterTitleText` / `- CenterDescText` | `isCenterTitleText` / `isCenterDescText` | Center title / description |
| `- LargeDesc` | `isLargeDesc` | Wider description max-width |
| `- SmallerTitles` | `isSmallerTitles` | All headings down one level (H1→30/H2→20/H3→18/H4→16/H5→14px) |
| `- NoPaddings` | `hasNoPaddings` | Remove all paddings |
| `- SmallGapCols` | `hasSmallGapCols` | Column/grid sections: 8px column gap (sets `--avSectionColGap`) |
| `- SmallGapRows` | `hasSmallGapRows` | Column/grid sections: 8px row gap (sets `--avSectionRowGap`) |
| `- NoGapCols` | `hasNoGapCols` | Column/grid sections: 0 column gap (sets `--avSectionColGap`) |
| `- NoGapRows` | `hasNoGapRows` | Column/grid sections: 0 row gap (sets `--avSectionRowGap`) |

**CTA tokens** (`parseSectionCtaClass`): `- SectionCtaBtn{Blue,LightBlue,Purple,Pink,Yellow}`. **Modifiers:** `- RoundedFull`, `- Rounded`, `- Square`, `- Dashed`, `- Solid`, `- NoOutline`, `- HeadingFont`, `- BodyFont`, `- AccentFont`, `- CtaBtnCenter`.

To add a token: add `hasToken(sectionName, 'MyToken')` in `parseSectionCustomOptions()` + a CSS class in `AVSectionContainer` (and document it in operator-guide §5.1).

## Coding Conventions

- Sharetribe conventions: CSS Modules, functional React, Redux ducks.
- Client env vars use `REACT_APP_` prefix; server secrets do not.
- Prefer extending over overriding core template files (reduces merge conflicts).
- Always use Stripe Connect — never direct charges.
- Heroku filesystem is ephemeral — never write files to disk at runtime.

## Upstream File Policy

**Do not modify upstream Sharetribe files unless there is no alternative.** First ask: can this be a custom component, config file, extension hook, or CSS override instead? Only touch upstream files when genuinely required (new route, nav link). Keep changes minimal — add, don't rewrite.

### Watchlist — high merge-conflict risk

| File | Why touched |
|---|---|
| `components/CustomExtendedDataField/CustomExtendedDataField.js` | `groupedMultiSelect` + `colorGridPicker` branches |
| `components/FieldCurrencyInput/FieldCurrencyInput.js` | Price inputs forced to `en-US` (`$1,325.00`) to match `formatMoney` display — was locale-dependent `1.325,00 $` |
| `util/configHelpers.js` | Listing field merge (code wins over Console) |
| `containers/SearchPage/FilterComponent.js` | Custom filter type branches (delegates to `searchFilters/avFilters`) |
| `containers/SearchPage/SearchPageWithGrid.js` | Grouped-sizes filter injection (`injectAvFilters`) |
| `PageBuilder/BlockBuilder/{BlockBuilder,BlockDefault}.js` | Custom block registration |
| `PageBuilder/SectionBuilder/SectionBuilder.js` | Custom section registration |
| `translations/en.json` | AV keys mixed with upstream |
| `TopbarContainer/Topbar/TopbarDesktop/CustomLinksMenu/*` | AV user/category dropdowns (~480 LOC) |
| `CheckoutPage/CheckoutPageWithPayment.js` | Default Stripe country (`configAV.defaultCountry`) |
| `EditListingWizard/EditListingWizard.js` | Default Stripe Connect payout country |
| `EditListingWizard/EditListingWizardTab.js` | `currentUser` prop drilling for pricing |
| `EditListingWizard/EditListingDetailsPanel/EditListingDetailsForm.js` | Two-column grid + `PhotoGallerySection` |
| `EditListingWizard/EditListingPricingPanel/EditListingPricing{Panel,Form}.js` | `originalPrice` field (gated by `configAV`) |
| `ManageListingsPage/ManageListingsPage.js` | "Create listing" `NamedLink` heading |
| `components/UserNav/UserNav.js` | Active-state expanded to all account pages |
| `containers/ProfilePage/ProfilePage.js` | `ListingCard` → `AVListingCard` swap |
| `containers/AuthenticationPage/UserFieldDisplayName.js` | Per-userType display-name label (store sellers) |
| `containers/ListingPage/SectionHero.js` | `StoreTypeTags` overlay on the gallery hero |
| `containers/ListingPage/CustomListingFields.js` | Force-show the hosted-hidden `tags` field |
| `PageBuilder/SectionBuilder/SectionColumns/SectionColumns.js` | `AVSectionContainer` + `2/3 cols` token |
| `PageBuilder/SectionBuilder/SectionCarousel/SectionCarousel.js` | `AVSectionContainer` + `useDebouncedWindowResize` |
| `components/CustomExtendedDataSection/CustomExtendedDataSection.js` | Custom `color`/`all_sizes` display dispatch (key→component map) |
| `components/LayoutComposer/LayoutSideNavigation/LayoutWrapperAccountSettingsSideNav.js` | Account tabs from `getAccountSettingsTabs()` extension |

Also high-conflict on sync: `SearchResultsPanel.js` (AVListingCard swap), `CMSPage.js` (section injection), `TopbarDesktop.js`/`TopbarMobileMenu.js`/`UserNav.js` (nav links), `EditListingPhotosPanel/`, `EditListing{Delivery,Location}Form.js` (grid wrappers), `EditListingPricingAndStockPanel.js` (EarningsEstimator + originalPrice), `SectionGallery.js`/`ListingImageGallery.js` (imageSlots captions), `OrderBreakdown.js` (`LineItemProviderCommissionFixedMaybe`), `OrderPanel.js` (originalPrice), `configDefault.js` (earningsEstimate). Small CSS-module forks (restyles kept inline due to scoped-class/var coupling — see the `AV:` comments in each): `SectionContainer.module.css`, `SectionListings.module.css`, `FilterPlain.module.css`.

Brand colors and the `TabNavHorizontal` `darkSkin` reskin were consolidated into `avBrandOverrides.css` (commit `c3bfa1b06`), so `marketplaceDefaults.css` and `TabNavHorizontal.module.css` are now upstream-clean — do not re-add AV CSS to them.

### Unavoidable upstream files — append AV additions at the bottom

| File | AV addition |
|---|---|
| `routing/routeConfiguration.js` | Custom page routes |
| `containers/pageDataLoadingAPI.js` | `loadData` exports |
| `containers/reducers.js` | Custom page reducers |
| `ducks/index.js` | `avExtension` duck |
| `server/index.js` | AV-noti poller + `mountCustomApiRoutes(app)` (before `app.use('/api', apiRouter)`) |
| `server/customApiRoutes.js` | AV-owned: `/api/brevo`, `/api/instagram`, `/api/my-balance`, `/api/bulk-import` |

## Deployment

- **Production (Heroku):** `git push heroku main` — `heroku-postbuild` runs `yarn build`.
- **Staging (Render.com):** Stripe test keys (`pk_test_`/`sk_test_`); may cold-start.

## Upstream Sync

```sh
git remote add upstream https://github.com/sharetribe/web-template.git
git fetch upstream && git merge upstream/main
```

Resolve conflicts reviewing customized areas first: `src/config`, `src/components`, customized containers, `src/extensions/`. See the Watchlist above for the highest-risk files.

## Documentation

`docs/` (read before changing the related subsystem): `bulk-import.md`, `listing-custom-fields-setup.md`, `console-customization-guide.md`, `test-account-setup.md`, `bidding-research.md`, `ai_notes.md`.

Implementation plans (written 2026-06-12, **not yet implemented** — execute task-by-task per plan headers): `plan-bulk-import-all-users.md`, `plan-favorites-page.md`, `plan-shopping-bag.md`.
