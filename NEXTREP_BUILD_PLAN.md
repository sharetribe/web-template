# NextRep Build Plan

Sequenced implementation plan for building NextRep (sports-gear resale marketplace with Team /
Individual accounts) on the Sharetribe Web Template. Source of requirements: WayPoint Labs handoff
document. Companion context lives in `CLAUDE.md` → "NextRep — product scope" and `AGENTS.md` (code
conventions).

**How to use this:** phases are ordered by dependency. Each phase lists where the work happens
(Sharetribe **Console** vs. **code**), concrete files, effort (S = hours, M = 1–2 days, L = 3–5+
days), and risks. Resolve the gating decisions below before starting the phases they block.

---

## Current state (verified 2026-05-22 via flex-cli + asset API)

Three environments exist: `nextrep1` (live), `nextrep1-test`, `nextrep1-dev`. **Console is partly
built; the codebase is still 100% stock Sharetribe — no NextRep custom code yet.**

Already in Console (app's env):
- **User types:** `teamname` (Team account) + `individual`. ✅ (Phase 1 config done)
- **User fields:** `sport` (multi-enum), `teamnamecustom` (text).
- **Listing type:** `sell_gear` (unit `item`). Listing **fields:** `sport_listing`, `condition_listing`
  (new/likenew/good/fair/lessthanfair), `size`, `givebackgear` (yes/part — donation feature), and
  `teamname` (multi-enum, **placeholder options `team_1_listing`/`team_2_listing`**). ✅ (most of Phase 2)
- **Categories:** equipment, apparel (+ categoryLevel1/2/3 search schemas).
- Env drift: `teamname` listing field is in test/dev but **not** live.

**Biggest gap — the team model.** The spec's core mechanic (unique team code → email → join by code →
virtual-warehouse dashboard) is **not modeled at all**. Console instead stubs teams as a free-text
`teamnamecustom` on the team user + a static placeholder `teamname` enum on listings, which can't scale
to dynamic team signup. This must be reconciled (decision D1) before Phases 3–5. Also missing vs spec:
location, bio, website, team contact, free/premium plan. Note: `flex-cli` **cannot** edit these
Console-defined fields — they're Console-UI only.

---

## Guiding principles

1. **Console-first for anything Console supports** (listing types/fields, user types/fields,
   commission, transaction processes, emails). Per `AGENTS.md`, only add local code config when
   Console can't express the pattern. Local files in `src/config/*` are fallbacks; hosted assets
   override them at runtime.
2. **The team layer is custom** — Sharetribe has no team/organization primitive. A "team" is modeled
   as a Team Admin **user account** whose profile carries the team data + code; membership is stored
   as extended data on user profiles.
3. **Team analytics split by API.** Public team metrics use the browser Marketplace API; private
   cross-member metrics require the operator-level **Integration API** on the server. See
   `CLAUDE.md` ⚠ note. This shapes Phase 5.

---

## Gating decisions (resolve first)

| # | Decision | Recommended default | Blocks |
|---|---|---|---|
| D1 | Is a Team modeled as a **user account** (Team Admin) or a separate data model? | **User account** (matches the spec wording "signs up… as an Admin"; reuses profiles, auth, listings) | Phases 3–5 |
| D2 | Where do user types / listing types / fields live — **Console** or local code? | **Console** (configHelpers already reads hosted `userTypes`; the `configUser.js` "not supported" comment is stale). Use local config only for local dev via `mergeDefaultTypesAndFieldsForDebugging`. | Phases 1–2 |
| D3 | Add the **Integration SDK** (`sharetribe-flex-integration-sdk`) for private team metrics? It's a new dependency + needs operator Integration API credentials. | **Yes, server-only** — there's no other way to aggregate other members' private data. Approve the dep. | Phase 5 (private metrics) |
| D4 | Can a user **change their userType** after signup, and can one account be both Admin and Individual? | **No** — userType is set at signup and fixed; keep accounts single-type for v1. | Phase 1 |
| D5 | Team code format & storage scope (e.g. `SEA-LL-7QX`) — and is the code stored in team profile `publicData` (so members can validate it client-side) or `privateData`? | Short human-friendly code in **`publicData`** so a join can be validated by querying users; generate server-side to guarantee uniqueness. | Phases 3–4 |

