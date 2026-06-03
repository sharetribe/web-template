# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Customized marketplace ("Archivo Vintach") built on the [Sharetribe Web Template](https://github.com/sharetribe/web-template) (React + Express SSR). Fork of `sharetribe/web-template`, deployed to Heroku (production) and Render.com (staging). Uses Stripe Connect for payments via Sharetribe Marketplace API.

- GitHub: https://github.com/honekun/sharetribe-web-template
- Upstream: https://github.com/sharetribe/web-template
- Staging: https://archivo-vintach.onrender.com/
- Docs: https://www.sharetribe.com/docs/

## Commands

```sh
yarn run dev              # Frontend (port 3000) + backend API server (port 3500) concurrently
yarn run dev-frontend     # Frontend only (webpack-dev-server via sharetribe-scripts)
yarn run dev-backend      # Backend API server only (nodemon)
yarn run dev-server       # Full production-like SSR with hot reload (port 4000)
yarn start                # Production server (node server/index.js)

yarn run build            # Build web bundle + server (build-web && build-server)
yarn run clean            # Remove build directory

yarn test                 # Frontend tests (Jest + React Testing Library, interactive watch mode)
yarn test -- --watchAll=false              # Run all tests once (no watch)
yarn test -- --testPathPattern=auth        # Run tests matching "auth" in path
yarn test -- --testNamePattern="login"     # Run tests matching "login" in name
yarn test-server                           # Server tests only (jest ./server/**/*.test.js)
yarn test-ci                               # CI: server tests then client tests (--runInBand)

yarn run format           # Prettier (JS + CSS)
yarn run format-ci        # Check formatting without modifying
yarn run config           # Config validation/setup wizard
yarn run translate        # Translation management
```

**Node:** `>=18.20.1 <23.2.0` | **Package manager:** Yarn

## Architecture

### Routing & Data Loading

Routes defined in `src/routing/routeConfiguration.js` — each route specifies a `path`, `name` (used by `NamedLink`/`NamedRedirect`), a `@loadable/component` for code-splitting, and an optional `loadData` thunk for SSR data prefetching.

The `loadData` pattern is critical: server calls `loadData` before rendering (via `server/dataLoader.js`), and the client calls it again on mount/navigation (via `RouteComponentRenderer` in `src/routing/Routes.js`). Each container exports its `loadData` through `src/containers/pageDataLoadingAPI.js`.

### Redux (Ducks Pattern)

State is organized as Redux ducks — self-contained modules with action types, creators, reducers, and selectors in a single file. Uses `@reduxjs/toolkit` (`createSlice`, `createAsyncThunk`).

- **Global ducks** in `src/ducks/`: `auth`, `user`, `routing`, `ui`, `stripe`, `stripeConnectAccount`, `paymentMethods`, `marketplaceData` (normalized entities), `hostedAssets`, `emailVerification`
- **Container ducks** colocated: `src/containers/SearchPage/SearchPage.duck.js`, etc.
- SDK instance is injected as `thunkAPI.extra` in async thunks
- Entities (listings, users, transactions) are normalized in `marketplaceData.duck.js`; containers hold references by ID
- Errors serialized via `storableError()` util

### SSR (Server-Side Rendering)

Express server in `/server/`. Key files:
- `server/index.js` — middleware stack (helmet, CSP, compression, auth, API routes, renderer)
- `server/renderer.js` — creates Redux store, renders React to string with `StaticRouter`, injects state into HTML
- `server/dataLoader.js` — matches URL to route, calls `loadData` before render
- `server/auth.js` — Passport for social auth (Facebook, Google)
- `server/api-util/sdk.js` — server-side SDK instantiation with token store from cookies
- `server/api-util/cache.js` — in-memory LRU cache (Heroku-safe, ephemeral)
- `server/csp.js` — Content Security Policy configuration

**SSR constraint:** Guard all browser APIs (`window`, `document`, `localStorage`) behind `typeof window !== 'undefined'` checks.

### Container/Page Pattern

Each page container has:
1. **Component** (`PageName.js`) — React component with `mapStateToProps`, wrapped via `compose(connect(...))`
2. **Duck** (`PageName.duck.js`) — Redux state, `loadData` thunk, SDK calls
3. **Styles** (`PageName.module.css`) — CSS Modules
4. Optional sub-components in subdirectories

### PageBuilder (CMS-Driven Pages)

`src/containers/PageBuilder/` renders dynamic pages from Sharetribe hosted assets (JSON from Console CMS).

