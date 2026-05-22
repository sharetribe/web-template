# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

This is the **Sharetribe Web Template** (`app` v11.1.0) — a React 18 marketplace web app with
server-side rendering, bootstrapped from create-react-app and heavily extended. It is the client
layer; the actual marketplace data, auth, payments (Stripe), and transaction process state machines
live in Sharetribe's hosted backend and are reached through `sharetribe-flex-sdk`.

**Read `AGENTS.md` first.** It is the authoritative guide for code conventions (styling, import
order, Forms via React Final Form, Redux Ducks, API calls, i18n, transaction processes). This file
does not repeat that content — it covers commands and the cross-cutting architecture you only see by
reading several files together.

## Commands

```sh
yarn config            # interactive: writes mandatory env vars to .env (run once after clone)
yarn config-check      # verify required env vars are present (dev runs this first)
yarn dev               # run frontend (port 3000) + backend (port 3500) concurrently — main dev loop
yarn dev-frontend      # frontend dev server only (scripts/start.js)
yarn dev-backend       # API server only (nodemon server/apiServer.js)

yarn build             # production build: build-web then build-server
yarn build-web         # client bundle (scripts/build.js)
yarn build-server      # server bundle (scripts/build-server.js)
yarn start             # run the production server (server/index.js) against a build
yarn dev-server        # build, then run the full SSR production server with nodemon (port 4000)

yarn test              # client tests, Jest watch mode (scripts/test.js, CRA-style)
yarn test-server       # server tests only (jest --roots ./server, node environment)
yarn test-ci           # full non-interactive run (server then client, --runInBand)

yarn format            # prettier --write on **/*.{js,css}
yarn format-ci         # prettier check only (list-different)
yarn translate         # scripts/translations.js — manage src/translations/*.json
```

**Running a single test:** in `yarn test` watch mode, press `p` and type a filename pattern, or pass
it directly: `yarn test ListingPage`. Non-interactive: `yarn test ComponentName --watchAll=false`.
For a server test: `yarn test-server --watchAll=false PathOrPattern`.

**Linting:** there is no standalone lint script. ESLint (`config/eslint-config-react-app`) runs
automatically via `eslint-webpack-plugin` during `yarn dev` and `yarn build`; TypeScript checking
runs via `fork-ts-checker-webpack-plugin`.

**Node:** `^22.22.0 || >=24.0.0` (see `engines` in package.json). Patches are applied on install via
`patch-package` (`patches/`).

## Architecture: the parts that span multiple files

### Hosted config overrides local config
On every full page load the app fetches translations and configuration assets from Sharetribe via
`sdk.asset*` calls (the list lives in `src/config/configDefault.js` under `appCdnAssets`). These
**hosted assets, created by a marketplace admin in Sharetribe Console, override the local files in
`src/config/`.** So `src/config/*` are fallbacks/defaults, not the source of truth at runtime.
Configs are merged and validated by `mergeConfig` in `src/util/configHelpers.js`, and components read
the result through the `useConfiguration()` hook — not by importing config files directly. Missing
critical assets surface as a `MaintenanceModeError` (handled in `src/app.js` `ClientApp`).

### SSR data loading: routeConfiguration → loadData → duck (not useEffect)
This is the most important pattern and the easiest to get wrong. Page data must load on the server,
so it is **not** fetched in `useEffect`:

1. Routes are declared in `src/routing/routeConfiguration.js`, each pointing at a container in
   `src/containers/` and optionally a `loadData` function.
2. `loadData` functions live in the page's `*.duck.js` (e.g.
   `src/containers/ListingPage/ListingPage.duck.js`) and are registered in
   `src/containers/pageDataLoadingAPI.js`.
3. On the server, `server/dataLoader.js` + `server/renderer.js` run `loadData`, populate the Redux
   store, and render to a string; the client hydrates from that store.

Add new page data by adding a `loadData` to a page-level duck and wiring it through
`pageDataLoadingAPI.js` and `routeConfiguration.js`. Only diverge to client-side fetching for
content that genuinely never renders on the server.

### Redux: Ducks, two scopes
Redux Toolkit + the Ducks pattern. **Global** ducks (used by multiple pages) live in `src/ducks/`
and are combined in `src/reducers.js`. **Page-level** ducks live in their container directory and are
combined via `src/containers/reducers.js`. The store is assembled in `src/store.js`. Only containers
(`src/containers/`) connect to Redux; shared `src/components/` stay presentational.

### Client vs. server entry points
`src/app.js` exports both `ClientApp` and `ServerApp`. `src/index.js` is the client entry (hydrate).
The server (`server/index.js`, Express 5) renders via `server/renderer.js`, exposes its own API under
`server/apiRouter.js` (and `server/api/`, `server/api-util/`), sets CSP in `server/csp.js`, and
handles auth (`server/auth.js`, Passport for Google/Facebook login).