---

## Phase 0 — Foundations & access (S)

**Goal:** working local env + the Console/credentials needed downstream.

- Run `yarn config` then `yarn dev` (per `README.md`); set the mandatory env vars
  (`REACT_APP_SHARETRIBE_SDK_CLIENT_ID`, `REACT_APP_STRIPE_PUBLISHABLE_KEY`,
  `REACT_APP_MAPBOX_ACCESS_TOKEN`, and `SHARETRIBE_SDK_CLIENT_SECRET` for privileged transitions).
- Confirm access to the Sharetribe **Console** for the target marketplace environment(s).
- If pursuing D3, create an **Integration API** application in Console and store its client
  ID/secret as server-only env vars (never `REACT_APP_*`).
- Decide commission % and set it in Console (provider and/or customer commission).

**Risk:** privileged transitions and Integration API both need server secrets — keep them out of the
client bundle.

---

## Phase 1 — Account types (Team Admin / Individual) (M)

**Goal:** entry-point chooser → user-type-specific signup → user-type-specific dashboard routing.

- **Console (D2):** define two user types: `team-admin`, `individual`. Add user fields scoped per
  type: Individual → name, sport, location, email; Team Admin → team name, photo, sport, location,
  bio, website, team contact, plan (free/premium).
- **Code:**
  - Pre-signup account-type chooser → route into `AuthenticationPage` with the chosen type. The
    signup form already branches on user type via
    `src/containers/AuthenticationPage/FieldSelectUserType.js` and
    `ConfirmSignupForm`/`SignupForm`; either reuse `FieldSelectUserType` or add a dedicated chooser
    screen ahead of it.
  - Post-login routing by `userType` in `src/routing/routeConfiguration.js` /
    `src/containers/pageDataLoadingAPI.js` so each type lands on its dashboard (Phase 5).
  - Local-dev fallback only: if mirroring types in `src/config/configUser.js`, enable them via
    `mergeDefaultTypesAndFieldsForDebugging` in `src/util/configHelpers.js`.

**Depends on:** Phase 0, D2, D4. **Risk:** keep userType immutable post-signup (D4); validate on the
server if exposed to edit forms.

---

## Phase 2 — Gear listings & data model (S–M)

**Goal:** a single product-selling listing type with NextRep's gear fields.

- **Console (D2):** add listing type `gear` → process `default-purchase`, `unitType: item`,
  `stockType: oneItem`, `shipping: true`, **`payoutDetails: false`** (lets sellers list before
  connecting Stripe — Phase 6). Add listing fields: **condition** (enum: New / Like New / Gently
  Used / Well Loved), **sport** (enum), **category** (enum), **size**. Set search schemas for the
  fields you want filterable (Sharetribe CLI).
- **Code:** only if Console can't express a field — mirror in `src/config/configListing.js`. No
  approval gate on member listings is already the template default (no change needed).

**Depends on:** Phase 0. **Risk:** the template warns SearchPage behaves poorly if booking + selling
listing types coexist — NextRep is selling-only, so keep it to one selling type.

---

## Phase 3 — Team identity & team codes (M–L)

**Goal:** Team Admin signup generates a unique, non-expiring, reshareable team code.

- **Server (code):** on team-admin account creation, generate a unique code and write it to the
  team's profile `publicData.teamCode` (D5). Add a server endpoint (new module in `server/api/`,
  registered in `server/apiRouter.js`, following the `initiate-privileged.js` pattern) that
  generates + uniqueness-checks the code using the SDK in `server/api-util/sdk.js`. Send the
  confirmation email containing the code (Console transactional email or a server mailer).
- **Client (code):** surface the code on the Team Admin dashboard with a copy/reshare action
  (Phase 5).

**Depends on:** D1, D5, Phase 1. **Risk:** uniqueness must be enforced server-side; codes never
expire, so the generator must avoid collisions across the whole marketplace.

---

## Phase 4 — Team membership (join by code) (M)

**Goal:** an individual joins one or more teams via code, retroactively, optionally none.