- `PageBuilder.js` — orchestrator
- `SectionBuilder/SectionBuilder.js` — maps section configs to components; delegates sectionName token parsing to `src/extensions/pageBuilder/av/sectionStyles.js`
- `SectionBuilder/SectionContainer/AVSectionContainer.js` — AV drop-in replacement for upstream `SectionContainer`; handles all display-option tokens from `parseSectionCustomOptions()` without touching upstream files
- 11+ section types in `SectionBuilder/Section*/` (7 upstream + multiple custom AV sections)
- Custom sections registered via `options.sectionComponents` prop
- Section appearance encoded in `sectionName` string via `- Token` flags (e.g., `- Large`, `- ShortHero`, `- CenterTitleText`); parsed by `parseSectionCustomOptions()` in `sectionStyles.js`

**PageBuilder extensions** (`src/extensions/pageBuilder/`):
- `av/index.js` — registers AV section components for CMSPage: `avHero`, `avHero2`, `avHero3`, `avVideo`, `price-columns`
- `av/sectionStyles.js` — `parseSectionCustomOptions(sectionName)` parses all `- Token` display flags; `parseSectionCtaClass()` parses CTA button style tokens
- `av/constants.js` — section type + ID prefix constants (re-exports CMSPage duck IDs)
- `av/transform.js` — rewrites AV sections before render (pulls text/links from intl + pricing asset)

### Transaction Processes

4 transaction types defined in `src/transactions/transaction.js`:
- **Purchase** (`default-purchase`) — one-time buy, unit type: ITEM
- **Booking** (`default-booking`) — time-based, unit types: DAY/NIGHT/HOUR/FIXED
- **Inquiry** (`default-inquiry`) — contact only, unit type: INQUIRY
- **Negotiation** (`default-negotiation`) — offer/counter-offer, unit types: OFFER/REQUEST

Each has a state machine in `src/transactions/transactionProcess*.js`. CheckoutPage dispatches to either `CheckoutPageWithPayment` (Stripe) or `CheckoutPageWithInquiryProcess`.

### API Integration (Sharetribe SDK)

- Package: `sharetribe-flex-sdk`
- Client-side wrapper: `src/util/sdkLoader.js`
- Server-side: `server/api-util/sdk.js`
- Token management: HttpOnly cookies via `expressCookieStore`, auto-refresh by SDK
- Hosted assets (CMS content, translations) fetched via `sdk.assets.search()`, cached 1hr server-side

### Config System

Files in `src/config/`: `configDefault.js`, `configListing.js`, `configSearch.js`, `configStripe.js`, `configUser.js`, `configLayout.js`, `configBranding.js`, `configMaps.js`, etc.

Built-in config is merged with hosted config from Sharetribe assets at runtime via `src/util/configHelpers.js`. Access in components via `useConfiguration()` hook from `src/context/configurationContext`.

**Listing field display overrides:** `src/config/configListingDisplay.js` is a client-only override map that swaps the default input for hosted-asset listing fields (e.g., `all_sizes` → `groupedMultiSelect` with Standard/MX/US/Curvy groups; `color` → `colorGridPicker`; `brand` → `searchableSelect`). Read by `EditListingDetailsForm`. Does NOT change backend search schema — render-only.

**AV-owned defaults:** `src/config/configAV.js` holds AV-specific defaults to keep upstream files free of marketplace literals. Exports:
- `defaultCountry` — ISO 3166-1 alpha-2 used by `CheckoutPageWithPayment.js` (Stripe payment + recipient country) and `EditListingWizard.js` (Stripe Connect payout country). Override via `REACT_APP_AV_DEFAULT_COUNTRY`.
- `sellerUserTypes` + `canShowOriginalPrice(currentUser)` — single source of truth for the originalPrice (strike-through "was") field gate; read by both `EditListingPricingAndStockPanel.js` and `EditListingPricingPanel.js`. Add new seller userTypes here rather than inlining `includes(userType)` checks.
- `storeSellerUserType` (`'vendedor-tienda'`) + `storeTypeFieldKey` (`'tipoTienda'`) + `getStoreTypeTags(author, config)` — gate/label logic for the `StoreTypeTags` overlay (see Custom AV Components). Intentionally separate from `sellerUserTypes` (the originalPrice gate is unrelated).
- `welcomePopupUserTypes` (`['vendedor', 'vendedor-tienda']`) + `canShowWelcomePopup(currentUser)` + `welcomePopupSuppressedPaths` (`['/signup']`) — eligibility gate for the `AVWelcomePopup` (see Custom AV Components), read by `TopbarContainer.js`. `canShowWelcomePopup` checks userType + `!onboardingCompleted`; the caller also excludes the suppressed paths and per-session dismissal. Intentionally separate from `sellerUserTypes`.

**Shared controls pattern** across all three custom field components (FieldGroupedMultiSelect, FieldColorDropdown, FieldSearchableSelect): clear (×) + toggle (▼/▲) buttons in a `.controls` flex group — 32×32px, `border-radius: 4px`, grey hover bg, focus-visible outline. Translation keys `expand` and `collapse` are required for all three; `clearAll` for FieldGroupedMultiSelect and FieldColorDropdown; `clear` for FieldSearchableSelect.