### Transaction processes are duplicated by design
`src/transactions/` defines four default process graphs (booking, purchase, inquiry, negotiation)
plus `transaction.js` (the utility hub that maps unit types → processes and is imported across
containers/ducks). These client-side graphs **must mirror the actual processes in the Sharetribe
backend** — they only tell the web app how to render each state/transition. The canonical process
definitions are referenced in `ext/transaction-processes/`. Changing files here does **not** change
backend behavior; that requires pushing via the Sharetribe CLI. Always confirm with the user before
touching transaction processes and remind them to update the backend.

### Styling and i18n (see AGENTS.md for full rules)
CSS Modules (`*.module.css`) with class selectors only; design tokens in
`src/styles/marketplaceDefaults.css`, breakpoints in `src/styles/customMediaQueries.css`. All copy
goes through React Intl (`useIntl()` / `<FormattedMessage>`) with keys
`"ComponentName.key"` added to `src/translations/{en,de,es,fr}.json` as local fallbacks (hosted
translations override them).

## Conventions

Prettier: single quotes, 2-space indent, ES5 trailing commas, prose-wrap always, 100-col lines.
Prefer existing local utilities in `src/util/` over adding libraries — **ask before adding any new
dependency** (bundle-size sensitive). Full convention details: `AGENTS.md`.

## NextRep — product scope (what we are building)

NextRep is a **sports gear resale marketplace** built on this template. The defining concept is a
**Team** (e.g. "Seattle Little League") that acts as a virtual warehouse: a Team Admin's dashboard
tracks gear activity across all individual members who joined with the team's code. Individuals can
sell gear, optionally belong to one or more teams, and (future) donate a % of a sale to a team.

### What the template already gives us (native or hosted-config — low effort)

- **User types** Team Admin vs. Individual = two user types. Not in hosted config yet, but the code
  path is fully built: add a `userType` enum field per `src/config/configUser.js` and wire
  `mergeUserConfig` in `configHelpers.js`. Signup already branches on user type
  (`AuthenticationPage/FieldSelectUserType.js`).
- **Profile fields** (sport, location, bio, website, team contact, team name/photo) = user extended
  data via `userFields`. Listing fields (**condition, sport, category, size, price, photos**) =
  listing extended data via `listingFields` / hosted listing fields; `category` is first-class.
- **Listing type** = one `product-selling` listing type on the `default-purchase` process,
  `stockType: 'oneItem'` (used gear is unique). Buyer-pays-shipping = the listing type's `shipping`
  flag.
- **Auth** (email/password, password reset), **edit/remove own listings** (no team approval needed),
  **Stripe Connect payouts**, and **commission** are all native. Commission % is set in Sharetribe
  Console, not in code.
- **"Post gear before connecting Stripe"** is native: set `defaultListingFields.payoutDetails: false`
  on the listing type so providers can list without payout details. Caveat: customers **cannot order**
  until the provider has set payout details — so the "notify on first sale to connect Stripe" prompt
  is the custom piece (see below).

### What is custom build (Sharetribe has no team/org primitive)

- **Account-type chooser before signup** routing to the right flow/dashboard.
- **Team = a Team Admin user account** whose profile holds the team data and a generated, **non-expiring
  team code** (created at signup, emailed, reshareable from the dashboard). Membership is many-to-many:
  individuals store joined team codes in their profile (`publicData`), addable retroactively.
- **Dashboards** for both account types, with explicit public vs. private field visibility (see scope
  doc: `# units listed/sold` and `# members` are public; revenue, product details, purchases are
  private).
- **Admin/ownership transfer** when an admin leaves — no native concept.
- **First-sale Stripe-connect notification** triggered off a transaction transition.
- **Donations** (% of a sale routed to a team, and donation totals) — **future feature**, requires
  custom transaction-process line items / split transfers. Returns & disputes are **TBD**.

### ⚠ The one architectural constraint to internalize

The browser **Marketplace API** (the `sharetribe-flex-sdk` used throughout `src/`) only ever returns
the **current user's own** private data and transactions. A Team Admin therefore **cannot** see other
members' revenue, purchases, or private product details from the client. The team dashboard's *public*
metrics work by tagging every member listing with the team code in `publicData` and querying
`pub_teamCodes=CODE`; but the *private* aggregate metrics (total revenue, gear purchased across
members) **must be computed server-side via Sharetribe's Integration API** in `server/` (e.g. a new
endpoint in `server/apiRouter.js`). Plan team analytics around this split from the start — it is the
biggest risk in the scope. Source spec lives in the WayPoint Labs handoff document.