- **Code:**
  - "Join a team" form (on signup and on a profile/settings page for retroactive adds) that takes a
    code, validates it (query users by `pub_teamCode=CODE`), and appends the team to the member's
    profile `publicData.teamCodes` (array — supports multiple teams).
  - When a member posts gear, stamp the listing's `publicData.teamCodes` from their profile so team
    dashboards can find member listings (Phase 5). Hook into `EditListingPage` save flow.
  - Optional: maintain a member roster on the team. Public roster count is derivable by querying
    members; a stored roster may need server-side write (a member writing to the team's data isn't
    allowed via Marketplace API → do it through a server endpoint).

**Depends on:** Phase 3. **Risk:** membership is many-to-many and editable; keep `teamCodes` arrays
consistent between user profile and stamped listings.

---

## Phase 5 — Dashboards (L)

**Goal:** Team Admin and Individual dashboards with the public/private field visibility from the spec.

- **Individual dashboard (client):** gear listed/sold (# public, details private), gear purchased
  (private), total revenue (private), teams (public), sports (public). All sourced from the current
  user's own listings/transactions via the Marketplace API in a page-level `*.duck.js` `loadData`.
- **Team Admin dashboard:**
  - **Public metrics (client):** # units listed/sold across the team via
    `listings.query({ pub_teamCodes: CODE })`; # members via `users.query`. Plus team profile + code
    reshare (Phase 3).
  - **Private metrics (server, D3):** total team revenue, gear purchased across members, per-member
    details. **Cannot** come from the browser SDK. Add a server endpoint (`server/api/team-stats.js`,
    registered in `server/apiRouter.js`) that uses the **Integration SDK** to aggregate
    transactions/listings for the team's members, authorize that the caller is the team admin, and
    return only the permitted aggregates.

**Depends on:** Phases 1–4, D3. **Risk:** the public/private split must be enforced server-side, not
just hidden in the UI. This is the highest-effort, highest-risk phase — build the public client view
first, then layer in the Integration-API endpoint.

---

## Phase 6 — "Connect Stripe on first sale" (S–M)

**Goal:** sellers list without Stripe; on first sale they're prompted to connect for payout.

- Listing without payout is already enabled by `payoutDetails: false` (Phase 2). Caveat: customers
  **cannot complete an order** until the provider has set payout details, so this is really a
  *prompt-to-connect* flow, not deferred payout.
- **Code:** detect a seller's first incoming order (a transaction transition) and trigger a
  notification (in-app banner + email) linking to the existing Stripe Connect onboarding
  (`src/containers/StripePayoutPage`, `src/ducks/stripeConnectAccount.duck.js`). Surface payout
  status on the Individual dashboard.

**Depends on:** Phases 2, 5. **Risk:** clarify the desired UX given the "can't be paid until
connected" constraint — likely block order completion + nudge, or require connect before the listing
can be purchased.

---

## Phase 7 — Donations (% of sale to a team) — FUTURE

Marked future in the scope. Requires custom transaction-process line items (a donation line item) and
splitting funds to the team's Stripe account, plus donation-total tracking on both dashboards.
Touches `src/transactions/*` and `server/api-util/lineItems.js` — **transaction-process changes
require user approval and corresponding backend updates via Sharetribe CLI** (per `AGENTS.md`). Scope
separately.

---

## Phase 8 — Returns & disputes — TBD

Undefined in the scope. Likely a transaction-process extension (dispute/refund transitions). Define
requirements before estimating.

---

## Suggested order & dependency summary

```
Phase 0 ─┬─ Phase 1 ─┬─ Phase 3 ── Phase 4 ── Phase 5 ── Phase 6
         └─ Phase 2 ─┘                                   (Phase 7, 8 later)
```

Critical path: 0 → 1 → 3 → 4 → 5. Phase 2 can run in parallel with Phase 1. Phases 7–8 are deferred.

## New dependencies / access to approve

- **`sharetribe-flex-integration-sdk`** (server only) — for Phase 5 private team metrics (D3).
- **Integration API application** + credentials in Console (Phase 0).
- Confirm a transactional **email** mechanism for the team code (Phase 3) and first-sale prompt
  (Phase 6).