### Styling

- **CSS Modules** (`*.module.css`) for component-scoped styles — use `className={css.root}`
- **Global styles** in `src/styles/`: `marketplaceDefaults.css` (base variables), `avBrandOverrides.css` (AV brand), `customMediaQueries.css` (breakpoints)
- **CSS custom properties** for theming: `--marketplaceColor`, `--marketplaceColorDark`, `--marketplaceColorLight`
- **Dark theme** applied via `css.darkTheme` class when section has `textColor: 'white'`
- Conditional classes via `classnames` package
- **Topbar mobile/desktop breakpoint:** the desktop topbar (`Topbar.module.css .desktop`) appears at `--viewportLarge` (1024px). Pages that pass `mobileRootClassName={css.mobileTopbar}` to `TopbarContainer` (EditListingPage, InboxPage, MyPurchases/MySales/MyBalancePage) **replace** the default `css.container` and must hide their `.mobileTopbar` at `--viewportLarge` too — hiding at `--viewportWide` (1600px) renders both topbars together on tablet widths.

## Custom AV Components

- `src/components/AVListingCard/` — custom listing card; overlays `StoreTypeTags` on the image for `vendedor-tienda` authors
- `src/components/AVUserCard/` — user profile card used in `SectionSelectedUser`
- `src/components/AVCategoryCard/` — category card for `SectionSelectedCat`; portrait image + name overlay (frosted gradient); links to `/s?pub_categoryLevel1=<id>`
- `src/components/FieldSwatch/` — color swatch display (14 color mappings keyed to listing enum values)
- `src/components/FieldColorDropdown/` — dropdown color picker (reuses swatchColors/swatchBg from FieldSwatch); react-final-form integrated; controls row: clear (×) + toggle (▼/▲) buttons, panel header has no close button
- `src/components/FieldGroupedMultiSelect/` — Final Form field with grouped options + removable yellow chips (used for `all_sizes`); clicking chip area opens dropdown; `.triggerCollapsed` prevents blank-row whitespace when chips present
- `src/components/FieldSearchableSelect/` — searchable single-select combobox (used for `brand`); selected option highlighted yellow/blue in dropdown list; controls row: clear + toggle buttons matching FieldGroupedMultiSelect
- `src/components/NewsletterForm/` — Brevo email subscribe form; posts to `/api/brevo/subscribe`
- `src/components/PricingToggle/` — shared pricing plan card UI; used by both `BlockPriceSelector` and `SectionPriceSelector`
- `src/components/StoreTypeTags/` — colored tag chips overlaid on the listing image for `vendedor-tienda` sellers; values come from the store's multi-enum `tipoTienda` user field (public scope), labels resolved from hosted `config.user.userFields`. Gate/label logic lives in `configAV.getStoreTypeTags(author, config)`. Rotating 4-color palette by index (`.tag0`–`.tag3`); renders `null` for non-store authors. Consumer positions it via `className`. Rendered by `AVListingCard` and the ListingPage gallery (`SectionGallery` carousel = top-left, `SectionHero` cover-photo = bottom-left). Requires `profile.publicData.userType` + `profile.publicData.tipoTienda` in the query `fields.user` — added to `SearchPage.duck.js` and `extensions/landingPage/av/listings.js` (ListingPage/ProfilePage already fetch full author publicData).
- `src/components/AVWelcomePopup/` — onboarding welcome modal shown once to new sellers (`vendedor`/`vendedor-tienda`), rendered globally by `TopbarContainer`. All content is operator-editable via translation keys `AVWelcomePopup.<userType>.{imageUrl,eyebrow,title,text,primaryButtonLabel,primaryButtonUrl,secondaryButtonLabel,secondaryButtonUrl}` — empty keys hide that element (the `t` helper reads `intl.messages` to avoid `MISSING_TRANSLATION` noise). Full-bleed image + eyebrow (avBlue) + title + body + CTA buttons; close button sits outside the card on a dimmed backdrop. Eligibility/suppression live in `configAV` (`canShowWelcomePopup`, `welcomePopupSuppressedPaths` — hidden on `/signup` so it doesn't cover the verify-email message). Dismissal (close, backdrop, or CTA click) persists `publicData.onboardingCompleted` via `markVendedorOnboarded` (user.duck); CTA clicks wait for that persist (capped 1.2s) before navigating, otherwise the full-page nav cancels the request and the popup re-appears.

Custom PageBuilder sections (in `src/containers/PageBuilder/SectionBuilder/`):
- `SectionHeroCustom/` — gradient hero banner; type `avHero` (LandingPage) / `hero` (CMSPage)
- `SectionHeroCustom2/` — multi-instance hero; type `avHero2`; sectionId prefix `av-hero2-*`; supports 2 CTAs, optional mobile bg + bgLink
- `SectionHeroCustom3/` — block-based hero; type `avHero3`; sectionId prefix `av-hero3-*`; each block = image strip with text overlay
- `SectionVideoSection/` — full-width 50/50 video + text split; type `avVideo`; sectionId prefix `av-video-*`; video URL from translation key
- `SectionPriceSelector/` — interactive pricing selector (data from hosted asset `content/pricing-plans.json`)
- `SectionSelectedListings/` — hand-picked listing carousel; sectionId prefix `av-selections`; each block's `blockName` = listing UUID
- `SectionRecommendedListings/` — auto-fetched listing grid; sectionId `av-recommendeds`; block names = listing UUIDs
- `SectionTagCatListings/` — tag/category-filtered listing carousel; sectionId prefix `av-tag-listings`; first block's `blockName` encodes filter: `tag:<value>`, `cat:<value>`, or plain value (defaults to tag)
- `SectionSelectedCat/` — category card carousel using `AVCategoryCard`; sectionId prefix `av-selected-cats`; each block provides `blockName` (category ID), optional `title` (display name), and `media` (image); no SDK fetch
- `SectionSelectedUser/` — user profile card carousel using `AVUserCard`; type `avSelectedUsers`; sectionId prefix `av-selected-users-*`; block names = user UUIDs
- `SectionInstaGrid/` — responsive Instagram-style image grid (2–6 cols); type `avInstaGrid`; sectionId prefix `av-insta-grid-*`; images from block media fields

Custom PageBuilder blocks (in `src/containers/PageBuilder/BlockBuilder/`):
- `BlockPriceSelector/` — block variant of pricing selector
- `BlockWithCols/` — two-column text block

Custom pages: `MakeOfferPage`, `RequestQuotePage`, `ManageAccountPage` (negotiation flow), `MyPurchasesPage`, `MySalesPage` (transaction history), `MyBalancePage` (seller financial dashboard), `BulkImportPage` (`/admin/bulk-import`, admin-only CSV+image bulk listing import via Integration SDK; see `docs/bulk-import.md`)

### My Purchases & My Sales Pages

Dedicated transaction history pages at `/my-purchases` and `/my-sales`. Both reuse `InboxItem` from `InboxPage` and `getStateData` from `InboxPage.stateData` — no custom card components. Ducks use `createSlice`/`createAsyncThunk`, hard-coding `only: 'order'` (purchases) or `only: 'sale'` (sales) against `sdk.transactions.query()`.

Files per page: `.js` (component), `.duck.js` (Redux), `.module.css` (styles), `.test.js` (tests). Registered in `routeConfiguration.js`, `pageDataLoadingAPI.js`, and `reducers.js`. Links added to `TopbarDesktop.js` (ProfileMenu `MenuItem`), `TopbarMobileMenu.js` (`<li>` in accountLinksWrapper), and `UserNav.js` (TabNavHorizontal tabs after "Your listings").

### My Balance Page (Seller Financial Dashboard)

Seller-focused financial dashboard at `/my-balance`. Shows balance summary cards at top, transaction filters, and a paginated payout history list. Uses `LayoutSideNavigation` + `UserNav` like MySalesPage.

**Key constraint:** No direct Stripe balance API through Sharetribe SDK. All financial data comes from `sdk.transactions.query()` — balance totals are computed client-side from transaction `payoutTotal` values.

**Components:**
- `src/components/BalanceSummary/` — 3 summary cards (Total Earnings, Pending, Cancelled count) with color-coded left borders (green/yellow/red). Uses `formatMoney` for currency display.
- `src/components/PayoutItem/` — financial transaction row showing listing title (linked to SaleDetailsPage), buyer name, date, gross/net amounts, and a status badge (completed/pending/cancelled).
- `src/components/TransactionFilters/` — URL-param-based filter controls: status select, process type select, date range inputs, clear button. On change, navigates via `history.push()` with updated query params (resets page=1). SSR-compatible.

**Duck (`MyBalancePage.duck.js`):**
Two async thunks dispatched in parallel via `Promise.all()`:
1. `loadTransactionsThunk` — paginated sale transactions with filter params from URL search. Uses `buildFilteredQueryParams()` from `transactionHelpers.js`.
2. `fetchSummaryThunk` — 3 parallel `sdk.transactions.query()` calls (completed/cancelled/all) with `perPage: 100` to compute balance totals client-side. Sums `payoutTotal.amount` from responses.

**Transaction helpers (`src/transactions/transactionHelpers.js`):**
Shared utility module providing:
- `getStatusFromLastTransition(processName, lastTransition)` → `'completed' | 'pending' | 'cancelled'`
- `getCompletedTransitions()` — aggregates completed transitions across all payment processes (excludes inquiry)
- `getRefundedTransitions()` — aggregates refunded/cancelled transitions across all payment processes
- `buildFilteredQueryParams(searchParams, options)` — parses URL search params (`status`, `process`, `dateFrom`, `dateTo`, `page`) into SDK-compatible query params

**Navigation:** Tab in UserNav (after "My Sales"), MenuItem in TopbarDesktop ProfileMenu, `<li>` in TopbarMobileMenu.

### Extension Patterns

AV uses an extension architecture to keep upstream files unmodified. Extensions live in `src/extensions/`.

**LandingPage extension** (`src/extensions/landingPage/`): Provides AV section components and data loading for LandingPage specifically.

Extension hooks: `loadDataExtension`, `selectExtensionProps`, `getPageBuilderOptions`, `transformPageData`.

**AV extension files** (`src/extensions/landingPage/av/`):
- `constants.js` — sectionId prefixes and sectionType strings for all AV section types on LandingPage
- `sections.js` — detection helpers and data extractors
- `listings.js` — SDK queries; `queryListingsByIds`, `queryListingsByFilter`; `parseFilterFromBlockName` parses `tag:<v>` / `cat:<v>` / plain blockName into SDK params
- `transform.js` — injects `listings` prop into each section before render
- `index.js` — lazy-loads and registers all AV section components; wires the 4 extension hooks

**Redux:** `src/ducks/avExtension.duck.js` — global `avLandingExtension` slice storing `{ tagListingIds: { [sectionId]: uuid[] } }`; SSR-safe alternative to module-level cache; registered in `src/ducks/index.js`.

**PageBuilder extension** (`src/extensions/pageBuilder/`): Provides AV sections and style helpers for CMSPage and other PageBuilder-rendered pages. Same hook pattern. AV subdir registers `avHero`, `avHero2`, `avHero3`, `avVideo`, `price-columns`.

**Other extensions:**
- `src/extensions/accountNav/` — account settings side nav tab list (`getAccountSettingsTabs()`)
- `src/extensions/topbar/` — TopbarDesktop custom link config
- `src/extensions/searchFilters/` — AV search filter helpers

### AV-noti: Event-Driven Notifications (Welcome Email + WhatsApp)

Server-side notification system in `server/services/`. Polls the Sharetribe Integration API every 5 minutes to detect new events and fire notifications via Brevo (email) and Meta Cloud API (WhatsApp).

**Files:**
- `server/services/eventPoller.js` — Integration API polling engine; started from `server/index.js` after server listens, guarded by `SHARETRIBE_INTEGRATION_CLIENT_ID` presence
- `server/services/welcomeEmailService.js` — sends branded Brevo transactional email with Getting Started PDF attached (`sendWelcomeEmail({ email, firstName, lastName })`)
- `server/services/pdfGenerator.js` — PDFKit PDF generator; returns `Promise<Buffer>` (`generateGettingStartedPDF({ firstName })`)
- `server/services/whatsappService.js` — Meta Cloud API sender; all calls go through `sendWhatsApp({ phone, templateName, params })`; gracefully no-ops if phone/env missing

**Event → notification mapping:**
- `user/created` → welcome email with PDF + admin WhatsApp alert + user WhatsApp welcome (if phone in `protectedData`)
- `transaction/transitioned` → buyer/seller WhatsApp based on transition name (purchased, delivered, cancelled, accepted, declined, offer-made)
- `message/created` → WhatsApp to the other party in the transaction

**Required env vars** (add to `.env.development` and all deployment environments):
```
SHARETRIBE_INTEGRATION_CLIENT_ID     # Sharetribe Console → Build → Integrations
SHARETRIBE_INTEGRATION_CLIENT_SECRET
WHATSAPP_ACCESS_TOKEN                # Meta Business Manager permanent token
WHATSAPP_PHONE_NUMBER_ID             # WABA phone number ID
WHATSAPP_ADMIN_PHONE                 # Admin phone in E.164 format (+521XXXXXXXXXX)
BREVO_SENDER_EMAIL                   # e.g. hola@archinovintach.com
BREVO_SENDER_NAME                    # e.g. Archivo Vintach
```

**WhatsApp templates** (must be pre-approved in Meta Business Manager before use):
`av_welcome_user`, `av_admin_new_user`, `av_purchase_confirmed`, `av_sale_received`, `av_delivered`, `av_cancelled`, `av_booking_accepted`, `av_booking_declined`, `av_new_message`

**Key constraint:** Never import `server/services/*` in client-side code. The poller runs only on the server process. The in-memory `lastSequenceId` cursor resets on restart — on first boot it polls the last 10 minutes to avoid missing events during deploys.

### Listing Form Customizations (Edit Listing Wizard)

Customizations to the listing creation/edit forms in `src/containers/EditListingPage/EditListingWizard/`:

**Two-column layout** — Details, Delivery, and Location panels use a CSS grid (`.fieldsGrid`) that switches from single column on mobile to `1fr 1fr` at `--viewportMedium`. Full-width fields (title, description, address) use `.fullWidth` (`grid-column: 1 / -1`). Custom listing fields flow naturally into the grid. Submit buttons remain outside the grid.

**Photos merged into Details panel** — For listing types that require images (`requireListingImage(listingTypeConfig)` is true), the separate Photos wizard step is hidden. Instead, a `PhotoGallerySection` in the Details panel provides inline image upload (free-form, max 10 images). The standalone `EditListingPhotosPanel` with `ImageSlot` still exists and renders for listing types that do NOT require images. The `publicData.imageSlots` mapping (front/back/horizontal/details) is built by `EditListingPhotosPanel` when it is shown.

Key files:
- `.../EditListingDetailsPanel/PhotoGallerySection.js` + `.module.css` — inline free-form photo upload in the Details step. Drag-to-reorder via `@dnd-kit`. `PlaceholderSlot` is keyboard-accessible (`role="button"`, Enter/Space → trigger upload).
- `.../EditListingDetailsPanel/reconcileOrderedImages.js` — pure helper that merges the user's drag-reordered list with incoming Redux `images`: preserves order, refreshes objects after upload id resolution, drops removed, appends new. Co-located unit tests.
- `.../EditListingPhotosPanel/ImageSlot.js` + `.module.css` — labeled upload slot (used only when Photos step is active)
- `.../EditListingPhotosPanel/EditListingPhotosFormSlots.js` — 4-slot form for listings types without required images
- `src/containers/ListingPage/ListingImageGallery/ListingImageGallery.js` — renders slot label captions from `publicData.imageSlots`

**Original price (strike-through)** — The Pricing & Stock panel includes an `originalPrice` field (stored in `publicData.originalPrice` as `{ amount, currency }`). Must be greater than `price` to display as a strike-through "was" price in `OrderPanel` and listing cards.

**Earnings estimator** — The Pricing panel shows an `EarningsEstimator` info card below the price input (simple price only, not price variants). Displays listing price, marketplace fee, Stripe processing fee, and net earnings using `formatMoney`. Fee percentages come from `config.earningsEstimate` in `configDefault.js`, overridable via env vars:
- `REACT_APP_PROVIDER_COMMISSION_PERCENTAGE` (default: 10)
- `REACT_APP_STRIPE_FEE_PERCENTAGE` (default: 2.9)
- `REACT_APP_STRIPE_FEE_FIXED_AMOUNT` (default: 30, in currency sub-units/cents)

Key files:
- `.../EditListingPricingAndStockPanel/EarningsEstimator.js` + `.module.css`
- `.../EditListingPricingAndStockPanel/EditListingPricingAndStockPanel.js` — renders `EarningsEstimator` and `originalPrice` field

### CMSPage Pricing Asset

`CMSPage.duck.js` fetches pricing plan data from `content/pricing-plans.json` (Sharetribe hosted asset) alongside the page JSON. Data is stored in `state.CMSPage.pricingPlansData`. The component falls back to intl-based data if the asset doesn't exist yet. See `docs/ai_notes.md` Section 4 for the JSON schema and pending setup steps.

## Testing Conventions

Every new AV component or custom page must ship with a co-located `.test.js` file. Use `renderWithProviders` from `src/util/testHelpers` — it wraps React Testing Library with a Redux store and router.

```js
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import '@testing-library/jest-dom';
const { screen } = testingLibrary;
```

**Minimum requirements:**
- New `src/components/AV*/` → render + key props + snapshot
- New `src/containers/*Page/` → smoke test + snapshot (`it('renders without crashing', ...)`)
- New `src/util/*.js` helpers → unit tests for each exported function
- New `src/extensions/*/` → registry/detection logic tests (see `landingPage/registry.test.js` as pattern)

Duck reducers and utility functions in `src/util/` should have pure unit tests (no render needed). Always run `yarn test -- --watchAll=false` before declaring a task complete.

**Gotchas seen across upstream merges (v11.x):**
- `formatMoney(intl, money)` in `src/util/currency.js` uses `new Intl.NumberFormat('en-US', ...)` directly — it ignores the passed `intl` argument. Tests must assert the formatted string (`'$20.00'`, not `'20'`); negatives render as `-$2.00`.
- `currencyDisplay: 'narrowSymbol'` in `settingsCurrency.js` means MXN renders as `$` (not `MX$`) in en-US. Snapshots from before this change need regeneration (`yarn test -u`).
- `validSchemaOptions` requires `enumOptions[].option` to be a **string**. Numeric option values are silently dropped + warn. Test fixtures must use `{ option: '29', label: '29' }`, not `{ option: 29, ... }`.
- `ResponsiveImage` builds a `srcset` attribute, not `src`. Tests asserting `getByRole('img').getAttribute(...)` must use `'srcset'`, and the mocked variant keys must match the consumer's `variants` prop (e.g. `AVCategoryCard` requests `['original400','800','1200','2400']`).
- `ProfileSettingsForm` renders `bioHeadingVendedor` / `bioHeadingTienda` per-userType, not a single `bioHeading`. There is no `bioLabel` — the textarea uses a placeholder.
- The `Unsupported listing extended data configurations detected (listingTypeConfig)` warning from `configHelpers.js:874` is upstream signal, not noise. It fires whenever a test's narrow listingTypes don't intersect with the default helper fixtures (`bikeType`/`tire-size`/`brand`). Don't broaden the fixtures — that makes those fields leak into `EditListingPage` tests that expect them filtered out.

## Section Display-Option Tokens

Encode display options in `sectionName` as `- Token` suffixes (space-dash-space before each token). Parsed by `parseSectionCustomOptions()` in `src/extensions/pageBuilder/av/sectionStyles.js` — never read `sectionName` directly inside section components.

| Token | Property | Effect |
|-------|----------|--------|
| `- Large` | `isLarge` | Enlarged height/padding |
| `- Medium` | `isMedium` | Medium variant |
| `- FullH` | `isFullH` | Full viewport height |
| `- FullW` | `isFullW` | Full width, no container |
| `- ShortHero` | `isShortHero` | Reduced hero height |
| `- ShortContent` | `isShortC` | Compact content area |
| `- SmallerTitle` | `isSmallerT` | Smaller h1/h2 |
| `- SmallTitle` | `isMediumT` | Even smaller title |
| `- BlueTitle` | `isBlueTitle` | Brand-blue title |
| `- WhiteTitle` | `isWhiteTitle` | White title |
| `- CenterTitleText` | `isCenterTitleText` | Center-aligned title |
| `- CenterDescText` | `isCenterDescText` | Center-aligned description |
| `- LargeDesc` | `isLargeDesc` | Larger description font |
| `- SmallSubTitles` | `isSmallSubTitles` | Smaller subtitles |
| `- Paddings` | `hasPaddings` | Force standard paddings |
| `- NoPaddings` | `hasNoPaddings` | Remove all paddings |
| `- NoPaddingsX` | `hasNoPaddingsX` | Remove horizontal paddings |
| `- NoPaddingsY` | `hasNoPaddingsY` | Remove vertical paddings |
| `- Heading2` | `isHeadingH` | h2 heading style |
| `- 2/3 cols` | `isTwoThirdsCols` | Two-thirds column layout |
| `- AvFeature` | `isAvFeature` | Feature block layout |
| `- ReverseFeature` | `isReverseFeature` | Reversed feature layout |
| `- TextGray` | `hasTextGray` | Gray text |

**CTA button tokens** (parsed by `parseSectionCtaClass`): `- sectionCtaBtnBlue`, `- sectionCtaBtnLightBlue`, `- sectionCtaBtnPurple`, `- sectionCtaBtnPink`, `- sectionCtaBtnYellow`
**CTA modifiers:** `- roundedFull`, `- rounded`, `- square`, `- dashed`, `- solid`, `- noOutline`, `- headingFont`, `- bodyFont`, `- accentFont`, `- ctaBtnCenter`

To add a new token: add a `hasToken(sectionName, 'MyToken')` line in `parseSectionCustomOptions()` and a corresponding CSS class in `AVSectionContainer`.

## Coding Conventions

- Follow Sharetribe Web Template conventions: CSS Modules, functional React, Redux ducks
- Client-side env vars use `REACT_APP_` prefix; server-side secrets do not
- Prefer extending over overriding core template files (reduces upstream merge conflicts)
- Always use Stripe Connect — never direct charges
- Heroku has ephemeral filesystem — never write files to disk at runtime

## Upstream File Policy

**Do not modify upstream Sharetribe template files unless there is no alternative.**

Before editing any upstream file, ask: can this be done in a custom component, a config file, an extension hook, or a CSS override instead? Only touch upstream files when the feature genuinely requires it (e.g. wiring a new route, adding a nav link).

When an upstream file must be modified, keep the change minimal and isolated — add, don't rewrite.

### Watchlist — high merge-conflict risk, avoid unless documented

These files are the most likely to conflict on `git merge upstream/main`. Changes here must be carefully justified and noted in commit messages:

| File | Why it's touched |
|---|---|
| `src/components/CustomExtendedDataField/CustomExtendedDataField.js` | `groupedMultiSelect` + `colorGridPicker` input branches |
| `src/util/configHelpers.js` | Listing field merge strategy (code wins over Console) |
| `src/containers/SearchPage/FilterComponent.js` | Custom filter type branches |
| `src/containers/SearchPage/SearchPage.shared.js` | Filter assembly pipeline |
| `src/containers/PageBuilder/BlockBuilder/BlockBuilder.js` | Custom block registration |
| `src/containers/PageBuilder/BlockBuilder/BlockDefault.js` | Custom block registration |
| `src/containers/PageBuilder/SectionBuilder/SectionBuilder.js` | Custom section registration |
| `src/containers/PageBuilder/SectionBuilder/SectionContainer/SectionContainer.js` | Modified to delegate display-option logic to `AVSectionContainer` |
| `src/util/lineItemHelpers.js` | Fixed commission line item |
| `src/translations/en.json` | AV translation keys mixed with upstream |
| `src/config/configHelpers.js` | (same as configHelpers.js above) |
| `src/containers/TopbarContainer/Topbar/TopbarDesktop/CustomLinksMenu/*` | AV user/category dropdowns with local design data (~480 LOC across 12 files) |
| `src/containers/CheckoutPage/CheckoutPageWithPayment.js` | Default Stripe payment/recipient country (reads `configAV.defaultCountry`) |
| `src/containers/EditListingPage/EditListingWizard/EditListingWizard.js` | Default Stripe Connect payout country (reads `configAV.defaultCountry`) |
| `src/containers/EditListingPage/EditListingWizard/EditListingWizardTab.js` | `currentUser` prop drilling for pricing panels |
| `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsForm.js` | Two-column grid + inline `PhotoGallerySection` |
| `src/containers/EditListingPage/EditListingWizard/EditListingPricingPanel/EditListingPricingPanel.js` | `originalPrice` field gated by `configAV.canShowOriginalPrice` |
| `src/containers/EditListingPage/EditListingWizard/EditListingPricingPanel/EditListingPricingForm.js` | `originalPrice` field UI |
| `src/containers/ManageListingsPage/ManageListingsPage.js` | Heading row with "Create listing" `NamedLink` |
| `src/components/TabNavHorizontal/TabNavHorizontal.module.css` | `darkSkin` family reskinned for `UserNav` (only consumer); `.root` left untouched |
| `src/components/UserNav/UserNav.js` | Active-state expanded to all account settings pages |

### Unavoidable upstream files (accept conflicts, append at bottom)

AV additions to these files are always appended at the bottom to minimise diff noise:

| File | AV addition |
|---|---|
| `src/routing/routeConfiguration.js` | Custom page routes (MyPurchasesPage, MySalesPage, MyBalancePage, BulkImportPage) |
| `src/containers/pageDataLoadingAPI.js` | `loadData` exports for custom pages |
| `src/reducers.js` | Custom page reducers |
| `src/ducks/index.js` | `avExtension` duck registration |
| `server/index.js` | AV-noti event poller startup + `mountCustomApiRoutes(app)` call (one line, before `app.use('/api', apiRouter)`) |
| `server/customApiRoutes.js` | AV-owned file — registers `/api/brevo`, `/api/instagram`, `/api/my-balance`, `/api/bulk-import` |

## Deployment

- **Production (Heroku):** `git push heroku main` — `heroku-postbuild` runs `yarn build`
- **Staging (Render.com):** use Stripe test keys (`pk_test_`/`sk_test_`); may cold-start after inactivity

## Documentation

In-repo docs in `docs/` (read these before changing the related subsystem):
- `bulk-import.md` — CSV+image bulk listing importer architecture & CSV format
- `listing-custom-fields-setup.md` — Sharetribe Console listing-field setup
- `console-customization-guide.md` — Console CMS/asset configuration
- `test-account-setup.md`, `bidding-research.md`, `ai_notes.md`

## Upstream Sync

```sh
git remote add upstream https://github.com/sharetribe/web-template.git
git fetch upstream
git merge upstream/main
```

When resolving conflicts, review customized areas first: `src/config`, `src/components`, customized containers, `src/extensions/`.

High-conflict files to watch: `SearchResultsPanel.js` (AVListingCard swap), `CMSPage.js` (custom section injection), `marketplaceDefaults.css` (AV brand colors), `TopbarDesktop.js` and `TopbarMobileMenu.js` (My Purchases/Sales/Balance menu links), `UserNav.js` (My Purchases/Sales/Balance tabs), `server/index.js` (AV-noti poller startup), `EditListingPhotosPanel/` (labeled image slots), `EditListingDetailsPanel/` (two-column grid + inline PhotoGallerySection), `EditListingDeliveryForm.js` / `EditListingLocationForm.js` (two-column grid wrappers), `EditListingPricingAndStockPanel.js` (EarningsEstimator + originalPrice), `SectionContainer/SectionContainer.js` (delegates to AVSectionContainer), `SectionGallery.js` and `ListingImageGallery.js` (imageSlots label captions), `OrderBreakdown.js` (adds `LineItemProviderCommissionFixedMaybe`), `OrderPanel.js` (originalPrice strike-through), `configDefault.js` (earningsEstimate block), `routeConfiguration.js` (MyPurchasesPage/MySalesPage/MyBalancePage/BulkImportPage routes).
