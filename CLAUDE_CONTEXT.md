# Sherbrt (sherbrt.com) — Project Context

> This file gives Claude (or any AI assistant) full project context at the
> start of a session. Read this first before doing any work on the codebase.

## What is Sherbrt?

Sherbrt is a peer-to-peer lending marketplace where people can borrow and lend
physical items (clothing, equipment, etc.). Built on top of the Sharetribe Flex
platform with heavy customizations for shipping, SMS notifications, late fees,
and a custom checkout flow.

Live site: https://www.sherbrt.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Platform | Sharetribe Flex (marketplace SaaS) |
| Frontend | React 18, Redux, React Router 5, React Final Form |
| Backend | Node.js (>=20.10), Express |
| Payments | Stripe (PaymentIntent flow) |
| Shipping | Shippo SDK v2 |
| SMS | Twilio (Messaging Service) |
| Cache/State | Redis (ioredis), in-memory fallback for local dev |
| Short Links | Custom HMAC-signed Redis-backed system (`/r/{id}{hmac}`) |
| Maps | Mapbox GL |
| Deployment | Render (web service + cron workers) |
| CI | CircleCI |
| Node | 20.10.0 |

## Repo Structure

```
shop-on-sherbet-cursor/
├── server/                    # Node.js backend
│   ├── api/                   # Express route handlers
│   ├── api-util/              # Shared utilities (sendSMS, shortlink, lenderEarnings)
│   ├── lib/                   # Core business logic (lateFees, shipping, businessDays)
│   ├── scripts/               # Cron worker scripts (SMS reminders, overdue fees)
│   ├── util/                  # SDK setup (getFlexSdk), URL helpers
│   ├── apiRouter.js           # Route definitions
│   ├── apiServer.js           # Express server setup
│   ├── index.js               # Entry point
│   ├── redis.js               # Redis client (lazy connect, in-memory fallback)
│   └── env.js                 # .env loading (mirrors create-react-app)
├── src/                       # React frontend
│   ├── transactions/          # Transaction process definitions (state machines)
│   ├── components/            # Shared UI components
│   ├── containers/            # Page-level components
│   └── ...
├── ext/transaction-processes/ # Sharetribe transaction process YAML
├── public/                    # Static assets
├── render.yaml                # Render deployment config
├── package.json               # Scripts, dependencies
└── .env.example               # Environment variable template
```

## Transaction Process (State Machine)

This is the core of the app. Every borrow request follows this flow:

```
INITIAL
  ├── transition/inquire ──────────────► INQUIRY
  │                                        │
  │                                        ├── transition/request-payment-after-inquiry
  │                                        ▼
  └── transition/request-payment ──────► PENDING_PAYMENT
                                           │
                                           ├── transition/expire-payment ──► PAYMENT_EXPIRED
                                           │
                                           ├── transition/confirm-payment (auto, Stripe)
                                           ▼
                                         PREAUTHORIZED
                                           │
                                           ├── transition/decline ─────────► DECLINED
                                           ├── transition/operator-decline ► DECLINED
                                           ├── transition/expire ──────────► EXPIRED
                                           ├── transition/accept ──────────► ACCEPTED
                                           ├── transition/operator-accept ─► ACCEPTED
                                           ▼
                                         ACCEPTED
                                           │
                                           ├── transition/cancel ──────────────────► CANCELED
                                           ├── transition/auto-cancel-unshipped ───► CANCELED
                                           ├── transition/complete-return ─────────► DELIVERED
                                           ├── transition/complete-replacement ────► DELIVERED
                                           ▼
                                         DELIVERED
                                           │
                                           ├── review transitions ─────────► REVIEWED
                                           ▼
                                         REVIEWED (terminal)
```

**Key detail:** `transition/request-payment` creates a Stripe PaymentIntent and
moves to `pending-payment`. Stripe then auto-fires `transition/confirm-payment`
(usually within seconds) moving to `preauthorized`. The lender sees the request
and can accept or decline from `preauthorized` state.

**File:** `src/transactions/transactionProcessBooking.js`

**Sharetribe process.edn (server-side state machine):** `ext/transaction-processes/default-booking/process.edn`. **Deployed via `flex-cli process push` + alias update** — the committed file does nothing until it's pushed AND the `default-booking/release-1` alias is repointed at the new version in Sharetribe Console.

Live alias state (as of April 23, 2026): `default-booking/release-1` → **version 5**. Critical gotcha: v2 was pushed on Dec 9, 2025 but the alias was never flipped, so prod ran on v1 (stock Sharetribe) for four months. This is why the Dec 12, 2025 transaction auto-paid-out the lender despite no shipment — v1's auto-complete fired regardless. v3 (April 14, 2026) added the Dec 9 custom complete-return/complete-replacement operator-fired payouts AND `transition/auto-cancel-unshipped`. v4 (April 15, 2026) added the two privileged late-fee transitions (`transition/privileged-apply-late-fees` from `:state/delivered` and `transition/privileged-apply-late-fees-non-return` from `:state/accepted`) needed for the 9.0 PR-2 charging pipeline. v5 (April 23, 2026) tightens `:transition/expire` from `P6D` to `PT24H` so lenders have 24 hours (not 6 days) to accept or decline a booking request before it auto-expires with full borrower refund. **Always verify the live alias version before debugging payout/cancel/charge behavior.**

**Payout flow (v3 active):** `transition/complete-return` and `transition/complete-replacement` are now `:actor.role/operator` transitions (no `:at` time trigger). They only fire when server code explicitly calls them:
- `server/webhooks/shippoTracking.js` fires `complete-return` when the return label gets a "delivered" tracking scan
- `server/scripts/sendOverdueReminders.js` fires `complete-replacement` for non-returns past the overdue window

## Cron Workers (Render)

All workers run as Render cron jobs. Each has `--dry-run`, `--verbose`, and
`--limit` flags for testing.

| Worker | Script | Schedule | What it does |
|--------|--------|----------|-------------|
| Lender Request Reminders | `sendLenderRequestReminders.js` | Every 15 min (cron) | 2-phase escalation SMS if lender hasn't accepted/declined within the v5 24h expire window (10.0 PR-4, April 23 2026): 60m gentle nudge (respects 8am–11pm PT quiet-hours), 22h final warning (bypasses quiet-hours — a 2am text beats a silent miss). Per-phase Redis dedupe keys `lenderReminder:{txId}:{60m\|22h}:sent`. Includes MISSED_FINAL watchdog that queries recently-expired txs (30-min lookback) and logs `[MISSED_FINAL] tx=X` + `[MISSED_FINAL_SUMMARY] count=N` per run; steady-state count should be 0. `MAX_AGE_MS` = 24h. |
| Lender Shipping Reminders | `sendShippingReminders.js` | Every hour on the hour (cron, `0 * * * *`) | 24hr "ship by tomorrow", end-of-day "not scanned", 48hr auto-cancel alerts to lender. 24h reminder anchored to `outbound.acceptedAt` time-of-day (not UTC midnight). Reads `protectedData.outbound.shipByDate` persisted at label-purchase time (10.0 PR-3) — no longer recomputes with its own `SHIP_LEAD_DAYS` env var. |
| return-reminders | `sendReturnReminders.js --daemon` | Long-running worker, internal 15-min loop | T-1, T, T+1 reminders for borrower return shipments. |
| Overdue / Late-Fee Reminders & Charges | `sendOverdueReminders.js` | Daily **17:00 UTC** (~10 AM PT) — Render cron schedule aligned April 21 2026 | Late fee notifications + automatic $15/day charge. Exits cleanly post-9.2.1 (PR #54). |
| Auto-Cancel Unshipped | `sendAutoCancelUnshipped.js --once` | Every hour on the hour (cron, `0 * * * *`) | Cancels accepted bookings still unscanned at end of D (11:59pm lender-local, D+1 for Monday-start) **PLUS 12-hour scan-lag grace buffer** (10.0 PR-5, April 23 2026) to avoid premature cancels when a carrier hasn't yet propagated the scan. Effective cancel window: 36h post-bookingStart for non-Monday bookings, 60h for Monday-start. Full refund (rental+commission+shipping) via `transition/auto-cancel-unshipped`, voids outbound+return Shippo labels, 3.2 SMS to borrower + 3.2b SMS to lender. Idempotent via `protectedData.autoCancel.sent` + state-machine guard. **Version gate accepts `processVersion >= 3`** (10.0 PR-4 fix — previously was `=== 3` exactly, which would have silently disabled auto-cancel for every v5 transaction). **Starts with `AUTO_CANCEL_DRY_RUN=1`** — flip to `0` only after a week of clean dry-run logs. |

`web-template` and `web-template-1` services on Render are unused scaffold placeholders — safe to delete.

**Idempotency pattern (Redis-backed, used by lender request + lender shipping reminders):**

Why Redis: the Integration SDK (used by crons) does NOT expose `sdk.transactions.update`, so any attempt to write `protectedData` flags silently fails → same SMS re-sent every cron tick. Redis is used elsewhere in the codebase (shortlinks, tracking) for exactly this purpose.

Keys per transaction (per phase, where applicable):
- `lenderReminder:{txId}:{60m|22h}:{sent|inFlight}` — 2-phase lender request escalation (10.0 PR-4)
- `lenderReminder:{txId}:missedFinal:logged` — 1h dedupe for MISSED_FINAL watchdog log (10.0 PR-4)
- `shippingReminder:{txId}:{24h|eod|cancel}:{sent|inFlight}` — 3-phase shipping flow

TTLs: `:sent` = 7 days (comfortably outlasts any reminder window). `:inFlight` = 10 min (auto-clears on process crash so next cron tick can retry; by the time it expires, tx has aged past any still-eligible window so no double-text).

Flow: check `:sent` → check `:inFlight` → SET `:inFlight` → send SMS → SET `:sent` + DEL `:inFlight` (on success) OR DEL `:inFlight` (on failure, retry next tick).

**Required env vars on every cron/worker that sends SMS:**
- `LINK_SECRET` — **must be identical** across web service + all workers (HMAC signs shortlink IDs; mismatch = unresolvable links)
- `REDIS_URL` + `REDIS_ENABLED=true` — must point to the same Redis instance as the web service
- `INTEGRATION_CLIENT_ID` + `INTEGRATION_CLIENT_SECRET` — Integration SDK credentials
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER`
- `PUBLIC_BASE_URL` / `SITE_URL`
- `SMS_ENABLED=true`, `SMS_DRY_RUN=false` for production

## SMS System

**File:** `server/api-util/sendSMS.js`

- Twilio Messaging Service (not a single from-number)
- E.164 phone format required; auto-converts 10-digit US numbers
- In-memory duplicate prevention (60-sec window per txId:transition:role)
- In-memory STOP list (resets on restart)
- Dry-run mode: `SMS_DRY_RUN=1` or `--dry-run` flag
- Phone filtering: `ONLY_PHONE=+15551234567` for testing

## Short Link System

**File:** `server/api-util/shortlink.js`

All SMS links go through the shortener to avoid Twilio 30019 carrier filtering:
- Format: `https://www.sherbrt.com/r/{6-char-base62-id}{4-char-hmac}`
- Redis-backed with configurable TTL
- HMAC-SHA256 verification prevents URL tampering
- Env: `LINK_SECRET`, `SHORTLINK_BASE`, `SHORTLINK_TTL_DAYS`

## Sharetribe SDK

**File:** `server/util/getFlexSdk.js`

Two SDK modes, used together in most scripts:
1. **Trusted Marketplace SDK** — `REACT_APP_SHARETRIBE_SDK_CLIENT_ID` + `SHARETRIBE_SDK_CLIENT_SECRET` (via `exchangeToken()`). **Preferred for QUERYING transactions** because it returns resource references in `included` as a `Map` keyed `${type}/${id}` and supports richer sparse-field projections. See `getScriptSdk()` pattern in `sendShippingReminders.js` + `sendAutoCancelUnshipped.js`.
2. **Integration SDK** — `INTEGRATION_CLIENT_ID` + `INTEGRATION_CLIENT_SECRET` (admin-level). **Required for calling operator-actor transitions** (`sdk.transactions.transition()`). Does NOT expose `sdk.transactions.update` — writes to `protectedData` must go through `upsertProtectedData()` in `server/lib/txData.js` or via Redis-backed idempotency keys.

Most daemons mix both: trusted SDK for the accepted-tx query, Integration SDK for the privileged transition call.

Base URL: `https://flex-api.sharetribe.com`

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/initiate-privileged` | POST | Start a transaction (privileged, backend-only) |
| `/transition-privileged` | POST | Advance a transaction state |
| `/transaction-line-items` | POST | Calculate booking fees/taxes |
| `/webhooks/*` | POST | Shippo tracking webhooks |
| `/twilio/sms-status` | POST | Twilio delivery receipts |
| `/qr/*` | GET | QR code redirect system |
| `/ensure-phone-number` | POST | Save phone to user protectedData |
| `/auth/google`, `/auth/facebook` | GET | OAuth flows (Passport.js) |

## Key Business Logic

**Late Fees** (`server/lib/lateFees.js`):
- $15/day, max 5 charges = $75 cap (policy confirmed April 15, 2026)
- Charge for day N-1 on day N's cron (24h scan-lag rule — see PR-3 scope doc)
- Day 1 = SMS only, no charge. Days 2-6 cron = SMS + $15 charge for prior day
- Day 6 = replacement warning SMS + 5th/final $15 charge (for day 5). Day 7+ = hard stop
- USPS scan stops all charging immediately (no lump-sum catch-up)
- Excludes Sundays and USPS holidays
- Idempotent per business day (Flex protectedData `lastLateFeeDayCharged`)
- SMS dedupe via Redis (`overdueNotified:{txId}:{daysLate}:{sent|inFlight}`) — pending PR-3a
- No automatic replacement (manual operator action only, `AUTO_REPLACEMENT_ENABLED=false`)

**Shipping** (`server/lib/shipping.js`) — Shippo-anchored architecture as of 10.0 (April 23, 2026):
- Shippo label creation + tracking via webhooks
- ZIP code resolution from labels or protectedData
- **Ship-by date derived from Shippo's selected rate `estimated_days` + `SAFETY_BUFFER_DAYS` (default 1), business-day-subtracted from bookingStart** — NOT from a static `SHIP_LEAD_DAYS` env var. `computeShipByDate` prefers the persisted `protectedData.outbound.shipByDate` first; recomputes only on Shippo outage or pre-10.0 transactions. `SHIP_LEAD_DAYS` env var is retained as a fallback floor, not the primary path.
- Business-day subtraction uses Pacific Time, skips Sundays and USPS holidays, KEEPS Saturdays (scope decision #8).
- Ship-by date adjusts Sunday → Saturday (legacy safety net; business-day subtraction already skips Sundays).
- **Rate-lock at borrower checkout:** `estimateOneWay` returns full rate metadata including `rateObjectId` + `estimatedDays` + `amountCents`; `initiate-privileged.js` persists to `protectedData.outbound.lockedRate` + `protectedData.return.lockedRate` at preauth. At lender accept, `transition-privileged.js` purchases the EXACT locked `rateObjectId` — no feasibility re-check, no fallback re-selection. Borrower preauth cost = actual label cost, always. Eliminates the silent Sherbrt-absorbed delta for short-lead cross-country bookings (CC Option 6 recommendation from 10.0 review).
- **Preferred services (`config/shipping.js`, expanded 10.0 PR-1 to 6 entries):** USPS Priority Mail, USPS Ground Advantage, USPS Priority Mail Express, UPS Ground, UPS 2nd Day Air, UPS Next Day Air Saver. `nameOf` helper strips trademark symbols (® U+00AE, ™ U+2122) from Shippo's returned service names so the filter matches regardless of Shippo-side drift — Shippo returns e.g. `"UPS 2nd Day Air®"` while config is `"UPS 2nd Day Air"` without ®.
- **Outbound rate selection (`pickCheapestAllowedRate`, 10.0 PR-1 refactor):** takes `daysUntilBookingStart` directly (not `shipByDate`), filters to `preferredServices` FIRST, then prefers UPS Ground if feasible, else cheapest feasible preferred, else cheapest of preferred (last resort). Reads `SAFETY_BUFFER_DAYS` from `SHIP_SAFETY_BUFFER` env.
- **Return rate selection (`pickCheapestPreferredRate`, new 10.0 PR-1):** always cheapest preferred service, no deadline filter, no dependency on outbound shipByDate. Previously shared `pickCheapestAllowedRate` with outbound and incorrectly reused outbound's past shipByDate as its deadline — always hit the "absolute cheapest" last-resort branch by accident.
- Haversine distance calculation for cost estimation (legacy `SHIP_LEAD_MODE=distance` mode still supported but unused).

**Business Days** (`server/lib/businessDays.js`):
- Pacific time (America/Los_Angeles) for all calculations
- Excludes Sundays and USPS holidays (2025–2028 calendar, expires `2028-12-25`; 90-day pre-expiry warning)

## Deployment (Render)

**Config:** `render.yaml`

| Service | Type | Start Command |
|---------|------|--------------|
| shop-on-sherbet | Web | `node server/index.js` |
| return-reminders | Worker | `node server/scripts/sendReturnReminders.js --daemon` |
| overdue-reminders | Worker | `node server/scripts/sendOverdueReminders.js --daemon` |
| auto-cancel-unshipped | Cron `0 * * * *` | `node server/scripts/sendAutoCancelUnshipped.js --once` |
| lender-request-reminders | Cron `*/15 * * * *` | `node server/scripts/sendLenderRequestReminders.js --once` |
| shipping-reminders | Cron `0 * * * *` | `node server/scripts/sendShippingReminders.js --once` |

Build: `yarn install --frozen-lockfile && yarn build`
Health check: `/healthz`

**Important: `render.yaml` is documentation-only for the three Cron Jobs above.**
The file is NOT auto-synced to Render in this project — `auto-cancel-unshipped`,
`lender-request-reminders`, and `shipping-reminders` were all created manually
as Cron Jobs in the Render UI. The `render.yaml` blocks are kept in sync as
intended-config documentation; **live config edits must happen in the Render
dashboard**, not by editing `render.yaml`. The three Worker services
(`return-reminders`, `overdue-reminders`, and the web service `shop-on-sherbet`)
ARE managed via `render.yaml`.

## Key Environment Variables

See `.env.example` for the full list. Critical ones:

| Variable | Purpose |
|----------|---------|
| `REACT_APP_SHARETRIBE_SDK_CLIENT_ID` | Marketplace SDK client ID |
| `SHARETRIBE_SDK_CLIENT_SECRET` | Marketplace SDK secret |
| `INTEGRATION_CLIENT_ID` | Integration SDK (for cron scripts) |
| `INTEGRATION_CLIENT_SECRET` | Integration SDK secret |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `SHIPPO_API_TOKEN` | Shippo shipping API |
| `TWILIO_ACCOUNT_SID` | Twilio SMS |
| `TWILIO_AUTH_TOKEN` | Twilio SMS |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio SMS |
| `REDIS_URL` | Redis connection |
| `LINK_SECRET` | Shortlink HMAC secret |
| `REACT_APP_MARKETPLACE_ROOT_URL` | Public URL |
| `SHIP_SAFETY_BUFFER` | Buffer days added to Shippo's `estimated_days` when computing ship-by. Default `1`. Only used when deriving shipByDate from a Shippo rate (10.0 PR-2). |
| `SHIP_LEAD_DAYS` | Fallback lead-days value when no Shippo rate is available (outage, manual cron invocation, pre-10.0 tx). Default `2`. Before 10.0 this was the primary path; now demoted to fallback only. |

## Checkout Flow (Known Fix)

**Issue:** Form context errors from nested Final Form providers in checkout.

**Solution:** Single FinalForm provider at `CheckoutPageWithPayment.js` level.
`StripePaymentForm.js` was converted from form owner to context consumer.

Key fields: `email`, `phone` (E.164 normalized), `billingAddress.*`,
`shippingAddress.*`, `shippingSameAsBilling` toggle.

Address mapping: `line1` → `customerStreet`, `postalCode` → `customerZip`.

**Files:** `CheckoutPageWithPayment.js`, `StripePaymentForm.js`
**Full details:** `CHECKOUT_FORM_CONTEXT_FIX.md`

## Recent Fixes & Gotchas

### September 11, 2026 — Borrower re-shop SMS link was a dead short link (1c + 2b)

Borrowers whose request was declined or expired got an SMS ending in
`https://www.sherbrt.com/r/lyBUNc13c1`, which rendered as **"invalid/expired
link"** when tapped. The `/r/` shortener target was gone, so every one of these
texts sent the borrower to a dead end at exactly the moment they were most
likely to re-book.

Fixed in both senders — they had duplicated the same hardcoded default:

- `server/api/transition-privileged.js` (**2b-SMS**, `transition/decline`) —
  `BORROWER_RESHOP_URL` default → `https://sherbrt.com/s`. Also dropped the
  trailing `.` after the URL; iOS was folding it into the link.
- `server/scripts/sendLenderRequestReminders.js` (**1c-SMS**, watchdog on
  `transition/expire`) — `BORROWER_EXPIRED_RESHOP_LINK` default → same URL.

**Gotcha:** both read `process.env.BORROWER_RESHOP_URL` first. If that var is
set on Render to the old `/r/` link, the code default never applies — check
Render env before assuming the fix shipped. It should be unset, or set to
`https://sherbrt.com/s`.

`/s` is the canonical search results page and (since Sept 2) sorts by highest
retail price, so borrowers land on real inventory with nothing left to expire.
`server/scripts/test-borrower-sms.js` still carries older decline copy, but it's
a dry-run formatting harness and sends nothing.


### September 2, 2026 — Search results default-sorted by highest retail price (PR #90)

`/s` used to open newest-first with no way to change the default. It now opens
**highest retail (original) price first** — $2,998 Madison Dress down to $88 —
and the Sort dropdown gained "Highest retail price" / "Lowest retail price".
Merge commit `53ac4ce`, branch `sort-only-retail-price`, deployed on Render.

**Two independent things were blocking this, and neither was where you'd look first.**

**Blocker 1 — the Console "Listing search" sorting checkboxes do nothing in this
template.** `mergeSearchConfig` in `src/util/configHelpers.js` explicitly discards
the hosted sort config and substitutes the local one:

```js
// The sortConfig is not yet configurable through Console / hosted assets,
// but other default search configs come from hosted assets
const searchConfig = hostedSearchConfig?.mainSearch
  ? { sortConfig: defaultSearchConfig.sortConfig, ...hostedSearchConfig }
  : defaultSearchConfig;
```

Toggling Newest/Oldest/price in Console → Listings → Listing search is read and
thrown away. **Sorting is a code-only setting** — edit `src/config/configSearch.js`.

**Blocker 2 — `publicData.retailPrice` had no search schema, so the API silently
ignored the sort key.** Sharetribe does not error on an unknown sort key; it
returns 200 with default ordering. Confirmed by querying with a deliberately
fake field name and getting byte-identical results. `retailPrice` was added as
custom code, never registered as a searchable field. Fixed with the CLI:

```
flex-cli search set --key retailPrice --type long --scope public -m sherbrt
```

Reindex takes a few minutes. **Any future sort on a `publicData` field needs the
same step** — and the failure mode is silence, not an error, so always verify by
comparing against a nonsense field name.

**Gotcha — Sharetribe's sort prefix is inverted from the usual convention.**
No prefix = **descending**, `-` prefix = **ascending**. Verified empirically:

| `sort=` | result |
|---|---|
| `price` | 20000, 20000, 10000, 9900 (high → low) |
| `-price` | 2500, 2500, 2500 (low → high) |
| `createdAt` | newest first |
| `-createdAt` | oldest first |

So highest-retail-first is `sort=pub_retailPrice`, **not** `-pub_retailPrice`.
This is also why `configSearch.js` maps `-price` → "Lowest price" and `price` →
"Highest price", which reads backwards but is correct.

**Gotcha — the SearchPage builds its query in TWO places, and they must agree.**
This caused a real bug that shipped: the dropdown read "Highest retail price"
while results came back newest-first, and you had to pick another option and
switch back to actually get retail ordering.

- `loadData()` in `SearchPage.duck.js` builds the **actual API call**. It spreads
  the parsed URL query straight through, so with no `?sort=` in the URL it sent
  no sort at all and Sharetribe applied its own newest-first default.
- `pickSearchParamsOnly()` in `SearchPage.shared.js` only feeds the
  `searchParamsAreInSync` check — patching it changes nothing about what's fetched.
- `SortBy.js` had `const defaultValue = 'createdAt'` hardcoded, which is what the
  dropdown *displays*.

All three now route through one helper, `getDefaultSortMaybe` in
`src/util/search.js` (chosen because both the duck and `SearchPage.shared.js`
already import from there — importing shared.js into the duck risks a circular
dep). It skips the default when a `keywords` search is active so relevance
ordering still wins, and treats `sort === null` (a conflicting filter deliberately
clearing it) differently from `sort === undefined`. If you only patch one of the
three, you get a dropdown that lies about what it's showing.

**Configuring the default sort now:** set `defaultSort` in `sortConfig`
(`src/config/configSearch.js`). It must match one of the `options` keys —
`validSortConfig` drops it otherwise. Empty string falls back to the API default.

**Also in this PR:** `SortBy.lowestPrice` / `SortBy.highestPrice` in
`src/translations/en.json` renamed to "Lowest borrow price" / "Highest borrow
price", to disambiguate from the new retail-price options. Note Console →
Content → Marketplace texts overrides `en.json`, so check there if a label
change doesn't take.

**Consequence to remember:** `publicData.retailPrice` is now load-bearing for
discovery, not just display. Anything that changes how it's collected or stored
changes catalog ordering. (It is a required field, so blank values are not a
live concern — but a listing that somehow lacked it would sort to the bottom.)

### June 11, 2026 — Return-reminder TZ off-by-one (8-SMS) + shortlinks falling back to raw URLs on workers

Surfaced by an intentionally-late test transaction: `6a21f7cf-028e-4ced-a771-dda7e4d3bd0d` (Faille Halter Mini Dress, booking **Sat Jun 6 — Tue Jun 9**, so `booking.end = 2026-06-09T00:00:00Z`, end-exclusive → last booked day / ship-back day is **Mon Jun 8 PT**). Two unrelated bugs fell out of it.

**Bug 1 — day-of return reminder (8-SMS) fired a day late, and contradicted the overdue copy on the same day.** The borrower got "⏰ Today's the day to ship back" on **Tue Jun 9 8:06am**, then "⚠️ ended yesterday" (9.1 Overdue Day 1) on **Tue Jun 9 10:01am** — two messages on the same day that disagree about when the return was due.

- Root cause: a **date-basis mismatch between two scripts that must agree.** `server/scripts/sendReturnReminders.js` computed the due date as a **UTC calendar date** (`bookingEndUTC.format('YYYY-MM-DD')` → `2026-06-09` = Tuesday), while the late-fee engine — `server/scripts/sendOverdueReminders.js` via `server/lib/businessDays.js` `ymd()`/`computeChargeableLateDays()` — resolves the same timestamp in **Pacific time** (`dayjs(end).tz('America/Los_Angeles')` → `2026-06-08` = Monday, because UTC midnight is 5pm the previous day in PT). So the day-of reminder thought "today" was Tue while the overdue engine thought "due" was Mon → day-of fired Tue (one day late) and Overdue Day 1 also fired Tue ("ended yesterday"). The two systems were silently one day apart.
- **NOT related to delivery/carrier status.** These reminders are derived purely from `booking.end` (with `deliveryEnd`/`returnData.dueAt` fallbacks), not from Shippo scans. The package being delivered late does not shift them.
- A misleading code comment (now corrected) claimed the UTC-date read was done *to align with* the overdue script. It did the opposite — the overdue script uses PT, so reading UTC misaligned them by a day.
- **Fix** (branch `fix/return-reminder-tz-basis`, commit `1c98a81fc`, PR open against `main`): in `sendReturnReminders.js`, `dueLocalDate` now uses `bookingEndPT.format('YYYY-MM-DD')` (PT basis, matching `businessDays.js`), and `tMinus1ForTx` is derived from the PT instant directly — `bookingEndPT.subtract(1, 'day').format(...)` — instead of re-parsing the `dueLocalDate` string (`dayjs('YYYY-MM-DD').tz(TZ)` re-shifts in UTC-hosted Render and would land T-1 on the wrong day). Result for this booking: day-of (8-SMS) = **Mon Jun 8**, T-1 (7-SMS) = **Sun Jun 7**, exactly one day before Overdue Day 1. Verified the math is stable under server `TZ=UTC`, `America/Los_Angeles`, and `America/New_York`; all 143 return-reminder tests pass. Deploys to the `return-reminders` worker on merge.
- **Gotcha to remember:** any new code that computes a return/overdue/late-fee due date MUST resolve `booking.end` in `America/Los_Angeles` (use `businessDays.js` `ymd()` or `dayjs(end).tz(TZ)`), never `dayjs.utc(end).format()`. And never re-parse a `'YYYY-MM-DD'` string with `dayjs(str).tz(TZ)` — anchor date math to the original PT `dayjs` instant.

**Bug 2 — SMS links were not being shortened (raw `deliver.goshippo.com/...png?Expires=…&Signature=<800+ chars>` label URLs in texts).** This is an **env-config bug, not code.** `server/api-util/shortlink.js` `shortLink()` silently returns the original URL when any of its guards fail, in this order: shortlinks disabled → `!LINK_SECRET || !redis` → `SHORTLINK_BASE` is falsy or `=== '/r'`. `SHORTLINK_BASE` is **not set on any Render service**, so it derives from `deriveBase()` = `(PUBLIC_BASE_URL || SITE_URL) + '/r'` (`server/lib/env.js`). The **web service `shop-on-sherbet`** has `PUBLIC_BASE_URL` set → base resolves to `https://www.sherbrt.com/r` → shortlinks work there (e.g. 4-SMS `item_shipped_to_borrower` → `https://www.sherbrt.com/r/zPMK6I1494`). The **worker/cron services did not have `LINK_SECRET`** (and weren't deriving a valid base) → every guard bailed → raw URLs.

- Affected jobs (all call `await shortLink(...)` but ran without the env): `overdue-reminders` (9.x), `return-reminders` (7/8), `shipping-reminders` (3.1/3.1b), `lender-request-reminders` (1a/1b). The web service (`transition-privileged.js`, `webhooks/shippoTracking.js`, `lender-booking-sms.js`) was already fine.
- **The "4-SMS looks fine" trap:** 4-SMS embeds a *carrier tracking* URL (`getPublicTrackingUrl` → `tools.usps.com/...`, `ups.com/track?...`, or `goshippo.com/track/<num>`), which is short even when the shortener falls back. The overdue/return reminders embed the giant **Shippo label PNG**, so only they look obviously broken. Don't use "4-SMS has a link" as proof the shortener works — confirm the link is a `https://www.sherbrt.com/r/...` token (id 6 chars + hmac 4 chars).
- **Fix** (env only — no code change): on each worker/cron, set `LINK_SECRET` and `REDIS_URL` to the **exact same values as the web service** (token is HMAC-signed by the worker and resolved by the web service's `GET /r/:token` route in `server/index.js` against the shared Redis — mismatched secret or different Redis = link generates but 404s on click), and ensure `PUBLIC_BASE_URL=https://www.sherbrt.com` is present (or set `SHORTLINK_BASE=https://www.sherbrt.com/r` explicitly to bypass the derive). **Done on `overdue-reminders` (June 11, 2026); still TODO on `return-reminders`, `shipping-reminders`, `lender-request-reminders`.** Setting `PUBLIC_BASE_URL` on the workers also re-enables Twilio delivery-status callbacks (`sendSMS.js` only wires `statusCallbackUrl` when `PUBLIC_BASE_URL` is set). Verify post-deploy via the worker's `[SMS] shortlink` log line (prints `short` + `original`) or the next daily run's received SMS.
- **Suggested hardening (not yet done):** add a startup guard that logs loudly when `SHORTLINK_BASE` resolves to `/r`, so a missing `PUBLIC_BASE_URL` fails visibly instead of silently emitting raw links.

### June 3, 2026 — Availability shape + cross-app TZ basis (PRs #77, #78, #79, #80, #81)

**The bug family.** A single listing — Tribeca Blazer Dress, `69160706-…` — surfaced four interlocking bugs that all stemmed from the same root cause: Sherbrt's marketplace is configured as **Daily + oneSeat** in the Sharetribe Console, which means listings MUST use `availability-plan/day` (entries `{ dayOfWeek, seats }` only — no `startTime`/`endTime`, no `timezone`). The web app was forked from the stock Sharetribe template that assumes `availability-plan/time` everywhere. The mobile wizard was already writing the correct day-shape, but only mobile-touched listings exposed the mismatch.

Five PRs shipped:

**PR #77 (`fix/web-availability-plan-day-shape`) — read & write of day-shape listings:**
- `src/util/generators.js` — `findNextPlanEntryInfo` now detects day-shape entries (no `startTime`/`endTime`) and treats them as covering `[dayStart, nextDayStart)` in the listing TZ. Without this branch, every mobile-saved listing showed every day as "Not available" on the lender's edit calendar.
- `src/containers/EditListingPage/EditListingWizard/EditListingAvailabilityPanel/EditListingAvailabilityPanel.js` — `getAllDaysAlwaysAvailable` emits day-shape (`{ dayOfWeek, seats: 1 }`, no timezone); `handleNextTab` preserves the existing plan instead of overwriting with a hard-coded time-shape payload (which Sharetribe rejects with HTTP 400 for Daily + oneSeat marketplaces).

**PR #78 (`fix/web-availability-day-shape-tz-gates`) — stop gating fetches on `plan.timezone`:**
- `EditListingPage.duck.js fetchLoadDataExceptions`, `ListingPage.duck.js fetchMonthlyTimeSlots` — removed `hasTimeZone` / `!!tz` early-returns. Day-shape plans never carry a timezone, so these gates silently no-op'd for every mobile-touched listing (lender's edit calendar showed no exceptions; public listing page showed the whole month unavailable).
- `OrderPanel.js`, `ListingPageCarousel.js` — same fix, plus a nullsafe access on `ListingPageCarousel:167` that previously TypeError'd for any plan-less listing.

**PR #79 (`fix/web-availability-tz-basis`) — single canonical TZ across both apps:**
- New `MARKETPLACE_TZ = 'America/Los_Angeles'` constant in `src/util/dates.js`. **Keep in lockstep with `sherbrt-mobile/lib/availability.ts`.** Re-anchor here if the operator picks a different canonical TZ.
- New `marketplaceDayStart(year, month, day)` helper in `src/util/dates.js`. Returns a UTC `Date` representing midnight on the given calendar day in `MARKETPLACE_TZ`. Implementation anchors at `day: 1` (always valid) and uses `moment.add(day - 1, 'days')` because **`moment.tz({ day: 32 })` and `moment.tz([y, m, 32])` BOTH return `Invalid Date`** — only `Date.UTC` normalizes day overflow, but we need TZ-aware output, so the workaround is the start-of-month + `.add('days')` pattern. DST-safe (LA spring-forward and fall-back days are 23h and 25h respectively).
- `MonthlyCalendar.js` tap-handler writes `[marketplaceDayStart(y, m, d), marketplaceDayStart(y, m, d + 1))` instead of `Date.UTC(...)`. Same calendar cell now maps to the same UTC interval on web and mobile, regardless of which device/coast clicked it.
- `EditListingAvailabilityPanel.js` — `formatDateToUtcMidnight` renamed/rewritten as `formatDateToMarketplaceDayStart`. Removed the dead legacy time-shape editor (`createEntryDayGroups`, `createInitialPlanValues`, `createEntriesFromSubmitValues`, `createAvailabilityPlan`, `handlePlanSubmit`, `valuesFromLastSubmit`, top-level `WEEKDAYS`/`rotateDays`/`defaultTimeZone`, unused `EditListingAvailabilityPlanForm` import). It was never wired up after the MonthlyCalendar migration but was a 400-on-write landmine if anyone rewired it.
- All four read-path fallbacks (`EditListingPage.duck.js`, `ListingPage.duck.js`, `OrderPanel.js`, `ListingPageCarousel.js`) now fall back to `MARKETPLACE_TZ` instead of browser-TZ. Fetch and render now share one calendar-day basis — fixes an off-by-one bookable cell for any non-PT borrower that the post-PR-#78 audit caught.
- `EditListingDetailsPanel.js setAvailabilityPlanForListing` — non-booking else-branch returns an empty day-shape plan instead of an empty time-shape one. No-op today (Sherbrt has no purchase process), but safe rather than a launch-day 400 if one is ever added.

**PR #80 (`fix/web-availability-day-overflow`) — month-end blocks no longer throw:**
- A hot-fix specifically to handle `marketplaceDayStart(y, m, d + 1)` when `d` is the last day of the month (e.g. `day = 32` on a 31-day month). See the implementation note above. Without this fix, tapping "block Jan 31" / "block Feb 28" / etc. threw `RangeError: Invalid time value` inside the MonthlyCalendar tap handler and no exception was created. Verified via empirical 1,095-day brute-force test across 2025–2027 that both web (`moment-tz`) and mobile (`Intl`) helpers produce **byte-identical UTC instants** for every valid in-month day AND every month-end overflow.

**PR #81 (`fix/web-lender-calendar-render-and-save`) — post-deploy follow-up: lender wizard couldn't see blocks and couldn't save:**

Surfaced within an hour of the PRs #77–#80 deploy. Two distinct bugs caught by manual smoke-testing on the live tribeca-blazer-dress listing.

- **Symptom A — lender edit calendar showed every day as available, even on a listing with 4 stored exceptions** (June 3–6). Also, clicking any cell did NOT update the UI (no coral pill), but the click WAS persisted to the backend (visible immediately on mobile and in the borrower-side incognito view).
- **Symptom B — "Save & continue" returned HTTP 400** with no diagnostic surfaced to the user.

Three of four surfaces (web borrower, mobile lender, mobile borrower) rendered the blocks correctly — only the web lender wizard failed, because it's the only surface that recomputes calendar state client-side via `generators.js availabilityPerDate` rather than reading API-computed time slots. Empirical Node-based repro of the actual algorithm reproduced the symptom for both Pacific and Eastern browsers (each browser-local TZ producing a differently-shaped failure of the same root cause).

Two coupled defects in `src/util/generators.js` (BUG-1):

  * `availabilityPerDate` derived `timeZone = plan?.timezone`, which is `undefined` for day-shape plans (Sherbrt's never have one). The entire downstream pipeline — `getStartOf`, `getDayOfWeek`, `generateDates`, `isInRange`, `findNextPlanEntryInfo` — then ran in **browser-local TZ** instead of `MARKETPLACE_TZ`. PR #79 standardized the duck/render-fallback layers but missed this one.
  * `getExceptionsOnDate` then constructed `dayUTC = Date.UTC(localY, M, D)` and tested `exStart <= dayUTC < exEnd`. For an LA-anchored exception (`07:00Z`/`08:00Z` start), `dayUTC = 00:00Z` was 7–8 hours too early — the exception was never recognized as covering the cell. **Both sub-edits required:** patching only `availabilityPerDate`'s TZ default OR only the overlap test leaves the other half broken (verified empirically).

  Fix: default `availabilityPerDate`'s timeZone to `MARKETPLACE_TZ` AND replace `getExceptionsOnDate`'s UTC-midnight reconstruction with a clean `[start, end)` interval-overlap test against the dayStart/dayEnd interval the caller already builds in the right TZ. After both fixes, the computation is **browser-TZ-independent** — Pacific and Eastern viewers see byte-identical calendar state, as it should be.

One regression in `EditListingAvailabilityPanel.js handleNextTab` (BUG-2):

  * After the PR #79 cleanup that removed the `availability-plan/time` overwrite, `handleNextTab` still sent `{ availabilityPlan, exceptions: allExceptions }` to `onUpdateListing` → `sdk.ownListings.update`. The `exceptions` array is **not a valid attribute on `ownListings.update`** — availability exceptions are a separate resource (`sdk.availabilityExceptions.*`), persisted at click-time. Sharetribe rejected the unknown attribute with HTTP 400. The `availabilityPlan` itself was fine (day-shape, no timezone) — the 400 was specifically the `exceptions` field.

  Fix: drop `exceptions` from the `handleNextTab` payload AND destructure it out of `data` in `EditListingPage.duck.js requestUpdateListing` (belt-and-suspenders for any other caller that might pass it).

**Cross-cutting invariants.**
- **TZ basis = `America/Los_Angeles` everywhere.** Web exception writes, web exception/timeslot reads, calendar bucketing, day-gate logic, and the borrower booking flow all bucket UTC instants against LA calendar days. The mobile app does the same (see `sherbrt-mobile/lib/availability.ts`).
- **Shape contract = `availability-plan/day`.** The mobile wizard writes this. The web wizard `getAllDaysAlwaysAvailable` writes this. Anywhere the codebase still hard-codes `availability-plan/time` is dead code (test fixtures, the removed legacy editor) — flag and remove on sight.
- **The `availability-plan/day` plan body must NOT include `timezone`.** Sharetribe rejects it as "Disallowed key" on day-plans for Daily + oneSeat marketplaces. This is why every reader has to fall back to `MARKETPLACE_TZ` instead of `plan.timezone`.

**Backfill scripts (`server/scripts/`).**
- `backfillAvailabilityPlan.js` — Integration API script that walks every listing and ensures it has a day-shape plan. Idempotent. Dry-run by default; `--apply` to write. Drafted but not yet run (every listing in the current marketplace already has a plan — the planless case was a hypothetical the code was protecting against).
- `reanchorAvailabilityExceptions.js` — Integration API script that walks every listing's existing `availabilityExceptions` and re-writes them from whatever TZ they were originally stored in (UTC midnight, device-local midnight, etc.) to `MARKETPLACE_TZ` midnight. **Already run on the live marketplace (June 3, 2026).** Inference heuristic: the stored start's UTC hour-of-day signals which TZ the lender wrote from (`04:00Z` → EDT, `05:00Z` → EST, `07:00Z` → PDT/already-LA, `08:00Z` → PST/already-LA, `00:00Z` → old web UTC-midnight). Multi-day blocks preserve their day count. Two non-obvious safety properties baked in after first-run lessons learned:
  - **Processes exceptions in reverse chronological order per listing.** Otherwise rewriting day N first creates a new LA-anchored range that overlaps the still-old day N+1's UTC-midnight range (because LA midnight on N+1 falls inside `[N+1 UTC 00:00Z, N+2 UTC 00:00Z)`). API rejects, original exception is deleted but new one isn't created → data loss.
  - **Skips exceptions in the past** (start > 1 day ago). Flex's `availabilityExceptions.create` rejects "start more than 1 day in the past." If we did delete-then-create on a past exception, the delete would succeed but the create would fail → irretrievable data loss. Past exceptions are also booking-irrelevant.
- `restoreLostExceptions.js` — One-shot recovery script for two specific future exceptions (`6/03/2026` and `7/01/2026` on listing `685eeceb-…`) that were lost by the FIRST `reanchorAvailabilityExceptions.js` run before the two safety properties above were added. Safe to delete once verified.

**Live data state after June 3 backfill run.** 9 future-dated availability exceptions across the marketplace, all LA-anchored. 11 past-date exceptions (8/2025, 9/2025, 5/30, 5/31 2026) were lost during the first apply run before the past-date skip was added — functionally irrelevant since past dates can't be booked, but the data is gone if anyone needed the historical record.

**Mobile cross-reference.** Mobile commit `00c63d9` on `main` (June 3, 2026) lands the same `MARKETPLACE_TZ` basis: `lib/availability.ts` gets a new `MARKETPLACE_TZ` constant + Intl-only `marketplaceDayStart` helper (no new dependency), `getListingTimeZone` fallback `'Etc/UTC'` → `MARKETPLACE_TZ`, `blockDate` writes LA-midnight intervals, `normalizeException` keys `ymd` in LA TZ. **NOT yet shipped to users** — waiting on a binary rebuild (build 13) since this app has no `expo-updates` / OTA capability. See `sherbrt-mobile/CLAUDE_CONTEXT.md` June 3 entry for the mobile-side detail.

**Gotchas not to re-discover.**
- **Don't use `moment.tz({ day: 32 })` or `moment.tz([y, m, 32])` to normalize day overflow** — both return `Invalid Date` (verified empirically). Use `Date.UTC(y, m, d)` for normalization OR the start-of-month + `.add('days')` pattern (which is what `marketplaceDayStart` does, so it gets it right for free).
- **Don't re-add `expo-updates` / OTA without a re-build.** OTA only reaches users running a binary that has `expo-updates` baked in. Adding it to source doesn't help existing 1.1.0/1.1.1 users.
- **`appVersionSource: remote` in `eas.json`** means EAS manages version numbers, not `app.json`. Don't manually bump `app.json` for a build — `eas build` auto-increments via the `autoIncrement: true` setting on the `production` profile.
- **Flex's `availabilityExceptions.query` caps the range at 366 days.** Original `reanchorAvailabilityExceptions.js` tried a 2-year window and 400'd; current version splits into two 365-day windows (past + future) and dedupes.
- **`marketplaceDayStart(y, m, d + 1)` to compute the EXCLUSIVE end of a single-day block** — DST-safe because moment's `.add('days')` counts calendar days, not absolute hours. Don't substitute `+ 24 * 60 * 60 * 1000` — that drifts on spring-forward and fall-back days.
- **`availabilityPerDate` in `src/util/generators.js` MUST default `timeZone` to `MARKETPLACE_TZ`** when `plan?.timezone` is undefined (which it always is for day-shape plans). Without this default, the entire downstream pipeline runs in browser-local TZ and silently mis-buckets every exception. PR #79 missed this; PR #81 caught it post-deploy. If a future refactor of `availabilityPerDate` reverts this default, the lender wizard will silently break again.
- **`getExceptionsOnDate` in `src/util/generators.js` uses a `[start, end)` interval-overlap test** — it does NOT reconstruct a `Date.UTC(...)` reference instant. The old implementation built `dayUTC = Date.UTC(localY, M, D)` (UTC midnight) and compared `exStart <= dayUTC < exEnd`, which failed for any LA-anchored exception (off by 7-8 hours). The correct test is `exStart < dayEnd && dayStart < exEnd`, with `dayStart`/`dayEnd` constructed by the caller in `MARKETPLACE_TZ`.
- **`exceptions` is NOT a valid attribute on `sdk.ownListings.update`.** Don't include it in any update payload — availability exceptions are a separate Sharetribe resource (`sdk.availabilityExceptions.*`), persisted at click-time. Sharetribe rejects unknown attributes with HTTP 400. Both `EditListingAvailabilityPanel.handleNextTab` and `EditListingPage.duck.js requestUpdateListing` strip it out as of PR #81.

**Empirical verification artifacts** (from the pre-merge audit, June 3, 2026):
- 1,095-day brute-force across 2025–2027: web and mobile `marketplaceDayStart` produce byte-identical UTC instants.
- DST boundary trace: March 8 2026 (spring-forward, 23h day), November 1 2026 (fall-back, 25h day). Both apps land on the same UTC instant at LA midnight of each day; consecutive-day diff is 23h and 25h respectively (correct).
- Hawaii trace: a lender on HST blocking July 4 stores `[LA midnight Jul 4, LA midnight Jul 5)`. The wizard's `serverByYMD` map keys against `ymdInTZ(start, MARKETPLACE_TZ)` = `"2026-07-04"`, matching what a re-tap on the calendar cell would produce. No phantom duplicate on re-tap. No B5 race.
- **PR #81 post-deploy repro:** the actual `toAvailabilityPerDate` algorithm run in Node against the 4 LA-anchored exceptions on `69160706-…` produces the bug's exact "all available" shape on a Pacific browser and a differently-shifted "mixed" shape on an Eastern browser BEFORE the fix; AFTER the fix, both browsers produce identical output with June 3–6 → `hasAvailability=false` and June 2/7/8 → `hasAvailability=true`. Production smoke test confirmed: lender wizard now shows blocks correctly, clicks toggle pills immediately, Save & continue advances without 400.

### May 29, 2026 — IN-FLIGHT: end-to-end verification via intentionally-late test transaction

**Status.** Code shipped to main as commit `cb08b4993` (lender-share split +
atomic charge+SMS fix). Render auto-deployed to the
`Overdue / Late-Fee Reminders & Charges` cron service. Env vars set on that
service:
- `OVERDUE_FEES_CHARGING_ENABLED=true`
- `LATE_FEE_LENDER_SHARE_ENABLED=true`
- `LENDER_LATE_FEE_SHARE_PCT_OVERRIDE=50`

Verification is now blocked on a single intentionally-late test transaction
that validates BOTH (a) the atomic charge+SMS invariant in production, and
(b) the load-bearing B1 assumption that provider line items added by the
mid-flow late-fee transition accumulate into the cumulative payout total
carried to `stripe-create-payout` at `complete-return`. B1 cannot be proven
by unit tests — see `docs/9.0_late_fee_lender_share.md:101` for the full
write-up of the assumption and why this empirical check is required.

**Test setup.**
- Booking: 3-night minimum, both sides operator-controlled (one borrower
  account, one lender account with Stripe Connect onboarding complete).
- Item: any active listing where the operator can withhold the return at
  will to force lateness.
- Borrower checks out and pays normally, lender accepts, item ships and
  is delivered to borrower.

**Intentional lateness.**
- Do NOT ship the return on the booking-end date. Let the return-by date
  pass with no return carrier scan.
- Day 1 after booking-end (10 AM PT cron): expect SMS only, no charge.
  Log signature: `[lateFees] SKIP tx=... reason=scan-lag-grace daysLate=1`.
- Day 2+ (10 AM PT cron each day): expect SMS + $15 borrower charge with
  the 50/50 split. Log signature: `[lateFees] Charging $15 for tx=... ` +
  `split=lender:$7.5/platform:$7.5 lenderShareEnabled=true`, followed by
  `event: "overdue.charge"` JSON with `items: ["late-fee","late-fee-lender-share"]`,
  followed by an SMS-send log line — all for the same `txId`.
- Day 6: same plus operator email alert (per `9.6-Email` row in
  `sherbrt_transaction_comms_v15.xlsx`).
- Cap caps at 5 charges = $75 total to borrower over days 2..6.
- Day 7+: hard stop, no SMS, no charge (now enforced for both per the
  atomic-skip fix).

**Atomic invariant check (smoke test, every charging day).** For each day
the charge fires, expect to see these log lines together for the same tx:
1. `[lateFees] Charging $15 for tx=...` with the split suffix.
2. `event: "overdue.charge"` structured JSON line.
3. SMS-send confirmation log.

What you should NEVER see post-deploy: an `event: "overdue.charge"`
structured log followed by an `[OVERDUE][NO-LABEL]` / `[NO-PHONE]` /
`[DAY>6][HARD-STOP]` skip for the same `txId` in the same run. That was the
pre-fix bug — its absence is the regression check.

**Lender-share end-to-end check (B1 verification, the test that matters most).**
After 2..6 chargeable late days, ship the return back. When the carrier
scans "delivered" on the return label:
- `server/webhooks/shippoTracking.js` fires `transition/complete-return`.
- `stripe-create-payout` fires, paying the lender's Stripe Connect account.

Open Stripe Connect and inspect the Transfer to the test lender account.
Expected Transfer amount: original rental payout + accrued lender share.

Example math for a 3-night $25 rental at 15% provider commission with
2 chargeable late days:
- Base rental payout: ~$21.25 (rental minus provider commission)
- Accrued lender share: 2 days × $7.50 = +$15.00
- Expected total Transfer: ~$36.25

Three outcomes:

1. **PASS** — Transfer ≈ base rental + lender share. The B1 assumption
   holds; line items accumulate into payout as designed. Leave
   `LATE_FEE_LENDER_SHARE_ENABLED=true` for real customers.

2. **FAIL (lender share stranded)** — Transfer ≈ base rental only, no
   lender share. Provider line items added mid-flow do NOT accumulate.
   Immediately set `LATE_FEE_LENDER_SHARE_ENABLED=false` in Render. Open
   `docs/9.0_late_fee_lender_share.md` and follow the "redesign with
   explicit Stripe Connect Transfers fired at charge time" branch.

3. **FAIL (rental destroyed)** — Transfer ≈ lender share only (~$15) or
   zero, missing the base rental. The late-fee `set-line-items` call has
   destructively replaced the payout-eligible line items. Same recovery
   path as outcome 2. Additionally indicates that any prior prod tx that
   hit late fees and reached `complete-return` may have been shortpaid
   on rental — audit historical Transfers to confirm scope.

**Post-test cleanup.**
- If the test borrower account incurred real $15 charges, refund them
  via Stripe dashboard.
- If outcome was PASS: replace this section's status with the verdict
  ("VERIFIED: B1 holds, $X Transfer included $Y rental + $Z lender share
  on test tx <txId>, prod-ready").
- If outcome was FAIL: replace with the verdict + link to the follow-up
  redesign PR.

**Things NOT to do during this test.**
- Do not run the cron manually via FORCE_NOW — let the natural daily
  10 AM PT cron fire so the test reflects real production timing and
  the Redis dedupe behavior.
- Do not change env vars on the cron service mid-test — the test
  validates the configuration that shipped with `cb08b4993`.
- Do not fire `transition/complete-replacement` manually unless the
  outcome is FAIL and you need to recover the lender; otherwise wait
  for the natural `complete-return` to be triggered by the return scan.
- Do not flip `LATE_FEE_CENTS_OVERRIDE=50` on for this test — the user
  controls both sides of the booking and there are no other live
  transactions to protect, so testing at the real $15 amount produces
  more meaningful Transfer math for the B1 check.

**Pre-test checklist.**
1. Render deploy of `cb08b4993` shows "Live" on the
   `Overdue / Late-Fee Reminders & Charges` service.
2. Test lender account has completed Stripe Connect onboarding (or the
   Transfer at `complete-return` will have nowhere to land).
3. Today's 10 AM PT cron run accounted for: if it ran before the deploy,
   any pre-existing overdue tx (e.g. stuck tx `6a03712a`) may have been
   charged $15 silently under the old code; check Stripe for surprise
   $15 charges in the morning's window and refund if necessary.

### May 29, 2026 — Late-fee lender share (50/50 split, flag-gated, default OFF)

**Why.** Until now, every dollar of the daily late fee went to Sherbrt. The
lender — whose item is the one being held past return — got nothing for the
inconvenience. Steps 9.1–9.6 in `sherbrt_transaction_comms_v15.xlsx` frame
the fee purely as a borrower penalty, never as compensation to the asset owner.
Policy decision: route 50% of each daily late fee to the lender (default;
0–100% configurable), keeping Sherbrt's half to cover Stripe processing,
day-6 ops, CS, and dispute risk. Borrower experience unchanged ($15/day,
$75 cap, same SMS copy). Replacement value remains manual + 100% lender
(it's reimbursement for a lost asset, not a penalty) — NOT affected by this
flag.

**How.** `server/lib/lateFees.js` now emits TWO line items per daily charge
when `LATE_FEE_LENDER_SHARE_ENABLED=true`:
1. `late-fee` — customer-side, $15, quantity 1 (unchanged — 100% to payin).
2. `late-fee-lender-share` — provider-side, percentage `LENDER_LATE_FEE_SHARE_PCT`
   (default 50), `includeFor: ['provider']`. Shape mirrors
   `line-item/provider-commission` in `server/api-util/lineItems.js`:
   percentage-based, no quantity, lineTotal = unitPrice × pct/100.

The provider line item accrues into the cumulative payout total and is
actually transferred to the lender's Connect account at the next
`stripe-create-payout` action, which fires on `transition/complete-return`
(return delivered scan via `server/webhooks/shippoTracking.js`) or
`transition/complete-replacement` (manual operator path).

**Cap accounting (critical).** The count-based cap filter still matches
`code === 'late-fee'` only. One chargeHistory entry per daily charge,
regardless of whether the entry has 1 or 2 line items. Cap stays at 5
charges = $75. Test `cap accounting — late-fee-lender-share never inflates
the 5-charge cap` in `lateFees.lender-share.test.js` is the regression
guard.

**process.edn — NO change.** `transition/privileged-apply-late-fees-non-return`
already runs `:action/privileged-set-line-items`, which accepts any line
items the script passes. No new transition, no version bump, no Console flip.

**Rollout (matches 9.0 PR-1 → PR-5 cadence).** Ships with
`LATE_FEE_LENDER_SHARE_ENABLED=false` so nothing changes in prod until the
env var is flipped in Render after a staging dry-run with
`LATE_FEE_CENTS_OVERRIDE=50`. Full rollout plan + edge cases in
`docs/9.0_late_fee_lender_share.md`.

**Gotcha — payout timing.** The late-fee transition only does
`stripe-create-payment-intent` (charges borrower). It does NOT create a
payout. Lender share is paid out at the next payout transition. For a tx
stuck in `:state/accepted` forever (no return, no operator replacement),
the lender share is stranded in the platform balance — acceptable because
day-6+ is already an investigation case where operator decides whether to
fire `complete-replacement` (lender gets full replacement value + accrued
late-fee share) or `cancel`.

**Gotcha — chargeHistory amounts now hold effective cents.** Pre-flag,
`chargeHistory[N].items[0].amount` = 1500 (= unitPrice). Post-flag,
percentage-based provider items record the EFFECTIVE lineTotal
(e.g. 750 at 50%), via the new `lineItemEffectiveCents()` helper. Cap
filter is unaffected (matches by `code`, not `amount`). Digest emails
that sum `amounts[].cents` will reflect real money moved.

**Files touched.**
- `server/lib/lateFees.js` — new constants, `buildLateFeeLineItems()` +
  `lineItemEffectiveCents()` helpers, updated charging path + return
  shape + chargeHistory tracking.
- `server/lib/lateFees.lender-share.test.js` (new) — 15 unit tests.
- `.env.example` — `LATE_FEE_LENDER_SHARE_ENABLED`,
  `LENDER_LATE_FEE_SHARE_PCT_OVERRIDE`,
  `OVERDUE_FEES_CHARGING_ENABLED`, `LATE_FEE_CENTS_OVERRIDE`
  (last two backfilled — were already in code but missing from example).
- `docs/9.0_late_fee_lender_share.md` (new) — PR description + rollout
  plan + edge cases.
- `sherbrt_transaction_comms_v15.xlsx` — borrower-facing copy is
  UNCHANGED (split is invisible to borrower). Lender-facing copy is
  DEFERRED to a follow-up PR (no notification when share lands; lender
  sees it as a bump in their payout total at complete-return).

**Verification.** `yarn jest server/lib/lateFees.lender-share.test.js`
green. `node --check server/lib/lateFees.js` passes. Existing scenarioTests
(`dailyChargeWithNoScan.js`, `maxCapReached.js`) remain green — their
assertions use `.includes('late-fee')` and
`.some(a => a.code === 'late-fee')`, which match correctly whether or
not the provider line is present.

**Ship status.** Shipped to main as commit `cb08b4993` (May 29 2026),
combined with the atomic-charge+SMS fix. Render auto-deployed.
Prod flag `LATE_FEE_LENDER_SHARE_ENABLED=true` set on the
`Overdue / Late-Fee Reminders & Charges` cron service per operator
decision (the only live transactions are operator-controlled test
bookings). End-to-end verification via intentionally-late test tx is
in-flight — see the "IN-FLIGHT: end-to-end verification…" entry above.

**Review follow-ups (Claude Code review, May 29 2026).** Code is safe to
merge as PR-1 (flag OFF, additive). Specific findings addressed:
- **B1 (BLOCKER for PR-4 flip, NOT for PR-1 merge):** The payout-accumulation
  premise — that a provider line item set in the mid-flow
  `privileged-apply-late-fees-non-return` self-loop persists into the
  cumulative payout total carried to `stripe-create-payout` at
  `complete-return` — is an ASSUMPTION, not verified by anything in this
  repo. Reviewer correctly flagged that `docs/9.0_late_fee_lender_share.md`
  originally said "Payout mechanics — verified" which overstated the
  evidence. Retitled to "ASSUMPTION, must verify empirically before PR-4".
  Added a hard verification gate in PR-2 with TWO checks:
    (A) Historical prod tx audit — find a prod tx that hit late fees AND
        `complete-return`; compare its final lineItems[] vs. its actual
        Stripe Transfer. Highest-signal check, zero risk.
    (B) Staging dry-run with $0.50 override + simulated `complete-return`,
        verify Stripe Transfer includes the lender share ON TOP OF rental.
  If either fails, do NOT flip — re-architect using explicit Stripe Connect
  Transfers at charge time instead of relying on line-item accumulation.
- **S1:** Documented that `lenderShareCents/platformShareCents` are JS-side
  ESTIMATES via Math.round (half-up). Authoritative value for audit is
  `tx.attributes.lineItems[].lineTotal` post-transition. At realistic
  configs (25/50/75/100) the two always agree.
- **N1:** With flag OFF the line items sent to Sharetribe are byte-identical,
  but the persisted chargeHistory entry + return object gain 3 additive
  metadata keys (`lenderShareCents:0`, `platformShareCents:1500`,
  `lenderShareEnabled:false`). No current consumer reads them. Reworded
  "byte-identical" → "functionally identical" throughout the docs.
- **N2:** Math.round is half-up, NOT banker's rounding (half-to-even).
  Corrected the misleading "banker-rounded" comments.
- **N3:** The digest email (`sendLateFeeDigest()`) uses hardcoded
  `totalCents: LATE_FEE_CENTS` per tx — it does NOT iterate
  `chargeResult.amounts`. So it will NOT show two rows per charge with
  flag on (doc was wrong in original draft).
- **S2:** Added `server/lib/lateFees.applyCharges.test.js` — SDK-mock
  integration tests that exercise the full applyCharges flow with the
  flag on/off, asserting the transition is called with the expected
  lineItems + chargeHistory shape. Cheap, recommended before PR-4 anyway.

Important reviewer-verified findings (no code changes needed):
- Existing prod late-fee path already sets `[late-fee]` (customer-only)
  line items daily, yet rental payouts still happen at complete-return.
  That's mild evidence (not proof) that Sharetribe preserves payout
  across mid-flow `set-line-items` calls — but the historical prod tx
  audit (B1 Check A) is the only way to know for sure.
- Provider line direction: positive `percentage` + `includeFor:['provider']`
  ADDS to payout, correctly inverting `provider-commission`'s negative
  percentage. Shape mirrors `line-item/provider-commission` in
  `server/api-util/lineItems.js:453-460`. Payin ≥ payout invariant holds.
- Downstream consumers: `lenderEarnings.calculateLenderPayoutTotal`
  consumers (`lender-booking-sms.js`, `sendLenderRequestReminders.js`,
  `sendAutoCancelUnshipped.js`) all run pre-late-fee, reading booking
  line items — the provider lender-share item can't corrupt their payout
  display. No other consumer of `chargeResult.items/amounts/wouldCharge`
  or `chargeHistory` regresses.

### May 29, 2026 — Atomic charge+SMS in the overdue cron (gate before charge)

**Symptom.** `sendOverdueReminders.js` fired the late-fee charge BEFORE
checking whether the overdue SMS could actually be sent. Surfaced on tx
`6a03712a-…`: txs with stripped/missing `protectedData` (no return label,
no phone) — or any tx hitting the day-7 hard stop or missing day-copy —
got billed with `applyCharges()`, then the loop `continue`d past the SMS.
Borrower charged, never notified. Violated the both-or-neither policy in
`sherbrt_transaction_comms_v15.xlsx` (rows 9.1–9.6) and the lateFees.js
docstring ("Day 7+ = hard stop: no SMS, no charge").

**Fix.** Reordered the per-tx loop body into Block A (SMS-eligibility
gates: day-7 hard stop, copy sanity, phone, ONLY_PHONE, label) → Block B
(`applyCharges`, unchanged) → Block C (SMS send, unchanged). A failing
Block A gate now `continue`s and skips BOTH charge and SMS. Scenario A
(delivered-late) has no SMS and still charges unconditionally.
`lateFees.js` was NOT touched. Behavioral change: day-7 hard stop now also
blocks the charge. Tests: `sendOverdueReminders.atomic-skip.test.js`.

**Invariant.** For an overdue non-return tx in a run, either both the
SMS-attempt AND the charge-attempt happen, or NEITHER does — the sole
exception being a `sendSMS()` network failure after the charge succeeds
(logged via `[OVERDUE][SMS-FAILED]`).

**Ship status.** Shipped to main as commit `cb08b4993` (May 29 2026)
alongside the lender-share split. Render auto-deployed. First
production behavior signal expected at the next 10 AM PT cron run
following the deploy.

### May 22, 2026 (follow-up) — Sunday / USPS-holiday-aware return reminder copy (SMS 7/8)

**Why.** A booking can end on a Sunday or USPS holiday (checkout already shows a
"Sunday end date" banner). The borrower can't ship that day, so SMS 7 ("ship
tomorrow") and SMS 8 ("today's the day… $15/day fees") read as confusing/alarming
for those returns. Note this is a **copy/clarity** issue, not a financial one —
the charge logic already protects them: day 1 is a no-charge grace day and
`computeChargeableLateDays` skips Sundays + USPS holidays, so a Sunday-due
borrower who ships the next business day pays $0.

**Fix (copy only; firing schedule unchanged).** Added `buildReturnReminderCopy()`
+ `nextShippingDay()` to `sendReturnReminders.js`. When
`isNonChargeableDate(returnDate)` is true — one mechanism covers Sundays AND USPS
holidays — SMS 7/8 name the next shipping day and mirror the banner's "carriers
don't run" framing:
- SMS 7 (still T-1): "…Carriers don't run Sunday, so use your QR/label to ship
  "[Item]" back Monday: [link]."
- SMS 8 (still day-of): "Your booking for "[Item]" ends today, but carriers don't
  run Sunday. Ship Monday to avoid a late fee — use your QR/label: [link]."
Holidays say "the holiday" and roll to the correct next business day (Memorial Day
→ Tuesday; a Friday holiday → Saturday, since carriers run Saturdays).

**Timing & 9.x unchanged.** No firing-schedule change — the Monday "ship today"
nudge is already 9.1 (grace day, no charge). The 9.x overdue series already
excludes Sundays/holidays via `computeChargeableLateDays`, so it needed no change.
Gotcha to remember: `getFirstChargeableLateDate` is imported in
`sendReturnReminders.js` but is NOT exported by `businessDays.js` (the call site
is `typeof`-guarded, so it's effectively null) — use `isNonChargeableDate` /
`subtractBusinessDays`, which ARE exported.

**Tests.** `server/scripts/sendReturnReminders.sunday-copy.test.js` covers Sunday,
Memorial-Day-holiday, and normal-weekday cases for SMS 7/8 plus `nextShippingDay`
(incl. "Saturday stays Saturday"). `buildReturnReminderCopy`/`nextShippingDay` are
exported for testability.

**Comms doc → v15** (`sherbrt_transaction_comms_v15.xlsx`): Sunday/holiday variant
noted in Policy/Notes on rows 22–23. Branch `fix/sunday-holiday-return-sms` (cut
from the May 22 SMS branch). Not yet deployed.

### May 22, 2026 — Return-label persistence + return/overdue reminder eligibility (SMS 7/8/9.x)

**Symptom.** Borrowers weren't receiving the return-shipment texts: SMS 7
(T-1 return reminder, tag `return_tminus1_to_borrower`), SMS 8 (day-of, tag
`return_reminder_today`), and the SMS 9.x overdue series. Traced on tx
`6a03712a-…` (booking Mon May 18 – Thu May 21, state `accepted`, default-booking
v6). Four independent bugs were stacked on top of each other.

**Root cause #1 — the big one: the protectedData whitelist silently dropped the
return label.** `ALLOWED_PROTECTED_DATA_KEYS` in
`server/api-util/integrationSdk.js` was missing the canonical return-label keys.
`pruneProtectedData()` runs on EVERY protectedData write (after `deepMerge`,
before the `operator-update-pd-<state>` transition that replaces protectedData
wholesale), copying only whitelisted keys. So `returnQrUrl`, `returnLabelUrl`,
`returnTrackingNumber`, `returnCarrier`, `returnService`, `returnQrExpiry`,
`returnPurchasedAt`, and `returnNotification` were stripped on every write — the
label/QR bought at `transition/accept` never persisted, and both reminder crons
hit `[NO-LABEL]` and skipped. This was systemic (every organic `accepted` tx,
not just the seeded one). The outbound side had the same class of gap: the accept
flow writes `outboundQrUrl` but the whitelist only had `outboundQrCodeUrl` (read
by `ship.js`, never written), and `outboundCarrier`/`outboundService`/
`outboundQrExpiry`/`outboundPurchasedAt` were also being dropped. **Fix:** added
all the canonical return + outbound keys to the whitelist.

**Root cause #2 — wrong target state.** `sendReturnReminders.js` queried (and a
per-tx guard re-checked) `state: 'delivered'` — inheriting the May 7 defensive
state-check assumption. But the borrower holds the item the entire time the tx is
in `accepted`; `delivered` is only reached AFTER the return scan fires the
operator `complete-return`. So filtering to `delivered` matched essentially
nothing. **Fix:** target `accepted` (terminal-state denylist kept). Note this
corrects the May 7, 2026 entry's `state: ONLY_STATE || 'delivered'` assumption —
that filter was itself a reason 7/8 never fired.

**Root cause #3 — off-by-one due date.** The T-1/day-of window used
`endsAtMidnight ? bookingEndPT.subtract(1,'day') : bookingEndPT`, shifting the
due date a day early; combined with the inner TODAY check that used the
un-subtracted booking end, the day-of reminder never fired. **Fix:**
`dueLocalDate` = the booking-end calendar date (PT) always, so T-1 lands one day
before the Return Date and TODAY lands on it, aligned with the overdue script.
**This only changes reminder timing — late-fee math is untouched.** Fees still
compute from `booking.end` and start the first *chargeable* day after it
(`computeChargeableLateDays` skips Sundays + USPS holidays); the reminder shift
just lines SMS 8 up with the day the fee window is pegged to.

**Root cause #4 — overdue due date couldn't resolve (SMS 9.x).**
`sendOverdueReminders.js` and `server/lib/lateFees.js` resolved the return due
date from `tx.attributes.booking?.end` / `deliveryEnd`, which is ALWAYS undefined
because `booking` is a Sharetribe *relationship*, not a tx attribute, and
`returnData.dueAt` was never persisted. Every tx was skipped with "no return due
date" → no overdue SMS and no charges ever evaluated. **Fix:** add
`include: ['booking']` to both `show()`/query calls and read `booking.end` from
the `included` resource.

**Defense-in-depth — Shippo re-fetch fallback.** Added `getShippoTransaction()`
(8 s `AbortSignal` timeout, never throws — safe in a cron loop) and
`resolveReturnLabelUrl()` to `server/lib/shippo.js`. The resolver prefers the
persisted `returnQrUrl`/`returnLabelUrl`; if both are absent it re-fetches the
label from Shippo via the transaction `object_id`. To make that possible the
accept flow now persists `returnTransactionId`/`outboundTransactionId`
(`transition-privileged.js`), and both are whitelisted. Bonus: this also unblocks
`sendAutoCancelUnshipped.js`, which already read `pd.outboundTransactionId`/
`pd.returnTransactionId` to void unused labels but never found them (never
persisted + not whitelisted). Wired the resolver into both
`sendReturnReminders.js` (T-1 + TODAY) and `sendOverdueReminders.js`.

**Also whitelisted `autoCancel`** — `sendAutoCancelUnshipped.js` writes a
top-level `autoCancel` idempotency marker that was being stripped, so the
cancel/void path could re-fire on later cron runs. Activating the void path
(above) made this live, so it's fixed in the same change.

**⚠️ Architectural gotcha (remember this).** ANY new top-level `protectedData`
key MUST be added to `ALLOWED_PROTECTED_DATA_KEYS` in
`server/api-util/integrationSdk.js`, or `pruneProtectedData()` silently drops it
on the next write (protectedData is replaced wholesale by the operator-update-pd
transition). Known still-stripped, deferred because nothing reads them FROM
protectedData (all consumers take them as in-process params): `shippingArtifacts`
(written in `transition-privileged.js`).

**Files touched.**
- `server/api-util/integrationSdk.js` — whitelist canonical return + outbound
  keys, `returnTransactionId`/`outboundTransactionId`, `autoCancel`.
- `server/api/transition-privileged.js` — persist the Shippo `object_id` for
  outbound and return labels.
- `server/lib/shippo.js` — `getShippoTransaction()` + `resolveReturnLabelUrl()`.
- `server/scripts/sendReturnReminders.js` — target `accepted`; fix off-by-one
  due date; T-1 no-scan gate; dry-run no longer writes; use the resolver.
- `server/scripts/sendOverdueReminders.js` + `server/lib/lateFees.js` — include
  `booking` so the due date resolves; overdue SMS uses the resolver.

**Verification.** All affected jest suites pass — `integrationSdk.transition` /
`integrationSdk.lockedRate` (whitelist/prune), `sendReturnReminders.persist` /
`.quiet-hours`, `sendOverdueReminders.skip-log`, and the three
`transition-privileged` accept-flow suites. `node --check` on every edited file;
runtime check confirms the resolver short-circuits on canonical fields and
returns null (no throw) when the Shippo token is missing.

**Ship status.** Branch `fix/return-overdue-sms-state-and-duedate`, two commits:
`7a9506e3d` (core fix) and `769fd7654` (Claude Code review follow-ups — Shippo
timeout/no-throw, `autoCancel` whitelist, overdue resolver). Reviewed by Claude
Code before merge. Pushed + PR to `main` by operator; Render auto-deploys `main`
on merge. No data backfill needed — the only stale `accepted` tx was an operator
test. (`CLAUDE_CONTEXT.md` + the read-only `diagnoseTxSms.js` diagnostic were
intentionally kept out of the fix commit for a cleaner review.)

**Workbook v14.** Saved to
`/Users/amaliabornstein/shop-on-sherbet-cursor/sherbrt_transaction_comms_v14.xlsx`
(supersedes v13; v13 retained for history). Log tab changes: `Verified` →
`In review` for 7-SMS, 8-SMS, and 9.1-SMS through 9.6-SMS (they were marked
Verified but were broken in prod until this fix — flip back to Verified after the
post-deploy end-to-end test). 7-SMS `Event / Trigger` tightened to "…no return
accepted/in-transit scan yet" (matches 8-SMS + the code). `Policy / Notes`
rewritten for 7/8/9.1 to record the `:state/accepted` gating, the Shippo label
re-fetch fallback, and the `booking.end` due-date resolution. Message copy,
examples, timing, and code-location columns unchanged (they already matched the
shipped code). Summary auto-counts recalculated (Verified SMS 17 → 9; the 8 rows
now sit in the `In review` bucket). Scenario 5's `$0.50` test value left as-is
(intentional `LATE_FEE_CENTS_OVERRIDE=50` staging value).

### May 20, 2026 — "Make cover photo" in the listing photo editor

**Problem.** Both the website grid (Console "Listing thumbnail aspect ratio:
Portrait 3:4") and the mobile app use a listing's FIRST image as the card
thumbnail. The Sharetribe template's photo editor (`EditListingPhotosForm`)
only supported add + remove — no reordering — and re-adding a replaced photo
appends it to the END. So replacing just the cover image was impossible
without deleting and re-uploading every photo in order (often not possible —
many are user-uploaded lifestyle shots the admin doesn't have).

**Fix.** Added a "Make cover" action using `react-final-form-arrays`'
`fields.move(index, 0)`. The first image shows a coral "Cover" badge; every
other image shows a "Make cover" button that promotes it to position 1. On
Save, images submit in FieldArray order (confirmed in `EditListingPhotosPanel`
onSubmit — `images` is spread in order), so the moved image becomes the cover
on BOTH web and mobile (both use `images[0]`).

Files: `EditListingPhotosForm.js` (passes `isCover` + `onMakeCover` through the
FieldArray map → `FieldListingImage`), `ListingImage.js` (renders the badge /
button), `ListingImage.module.css` (`.coverBadge`, `.makeCoverButton`),
`src/translations/en.json` (`EditListingPhotosForm.coverLabel` / `.makeCover`).

**Ship status.** Committed on branch `feature/make-cover-photo` (cut from
latest `main`), pushed; PR opened to `main`. Render auto-deploys `main`, so
merging deploys it. Verified: en.json valid JSON; both JS files parse with the
project's `babel-preset-react-app`.

**Related — image standardization (mostly mobile-side).** Listings now follow
a 3:4 image standard (1200×1600, model framed head-to-toe on white) to match
the Console Portrait 3:4 thumbnail, so one upload looks consistent on web +
app with no cropping. A Python tool (`standardize_images.py`, kept OUTSIDE the
repos) auto-detects the model on white and reframes to the standard. See the
mobile repo's `CLAUDE_CONTEXT.md` for the app-side display details.

### May 8, 2026 — Lender SMS deferred to preauthorized via Integration API events poller; borrower request-confirmation SMS removed

**Surfaced.** Mobile dogfood on TestFlight build 0.1.0 (4): the lender
1-SMS fired the moment the borrower tapped Pay in the Stripe
PaymentSheet — i.e. on `transition/request-payment` — even when the
PaymentSheet was abandoned and the tx died at `:state/payment-expired`
(15min Stripe timeout). Lenders saw "Faille Halter Mini Dress —
$48 💸🤑" notifications for bookings that never reached
`:state/preauthorized`, eroding trust in the channel. Same dogfood
also re-confirmed that the borrower confirmation SMS at
`request-payment` (`booking_confirmation_to_borrower` tag) had been a
silent no-op in practice — production logs show
`customerId: undefined, borrowerPhone: null skip` consistently — so
borrowers were never receiving an SMS confirming an action they had
just taken on-screen anyway.

**Industry pattern.** Airbnb / DoorDash / Uber Eats all defer
host/lender notifications until payment authorization succeeds, not
when the customer first taps the pay button. The
`:state/pending-payment → :state/preauthorized` transition (via
`transition/confirm-payment`, customer-actor, `stripe-confirm-payment-intent`)
is the natural fire point: at that moment the card has been
authorized but not yet captured, exactly the state in which the
lender should be asked to accept.

**Why polling, not in-handler dispatch.** First attempt added the
helper call to `transition-privileged.js` in the confirm-payment
branch; got vetoed before commit. Both web and mobile clients fire
`transition/confirm-payment` via `sdk.transactions.transition`
directly (web `CheckoutPage.duck.js:399`; mobile
`lib/checkout.ts:189`), and `confirm-payment` is not in
`isPrivileged()` allowlist
(`src/transactions/transactionProcessBooking.js:216` — only
REQUEST_PAYMENT + REQUEST_PAYMENT_AFTER_INQUIRY). The transition
never hits our `/api/transition-privileged` endpoint, so an in-handler
dispatch would be a no-op. Sharetribe Flex doesn't expose webhooks
either — the only reliable way to react to a customer-actor transition
fired straight through the SDK is to poll the Integration API events
endpoint. That's the established pattern in this repo
(`sendShippingReminders.js`, `sendLenderRequestReminders.js`,
`sendAutoCancelUnshipped.js` all do it).

**The poller — `server/scripts/processConfirmPaymentEvents.js`.**
- `sdk.events.query({ eventTypes: 'transaction/transitioned',
  createdAtStart })` with `createdAtStart = now - 5min`. The 5-min
  lookback creates a 3-min overlap with the prior tick (cron runs
  every 2 min) so late or skipped ticks don't drop events.
- In-code filter: `event.attributes.resource.attributes.lastTransition
  === 'transition/confirm-payment'`. Sharetribe events stream emits
  one event type for all transitions; the SDK doesn't support filtering
  on `lastTransition` server-side, so the post-fetch filter is the
  documented approach (per Integration SDK README).
- For each matching event: `sdk.transactions.show({ id, include:
  ['listing','customer','provider'] })` to get the full tx, then call
  `sendLenderBookingRequestSMS({ tx, listing, lineItems, sdk })`.
- Per-event try/catch — one bad event (Sharetribe 500 on `show`,
  Twilio rate limit, etc.) doesn't kill the batch.
- Structured logs at every level: `[confirm-payment-events] Querying
  events stream` (entry), `Event summary` (fetched / matched counts),
  per-event failures with `txId` + `eventId` + `message`,
  `Run complete` summary `{ fetched, matched, attempted, succeeded,
  failed }`. Mirrors the existing cron logging style.
- `--dry-run` flag and `DRY_RUN=1` env honor — logs the would-dispatch
  list without calling the helper. `--verbose` for skip-path detail.
- Process exits 0 on success / 1 on fatal so the cron container can
  shut down cleanly.

**Idempotency lives in the helper.** `server/api-util/lender-booking-sms.js`
now uses Redis (`getRedis()`) instead of the in-process
`alreadySent()` cache. Key `lenderBookingSms:{txId}:sent` (7d TTL),
set only AFTER a successful `sendSMS` call so a Twilio failure
mid-flight doesn't lock out a retry. `alreadySent()`'s 2-min TTL
in-memory map was useless across cron-tick processes (each tick is
its own Node process — Map state doesn't survive). Per-tx (not
per-tx-per-transition) granularity is intentional: a lender SMS for
this transaction either has been sent or hasn't, regardless of which
event observation triggered it. If Redis is unreachable, the helper
falls through to send (warn-and-proceed pattern matching
`sendShippingReminders.js`) — better an occasional dup than a
permanent miss.

**Refactor of the source code (initiate-privileged.js cleanup).**
Stripped the entire SMS dispatch block (lines 264-475 in the
pre-change file):
- Lender SMS section (271-410) → moved to
  `server/api-util/lender-booking-sms.js`.
- Borrower SMS section (433-471) → deleted outright (silent no-op in
  production; informational SMS for a user-initiated on-screen action
  adds noise without value).
- Wrapping `if (transition === 'transition/request-payment' &&
  !isSpeculative && tx)` guard, surrounding try/catch, and
  `🧪 Inside initiate-privileged — beginning SMS evaluation` marker
  log (grep confirmed marker was only used by this block).
- Eight imports that became unused after the strip: `getIntegrationSdk`,
  `maskPhone`, `alreadySent`, `attempt/sent/failed` from metrics
  (already unused at HEAD), `calculateTotalForProvider`,
  `formatMoneyServerSide`, `shortLink`, `orderUrl`/`saleUrl`. Plus
  the conditional `sendSMS` import block and the inline
  `buildLenderMsg` function.
- `server/api/transition-privileged.js` is UNTOUCHED. The first-pass
  dispatch wired into the confirm-payment branch was reverted (it
  would never have fired — see "why polling" above).

The `server/api-util/lender-booking-sms.copy.test.js` regression test
was renamed from `server/api/initiate-privileged.copy.test.js`
(matches the helper's new home). Same regex assertions, just an
updated `path.resolve(__dirname, …)` target.

**User-side action required.** The Render cron job must be created
manually in the Render UI to match the new `render.yaml` block —
this project does NOT auto-sync `render.yaml` to Render (per the
existing comments on `auto-cancel-unshipped`, `lender-request-reminders`,
`shipping-reminders`). Create job:
- Name: `confirm-payment-events`
- Type: Cron Job
- Schedule: `*/2 * * * *`
- Build: `yarn install && yarn run render-build`
- Start: `node server/scripts/processConfirmPaymentEvents.js --once`
- Env: same `INTEGRATION_CLIENT_ID/SECRET`, Twilio creds, `REDIS_URL`
  as the other lender-side crons. SendGrid not needed.

**Latency expectation.** Borrower confirms payment → up to ~2 min
until lender SMS (cron interval). Acceptable for booking flow:
lender has a 24h window to accept after preauthorized, so a 2-min
notification delay is invisible in practice. Compare to the previous
in-handler dispatch which was sub-second — the latency increase is
the cost of moving the trigger to the right state.

**Soak window plan (24h, mirrors PR #58 pattern).** Watch for:
- Render cron logs for `confirm-payment-events` show non-zero
  `matched` counts during normal traffic windows; zero `failed`.
- Twilio outbound volume on tag `booking_request_to_lender_alt`
  matches the rate of completed bookings (PaymentIntent status
  `requires_capture` from Stripe, NOT just `requires_confirmation`).
  Pre-change baseline included abandoned-PaymentSheet noise; new
  baseline should be lower-and-cleaner.
- No new Sharetribe API rate-limit errors in Render logs — the new
  cron adds ~30 events.query calls/hour, well under the limit.
- "Lender didn't get SMS for a real booking" complaints in the
  operator inbox or dogfood Slack channel.
After 24h with no incidents, mark soak-complete in the next session
entry. If `matched` count stays at 0 across normal-traffic windows,
re-check the Render cron is actually scheduled and that
`INTEGRATION_CLIENT_ID/SECRET` are wired in the cron's env.

**Files touched.**
- New: [server/api-util/lender-booking-sms.js](server/api-util/lender-booking-sms.js)
  (Redis-backed dedup, helper signature
  `sendLenderBookingRequestSMS({ tx, listing, lineItems, sdk })`)
- New: [server/scripts/processConfirmPaymentEvents.js](server/scripts/processConfirmPaymentEvents.js)
  (cron poller — entry point + module export)
- New: [server/scripts/processConfirmPaymentEvents.test.js](server/scripts/processConfirmPaymentEvents.test.js)
  (6 unit tests: filter behavior, helper invocation, error
  isolation, missing-id skip, lookback-window math)
- Renamed: `server/api/initiate-privileged.copy.test.js` →
  [server/api-util/lender-booking-sms.copy.test.js](server/api-util/lender-booking-sms.copy.test.js)
  (path constant updated; test bodies unchanged)
- Edit: [server/api/initiate-privileged.js](server/api/initiate-privileged.js)
  — strip SMS block + 8 imports + sendSMS marker log; add
  in-context comment pointing at the helper + cron
- Edit: [render.yaml](render.yaml) — new `confirm-payment-events`
  cron block (documentation-only; not auto-synced — see User-side
  action required above)

**Verification.**
- `grep -rn "booking_request_to_lender_alt" server/ | grep -v test |
  grep -v node_modules` → exactly one match
  (`server/api-util/lender-booking-sms.js`).
- `grep -rn "booking_confirmation_to_borrower" server/ | grep -v
  test | grep -v node_modules` → zero matches.
- `npm run test-server` — touched tests pass; pre-existing
  `server/__tests__/shipping-estimates.test.js` failures (4)
  reference unexported `buildShippingLine`/`getZips` and fail
  identically on HEAD, unrelated to this PR.
- New poller tests: 6/6 pass via
  `npx jest server/scripts/processConfirmPaymentEvents.test.js`.
- Prettier baseline on `initiate-privileged.js` is non-conformant on
  HEAD (whole-codebase drift) — this PR doesn't introduce new
  prettier failures.

**May 8, 2026 — addendum (lineItems shape fix, post-deploy).**
First dogfood after PR #63 merged validated end-to-end (SMS delivered
to lender via the cron) but surfaced a small follow-up bug in the
Render logs:

```
[SMS][booking-request] Could not calculate payout: Value must be a Money type
```

The lender SMS shipped without the earnings tease — `"Sherbrt 🍧:
Amalia wants to borrow your \"Cindy Dress\". You have 24hrs to
accept: <url>"` — losing the conversion-driving `"You'll earn $XX.XX
💸🤑"` clause. *Cause.* `tx.attributes.lineItems[i].unitPrice`
(and `lineTotal`) come back from `sdk.transactions.show()` as plain
`{ amount, currency }` objects, not `Money` class instances. The
helper called `calculateTotalForProvider` from
`server/api-util/lineItemHelpers.js`, which delegates to
`getAmountAsDecimalJS`, which has an `instanceof Money` guard
(`server/api-util/currency.js:215`) — that's the throw site.

*Fix.* Swap to `calculateLenderPayoutTotal` from
`server/api-util/lenderEarnings.js`. That helper was authored
specifically for the Integration-SDK shape: it tries
`calculateTotalForProvider` first and on throw falls back to a manual
calculation that handles plain `{amount, currency}` objects AND
goog.math.Long amounts, returning `null` instead of throwing. Same
helper `sendLenderRequestReminders.js` uses for the 60m follow-up
SMS — its docblock literally says "used by both the initial lender
SMS and the 60-minute follow-up reminder worker so the two messages
can never drift on the earnings amount." Should have used it during
the original PR #63 extraction; missed it.

*Files touched.*
- Edit: `server/api-util/lender-booking-sms.js` — replace
  `calculateTotalForProvider` import and call with
  `calculateLenderPayoutTotal`. Drop the surrounding try/catch
  (the new helper returns `null` instead of throwing).
- New: `server/api-util/lender-booking-sms.payout.test.js` — 3
  unit tests using a `tx` fixture with plain-object `lineItems`
  (mirrors `transactions.show()` output): asserts
  `"You'll earn $90.00 💸🤑"` is in the SMS body, fallback to
  `tx.attributes.lineItems` when explicit `lineItems` arg is null,
  graceful no-earnings copy when lineItems are missing entirely.

*Branch.* `chore/lender-sms-payout-money-shape` (off main post-PR-63
merge). Verification: `npm run test-server` 222/226 pass — same 4
pre-existing `shipping-estimates.test.js` failures unchanged. Manual
cron retest after Render redeploy: confirm log shows `[SMS][booking-
request] Calculated payout total: Money { ... }` and SMS body
includes earnings tease.

### May 7, 2026 — 4-issue SMS / inbox-copy fix-up (default-booking expire flows)

**The bugs.** Three back-to-back transactions (`69f8e5ee-…`,
`69f8e102-…`, `69f8db17-…`) booked end-date May 7 hit `:state/expired`
because the lender never accepted. They surfaced four separate
problems:

1. **Spurious 8-SMS day-of-return reminder.** All three borrowers
   received `⏰ Sherbrt 🍧: Today's the day for you to ship back …
   Check your dashboard for return instructions.` (the
   `return_reminder_today_no_label` branch in
   `server/scripts/sendReturnReminders.js`). Should never fire — these
   txns were never `:state/delivered`. The base query filters
   `state: ONLY_STATE || 'delivered'`, but txns slipped through anyway
   (root cause unclear; either Sharetribe state filter looser than we
   assume, or namespaced-vs-bare state mismatch). 7-SMS T-1 reminder
   correctly skipped because no `pd.returnQrUrl` / `pd.returnLabelUrl`
   was ever generated (label only created on `transition/accept`).
2. **No 1c-SMS for borrower on lender expire.** When
   `transition/expire` fires (lender didn't accept in 24h), the
   borrower got nothing. Borrowers were left wondering what happened.
3. **Borrower inbox title was wrong.**
   `customer.payment-expired.title` read "You didn't confirm the
   payment in time" — borrower-blamey wording for a state that, while
   technically about Stripe payment-intent timeout, often coincides
   with operator-side workflow issues. Borrowers don't perceive
   themselves as "confirming payment" — they tap Submit and wait.
4. **Lender inbox title was wrong.**
   `provider.payment-expired.title` read "Payment wasn't confirmed in
   time" — implies the *borrower* failed, which confused lenders into
   thinking this is a borrower-side problem. The lender perspective is
   "I never got a chance to accept" — same outcome regardless of which
   transition fired.

**The fixes.**

1. **Defensive state check inside the loop** in
   `server/scripts/sendReturnReminders.js` (right after the ONLY_TX
   filter). Re-checks `tx.attributes.state` against the expected state
   (`ONLY_STATE || 'delivered'`), normalizing `state/delivered` →
   `delivered` for Integration SDK responses. Skips with
   `[RETURN-REMINDER][SKIP-WRONG-STATE]` log line. Belt-and-suspenders:
   query filter remains the first line of defense; this catches
   anything that slips past it. Cron tick on May 8+ should show this
   skip path firing for any expired/canceled txns instead of sending.
2. **1c-SMS borrower-expired notification** added to
   `server/scripts/sendLenderRequestReminders.js`. The existing
   `MISSED_FINAL` watchdog already polls
   `lastTransitions: 'transition/expire'` every 15 min with a 30-min
   lookback. Extended that same loop to:
   - Add `include: ['customer']` to the watchdog query (was missing).
   - Per tx within the lookback window, send a borrower SMS with copy:
     `😔 Sherbrt 🍧: Your borrow request was not accepted this time.
     Don't worry — there's still time to book another look you love!
     Check them out now! https://www.sherbrt.com/r/lyBUNc13c1`
   - Redis dedupe key
     `lenderReminder:{txId}:borrowerExpired:sent` (7d TTL — outlasts
     any reasonable retick window). DRY mode skips Redis writes.
   - Tag: `borrower_request_expired`, smsNumber: `2c` in meta.
   - Phone resolution mirrors the borrower-phone precedence used in
     `sendReturnReminders.js`: checkout-protectedData phone wins over
     profile phone (per Phase D task #31).
   - Borrower-SMS failures are caught and logged — they must not
     block `MISSED_FINAL` logging or subsequent txns.
3. **`customer.payment-expired.title`** in
   `src/translations/en.json`: `You didn't confirm the payment in
   time.` → `Request expired.` Same change applied to the
   `default-booking` entry only; `default-purchase` left as-is (not
   used on Sherbrt).
4. **`provider.payment-expired.title`** in `src/translations/en.json`:
   `Payment wasn't confirmed in time.` → `Request not accepted.`
   Same caveat — only the `default-booking` entry, not
   `default-purchase`.

**Why piggyback on `sendLenderRequestReminders` cron rather than a
new transition hook.** `transition/expire` is an `:at`-driven
transition fired by Sharetribe internally — there's no actor and no
HTTP transition call hitting our `transition-privileged.js` handler.
The only reliable way to react is polling, which the lender-request
cron already does for its `MISSED_FINAL` watchdog. Reusing that loop
keeps the moving parts to a minimum and inherits the existing 30-min
lookback. Tradeoff: the borrower SMS lands up to ~30 min after the
actual expire — acceptable given borrowers were waiting 24h+ already.

**Note on `payment-expired` vs `expired` states.** Two separate
states can lead to "request didn't go through":

| State | Trigger | Cause |
|-------|---------|-------|
| `:state/payment-expired` | `transition/expire-payment` (15 min) | Stripe payment-intent confirmation timed out (borrower closed checkout / 3DS expired) |
| `:state/expired` | `transition/expire` (24h or booking-start+1d or booking-end, whichever is earliest) | Lender didn't accept |

The May 7 screenshots showed `payment-expired`-state titles, but the
user reported lender-no-accept as the cause. Two possibilities: (a)
borrowers actually didn't confirm Stripe in 15 min and the user
mis-attributed the state, or (b) there's a state/title mapping issue
worth a future investigation. Updating both `payment-expired` titles
to the friendlier "Request expired" / "Request not accepted" copy is
robust either way — neither blames the wrong party. The
already-correct `expired`-state titles ("Your booking request
expired." / "The request from {customerName} expired.") were left
alone for now.

**Future feature — 1c-EMAIL borrower-expired email.** The user
explicitly scoped 1c-SMS only for now. Email companion (`1c-Email -
Request expired`) is a tracked-here follow-up:
- Source from `notification/booking-expired-request` in
  `ext/transaction-processes/default-booking/process.edn`. Sharetribe
  already has the notification wired (`:on :transition/expire`,
  `:to :actor.role/customer`, template
  `:booking-expired-request`); the *email template* itself in
  Sharetribe Console → Content → Email templates is the place to
  refresh copy.
- Pending checklist item in CLAUDE_CONTEXT.md (line ~1295): "Review
  Sharetribe Console → Content → Email templates →
  `booking-expired-request` for stale '6 days' / 'within a week'
  language. Update to '24 hours' or make generic." — combine with the
  1c-EMAIL refresh.
- Suggested copy mirroring the SMS:
  `Subject: Your borrow request expired`
  `Body: Your borrow request wasn't accepted this time. Don't worry —
  more fabulous looks are waiting to be borrowed!
  https://www.sherbrt.com/r/lyBUNc13c1`

**Lender 24h auto-expire confirmed correct.** Per
`ext/transaction-processes/default-booking/process.edn` the
`transition/expire` `:at` clause is
`min(firstEnteredPreauthorized + 24h, bookingStart + 1d, bookingEnd)`.
For typical bookings (booking-start more than 1 day out) this is
24h after the borrower confirms payment — matches the user's
expectation. For last-minute bookings (booking-start within 24h of
request) the window shrinks to `bookingStart + 1d` or `bookingEnd`,
whichever is earliest, to avoid stranding the lender past their own
booking. Already correct — no change needed.

**Code commits (3, all on `main`):**
- `<commit-1>` — `sendReturnReminders.js`: defensive
  `[SKIP-WRONG-STATE]` check.
- `<commit-2>` — `sendLenderRequestReminders.js`: 1c-SMS borrower
  expired-request dispatch in watchdog loop. Extends watchdog query
  with `include: ['customer']`. Adds Redis key
  `lenderReminder:{txId}:borrowerExpired:sent` (7d TTL).
- `<commit-3>` — `src/translations/en.json`: copy refresh on the two
  `default-booking` `payment-expired.title` keys.

**Verification.**
- Local DRY run of `sendLenderRequestReminders.js` on a known expired
  tx (e.g. one of the May 7 IDs) should show `[1c-SMS]` log lines
  with `dryRun=true`.
- Inspect `redis-cli get lenderReminder:69f8e5ee-…:borrowerExpired:sent`
  after a real run — should be set.
- Force a fake `state/canceled` tx through
  `sendReturnReminders.js --verbose` — expect
  `[RETURN-REMINDER][SKIP-WRONG-STATE]` log line, no SMS sent.
- Inbox titles: visit a `payment-expired` tx as borrower and as
  lender; confirm "Request expired." / "Request not accepted."

**Open question for next session.** Why did the 8-SMS slip through
the `state: 'delivered'` filter in the first place? The defensive
check above prevents the symptom, but the root cause is still
unidentified. Worth pulling production logs from the May 7 cron tick
that sent the spurious SMS to confirm what state the Sharetribe
query actually returned for those txns.

**May 7, 2026 — addendum (Stripe forensics + workbook v13 + mobile
sync).**

*Stripe forensics on `pi_3TTQY7P9WqHTFi1C0VU20UjF` (one of the three
May 7 txns).* PaymentIntent created May 4 10:44:55 AM, canceled May
4 10:59:59 AM — exactly 15min04sec later. `amount_capturable=0`,
`amount_received=0`, `payment_method=null`, `latest_charge=null`,
`cancellation_reason=null`, `capture_method=manual`. Conclusion: the
borrower never confirmed the PI (left checkout idle), Sharetribe
fired `:transition/expire-payment` (PT15M from `:state/pending-payment`)
which ran the `stripe-refund-payment` action and canceled the
un-confirmed PI via API (no user-facing reason → `cancellation_reason`
stays null; manual dashboard cancels would have set
"requested_by_customer" or similar).

*Implication.* These three May 7 txns died at `:state/payment-expired`
(borrower checkout timeout), NOT `:state/expired` (lender no-accept).
The `payment-expired` inbox titles were correctly displayed for the
actual state. The user's mental model was off by one transition. The
1c-SMS implemented in this fix-up fires on `:transition/expire`
(lender-no-accept), so it would NOT have fired for the May 7 txns —
those would need a separate "borrower abandoned checkout" SMS, which
is out of scope for this entry. Logged as a future-feature candidate
(see Future Comms tab in workbook v13). The defensive state check in
`sendReturnReminders.js` IS still relevant for these txns — without
it, future `payment-expired` txns slipping through the
`state:'delivered'` filter would still trigger spurious 8-SMS.

*Workbook v13.* Saved to
`/Users/amaliabornstein/shop-on-sherbet-cursor/sherbrt_transaction_comms_v13.xlsx`.
Two changes from v12:
- Log tab: new row 1c-SMS inserted between 1b (22h final warning) and
  2a (request accepted). 2c is already taken (return-label-provided)
  so 1c was the cleaner numbering — extends the 1-series which is
  the lender-accept-window flow. Summary tab COUNTIF/COUNTIFS ranges
  bumped from `Log!C5:C29` → `Log!C5:C30` to absorb the inserted row.
- New tab: Inbox Comms. Two-column matrix (Borrower / Lender) of
  Sharetribe state → user-facing inbox title, sourced from
  `src/translations/en.json` and mirrored against
  `sherbrt-mobile/lib/transactions.ts`. 26 rows covering every
  default-booking state for both perspectives. Includes the May 7
  copy refresh, a column for the en.json key (so future edits know
  what to grep for), and a column for the mobile equivalent so web
  and mobile drift is visible at a glance.

*Mobile app sync.* `sherbrt-mobile/lib/transactions.ts` had its own
status-label dictionaries (`STATE_TO_STATUS` for borrower view,
`STATE_TO_LENDER_STATUS` for lender view) that previously displayed
"Payment didn't go through" for `payment-expired` on both sides.
Updated to match web:
- Borrower view: `Payment didn't go through` → `Request expired`
- Lender view: `Payment didn't go through` → `Request not accepted`
Comments added pointing back to the en.json keys + this CLAUDE_CONTEXT
entry. The web and mobile labels will now stay in sync via the new
Inbox Comms tab in v13.

*Re-numbering ripple from 2c-SMS → 1c-SMS.* The first draft of this
entry used 2c-SMS but 2c is already in workbook v12 (Return Label
Provided, row 13). Renumbered everywhere: this entry's prose, the
`smsNumber` meta field on the SMS dispatch, the doc-block comments
in `sendLenderRequestReminders.js`, and the new workbook row
identifier. The 1c-EMAIL future-feature companion follows the same
naming.

*Manual Stripe cancel handling — operator note.* If you ever cancel
a Stripe PaymentIntent via the dashboard manually, you must ALSO
cancel the corresponding Sharetribe transaction (Console →
Transactions → tx → operator-cancel/decline) — they are independent
systems. Canceling only in Stripe leaves Sharetribe in a stale
`:state/preauthorized` (or `:state/pending-payment`), which means:
later lender-accept attempts will fail at the
`stripe-capture-payment-intent` action (PI is already canceled);
1a-SMS / 1b-SMS reminders may still fire from the cron until the
24h `transition/expire` lands; inbox / inbox titles will misrepresent
the txn as live. Safest reset is decline on Sharetribe first
(transition fires `stripe-refund-payment`, idempotent against an
already-canceled PI), then verify Stripe matches.

*Mobile rollout.* Server-side changes (`sendReturnReminders.js`
state-skip + `sendLenderRequestReminders.js` 1c-SMS dispatch) live
in the Render workers and fire for all clients regardless of
platform — mobile users get the SMS just like web users. Inbox-title
copy lives client-side, so:
- Web (`shop-on-sherbet-cursor/src/translations/en.json`): updated.
- Mobile (`sherbrt-mobile/lib/transactions.ts`): updated.
The two are now in sync — but they're separate codebases, so future
copy changes have to be made twice. The Inbox Comms tab in workbook
v13 is the single source of truth for catching drift.

**Follow-up backlog (May 7 fix-up — parked, not blocking).** All
six items surfaced during this session; tracked here so the next
session can pick them up without re-deriving the list from chat
history.

1. **1c-EMAIL companion.** Sharetribe `booking-expired-request`
   email template refresh. Already fully drafted above ("Future
   feature — 1c-EMAIL borrower-expired email"). Combine with the
   existing pending-checklist item (line ~1295 in this file: stale
   "6 days" / "within a week" language in the same template).

2. **"Borrower abandoned checkout" SMS.** Fires on
   `transition/expire-payment` (15-min Stripe checkout timeout) —
   the actual cause of the May 7 txns per the Stripe forensics
   above (PI canceled at exactly 15min04sec, lender never saw the
   request). Distinct from 1c-SMS, which fires on the 24h
   `transition/expire`. Mobile side already has this flagged in
   `sherbrt-mobile/CLAUDE_CONTEXT.md` under the May 7 entry's
   "Cross-repo follow-up" bullet. Likely dispatcher: a new poller
   or hook on `transition/expire-payment` (no existing cron polls
   that transition).

3. **Mobile checkout retry on `confirmBookingPayment()` network
   failures.** Already tracked in
   `sherbrt-mobile/CLAUDE_CONTEXT.md` lines 1312-1322 (pre-
   existing) and reinforced by the May 7 entry there — left here
   as a cross-reference so the backend reader knows about the
   mobile-side gap. The unprotected step 3 in
   `app/checkout/[id].tsx` is the most likely root cause of any
   future organic `payment-expired` traffic.

4. **Env-configurable re-shop link.**
   `https://www.sherbrt.com/r/lyBUNc13c1` is hard-coded in two
   places: 1c-SMS in
   `server/scripts/sendLenderRequestReminders.js` (this fix-up,
   constant `BORROWER_EXPIRED_RESHOP_LINK`) and 2b-SMS in
   `server/api/transition-privileged.js` (pre-existing, the
   borrower-decline branch). Refactor both at once when convenient.
   Suggested env var: `BORROWER_RESHOP_URL` with the current value
   as default.

5. **Lo-fi CI check for inbox-copy drift.** The new `Inbox Comms`
   tab in `sherbrt_transaction_comms_v14.xlsx` is a manual source
   of truth that web (`src/translations/en.json`) and mobile
   (`sherbrt-mobile/lib/transactions.ts` STATE_TO_STATUS /
   STATE_TO_LENDER_STATUS) must stay in sync with. Easy first
   version: a Node script that parses the xlsx via SheetJS, reads
   the `Inbox Comms` tab's "en.json Key" column, and verifies each
   key exists in en.json with the workbook's expected title. Run
   on every PR via GitHub Actions. Cross-repo version (mobile
   labels) is harder because the labels live in a separate repo —
   could be a manual checklist item in PR templates instead.

6. **Root-cause investigation on the original 8-SMS leak.** The
   defensive state filter in `sendReturnReminders.js` prevents the
   symptom, but why three May 7 txns slipped past
   `state:'delivered'` is still unanswered. CC's three concrete
   leads (review pass, May 7):
   - (a) Echo the literal query payload right before
     `sdk.transactions.query(baseQuery)`. Sharetribe may want
     `state/delivered` namespaced or an array
     `state: ['delivered']`, and silently ignoring an invalid
     filter would explain everything.
   - (b) Run `RETURN_REMINDERS_FLEX_SELFTEST=1` and inspect the
     returned tx's actual state at query time.
   - (c) Pull one of the three May 7 txns
     (`69f8e5ee-…`, `69f8e102-…`, `69f8db17-…`) with
     `sdk.transactions.show` and confirm what `attributes.state`
     actually is at query time vs. now — there may be a
     transition race within the 15-min cron window.

### May 1, 2026 — Shippo address validation (task #29)

**The bug.** Two production accepts on 4/29/2026 (`69f28897-…` and
`69f0f9a8-…`) succeeded as marketplace transitions but failed at Shippo
label-print with `failed_address_validation: Recipient address invalid:
Address not found.` from USPS at `/transactions/`. Recipient address:
`1795 Chestnut Street, apt 7, San Francisco, CA 94123`.

**What we ruled out (do not re-investigate).** Probed Shippo's
`/addresses/?validate=true` with all 7 plausible variants of the
recipient's address (raw / Street→St / Apt 7 cap / packed into street1
/ uppercase / no-apt). Every variant returned `is_valid:true` and
normalized to the canonical `1795 Chestnut St Apt 7, San Francisco, CA
94123-2935` (ZIP+4). So borrower-side address normalization is fine —
the problem is downstream.

**Diagnosis.** USPS in live mode at label-print is stricter than
`/addresses/?validate=true`. Without ZIP+4, USPS can't disambiguate
multi-unit addresses like `apt 7` against the building's
delivery-point database, so it rejects with "Address not found." If we
pre-normalize to the canonical (ZIP+4) before the `/shipments/` POST,
USPS at print-time sees its own approved canonical and accepts.

**The fix.** New helper `server/shippo/validateAddress.js` that POSTs
to `/addresses/?validate=true`, returns either `{valid:true,
normalized:{...}}` or `{valid:false, transient:bool}`. Wired into both
label flows in `server/api/transition-privileged.js` (outbound +
return). On `is_valid:true` (with or without soft warnings), the
canonical address replaces the raw one for the shipment payload. On
hard fail (`is_valid:false`), the label is skipped and a structured
error is persisted to `protectedData.labelCreationError` (or
`returnLabelCreationError`) plus an ops alert is sent via the existing
`OPS_ALERT_EMAIL` channel. Transient errors (4xx/5xx/network) fall
through with the un-normalized address — we don't block label creation
on a Shippo-side outage.

**Failure UX is hard-fail, not soft-retry.** Multi-unit USPS deliveries
without a unit number get held at the PO, so silently retrying without
the unit would create a worse outcome. The marketplace transition is
NOT voided (it already happened, can't roll back); only the label is
skipped. Ops gets the email alert and contacts the user manually.

**Why error surfaces via persistence, not the HTTP response.**
`createShippingLabels` is invoked fire-and-forget at
[transition-privileged.js:2416](server/api/transition-privileged.js:2416)
— the HTTP 200 response is sent at line 2444 BEFORE label creation
even runs. So the response can't carry the error code. Instead we
persist `labelCreationError: { code, failedSide, validationMessages,
occurredAt }` to protectedData; the client picks it up on its next
refresh and can render an inline banner from there.

**Probe revealed pre-validation alone is insufficient — extended fix
re-rates at accept.** Ran `scripts/probe-shipment-rate-binding.js` against
test-mode Shippo: created a checkout-shaped shipment (`street1: 'N/A'`),
grabbed a USPS Ground Advantage rate, posted to `/transactions/`. Result:
`tx.status: ERROR` with `Recipient address invalid: Address not found.`
Definitive: USPS validates against the rate's ORIGINAL shipment in
Shippo's database. The locked rate at accept is bound to the
checkout-time ZIP-only shipment in Shippo, so purchasing it directly
sends USPS the 'N/A' address regardless of what the freshly-created
accept-time shipment looks like.

**Re-rate-at-accept follow-up.** Both label flows in
`transition-privileged.js` now match the locked rate's
`provider + servicelevel.token` against the fresh accept-time shipment's
rates and purchase the FRESH `object_id`. The borrower-preauth amount
stays at `lockedRate.amountCents` (Sherbrt absorbs any delta). Helper
[`findMatchingRate(freshRates, lockedRate)`](server/api/transition-privileged.js)
is exact-or-fail by design — never falls back to "cheapest" when the
locked service-level is missing, since that would silently swap the
carrier from what the borrower was quoted at checkout. Instead, hard-
fails with `reason: 'unprintable_at_accept'`, persists the failure to
`protectedData.labelCreationError` (or `returnLabelCreationError`), and
fires an ops alert. A `LOCKED_RATE_AMOUNT_DELTA_ALERT_CENTS = 200`
threshold ops-alerts when |fresh − locked| >= $2. 18 unit tests in
[transition-privileged.rerate.test.js](server/api/transition-privileged.rerate.test.js)
cover all 5 scenarios from the brief plus edge cases (case-insensitive
provider, legacy `service.token` SDK shape, malformed lock payloads).
Probe script extended with step 1.5: after step-1 reproduces the bug,
step-1.5 creates a fresh full-address shipment, finds the matching
service-level, and purchases that rate — expected `tx.status: SUCCESS`.

**Files touched.**
- New: [server/shippo/validateAddress.js](server/shippo/validateAddress.js) — 13 tests
- New: [server/api/transition-privileged.rerate.test.js](server/api/transition-privileged.rerate.test.js) — 18 tests
- New: [scripts/probe-shipment-rate-binding.js](scripts/probe-shipment-rate-binding.js) — bug repro + fix verify
- Edit: [server/api/transition-privileged.js](server/api/transition-privileged.js) — validation in both label flows; `findMatchingRate` helper + re-rate logic in both flows; sentinel-error downgrade in return-label catch

**Verified end-to-end against live USPS (no Stripe involved).** Ran
`scripts/probe-shippo-live.js` with the Render-side LIVE Shippo token.
Live mode validated both addresses with no warnings, normalized to
canonical with ZIP+4 (`94109-2420` / `94123-2935`), got 10 rates back
on the fresh shipment, found `usps_ground_advantage` at $6.00,
purchased the label → `tx.status: SUCCESS` with tracking
`9300120845500002217937`, and auto-voided successfully (`PENDING` →
becomes `REFUNDED` after Shippo's async processing). Net cost: $0. The
fix is live in production as of `5acbb2e20` on `main`. Scenario 1 is
unblocked.

### May 1, 2026 — Task #30 framing correction (silent persistence loss, not cosmetic noise)

**Prior framing was wrong.** The April 29 entry called the
`[VERIFY][ACCEPT] Missing providerZip after upsert!` warning a
"false-positive log / cosmetic noise in production logs." Investigation
during the task #29 work proved this is wrong on both halves: the
warning is real, and the persistence loss it surfaces affects downstream
features that read `tx.attributes.protectedData.*`.

**What's actually happening.** `server/api-util/integrationSdk.js`'s
`txUpdateProtectedData` shapes its request body as
`{ metadata: { protectedData: pruned } }` and calls
`sdk.transactions.updateMetadata({ id, ...body })`. The Sharetribe
Integration API's `transactions/update_metadata` endpoint writes to
`tx.attributes.metadata` — NOT `tx.attributes.protectedData`. Whatever
you pass under `metadata` becomes the literal value of that field. Our
shape causes data to land at `tx.attributes.metadata.protectedData.X`
instead of the intended `tx.attributes.protectedData.X`. Verified by
extending `scripts/diag-tx-address.js` to read both paths on the
failing tx records — the keys we expected on `protectedData` exist
under `metadata.protectedData` (or are missing entirely; see clobber
discussion below).

The existing test at `server/api-util/integrationSdk.lockedRate.test.js:44`
verifies the wrapper shape (`mockUpdateMetadata.mock.calls[0][0].metadata.protectedData`)
but does NOT verify where the data actually lands on the transaction
record. So the misuse was structurally invisible to the test suite.

**Compounding bug — top-level clobber.** Sharetribe's `update_metadata`
endpoint replaces the entire `metadata` field wholesale (no
server-side merge across calls). Two `upsertProtectedData` calls in
the same accept flow:

1. First write: keys `[providerStreet, providerZip, ..., outbound, return]`
2. Second write: keys `[outbound]` only (when `outbound.acceptedAt` is set)

The second write sends `{ metadata: { protectedData: { outbound: {...} } } }`
which replaces the entire `metadata` object. The provider* and customer*
keys from the first write are wiped. Confirmed by reading
`tx.attributes.metadata` of `69f28897` and `69f0f9a8` — the only key
that survives in `metadata.protectedData` is `outbound`. The existing
test guards the inner-level clobber (`outbound.lockedRate` survival
inside `outbound`) but not the outer level.

**Why customer addresses still appear correct in
`tx.attributes.protectedData`.** The customer fields (`customerStreet`
etc.) get set during checkout via `transition/request-payment` /
`transition/confirm-payment`. The marketplace process for those
transitions has `actions.update-protected-data` wired up, so
`params.protectedData` on the transition itself persists. That's the
correct path. The doomed `updateMetadata` path is a SEPARATE write
that only runs at accept time for provider* fields, which is why the
data loss is selective.

**Why outbound labels work despite the persistence loss.**
`createShippingLabels` reads from the in-memory `params.protectedData`
(passed through from the request body), never re-fetches the
transaction. So the address data Shippo gets is correct regardless of
what's persisted. Task #29's address-validate fix uses the same
in-memory addresses and re-rates against fresh shipments, so it works.
**This is luck, not design.** Any feature that re-fetches the
transaction after accept silently gets back stale data.

**Blast radius — features actually broken today.** Anything that reads
`tx.attributes.protectedData.<X>` for `<X>` in the
`ALLOWED_PROTECTED_DATA_KEYS` whitelist after an `updateMetadata`-only
write:

- **`shippoTracking.js` webhook handlers** (lines 401, 437, 1208, 1455):
  reads `tx.protectedData.outbound.firstScanAt`,
  `tx.protectedData.outboundTrackingNumber`,
  `tx.protectedData.shippingNotification.firstScan.sent` — all written
  via `upsertProtectedData`. Webhook payloads from Shippo could match
  the wrong tx, miss first-scan SMS, or fail idempotency dedupe.
- **Lender ship-by SMS reminders** (`scripts/sendShippingReminders.js`):
  reads `tx.protectedData.outbound.shipByDate` and uses
  `hasOutboundScan(tx)` to skip already-scanned packages. (Replaced the
  legacy `sendShipByReminders.js`, which was deleted alongside the Phase D
  task #31 phone-field deprecation.)
- **Return-T-minus-1 reminders** (`scripts/sendReturnReminders.js`):
  reads `tx.protectedData.return.tMinus1SentAt` for dedupe. Could
  re-fire reminders.
- **Auto-cancel-unshipped cron**
  (`scripts/sendAutoCancelUnshipped.js`): reads
  `tx.protectedData.shippingNotification` via `hasOutboundScan(tx)`.
  Could auto-cancel transactions that were actually shipped.
- **Lender outbound label email idempotency**: reads
  `tx.protectedData.lenderOutboundLabelEmailSent`. Could double-send
  emails.
- **Borrower return label email idempotency**: same pattern with
  `borrowerReturnLabelEmailSent`. Could double-send emails.
- **Return label generation** at accept: reads
  `tx.protectedData.providerStreet/etc` to gate the return-shipment
  call. The accept-time params pass through correctly, but if a webhook
  later writes `outbound.firstScanAt` and we re-evaluate gating from
  the persisted tx, we'd see empty fields and skip generation.

In practice, the most-frequent observable symptom is webhook
mis-matching for tracking events — which would manifest as missing
first-scan / delivered SMS or overdue reminders firing on already-
delivered packages. None of these have been reported by users to date,
which is consistent with the low test-tx volume and Sherbrt's
operator-mediated test scenarios so far.

**Why this hasn't blocked production. Yet.** Three things have masked
the symptom:

1. The accept-time `params.protectedData` flow has carried address
   data correctly through the in-memory path that `createShippingLabels`
   actually uses.
2. Phone/email come from the listing author's
   `relationships.provider.data.attributes.profile.protectedData.phone`
   (separate read path), so SMS sending hasn't broken.
3. Test-tx volume is low and most flows have been operator-driven, so
   anomalies in webhook delivery / reminder timing are absorbed
   without being attributed to this bug.

When real user volume hits, especially when overdue / first-scan
reminders need to fire reliably, this will start surfacing as
"reminders fire when they shouldn't" or "first-scan SMS missing."

**Recommended architectural fix (next session).**

The right path is **option A** from prior analysis: introduce a
privileged transition like `transition/operator-update-protected-data`
in the marketplace process (Sharetribe Console change) that has
`actions.update-protected-data` enabled. Then change
`server/lib/txData.js` `upsertProtectedData` to call this transition
via the integration SDK instead of `transactions.updateMetadata`. The
transition's params.protectedData genuinely merges into the
transaction's `protectedData` field. Existing readers don't change.
This is the durable fix.

Two cheaper alternatives we explicitly rejected for the long-term fix
but might use as a band-aid:

- **Option B — fall-back readers.** Update every reader of
  `tx.attributes.protectedData.<X>` to also check
  `tx.attributes.metadata.protectedData.<X>` if undefined. Doesn't fix
  the architecture (writes still go to the wrong field), and adds
  lookup overhead at every read site. Sharetribe support also
  effectively becomes a black box for diagnosing where data is —
  half-working state confuses humans more than it helps.
- **Option C — switch the wrapper.** Change `txUpdateProtectedData` to
  send `{ metadata: pruned }` (no inner `protectedData` wrapper). The
  data lands at `tx.attributes.metadata.<X>`. Readers still need to
  check `metadata.<X>` instead of `protectedData.<X>`, so it's
  Option B with a trivially-different shape. Doesn't address the
  clobber problem.

**Pre-conditions before the architectural fix can ship.**

1. Sharetribe Console: add `transition/operator-update-protected-data`
   (or whatever name) to the `default-booking v5` process, with
   `actor: 'operator'`, `actions: ['update-protected-data']`, no
   pre-conditions, no post-conditions, fires from any state where it's
   needed (likely all of them). Verify by attempting the transition
   from a known state via the integration SDK.
2. Decide on a fetch-then-merge wrapper around the new helper — the
   existing top-level clobber (which the `update_metadata` API
   exhibits) ALSO exists in transitions: `params.protectedData` on a
   transition replaces top-level keys wholesale. So writers still need
   to spread existing values OR the helper itself fetches the current
   tx and merges client-side before sending the transition.
3. Update `pruneProtectedData` and the whitelist as needed —
   `ALLOWED_PROTECTED_DATA_KEYS` should still apply to prevent unknown
   keys from being persisted.
4. Migrate existing data from `tx.attributes.metadata.protectedData.*`
   into `tx.attributes.protectedData.*` for any in-flight transactions
   that have data in the wrong place. Likely a one-shot script that
   reads `metadata.protectedData`, calls the new helper for each
   surviving key, and clears the metadata after success. Operator-only,
   run during a low-traffic window.

**Estimated effort.** Half-day to a full day of focused work, plus the
Sharetribe Console change which is only a few minutes but should be
done in a maintenance window or with a feature flag because it changes
the process definition.

**What's NOT changing in this commit.** This entry is documentation-
only — it does NOT ship a fix. The address-validate work for task #29
(commit `5acbb2e20`) is independent and unblocks Scenario 1 testing
without depending on a #30 resolution. Task #29's hard-fail
`labelCreationError` writes use the same `upsertProtectedData` helper
and inherit this same persistence loss (the `labelCreationError`
object lands at `metadata.protectedData.labelCreationError`, not
`protectedData.labelCreationError`). The mobile/web banner that reads
this would need to check both paths until #30 is fixed, OR we move
that field to the transaction's `metadata` directly (which is
operator-writable by design). Note for the mobile/web banner work
session.

**Files to read for the next session.**

- `server/api-util/integrationSdk.js:133-182` — `txUpdateProtectedData`
  (the misused write).
- `server/api-util/integrationSdk.lockedRate.test.js` — existing
  inner-level clobber test.
- `server/lib/txData.js:47-57` — `upsertProtectedData` wrapper.
- `node_modules/sharetribe-flex-integration-sdk/src/integration_sdk.js:241`
  — Sharetribe SDK's `update_metadata` definition.
- `scripts/diag-tx-address.js` — extended diag that reads both `protectedData`
  and `metadata.protectedData` paths.
- This entry, for blast-radius reference.

### May 5, 2026 — Phase D task #31: server-side `protectedData.phone` deprecation + per-booking phone precedence

**Background.** By Phase C the user profile had four phone storage slots:
`protectedData.phoneNumber` (canonical), `protectedData.phone` (legacy
top-level lender), `protectedData.lenderShippingAddress.phoneNumber`,
`protectedData.customerShippingAddress.phoneNumber`. Mobile's Phase D dual-
write kept all four aligned, but the legacy slot still drove production SMS
routing. Web audit overturned the original premise: the named SLA-critical
reader (`sendShipByReminders.js:159`) was already dead code (replaced by
`sendShippingReminders.js`, not deployed since at least April), so the
"mobile-first risks lost SMS" concern dissolved. Other readers (return-day
cron, Shippo webhook handlers) had the legacy slot in their fallback chain.

**Web PR scope (this entry):**

1. Cron readers + webhook prefer canonical `phoneNumber` over legacy `phone`:
   - `server/scripts/sendShippingReminders.js` (provider phone)
   - `server/scripts/sendReturnReminders.js` (customer profile fallback)
   - `server/webhooks/shippoTracking.js` (`getBorrowerPhone`, `getLenderPhone`)
2. Per-booking phone precedence — booking-specific phone (set at checkout
   for borrower or at accept for lender) wins over the user's account phone
   for that booking's SMS dispatch. `tx.protectedData.{customerPhone|providerPhone}`
   first, then `profile.phoneNumber`, then `profile.phone` (soak fallback),
   then `tx.metadata.{customerPhone|providerPhone}`. Per-booking values do
   NOT overwrite the user's account number — supports gifting, work phones,
   different recipients. Same precedence applied uniformly across all three
   dispatch paths above.
3. Web settings page (`AccountShippingAddressPage.duck.js`) dropped its
   write-through to legacy `protectedData.phone`. Test updated from "writes
   both, equal" to "writes phoneNumber only, no legacy phone slot".
4. Dead-code deletion: `sendShipByReminders.js` + `.persist.test.js` removed
   per render.yaml notes ("Safe to delete in a future cleanup PR" — done).
   `render.yaml` dead-code comment block removed. CLAUDE_CONTEXT.md sweeps:
   architecture mentions past-tensed (174, 463), Phase D Option-A history
   updated (932, 942), open-items list trimmed (1199), bug-fix history
   past-tensed (1313, 1438), `withinSendWindow` caller-count footnote
   trimmed (1404).
5. New unit test file `server/webhooks/shippoTracking.phone.test.js`
   covering the precedence rules end-to-end.

**Mobile follow-up.** `lib/account.ts` still writes to legacy `phone` in
`syncPhoneNumber` and `updateLenderShippingAddress`. Slated for a separate
mobile PR after a 24h soak window confirms web SMS volume is unchanged
(Twilio logs + per-cron `[shipping-reminder]` / `[RETURN-REMINDER]` lines).
shippoTracking webhook will be exercised proactively against staging during
the soak window via a replayed Shippo webhook event, since organic delivery
events may be sparse.

**No backfill performed.** Phone is a required signup field on web's
`SignupForm.js`, so all profiles are expected to have `phoneNumber`. If
post-deploy logs surface any user with `phone` set + `phoneNumber` missing,
fix case-by-case.

### May 1, 2026 — Task #30 Phase 1 shipped (Sharetribe v6 + 6 operator-update-pd transitions); Phase 2 with CC

**Phase 1 ship details.** Marketplace process `default-booking` v6 published
to Sharetribe today at 1:29 PM PT. Alias `default-booking/release-1` moved
from v5 to v6 minutes later. Local `process.edn` synced and committed as
`c5f2d0b02` on `main`. Mechanical signals all green: `flex-cli process list`
shows v6 with the alias, the EDN diff between v5-pull and the local file
contains exactly the 6 new transitions plus pre-existing comment/whitespace
differences (no semantic drift in pre-existing transitions).

**The 6 new transitions (all self-loop, actor=operator, action=update-protected-data, no `:privileged?` flag).**

```
transition/operator-update-pd-accepted        (state/accepted)
transition/operator-update-pd-delivered       (state/delivered)
transition/operator-update-pd-cancelled       (state/cancelled)         ← per CC audit; sendAutoCancelUnshipped writes here
transition/operator-update-pd-reviewed        (state/reviewed)          ← defensive (no current call sites)
transition/operator-update-pd-reviewed-by-p   (state/reviewed-by-provider)  ← defensive
transition/operator-update-pd-reviewed-by-c   (state/reviewed-by-customer)  ← defensive
```

**Phase 0 risk audit (CC) outcome.** PROCEED with 4 caveats, all folded in:
1. Added `cancelled` (CC catch — `sendAutoCancelUnshipped.js:258` writes
   AFTER the auto-cancel transition fires, so the tx is in `state/cancelled`
   when the upsert runs — not `state/accepted`).
2. Removed `:privileged? true` flag from the new transitions (CC: that flag
   is for non-operator actors invoking privileged actions via the marketplace
   `transition_privileged` endpoint; operator transitions via Integration
   SDK don't need it).
3. Hard-fail on unsupported state, NOT soft fallback (CC: a fallback to
   `updateMetadata` would silently re-create the bug; loud failure is the
   discovery mechanism for any state we missed).
4. NO `TASK_30_FIX_ENABLED` feature flag (CC: a flag that falls back to
   the buggy path is "a regression with telemetry, not a rollback";
   rollback is Render deploy revert).

Plus 4 risks CC raised (all folded into the Phase 2 brief): rate limits at
scale (2 API calls per upsert vs 1), Console notification rules verification
(self-loop transitions still trigger Console-configured emails), migration
race during deploy (run during low-traffic window or fence with feature
flag), per-key conflict resolution during migration (don't blanket "metadata
wins").

**Phase 1 runtime verification deferred.** Sharetribe transactions are
pinned to the process version they were CREATED on, so existing test txs
(all on v5) cannot exercise the v6 transitions — the integration SDK
returns `transaction-invalid-transition` (status 409) when you try. Decided
on Path B: skip explicit Phase 1 verification, let the first organic tx
accept post-Phase-2-deploy verify Phase 1 + Phase 2 together. Same pattern
as task #29 (where the live-Shippo probe proved the fix without burning a
Stripe charge on a synthetic test transaction).

**Phase 2 SHIPPED** (commit `19f27cded` on `main`). Detailed Phase 2 ship
report appears below this entry's diag-scripts section. tl;dr:
`txUpdateProtectedData` now writes via `transactions.show` → deep-merge →
state→transition lookup → `transactions.transition` (the transition path
that actually persists to `tx.attributes.protectedData`). Hard-fail on
unsupported state, 409-retry once, no feature flag, 28 directly-affected
tests pass.

**Phase 3 deferred.** Migration script (`scripts/migrate-task-30-data.js`)
to copy data from `tx.attributes.metadata.protectedData.*` to
`tx.attributes.protectedData.*` for in-flight transactions. Per CC audit:
needs maintenance window OR feature flag fence on `txUpdateProtectedData`
during migration window; per-key conflict resolution (prompt operator
on conflicts, don't blanket-pick); skip terminal states not in the 6
covered. Will be a separate session after Phase 2 stabilizes.

**Diag scripts written today.**

- `scripts/probe-task-30.js` — verifies the bug is real and present in
  deployed code right now. Calls existing `upsertProtectedData` on a real
  tx with a sentinel value; checks where it landed. Run twice today
  (against `69f3cbd6` and `69f27547`) — both confirmed bug present, both
  showed the probe value at `metadata.protectedData.shipByISO` not
  `protectedData.shipByISO`.
- `scripts/diag-task-30-transition.js` — verifies a specific
  `operator-update-pd-<state>` transition routes data correctly. Will
  fail with `transaction-invalid-transition` against any existing v5 tx;
  expected to pass once a v6 tx exists.
- `scripts/diag-tx-address.js` — extended to also read
  `tx.attributes.metadata.protectedData` so we can see where data
  actually landed across both fields.

**Files touched today.**

- New: `ext/transaction-processes/default-booking/process.edn` lines 164-202
  — 6 new operator-update-pd-<state> transitions
- New: `scripts/probe-task-30.js`
- New: `scripts/diag-task-30-transition.js`
- New: `scripts/probe-shippo-live.js`
- New: `scripts/probe-shipment-rate-binding.js`
- Edit: `scripts/diag-tx-address.js` — extended to read both fields
- Edit: `CLAUDE_CONTEXT.md` — task #30 framing correction (commit
  `52e467b07`) + this entry
- Edit (Sharetribe-side): `default-booking` v6 published

**Commits on `main` today.** `5acbb2e20` (task #29 squash merge), `52e467b07`
(docs: task #30 framing correction), `c5f2d0b02` (process.edn: 6 new
transitions), `42f855f84` (docs: this entry + Pickup Tomorrow refresh).
Phase 2 commit lands as a squash from `claude/musing-sanderson-18e7fc`.

**Phase 2 SHIPPED (May 1, 2026 — server refactor).**
`txUpdateProtectedData` no longer calls `sdk.transactions.updateMetadata`;
instead it does `sdk.transactions.show` → state→transition lookup →
client-side `deepMerge` with existing `protectedData` →
`pruneProtectedData` → `sdk.transactions.transition({ params: { protectedData } })`.
Hard-fails on unsupported states (preauthorized, terminal, etc.) with
ops-alert email + `{ success: false, reason: 'unsupported_state' }`
envelope — explicitly NO soft fallback to the broken path. 409 conflict
on the write is retried once with a fresh `show` re-fetch; repeated 409
throws and fires an ops alert. No feature flag — rollback is Render
deploy revert. Files changed: `server/api-util/integrationSdk.js`
(rewrite `txUpdateProtectedData`, add `PD_TRANSITION_BY_STATE`),
`server/lib/txData.js` (wrapper passes envelope through),
`server/api-util/integrationSdk.lockedRate.test.js`,
`server/scripts/sendReturnReminders.persist.test.js`,
`server/webhooks/shippoTracking.upsert.test.js` (mock `show` +
`transition` instead of `updateMetadata`), and new
`server/api-util/integrationSdk.transition.test.js` (the test gap that
hid the original bug — it now asserts `params.protectedData` shape and
covers unsupported_state + 409-retry + whitelist + deep-merge cases).
28 directly-affected tests pass; 4 pre-existing failures in
`shipping-estimates.test.js` are unrelated (`getZips`/`buildShippingLine`
not exported from `lineItems`). Runtime verification deferred to the
first organic tx accept post-deploy: `scripts/diag-task-30-transition.js`
will confirm the new transition routes data to
`tx.attributes.protectedData.X` (not `metadata.protectedData.X`).
Phase 3 (one-shot migration script to recover orphaned data from
`tx.attributes.metadata.protectedData.*` on in-flight transactions)
ships separately.

### May 1, 2026 (evening) — Task #30 Phase 2 RUNTIME-VERIFIED on first organic v6 accept

**Verified.** First organic v6-process tx
(`69f51671-7b35-4b1a-87e5-71f934856568`) accepted from mobile (Expo
iOS via `host: sherbrt.com` apex) at 21:14 UTC. Render web-service logs
and `scripts/probe-task-30.js` confirm Phase 1 + Phase 2 both working
as designed.

**Render log signals (all GREEN):**

- `[INT][PD] transition` with `transition: 'transition/operator-update-pd-accepted'`
  and `state: 'state/accepted'` fired 4 times during the accept (outbound
  label persist, return label persist, `returnNotification.labelCreated`,
  `shippingNotification.labelCreated`).
- `[INT][PD][OK]` followed every one. All 4 writes used `attempt: 1` —
  no 409 retries, no concurrency races.
- The pre-existing `[VERIFY][ACCEPT] Missing providerZip after upsert!`
  cosmetic-noise warning (the original task #30 symptom) did NOT appear.
  Extinct on the new write path.
- No `[INT][PD][UNSUPPORTED-STATE]`, no `[INT][PD][409]`, no
  `[INT][PD][ERR]`. Clean.

**`probe-task-30.js` proof (the definitive test):**

```
[probe-30] tx.attributes.protectedData.shipByISO:
  "__task30_probe_aa5be777-6294-4287-8994-7bbde4a2e521"
[probe-30] tx.attributes.metadata.protectedData.shipByISO: undefined
```

Inverse of yesterday's readings against `69f3cbd6` and `69f27547` (v5
txs on broken code put data at `metadata.protectedData.X`, undefined at
`protectedData.X`). Phase 2 is real, deployed, and verified on a real
organic mobile-originated transaction.

**Bonus signals verified in the same accept:**

- **Task #29 working end-to-end at scale.** Outbound + return USPS
  labels both printed via Shippo (tracking `9300120845500002315978`
  outbound, `9300120845500002316012` return). Address validation
  produced canonical `1795 Chestnut St Apt 7 / 94123-2935` and
  `1745 Pacific Ave Apt 202 / 94109-2420`. Re-rate logic worked:
  `[RATE-SELECT][RETURN:LOCKED→FRESH]` swapped lockedRate `7f7de4d6`
  for freshRate `e94f32e6`, both `provider=USPS,
  token=usps_ground_advantage`, delta -50¢ (carrier neutrality
  preserved).
- **Day 12 Cloudflare 307 fix holding.** Mobile request `host: sherbrt.com`
  (apex), iOS reached server cleanly with `transition/accept` body intact.
- **v6-pinned tx exercised v6 transitions cleanly** — confirms
  Sharetribe process publish and `default-booking/release-1` alias move
  to v6 both succeeded.

**Two unrelated issues surfaced in the same logs — both backlog, gated
on post-mobile-launch (see "Pickup Tomorrow"):**

1. **Task #32 — Transactional email provider returning `Unauthorized`.**
   Both `lenderOutboundLabelEmail` and the return-label email failed with
   `error: 'Unauthorized', response: { errors: [...] }`. Likely
   rotated/expired API key (SendGrid/Postmark/etc.). SMS (Twilio)
   unaffected. The `outboundLabelUrl` / `returnLabelUrl` did persist to
   `tx.protectedData` correctly, so a re-send mechanism could recover the
   missed emails later. Investigate post-mobile-launch.
2. **Task #33 — Twilio SMS-status-callback URL has duplicated query
   params** (`?tag=...&tag=...&txId=...&txId=...`). Cosmetic — webhook
   still 200s — but the query-string assembly logic in the callback URL
   builder is double-appending. Fix post-mobile-launch.

**Probe script cosmetic followup.** `scripts/probe-task-30.js`'s
diagnosis branch reads `=> Task #30 is NOT a bug. Data is going to the
correct field. => Either Sharetribe changed semantics, OR our analysis
was wrong.` That branch was written pre-Phase-2-deploy; on the fixed
code it's the *expected* outcome (data lands at `protectedData` because
the new transition path puts it there). Worth a one-line patch to make
the probe distinguish "pre-Phase-2" from "post-Phase-2" semantically.
Cosmetic, not blocking. Same backlog batch as #32/#33.

**Status overall.** Tasks #29 and #30 (Phase 1 + Phase 2) are now fully
shipped + runtime-verified. Phase 3 (migration script for orphaned
in-flight `metadata.protectedData.*` data) remains deferred. Mobile
launch path can now proceed.

### April 30, 2026 — Mobile accept verified end-to-end + Cloudflare 307 gotcha

**Status at end of session:** Option A's Scenario A (lender WITH saved
address → mobile accept) verified end-to-end in production. Mobile tx
`69f3cbd6-e256-420b-bc4c-1ba60deaf710` accepted at 17:22 PT today on
mobile, confirmed via integration SDK. Diagnostic code cleaned up.

**The bug.** Mobile accept tap → 20–30s spinner → app crash. Backend
showed no `transition/accept` attempt; the request never reached the
server. After adding diagnostic logging + a 15s `AbortController`
timeout in mobile `lib/api.ts`, a `curl` from the host Mac surfaced:

```
$ curl -i -X POST https://www.sherbrt.com/api/transition-privileged ...
HTTP/2 307
location: https://sherbrt.com/api/transition-privileged
server: cloudflare
```

Cloudflare 307-redirects `www.sherbrt.com` → `sherbrt.com` (apex).
Browsers handle this transparently for POST. **iOS URLSession does NOT
re-stream a POST body across a 307 redirect when the request has a
custom Cookie header + non-standard content type
(`application/transit+json`).** The redirect arrives, URLSession plans
to follow it, then hangs indefinitely instead of re-issuing.

**Fix.** Mobile `EXPO_PUBLIC_API_BASE_URL` changed from
`https://www.sherbrt.com` to `https://sherbrt.com`. Documented in
mobile `.env.example`. No web-side changes needed; this is purely a
mobile-client config.

**Side improvements bundled in (mobile only).**

- **Cookie URL-encoding** in `lib/api.ts`. Web's `js-cookie`
  URL-encodes the JSON token on write; mobile was sending raw JSON in
  the Cookie header. RFC 6265 disallows unescaped `{`, `"`, `,`, `:`
  in cookie values. Now URL-encoded to match. Did NOT resolve the
  hang on its own (Cloudflare redirect was the actual cause), but
  it's still the correct behavior.
- **15s `AbortController` timeout** on the privileged-transition
  fetch. iOS URLSession defaults to 60s — bad UX. Now surfaces
  `code='timeout'` to the caller. Defensive — kept in.

**Architectural learnings.**

- **Cloudflare-managed apex/www redirects interact badly with iOS POST
  bodies.** Always point native iOS clients at the canonical
  redirect-free host. Web JS is forgiving of www→apex redirects;
  native HTTP libraries are not.
- **Indefinite hang ≠ server-side processing problem.** Server hangs
  for processing reasons usually surface as 500/502/504 eventually.
  Pure 30s+ silence with no response = the request never made it to
  the application layer (typically a redirect, TLS handshake, or
  proxy issue).
- **Sharetribe Console "Last used" timestamp on apps.** Useful sanity
  check that integration creds are working — if "Last used" updates
  after a script run, auth handshake succeeded, and any 4xx on
  subsequent calls is API-layer, not auth-layer. Conversely, if
  "Last used" never updates, creds are wrong (or `dotenv` is
  including an inline comment in the value — happened today; same
  4xx symptom).

**Operator-naming note (recorded for context).** The Render web
service is named `shop-on-sherbet`, the local repo is
`~/shop-on-sherbet-cursor`, and Sharetribe's web app is named the
same — all predate the rebrand from "Shop on Sherbet" to "Sherbrt".
Mobile is `~/sherbrt-mobile`. No plan to rename the web side; expect
the inconsistency to persist.

**Scenarios B + C also passed end-to-end same session (continued
testing after Cloudflare fix landed).**

- **Scenario B (graceful no-saved-address fallback):** cleared the
  lender's `lenderShippingAddress` via the new `diag-clear-lender-
  address.js` script (which writes a `_lenderShippingAddressBackup`
  sibling field). Borrower submitted fresh request → mobile accept
  tap → server returned the expected `transition/accept-missing-
  provider` 422 → mobile rendered the inline coral banner. **Bug
  surfaced + fixed mid-test on the mobile side:** the action buttons
  weren't gated on `!needsShippingAddress`, so banner rendered below
  visible Decline/Accept buttons. One-line fix in
  `app/lending/[id].tsx`, shipped in mobile commit `a4190aa`. After
  fix: banner correctly replaced action buttons; settings screen
  saved address; `useFocusEffect` cleared the prompt state on
  return; second accept succeeded → tx
  `69f40260-65b9-4632-be22-f670b8706a3d` transitioned cleanly.
- **Scenario C (cross-platform sync):** mobile→web verified
  (lowercase mobile values pre-populated web settings page);
  web→mobile verified (web-edited values picked up by mobile
  shipping-address screen on focus refetch). Both directions of
  parity are working as designed.

**Form UX gap noted for follow-up (task #25 / form polish session).**
iOS user-level Settings → General → Keyboard → Auto-Capitalization
overrides React Native's `autoCapitalize` prop (the native keyboard
owns the behavior; the prop is a hint). The user has this off, so
typed `san francisco` / `ca` saved lowercase even with proper props
on the field. Means the matching web `AccountShippingAddressForm`
likewise can't trust client-side casing — same defense-in-depth
applies on the web duck save path. Future polish: state dropdown
(both clients), title-case on blur, `textContentType` props on iOS
side, US phone formatter shared between forms. Pairs naturally with
task #25.

**Heads-up for next mobile production build.** Mobile's
`EXPO_PUBLIC_API_BASE_URL` was changed `www.sherbrt.com` →
`sherbrt.com` (apex) in local `.env` and `.env.example`. The same
must land in EAS production config (`eas.json` or project secret)
before next TestFlight ship — otherwise the 30s-hang bug ships to
users. Pre-flight check before `eas build --profile production`.

### April 29, 2026 — Booking-breakdown polish, 1b-SMS copy fix, lender accept architecture audit (Option A in flight)

**Status at end of session:** 6 commits pushed and deployed to `main`. Scenario 1 still in flight (1-SMS yesterday 11:17 AM → 1a-SMS 12:30 PM → 1b-SMS today 9:30 AM all received as expected; lender accept completed via web). Persistent lender shipping address feature (Option A) is mid-implementation: Step 1 SHIPPED (`f37f8acfd`), Steps 2-5 + 4b queued and prompted for CC.

**Session goal:** Mobile-parity polish on the booking breakdown sidebar (mirror Day 9 mobile fixes onto web), audit + fix a misleading SMS, then resolve a hard mobile-accept blocker discovered during Scenario 1 testing.

**Commits shipped today (6, all on `main` and deployed):**

- `b7d804235` — `fix(OrderBreakdown): gate Sunday end-date banner to customer (borrower) only`. Mirror of mobile Day 9 iteration 2 fix. The "Sunday end date: Carriers don't run — ship Monday to avoid a late fee" banner is borrower-directed copy (the borrower ships back on the end date); lenders shipped out at booking start. One-line change: `OrderBreakdown.js:123` `showSundayEndDateNotice={showSundayEndDateNotice}` → `showSundayEndDateNotice={showSundayEndDateNotice && isCustomer}`. ANDed (not replaced) so the existing `EstimatedCustomerBreakdownMaybe.js:567` explicit `false` override still wins.
- `97f44b3a4` — `copy(OrderBreakdown): unify lender total label to 'Your earnings'`. Mirror of mobile Day 9 iteration 1. All three `providerTotal*` keys in `en.json` (`Default` / `Received` / `Refunded`) set to `"Your earnings"` so the label reads naturally pre-accept, in-progress, complete, and refunded. Other locales unchanged (English-only marketplace). **Gotcha discovered mid-session:** Sharetribe Console-hosted translations (Asset Delivery API at `/content/translations.json`) override bundled `en.json` at runtime — `src/app.js:249,287` does `messages={{ ...localeMessages, ...hostedTranslations }}`, hosted wins. The bundled change shipped correctly but the page kept showing "You'll make" until the matching Console microcopy update was applied. Documented for future copy work: bundled = fallback, Console = source of truth in prod.
- `4ac20d647` — `feat(TransactionPanel): show listing brand below title with search-card styling`. New `listingBrand` derived from `stateDataListing.attributes.publicData.brand` in `TransactionPanel.js:218-220`, passed via `DetailCardHeadingsMaybe`'s existing-but-unused `subTitle` prop. Updated `.detailCardSubtitle` CSS from `composes: h5 from global` to a `marketplaceTinyFontStyles`-based treatment matching `.authorInfo` on `ListingCard`. Hidden when listing is deleted. Both `/order/*` and `/sale/*` covered (single component).
- (squashed into next commit) — `fix(TransactionPanel): show proper brand display label, not the slug`. Brand was rendering as the raw `publicData.brand` value (e.g. `helsa`) instead of the configured display label (`Helsa`). Extracted the inline `getBrandLabel` from `ListingCard.js:129-139` into a reusable `getListingFieldLabel(config, fieldKey, optionKey)` helper in `src/util/fieldHelpers.js` — generic version, falls back to raw option key, returns `null` for empty input, never throws. Used in `TransactionPanel.js`. `ListingCard.js` not migrated yet (deferred to keep diff small).
- `d8315bf14` — `copy(1b-SMS): drop literal '2 hours' claim — reframe around payout`. The 22h final-warning SMS used to read "expires in 2 hours" but actual time-to-expire at the first cron tick is ~1h47m and shrinks on later ticks (phase window `[22h, 24h)`, cron `*/15`). New copy: `Sherbrt 🍧: ⚠️ Final call — your $X.XX payout is about to expire. Accept NAME's borrow request now: URL` — no time mention, urgency carried by "Final call" + "about to expire". `sendLenderRequestReminders.js:411` + matching test in `sendLenderRequestReminders.phases.test.js:111-114` updated to assert new phrase + explicitly forbid regression to "expires in 2 hours" string. 44 tests still passing.
- `9c8267e82` — `style(TransactionPanel): bump brand subtitle from 13px to 16px`. Brand line was reading as fine-print at 13px; bumped to 16px (explicit `font-size` + `line-height: 22px`, kept medium weight + grey700). Sits between 13px fine-print and the 21px H4 title weight without competing.
- `f37f8acfd` — `feat(account): add AccountShippingAddressPage settings page` (**Step 1 of Option A** — see below for full plan). 11 files / 766 insertions. New `/account/shipping-address` route, settings page modeled on `ContactDetailsPage`, six-field form (street, street2, city, state, zipCode, phoneNumber), saves nested object at `currentUser.attributes.profile.protectedData.lenderShippingAddress`. Originally also wrote `protectedData.phone` for legacy reader compatibility; that write-through was removed alongside the Phase D task #31 phone-field deprecation (see entry below). 7 tests passing including the regression test for shallow-merge behavior (cleared `streetAddress2` MUST be sent as `''` literal, not omitted).

**Mobile accept blocker discovered + Option A architecture decision:**

Mid-session, attempted Day 9's mobile lender accept via Expo Go on a fresh `preauthorized` test request. Got `PrivilegedTransitionError: Provider shipping fields missing` from `lib/lender-actions.ts:72`. Initially attributed to the Day 9 spec's documented v0.1.5 deferral ("lenders v0.1 are existing users who set up address via web"). **Independent investigation (Explore subagent confirmed the original analysis) revealed Day 9's framing was wrong:** there is NO persistent storage of lender shipping address anywhere in the system today. Web's `ProviderAddressForm` starts empty every time (verified at `TransactionPanel.js:97-104` initialState + form `initialValues` from that empty state); the lender re-enters their full address fresh on every accept; the values are written to `tx.protectedData` only at accept time. Server `transition-privileged.js:1929-1944` validates request-body params + `tx.protectedData` only — no fallback to `prov.profile.protectedData`. So mobile's defensive check at `lib/lender-actions.ts:69-76` is mechanically correct but reads from a slot (`tx.protectedData`) that legitimately isn't populated until the very accept it's blocking — a circular dependency that mobile cannot escape without persistent profile-level storage.

**Decision: Option A** (persistent profile address, fixes web UX gap + unblocks mobile in one architectural change). Picked over Option B (mobile-only inline form) which would have left the every-accept-re-entry web UX gap unfixed. CC reviewed the plan and surfaced 4 issues we incorporated:
1. Sharetribe SDK `updateProfile` shallow-merges top-level `protectedData` keys but **replaces nested object values wholesale** — verified via `ContactDetailsPage.duck.js:107-114, 217-218` where independent updates of `phoneNumber` and `shippingZip` preserve each other. Implication: every save MUST send the full six-field `lenderShippingAddress` object; partial updates silently wipe siblings. Regression test added.
2. `componentDidMount` prefill in `TransactionPanel.js` would race the `currentUser` async load (it's `null` on first mount, arrives via later prop update). Use `componentDidUpdate` with a `hasPrefilledFromProfile` flag.
3. Server-side fallback (Step 4b, promoted to peer step): `transition-privileged.js` accept validation should hydrate missing `provider*` fields from `prov.profile.protectedData.lenderShippingAddress` BEFORE validation runs (mirror existing phone fallback at lines 285-287). Makes server the source of truth, lets clients send empty objects and trust the server, future-proofs against new client surfaces.
4. Phone-key sprawl: three lender phone slots existed (`lenderShippingAddress.phoneNumber` new, `protectedData.phone` legacy, `tx.protectedData.providerPhone` written at accept). Initial mitigation was to save form's phoneNumber to BOTH new + legacy in one `updateProfile` call. Legacy slot has since been deprecated server-side — readers prefer `phoneNumber` and the dual-write was removed (see Phase D task #31 entry below).

**Locked Option A design decisions (user confirmed via clarifying questions):**
- **Schema:** nested object at `currentUser.attributes.profile.protectedData.lenderShippingAddress = { streetAddress, streetAddress2, city, state, zipCode, phoneNumber }`. Naming uses Sherbrt's external "lender" term not server's "provider" — mapping documented inline in the duck.
- **Booking-page UX when profile address exists:** form prefilled, always editable inline (no hide/toggle, no read-only summary). Per-tx edits scoped to component state — don't leak back to profile unless user opts in via a "Save these as my default shipping address" checkbox that appears only when prefill happened AND user edited a field.
- **Mobile no-address fallback:** inline prompt on lender detail screen with deep-link to a new `app/account/shipping-address.tsx` settings screen. Hard error / web-redirect rejected as poor UX.
- **Out of scope:** customer (return) address mobile settings (different mental model — borrowers enter at checkout); "ships from {city}" badge on borrower side (separate feature); validator upgrade for ZIP/phone/state format (deferred follow-up — both `ProviderAddressForm` + new `AccountShippingAddressForm` use HTML5 `required` only today, no ZIP regex/phone format/2-letter state — match existing behavior, no regression, fix in a separate pass that upgrades both forms together).

**Option A implementation plan (5 steps + 1 server-side step, in execution order):**
1. ✅ **Web settings page** (`f37f8acfd`) — `AccountShippingAddressPage` modeled on `ContactDetailsPage`. Done.
2. ⏳ **Web prefill** — `TransactionPanel.componentDidUpdate` reads `currentUser.profile.protectedData.lenderShippingAddress` once when currentUser arrives (`hasPrefilledFromProfile` flag), maps to form state. "Save as default" checkbox renders only when prefill source = profile AND user has edited any field. On accept with checkbox checked: dispatch `saveShippingAddress` first, await success, THEN fire accept (Promise chain — fail loudly if profile save fails to avoid inconsistent state). **Prompt drafted, ready to give to CC.**
3. ⏳ **Server fallback** (Step 4b promoted to peer) — `transition-privileged.js` accept validation hydrates missing `provider*` fields from `prov.profile.protectedData.lenderShippingAddress` before validation runs. Mirrors phone fallback at lines 285-287. Makes server the source of truth — simplifies mobile step 5 dramatically (mobile can call accept with empty params and trust server hydration).
4. ⏳ **Mobile settings screen** — `app/account/shipping-address.tsx` alongside existing `app/account/email.tsx` and `password.tsx`. Six-field form. `useFocusEffect` dispatches `currentUser/show` on focus to pick up cross-platform saves. Wire entry into `app/account/index.tsx`.
5. ⏳ **Mobile lender-actions fallback + no-addr prompt** — Update `lib/lender-actions.ts` `acceptBookingRequest` to read profile address as fallback when `tx.protectedData` lacks fields. On `app/lending/[id].tsx`, when error code = `transition/accept-missing-provider` AND profile address also empty, show inline "Set up shipping address" prompt with deep-link to `/account/shipping-address`.

**End-of-day update — Steps 2, 3, 4, 5 all shipped same session.**

**Step 2 shipped — `adab92493` + Step-2 follow-up CSS commits `0bc2b9834`, `c0194730b`, `3f05af329`.** Web booking-page prefill + "Save as default" checkbox.
- `componentDidUpdate` with `hasPrefilledFromProfile` instance flag fires prefill exactly once when `currentUser` arrives (race-safe vs `componentDidMount` which would have fired before currentUser loaded).
- "Save as default" checkbox renders only when prefill happened AND user has edited a prefilled field (per-key compare against snapshot stored on instance, not in state). Reverting an edit re-hides the checkbox automatically.
- On Accept with checkbox checked: `Promise.resolve(onSaveShippingAddress(values)).then(result => { if (!result) skip; else fireTransition() })`. Save first, conditional transition on truthy result. Prevents profile/tx desync if save fails.
- **CC discovered + fixed a latent infinite-render-loop in the existing form contract.** `<ProviderAddressForm initialValues={state.addressValues} onChange={handleAddressFormChange}>` had been passing the same value back as `initialValues` that the form mutated via `onChange` — Final Form would reinitialize on every onChange-triggered setState. Dormant because state.addressValues rarely changed in the no-prefill flow; the prefill setState woke it up. CC's fix: split `state.addressInitialValues` (only changes on prefill, what Final Form receives) from `state.addressValues` (live mirror for the accept handler), plus a no-op guard in `handleAddressFormChange`. Step 1 tests confirmed no regression.
- **CSS battle for the "Save as default" checkbox** took three iterations across `0bc2b9834` → `c0194730b` → `3f05af329`. Root cause: `marketplaceDefaults.css:523-528` has an unqualified `input, textarea { display: block; width: 100%; padding: 6px 12px 4px 12px }` rule that applies to ALL inputs including checkboxes, forcing them to render as full-width blocks on their own line. Fix required explicit overrides at the checkbox class level: `display: inline-block; width: auto; padding: 0`. The `<label>` itself uses `display: block` with `vertical-align: middle` on the input + span (avoiding `display: flex` entirely; flex was misbehaving in this parent context). **Lesson logged:** the global `input` rule is a hidden trap for any future inline-checkbox usage in this codebase — the `[VERIFY][ACCEPT]` task #30 triage might surface similar gotchas elsewhere.

**Step 3 shipped — `3cc15394a`** + critical follow-up `0bc2b9834`. Server-side fallback in `transition-privileged.js`.
- New helper `hydrateProviderFieldsFromProfile(params, lenderShippingAddress, providerEmail)` (line 38). Decoupled from SDK shape, easy to unit-test.
- Wired into the existing `if (transition === ACCEPT_TRANSITION)` validation block at line 1991, immediately before the `missingProvider` filter at line 2006. Empty/whitespace strings in profile do NOT hydrate. Client-supplied values always win. Mutates both `params[k]` and `params.protectedData[k]` to match the existing flattened-params pattern.
- Provider user fetched via integration SDK (`iSdk.users.show`) using the listing's `relationships.author.data.id`. Marketplace SDK can't read another user's `profile.protectedData` even with `include` — same pattern as `initiate-privileged.js:288`.
- Try/catch wrapper around the whole hydration block. Transient integration SDK failures fall through to the existing `missingProvider` check rather than 500ing the request.
- **Critical follow-up:** initial Step 3 ship logged `[ACCEPT][HYDRATE] No provider id on listing.relationships.author; skipping hydration` on every accept. Root cause: `sdk.listings.show({ id: listingId })` was called WITHOUT `include: ['author']`, so the relationship object was empty. Web flow happened to still work (clients send full params, hydration was a no-op anyway) but mobile would have been blocked since mobile relies on hydration to fill in provider fields. One-line fix at line 1742: `sdk.listings.show({ id: listingId, include: ['author'] })`. Verified post-deploy via Render logs: hydrate log changed from "No provider id on listing.relationships.author; skipping hydration" to `[ACCEPT][HYDRATE] No provider fields needed hydration` (helper now executes successfully but has nothing to do because client sent everything).
- **22 hydration tests added** in `transition-privileged.hydrate-provider.test.js`: empty params + saved address (hydrates all), partial client params (client wins), empty strings in profile (don't hydrate), no profile address (existing 422 unchanged), email from `prov.attributes.email`, hydrated values flow to `tx.protectedData`. All 30 server tests pass (8 existing pick-rate + 22 new). Step 1 + Step 2 tests still pass.

**Step 4 shipped — mobile commit `b529975`** (cross-repo: `~/sherbrt-mobile`). New `app/account/shipping-address.tsx` settings screen mirrors web's settings page. See mobile CLAUDE_CONTEXT for full details.

**Step 5 shipped — mobile commit `c33203e` merged via `01a1b1a`** (cross-repo). Mobile `lib/lender-actions.ts` now calls accept with empty params, trusts server to hydrate. Lender detail screen shows inline "Set up shipping address" prompt with deep-link to settings on `transition/accept-missing-provider`. See mobile CLAUDE_CONTEXT for full details.

**Other commits same session (not part of Option A):**
- `4ac20d6`/`9c8267e8`/related — Listing brand display below title in TransactionPanel sidebar. Reads `publicData.brand` (slug) → `getListingFieldLabel(config, 'brand', slug)` lookup → render display label ("Helsa" not "helsa"). Helper extracted to `src/util/fieldHelpers.js` — generic for any enum listing field. Brand styling: 16px / medium weight / `colorGrey700`. Web hide-when-listing-deleted; visible at both `/order/*` (borrower) and `/sale/*` (lender) views.
- `d8315bf` — 1b-SMS copy refresh (already documented above).

**Two side-issues surfaced from accept logs — NOT introduced by Option A, NOT blockers, but worth tracking:**
1. **Shippo label still failing on a customer (recipient) address validation:** `[SHIPPO] Label purchase failed: failed_address_validation: Recipient address invalid: Address not found.` for `1795 Chestnut Street, apt 7, San Francisco, CA, 94123`. The accept transition completes successfully and the borrower SMS fires, but the actual outbound USPS label never gets generated. The lender therefore won't get a label-delivery SMS, and the borrower won't get tracking. Address validates fine in Google Maps so this is a USPS/Shippo normalization quirk. Worth trying: abbreviate `Street` → `St`, change `apt 7` → `Apt 7` or `Suite 7`, append ZIP+4. Tracked as **task #29**. Pre-existing; not introduced by Option A.
2. **`[VERIFY][ACCEPT] Missing providerZip after upsert!` false-positive log.** After the integration SDK protectedData upsert at accept time, the verification check fires this warning even though the upsert clearly included `providerZip` in its keys (see `[INT][PD] updateMetadata` bodyKeys log adjacent). The verification re-fetches the tx but reads from a stale source OR checks the wrong path. Tracked as **task #30**. Pre-existing; cosmetic noise in production logs.

**Architectural learnings worth carrying forward:**
- **Sharetribe Console hosted translations override bundled `en.json`.** Any user-facing copy change in `en.json` requires a parallel Console microcopy update for the change to render in production. Bundled file = dev fallback.
- **Sharetribe SDK `updateProfile` semantics:** top-level `protectedData` keys merge shallowly across calls (independent updates preserve each other), but the value of a single key is REPLACED wholesale. Always send the full nested object on save. Web duck and mobile `updateLenderShippingAddress` helper both do this correctly with `?? ''` fallbacks.
- **Sharetribe `sdk.listings.show` does NOT populate `relationships.*` unless you pass `include: ['author']` (or whatever entity you need).** This was the Step 3 follow-up bug — listing was fetched, author relationship was empty, hydration helper bailed early. If any future code reads `listing.relationships.X.data.id`, ensure the listing fetch includes that entity.
- **Marketplace SDK can't read another user's `profile.protectedData` even with `include`.** Cross-user profile reads (e.g. provider's saved address from a non-provider session) require integration SDK (`iSdk.users.show`).
- **Cron timing nuance:** SMS phases with windows like `[22h, 24h)` paired with `*/15` cron schedules mean actual fire time = "first 15-min tick at or after the lower bound" — not "exactly at the lower bound". Avoid SMS copy that makes literal time claims (e.g. "expires in 2 hours") because actual delta varies by tick alignment. Use directional language ("about to expire") instead.
- **Render Manual Deploy footgun:** the dashboard's deploy list lets you click any historical commit and it will re-deploy from THAT snapshot — effectively a rollback. Today's session lost ~11 minutes to a `686f602` (April 28 docs commit) accidentally re-deployed at 8:12 AM, wiping the 8:04 + 8:11 fix deploys. Going forward: only ever click "Deploy latest commit" from the top of the Manual Deploy dropdown, never click rows in the historical deploys list unless you specifically want to roll back.
- **`marketplaceDefaults.css` global `input, textarea` rule applies to checkboxes.** When adding any inline checkbox UI, override `display`, `width`, AND `padding` explicitly at the class level. The Step 2 CSS battle (3 iterations) traces directly to this trap.
- **Zsh history expansion footgun:** double-quoted heredoc commit messages containing `!word` (e.g. `!isDirty` documenting a code reference) cause zsh to bail with `event not found: word`, silently aborting the `git commit` chain. Workaround: use single quotes (`git commit -m '...'`) which disable history expansion, or avoid `!` characters entirely in commit messages. Today's session lost ~30 min to this when a commit message referenced `!isDirty` from the React code being shipped.

---

## 🟢 Pickup Tomorrow — Where We Are + What To Do Next

**State of the world (end of May 1 session):**
- ✅ **Task #29 SHIPPED + VERIFIED LIVE.** Squashed commit `5acbb2e20` on
  `origin/main`. Pre-validates addresses via Shippo `/addresses/?validate=true`,
  uses canonical (with ZIP+4) for `/shipments/`, re-rates at accept against
  fresh-shipment rates by exact `provider+servicelevel.token` match
  (preserves carrier neutrality, never falls back to cheapest). Verified
  end-to-end against live USPS via `scripts/probe-shippo-live.js`
  (tracking `9300120845500002217937`, $0 net cost via auto-void).
  **Scenario 1 is unblocked.**
- ✅ **Task #30 Phase 1 SHIPPED.** Sharetribe `default-booking` v6 published
  at 1:29 PM PT today, alias `default-booking/release-1` moved from v5 to
  v6. Local `process.edn` synced as commit `c5f2d0b02` on `main`. 6 new
  operator-update-pd-<state> transitions added: `accepted`, `delivered`,
  `cancelled`, `reviewed`, `reviewed-by-provider`, `reviewed-by-customer`.
  CC's Phase 0 audit caveats all folded in (no `:privileged?` flag, no
  feature flag, hard-fail on unsupported state, 6 not 5 — `cancelled`
  added per CC catch).
- ✅ **Task #30 Phase 2 SHIPPED + RUNTIME-VERIFIED.** Squash-merged commit
  `19f27cded` on `main`. `txUpdateProtectedData` rewritten to use the new
  operator-update-pd-<state> transitions. 28 directly-affected tests pass.
  Runtime verified end-of-day on first organic v6 accept (mobile-originated
  tx `69f51671-7b35-4b1a-87e5-71f934856568`): all 4 `[INT][PD] transition
  operator-update-pd-accepted` log lines paired with `[INT][PD][OK]`,
  `attempt: 1` each, no 409s, no UNSUPPORTED-STATE, no ERR, no
  `[VERIFY][ACCEPT] Missing providerZip after upsert!` warning.
  `scripts/probe-task-30.js 69f51671` confirmed data at
  `tx.attributes.protectedData.shipByISO` (correct), undefined at
  `tx.attributes.metadata.protectedData.shipByISO`. See May 1 (evening)
  entry above for full proof.
- ⏳ **Task #30 Phase 3 deferred.** Migration script
  (`scripts/migrate-task-30-data.js`) to copy data from
  `metadata.protectedData.*` → `protectedData.*` for in-flight txs. Runs
  AFTER Phase 2 deploys + stabilizes. Needs maintenance window OR feature
  flag fence on `txUpdateProtectedData` during migration. Per-key conflict
  prompts (don't blanket-pick "metadata wins").
- ✅ **Phase 1 runtime verification COMPLETE.** Path B succeeded as
  designed: tx `69f51671` was created on v6, accepted from mobile, and
  exercised the new `transition/operator-update-pd-accepted` transition
  cleanly (4 successful writes, no errors). Phase 1 + Phase 2 both
  verified in the same accept. Same pattern as task #29 worked
  (organic verification instead of synthetic test charge).
- ⏳ **Mobile launch path heads-ups still pending** from Day 12 wrap-up:
  EAS production env-var change (`EXPO_PUBLIC_API_BASE_URL` = `sherbrt.com`
  apex, NOT `www.sherbrt.com`) before next TestFlight ship; Sharetribe
  Console microcopy verification for `OrderBreakdown.providerTotal*` keys
  ("Your earnings" should render in production).

**Decision log from today (anchor for future-CC):**

- Failure UX for invalid addresses on accept: **hard-fail** with structured
  error `invalid_recipient_address` / `invalid_provider_address` (NOT
  soft-retry without unit, which would hold packages at the PO).
- Re-rate matching: **exact `provider+servicelevel.token`** (NOT
  cheapest fallback — cheapest would silently swap carriers from what the
  borrower was quoted at checkout).
- Re-rate price delta: **$2 ops alert threshold** via `OPS_ALERT_EMAIL`,
  Sherbrt absorbs delta, borrower preauth amount preserved.
- Task #30 architecture: **6 transitions per state** (not vector-from —
  Sharetribe EDN doesn't support it; CC verified by grepping).
- Task #30 unsupported-state behavior: **hard-fail** with structured
  error and ops alert (NOT soft fallback to `updateMetadata`, which would
  re-create the bug silently).
- Task #30 rollback strategy: **Render deploy revert** (NOT a feature
  flag, which would also silently re-create the bug).

**Day 2 morning task (~10 min): check on CC's Phase 2.**

If CC has reported back with the diff, paste it to Cowork-Claude for
review. Mostly we're checking: `transactions.updateMetadata` is gone from
`server/api-util/integrationSdk.js`; new helper calls
`transactions.show` + `transactions.transition`; the 4 existing tests are
updated; new test asserts data lands at `protectedData.X` via `tx.show()`;
all green via `npm test`. Then merge to `main`, push, Render auto-deploys.

If CC hasn't reported back: re-prompt or wait. The brief is in the chat;
re-paste if CC's session was interrupted.

**Day 2 afterwards (in priority order):**

1. **Phase 2 deploy + watch first organic accept** for Render log lines
   `[INT][PD] transition operator-update-pd-accepted` (or whichever
   state). Confirm `[VERIFY][ACCEPT] Missing providerZip after upsert!`
   no longer fires. That tx becomes the runtime verification of Phase 1
   + Phase 2 together.
2. **Phase 3: migration script** with `--dry-run` first, then real run
   during low-traffic window. Per-key conflict prompts.
3. **Pivot to mobile launch path:**
   - Resume Scenario 1 → 2 → 3 → 4 → 5 → 6 in v12 Test Scenarios workbook.
     Scenario 1 was in flight before Option A and task #29 intercepted;
     now fully unblocked.
   - EAS production env-var change (`EXPO_PUBLIC_API_BASE_URL`).
   - Sharetribe Console microcopy verification.
4. **Backlog — pre-mobile-launch (no order):** task #25 (format
   validators), task #31 (phone field consolidation), worktree
   cleanup, `ListingCard.js` migration to `getListingFieldLabel`,
   extract `shippoTracking.js` phone-resolution helpers
   (`getBorrowerPhone` / `getLenderPhone`) to `server/api-util/phone.js`
   — current pattern attaches them to the router export, works but is
   non-idiomatic.
5. **Backlog — post-mobile-launch (gated on TestFlight ship + first
   real users; no order within batch):**
   - **Task #32** — Transactional email provider returning
     `Unauthorized`. Surfaced May 1 evening logs on tx `69f51671`;
     **still failing as of May 12, 2026** (confirmed on tx `6a03712a`
     while seeding the Apple App Store reviewer test account — both
     `lenderOutboundLabelEmail` to `amaliaebornstein@gmail.com` and
     `returnLabelEmail` to `appstore-review@sherbrt.com` failed with
     `error: 'Unauthorized', response: { errors: [...] }`). **Operator
     diagnosis (May 12, 2026):** SendGrid free trial likely expired;
     transactional emails not going out. SMS unaffected — label URLs
     all delivered via Twilio successfully on tx `6a03712a` (borrower
     accept SMS, lender ship-by SMS, return label SMS to borrower all
     delivered). Label URLs DID persist to `tx.protectedData`, so a
     re-send mechanism could recover the missed emails once a new
     provider is wired up. **Action items (post-Apple-launch):** (1)
     confirm SendGrid plan status / which provider key is in use, (2)
     evaluate alternatives — SendGrid paid tier vs Resend (generous
     free tier, modern API) vs Postmark (transactional-focused,
     ~$15/mo) vs AWS SES (cheap but more setup), (3) build a re-send
     CLI to backfill emails for any tx with `protectedData.outboundLabelUrl`
     or `returnLabelUrl` set but no corresponding `sentAt` flag. **Not
     blocking Apple App Store submission** — Apple reviewers don't
     receive these emails, and the in-app + SMS surfaces cover the
     critical UX paths.
   - **Task #33** — Twilio SMS-status-callback URL has duplicated query
     params (`?tag=...&tag=...&txId=...&txId=...`). Cosmetic — webhook
     still 200s. Fix the query-string assembly logic in the callback
     URL builder (search for the call-site that constructs the
     `statusCallback` URL on Twilio Messaging Service requests). Low
     priority but trivially fixable.
   - **Probe script cosmetic patch** — `scripts/probe-task-30.js`
     diagnosis text reads `=> Task #30 is NOT a bug. Data is going to
     the correct field. => Either Sharetribe changed semantics, OR our
     analysis was wrong.` That branch was written pre-Phase-2-deploy;
     on the fixed code it's the *expected* outcome. Update the
     diagnosis to distinguish "pre-Phase-2" (data at metadata.X = bug
     present) from "post-Phase-2" (data at protectedData.X = fix
     verified). One-line patch. Bundle with #32/#33.
   - **Task #34** — Turnaround buffer between bookings on the same
     listing. Currently the listing's availability calendar allows
     back-to-back bookings with zero gap (Sherbrt operator surfaced
     this May 12, 2026 while seeding the App Store reviewer test
     account — placed booking #1 May 14-16 and booking #2 May 18-23
     on a different listing because it felt risky on the same item
     with only 1 day in between). Lenders need realistic turnaround:
     receive returned item, inspect, clean if needed, repackage,
     re-list as available. Proposed: a per-listing `turnaroundDays`
     field (default 2-3?) that auto-blocks N calendar days after any
     accepted booking's `end` date. Touches: Shippo-anchored
     availability logic in `server/lib/shipping.js` + listing-creation
     UI on web + mobile borrower date-picker (which currently shows
     calendar from a Sharetribe API call — would need to consume the
     `turnaroundDays` config from listing publicData). Marketplace-
     wide v1 default + per-lender override would be the cleanest
     v0.2+ shape.

**Diag scripts written today (still useful for verification later).**

- `scripts/probe-task-30.js <txId>` — proves the bug is real on any
  given existing v5 tx. Run twice today against `69f3cbd6` and `69f27547`,
  both confirmed. Will EXPECT to FAIL after Phase 2 ships (the "bug" goes
  away once writes go to `protectedData` directly).
- `scripts/diag-task-30-transition.js <txId>` — verifies a specific
  `operator-update-pd-<state>` transition routes data correctly. Will
  fail with `transaction-invalid-transition` on any v5-pinned tx; will
  pass on v6-created txs after Phase 2 deploys.
- `scripts/diag-tx-address.js` — extended to read both
  `tx.attributes.protectedData` and `tx.attributes.metadata.protectedData`.
  Useful for diagnosing "where did this data go?" on any tx.
- `scripts/probe-shippo-live.js` — verifies Shippo+USPS works end-to-end
  with $0 net cost via auto-void. Pattern for future verifications.
- `scripts/probe-shipment-rate-binding.js` — proves USPS validates
  against the rate's original shipment, not a freshly-created shipment
  with the same rate ID. Locks in the re-rate-at-accept design rationale.

**Where we left off literally:** Web `~/shop-on-sherbet-cursor/main` HEAD
is `c5f2d0b02` (process.edn v6 transitions). Sharetribe `default-booking`
alias on v6. CC working on Phase 2 in a worktree. No uncommitted changes
pending on main. Ready to review CC's Phase 2 diff first thing tomorrow.

---

## Earlier Pickup Tomorrow notes (April 29 → April 30)

(These are now superseded by the May 1 entry above. Kept for reference
in case anything from this period needs to be re-checked.)

**State of the world (end of April 29 session):**
- ✅ Web side of Option A fully shipped. Settings page, prefill, server fallback, brand display, banner gating, copy refreshes — all on `origin/main`, all deployed via Render.
- ✅ Mobile side of Option A fully shipped. Settings screen + lender-actions empty-params + inline prompt on `origin/main` for `~/sherbrt-mobile`.

**Day 1 morning task was the mobile smoke test (Scenarios A / B / C).**
All three passed during the April 30 session (see entry below). Task
#20 (Option A end-to-end) marked completed.

**Then resume Scenario 1 → 2 → 3 → 4 → 5 → 6 in the v12 Test Scenarios workbook.** Scenario 1 was in flight before Option A intercepted; the Shippo address fix (task #29) unblocked it on May 1. All comms are wired and deployed; no other blockers known.

### April 28, 2026 — Comms wiring audit + 3.2/3.2b copy refresh + render.yaml drift cleanup + workbook v12 + Scenario 1 testing started

**Status at end of session:** Mid-Scenario 1 (IDEAL) live testing. All 9.2 + 9.2.1 + 10.0 work confirmed deployed and live in production. Workbook is at v12 (saved locally, NOT yet uploaded to Drive). 5 commits pushed to main today.

**Session goal:** Verify everything scoped in CLAUDE_CONTEXT was actually deployed; align Log-tab copy with shipped code; close `render.yaml` drift; resume QA testing on the v12 plan.

**Comprehensive deployment audit (verified live in `main` + Render dashboard):**
- All 9.2 pre-QA fixes (B1, B2, B3, H1, H2, H3) shipped in PR #53 (`bb51f1f`).
- 9.2.1 overdue-cron clean exit shipped in PR #54 (`9b764e1`).
- All 10.0 PRs shipped: PR-5 (#55, scan-lag grace) → `46c80638e`, PR-1/2/3 bundle (#56) → `ea1bc3bf8`, PR-4 (#57, 24h expire + watchdog + version-gate blocker fix) → `d922669d2`.
- Sharetribe alias `default-booking/release-1` → version 5, confirmed via Console screenshot. Transactions count = 0 on v5 (next request will be the first).
- Render env vars verified: `SENDGRID_API_KEY` + `EMAIL_FROM_ADDRESS` set on overdue + auto-cancel crons. SMS-only crons (`lender-request-reminders`, `shipping-reminders`) correctly do NOT have SendGrid keys.
- `AUTO_CANCEL_DRY_RUN=0` flipped to live mode — intentional, only operator/test transactions exist in prod.
- 64 historical v1 transactions still in `:state/accepted` show in auto-cancel cron logs as `not on default-booking v3+, skipping`. Operational debt; harmless. Version-gate working correctly (10.0 PR-4 fix `>= 3` not `=== 3` is doing its job).

**Code commits (5, all on `main` and deployed):**
- `5fc6712bf` — 3.2-SMS borrower + 3.2b-SMS lender copy refresh in `sendAutoCancelUnshipped.js`. Switched 3.2b URL from per-listing `shortLink` to static `https://sherbrt.com/listings` (ManageListingsPage). Lender earnings amount now uses `calculateLenderPayoutTotal` + `formatMoneyServerSide` from `api-util/lenderEarnings` — same source of truth as 1-SMS / 1a-SMS / 1b-SMS so the four lender-side messages can never drift on the figure shown.
- `ccfc9dd0e` — 4-SMS outbound-shipped copy aligned to workbook in `webhooks/shippoTracking.js` lines 1226 (production webhook) + 1471 (test/diagnostic path). New copy: `🚚 Sherbrt 🍧: "[item]" is on its way! Tracking info: [link].`
- `7813c380f` — Added `lender-request-reminders` cron block to `render.yaml` (documentation-only — service was already live in Render UI). Updated CLAUDE_CONTEXT note.
- `78ae68858` — `render.yaml` drift cleanup: removed legacy `shipby-reminders` worker block (script not deployed, superseded by `sendShippingReminders.js`); added `shipping-reminders` cron block (3.1 + 3.1b SMS); rebuilt the deployment-config note. CLAUDE_CONTEXT deployment table now matches Render dashboard 1:1 (1 web + 2 workers + 3 cron jobs = 6 active services).
- `43655e552` — Switched user-facing `cancelled` → `canceled` (American spelling) in 3.2 + 3.2b SMS copy + the matching internal log line. Sharetribe API state-string checks (`state === 'cancelled'`) intentionally retained — must match upstream API.

**Workbook v12** (saved locally at `/Users/amaliabornstein/shop-on-sherbet-cursor/sherbrt_transaction_comms_v12.xlsx`):
- **Log tab:** new row 1b-SMS (22h final warning to lender, bypasses quiet-hours, tag `lender_request_reminder_22h`); 1-SMS / 1a-SMS copy refreshed to match shipped code (`You have 24hrs to accept`, `Just tap before it expires`); 3-SMS / 3.1 / 3.1b notes refreshed for Shippo-anchored ship-by; 3.2 / 3.2b copy + timing rewritten (anchored to bookingStart + 12h scan-lag, NOT shipByDate; ManageListingsPage URL; earnings via shared helper; American spelling); deprecated 5-SMS row deleted; 4-SMS copy aligned with deployed code; 6-SMS copy aligned with deployed code.
- **Legend tab:** Ship-by-logic row rewritten for Shippo-anchored model; new entries for Lender accept window (24h, 2-phase escalation, quiet-hours rules) + Auto-cancel scan-lag grace (12h buffer + Monday-shift math).
- **Test Scenarios tab:** dropped Pre-Test Blockers + Post-Deploy Findings sections (all work shipped); rebuilt all 6 scenarios in Log-aligned column format with separate "Expected to FIRE" + "Must NOT fire" sub-tables; Scenario 2 now expects 1b-SMS at 22h; Scenario 4 reflects `AUTO_CANCEL_DRY_RUN=0` + scan-lag-grace observable.
- **PR-4 Instructions tab** renamed to `Late-Fee Charging Dry-Run` (content unchanged).

**Listing-specific calendar quirk surfaced during Scenario 1 setup (NOT a code bug):**
- One specific listing blocks all May 2026 dates when start = Apr 30 selected.
- Confirmed by code trace: `BookingDatesForm.js:168` `getBookableRange` correctly clamps end-date picker to the time slot's `end` attribute. The listing's Sharetribe time slot covering Apr 30 ends on May 1 (exclusive) → all May correctly blocked.
- Lender confirmed availability is open in Console UI, but symptom persists. Likely cause: stale time-slots cache or stale `protectedData` on the listing from a one-off script in the past. Did NOT investigate further.
- **Workaround:** use a different listing for IDEAL testing. Class of issue is listing-specific data, not global code.

**Open / pending items for next session:**
1. **Sharetribe Console → Content → Email templates → review `booking-expired-request`** for stale "6 days" / "within a week" language before testing Scenario 2 (the borrower receives this email when the v5 24h auto-expire fires). The in-repo template is generic ("didn't respond on time, so your request expired") — but Sharetribe Console can have a marketplace-specific override that may be stale.
2. **Workbook v12 → Drive:** local copy still needs uploading.
3. **Continue Scenario 1 → 2 → 3 → 4 → 5 → 6** in the v12 Test Scenarios tab order. All comms verified wired and deployed. No blockers.

**Where we left off:** Scenario 1 (IDEAL) is in flight. The test transaction will be the first booking on Sharetribe v5 (alias just shows 0 transactions). Borrower side encountered the listing-specific calendar quirk above — switched to a different listing to continue.

### 10.0 — Shippo-Anchored Ship-By + 24h Lender Expire + Acceptance Hardening (April 23, 2026)

**Status:** ✅ Shipped end-to-end same day as the env-drift incident (below) that triggered it. All 5 atomic PRs merged, process.edn v5 alias flipped live, deploy verified.

**What shipped:** A comprehensive rewrite of the shipping + lender-acceptance architecture that replaces static env-var-driven ship-by computation with Shippo-anchored derivation, adds rate-lock between checkout and accept to eliminate silent revenue leaks, tightens the lender acceptance window from 6 days to 24 hours with 2-phase SMS escalation + a MISSED_FINAL watchdog, adds a 12-hour scan-lag grace to auto-cancel, and fixes a version-gate blocker that would have silently disabled auto-cancel marketplace-wide on the v5 alias flip.

**PRs merged (in deploy order):**
- PR-5 (#55): `server/scripts/sendAutoCancelUnshipped.js` — 12h scan-lag grace buffer. Prevents premature cancels when a carrier hasn't yet propagated the scan (USPS often 4-12h behind physical drop). `SKIP reason=scan-lag-grace hoursPastDeadline=X.X` log event structurally parallel to overdue's `daysLate <= 1` guard at `lateFees.js:294`. Compounds intentionally with the existing Monday-start grace: 60h post-bookingStart cancel window for Mon-start, 36h for other weekdays.
- Bundle PR (#56): 3 atomic commits (`5a4a0230a` + `e67702b37` + `6ff722b3c`) + 1 follow-up (`dbf6f83fd`) — expanded `preferredServices` to 6 entries (added USPS Priority Mail Express, UPS 2nd Day Air, UPS Next Day Air Saver), fixed the `estimateOneWay` name-builder bug (was reading undefined `r.service` under modern Shippo SDK shape — filter matched nothing, fallback silently picked cheapest-of-all-rates), refactored `pickCheapestAllowedRate` to actually filter by `preferredServices` and take `daysUntilBookingStart` directly, added `pickCheapestPreferredRate` for return labels (always-cheapest, no deadline), implemented Shippo-anchored `computeShipByDate` (persisted-first, `transitDays + SAFETY_BUFFER_DAYS` business-day-subtracted, PT-based), added rate-lock at checkout (`outbound.lockedRate` + `return.lockedRate`), implemented CC Option 6 at accept (always-use-locked-rate, no feasibility re-check, no fallback re-selection — eliminates the delta class entirely), added trademark-symbol stripping to `nameOf` (® U+00AE, ™ U+2122) after a live Shippo probe found `"UPS 2nd Day Air®"` and `"UPS Next Day Air Saver®"` in the real response.
- PR-4: `process.edn` v5 (`:transition/expire` `P6D` → `PT24H`), `sendAutoCancelUnshipped.js:143` `processVersion !== 3` → `< 3` blocker fix, `sendLenderRequestReminders.js` 2-phase escalation (60m respects quiet-hours, 22h bypasses), MISSED_FINAL watchdog with 1h Redis dedupe preventing 2x count inflation across consecutive 15-min cron ticks within the 30-min lookback, `initiate-privileged.js` 1-SMS copy update (`"Tap to review & accept"` → `"You have 24hrs to accept"` + comma splice after title per operator-approved template).

**Deploy sequence executed:**
1. Merged PR-5, auto-deployed via Render
2. Merged Bundle PR, auto-deployed
3. Merged PR-4, auto-deployed
4. `flex-cli process push --process default-booking -m sherbrt` → `Version 5 successfully saved`
5. `flex-cli process list` → confirmed v5 exists, alias still v4
6. `flex-cli process update-alias --alias release-1 --process default-booking --version 5 -m sherbrt`
7. `flex-cli process list` → alias now v5 ✓

**Scope doc:** `docs/10.0_shippo_anchored_shipby.md` — full architecture + policy decisions (14 locked) + atomic PR breakdown. v3.1 was the final version shipped after 3 CC pre-implementation review rounds (round 1 caught 2 blockers including the processVersion gate issue, round 2 caught 3 pseudocode bugs including a TypeError on every computeShipByDate call, round 3 signed off ✅ READY TO IMPLEMENT).

**Tests added:** ~78 new assertions across 11 new test files (PR-5: 5, Bundle PR-1: 21, Bundle PR-2: 21, Bundle follow-up ® fix: 8, PR-4: 22 including 2 for the MISSED_FINAL dedupe). Full server sweep: 198 total, 186 pass, 12 pre-existing failures in `shipping-estimates.test.js` / `shippingLink.spec.js` unchanged (pre-date this work, confirmed unrelated via git stash comparison).

**New architectural guarantees post-10.0:**
- Borrower checkout cost = actual label cost, always. No silent deltas absorbed by Sherbrt. Zero cost-mismatch class.
- Ship-by date persisted once at label purchase, read by all downstream consumers. No more env-var drift between web service and crons (which caused the April 23 3.1b miss).
- Short-lead cross-country bookings correctly land on expedited services (UPS 2nd Day Air, UPS Next Day Air Saver) instead of silently picking cheapest-of-all with a transit time that wouldn't arrive before booking start.
- Return shipping decoupled from outbound's deadline; always picks cheapest preferred service.
- Lenders have 24h (not 6 days) to respond. Two SMS escalations (60m gentle, 22h final warning with quiet-hours bypass). MISSED_FINAL watchdog measures any silent misses.
- Auto-cancel has 12h scan-lag grace so a lender who dropped the package at 11:50pm PT doesn't get prematurely cancelled when USPS doesn't scan until 6am next morning.
- Auto-cancel version gate uses `>= 3` instead of `=== 3`, so v5 and future process.edn bumps don't silently disable the feature.

**Pre-merge operator checks completed during rollout:**
- Shippo service-name format probe (LA→NYC test rate-fetch) confirmed 4/6 preferredServices strings match exactly and 2/6 needed the `®` fix (applied via follow-up commit `dbf6f83fd` with `.replace(/[®™]/g, '')` in the `nameOf` helper).
- Shippo Dashboard → Carriers confirmed UPS + USPS active with required services.

**Pending post-merge items to revisit** (not blocking, tracked here for next session):
1. Review Sharetribe Console → Content → Email templates → `booking-expired-request` for stale "6 days" / "within a week" language. Update to "24 hours" or make generic. Pre-merge operator checklist item from the scope doc; not yet verified.
2. Mid-window reminder SMS for long-lead bookings (between accept and 24h-before-ship) — add to `sherbrt_transaction_comms_v11.xlsx` future comms tab in a dedicated follow-up session with operator.
3. Critical-path monitoring/alerting session — build operator email/SMS notifications for Shippo outages, cron failure states, Render service health. Separate from 10.0 scope.
4. Listing-search validation — prevent showing listings to borrowers when the zip-pair + booking-start combination is infeasible even with expedited service. Deferred from 10.0.
5. Re-compute `outbound.shipByDate` on zip change post-accept — deferred edge case from 10.0.

**Data structure additions:** `outbound.lockedRate` and `return.lockedRate` (both `{rateObjectId, estimatedDays, amountCents, provider, servicelevel}`). `outbound.shipByDate` is now the authoritative read path for all consumers — the shared `computeShipByDate` in `lib/shipping.js` prefers this value and logs `[ship-by:persisted]` when used; falls back to compute-from-rate (logs `[ship-by:computed] mode=shippo-anchored`) or compute-from-fallback (logs `[ship-by:computed] mode=static-fallback`) only when persisted value is absent.

**Env var additions:** `SHIP_SAFETY_BUFFER` (default `1`). `SHIP_LEAD_DAYS` retained as fallback floor only.

### SHIP_LEAD_DAYS env drift on Lender Shipping Reminders cron — root cause for missing 3.1b SMS (April 23, 2026)

**Symptom surfaced during Scenario 1 QA:** Lender Monica D accepted a booking at 8:26 PM PT on Apr 21 for an Apr 23 start. The 3-SMS correctly fired at accept with "Ship by Apr 22." The 3.1b end-of-day unshipped reminder (expected Apr 22 3-5 PM PT window) never fired, even though the lender didn't ship. Cron summary showed `EndOfDay=0, Processed=65` across all hourly ticks.

**Root cause (concrete):** `SHIP_LEAD_DAYS=1` set on `shop-on-sherbet` web service, but NOT set on the `Lender Shipping Reminders` cron — the cron fell back to the code default of `2` in `server/lib/shipping.js:24`. Web service computed ship-by = Apr 23 − 1 = **Apr 22** (what the 3-SMS told the lender). Cron independently recomputed ship-by = Apr 23 − 2 = **Apr 21**. At each Apr 22 cron tick, `isShipByDay` at `sendShippingReminders.js:463` compared cron's Apr 21 against today's Apr 22 → false → skipped the EOD branch. The `[ship-by:static] { chosenLeadDays: 2 }` log line (printed 65x per run, once per accepted tx) is the literal smoking gun.

**Mechanism — `computeShipByDate` never reads persisted values:** Even though `transition-privileged.js:976` already persists `outbound.shipByDate` to protectedData at label purchase, the function at `shipping.js:149-211` always recomputes from scratch using whatever `SHIP_LEAD_DAYS` each service has. Services drift silently.

**Fix class:** Same category as the April 21 Overdue cron F1/F2/F4 config drift — Render env vars and cron schedules are PER-SERVICE, and `render.yaml` is documentation-only on this project.

**Immediate mitigation:** Skipped the config-only `SHIP_LEAD_DAYS=1` patch on the cron in favor of the structural fix — Shippo-anchored shipByDate persisted at label purchase, read by all consumers via `computeShipByDate` in the shared lib (no more per-cron recomputation with per-cron env vars).

**Structural fix: ✅ SHIPPED same day.** See the "10.0 — Shippo-Anchored Ship-By + 24h Lender Expire + Acceptance Hardening (April 23, 2026)" entry above for full shipped-state details. All 5 atomic PRs merged, process.edn v5 alias live, `protectedData.outbound.shipByDate` is now authoritative source-of-truth read first by every downstream consumer. The env-drift class of bug cannot recur via this code path — `computeShipByDate` reads the persisted value and only falls back to a fresh compute when the persisted value is absent (Shippo outage or pre-10.0 tx). Per-service `SHIP_LEAD_DAYS` drift is demoted from "breaks SMS flow" to "last-resort fallback that only matters during Shippo outages."

**All current prod transactions at time of rollout were operator/QA tests** (amalia running as both borrower and lender across listings). Safe to roll out the Shippo-anchored rewrite without impacting real marketplace activity.

### Overdue cron Render config drift — post-9.2 validation (April 21, 2026)

Three Render dashboard config issues surfaced while validating the 9.2 PR on the **Overdue / Late-Fee Reminders & Charges** cron. All were config-only (no code change, no deploy).

**F1 — SendGrid key missing on cron service.** `SENDGRID_API_KEY` was set on the main `shop-on-sherbet` web service but never propagated to the overdue cron. `emailClient.js` init logged `hasKey: false` → day-6 ops alert (9.6-Email) and daily digest (9.7-Email) had NEVER fired in production despite being marked "Verified" in the Log tab. **Fix:** copied `SENDGRID_API_KEY` from web-service env vars to cron env vars via Render → Environment tab. No deploy needed.

**F2 — Schedule drift.** PR-3a updated the code's run-time assumption to 17:00 UTC but didn't touch the Render cron schedule, which stayed at 09:00 UTC. The cron ran, just 8 hours earlier than `withinSendWindow()` and the quiet-hours gate assumed. **Fix:** changed Render cron schedule to `0 17 * * *` (17:00 UTC = 10 AM PT).

**F4 — `EMAIL_FROM_ADDRESS` missing on cron service.** `emailClient.js:37` gates on `SENDGRID_API_KEY && EMAIL_FROM_ADDRESS` — both must be set. Only the API key was added in F1, so emails were still being silently skipped. **Fix:** added `EMAIL_FROM_ADDRESS='Sherbrt <notifications@sherbrt.com>'` (same value as web service). Post-fix cron runs show `from: 'Sherbrt <notifications@sherbrt.com>'`.

**Lesson:** Render env vars and cron schedules are PER-SERVICE. When a code change updates an assumed schedule or introduces a new env-var dependency, the corresponding Render dashboard config must be updated on every worker/cron that runs that code, not just the main web service. Easy to miss since `render.yaml` is documentation-only on this project.

**Overdue pipeline is fully operational as of April 21 post-9.2.1** — SendGrid key present, from-address set, clean process exit, correct schedule. Trigger-runs complete with "Successful run" status; emails will land at `amalyb@gmail.com` (the `OPS_ALERT_EMAIL` default) once real overdue data exists. **Log tab "Verified" status on 9.6-Email + 9.7-Email was technically incorrect before today and should be re-verified through Scenario 5 of the live QA plan.**

### 9.2.1 — overdue cron clean exit (April 21, 2026)

**Shipped commit:** `9b764e1` (PR #54), squash-merged on top of `bb51f1f`.

**File:** `server/scripts/sendOverdueReminders.js:936-938` (the no-flag `else` branch of the `require.main === module` block).

**Current behavior before fix:** Script called `sendOverdueReminders()` without `await` and without an explicit `process.exit()`. Async work completed correctly (candidates processed, SMS fired when applicable, summary printed), but ioredis + Sharetribe SDK keep-alive connections held the event loop open. Render's cron timeout force-killed the process minutes later. Every daily run was marked "Failed" in Render's event feed despite work completing. Symptom: daily "cronjob failed" Render notification emails to the operator; false-failure signal that would have masked real failures during Scenario 5.

**Fix:** Wrapped the call in `.then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); })`, matching the entry-point pattern used by `sendAutoCancelUnshipped.js --once`.

**Verification:** Post-deploy trigger-run completes in <60 seconds with "Successful run" in Render's event feed. stdout ends with `✅ Overdue reminders script complete, exiting.` — no more `[redis] connect / [redis] ready` reconnect loops between the summary block and the cron timeout.

**Out of scope (not touched):** `--daemon` branch (intentional long-running with internal `setInterval`), `--test` branch, function body of `sendOverdueReminders()`. The other crons (`sendAutoCancelUnshipped --once`, `sendShippingReminders`, `sendLenderRequestReminders`) already exit cleanly; no pattern sweep needed.

### 9.2 pre-QA fixes — eliminate silent-failure paths (April 21, 2026)

**Shipped commit:** `bb51f1f` (PR #53) — squash-merge containing 7 atomic commits (B1 / B2 / B3 / H1 / H2 / H3 + a test-relocation housekeeping commit for `npm run test-server` glob compatibility).

Pre-QA code review on April 21 identified 3 BLOCKERS + 2 HIGH + 1 follow-on silent-failure bug in the transaction-comms pipeline. All fixed in one PR before the live-data QA plan (see `sherbrt_transaction_comms_v10.xlsx` → "Test Scenarios" tab) could run Scenarios 4 and 5.

**B1 — `OVERDUE_FEES_CHARGING_ENABLED` undefined (`sendOverdueReminders.js:590`):** The identifier was used inside the `overdue.charge.skip` JSON-log event but never imported or declared in the file (only `applyCharges` was destructured from `lateFees.js`; the const is not exported). Every skip-path log emit threw `ReferenceError`, caught as `overdue.charge.error`, bumped `chargesFailed++`. Pre-fix dry-run logs showed every skipped tx as a charge failure, defeating PR-4 analysis. **Fix:** read from `process.env.OVERDUE_FEES_CHARGING_ENABLED === 'true'`, mirroring the pattern at line 213.

**B2 — Orphan `transition/store-shipping-urls` (`shippoTracking.js:1346,1353`, `resendDeliverySms.js:128`):** This transition does NOT exist in any version of `process.edn`. Calls 400'd with `unknown-transition`, caught-and-logged ("Failed to update transaction protectedData"), no `protectedData` ever landed. Cascade: (1) `outbound.firstScanAt` never set → `hasOutboundScan()` returned `false` for every shipped tx → `sendAutoCancelUnshipped` would have cancelled shipped bookings once `AUTO_CANCEL_DRY_RUN=0`, issuing refunds to borrowers holding items and leaving lenders out of pocket; (2) `shippingNotification.delivered.sent` never set → webhook retries re-sent the delivery SMS (6-SMS); (3) `sendShippingReminders.isOutboundScanned()` returned `false` → 24h/EOD ship-by reminders still fired for shipped items. **This is the single biggest reason `AUTO_CANCEL_DRY_RUN=1` has stayed on so long — the "would-cancel" dry-run logs have been full of false positives for every shipped booking, making it impossible to judge readiness to flip.** **Fix:** replaced all three call sites with `upsertProtectedData(txId, {...}, {source: 'webhook'})`. Deep-merge shape mirrors existing working calls at `shippoTracking.js:901` (return first-scan) and `:1102` (return delivered).

**B3 — 48h double-cancel path (`sendShippingReminders.js:237-241`):** `transition/cancel` block overlapped with `sendAutoCancelUnshipped`. Two cancel paths. The 48h legacy path sent NO SMS to the borrower — borrower got silently refunded. Because of B2, `isOutboundScanned()` always returned `false`, so even lenders who DID ship hit the 48h cancel if they were slow to scan. Any recent silent-refund-no-SMS prod behavior traces to this. **Fix:** deleted the 48h block + `cancelTransaction` helper entirely. `sendAutoCancelUnshipped.js` is now the sole cancel authority. Module-level comment added to prevent re-introduction: "Cancel policy for unshipped bookings lives in `sendAutoCancelUnshipped.js`. This script only sends ship-by reminders (24h, EOD); it does NOT cancel."

**H1 — Quiet-hours gate below Redis lock (`sendReturnReminders.js:621-642`):** `acquireRedisLock(perTxLockKey, 60*60*24)` ran at :621 BEFORE `if (!withinSendWindow()) continue` at :639. A quiet-hours tick (e.g. 7:45 AM PT) claimed the 24h lock, then saw it was too early and skipped. Subsequent ticks that day hit "lock held" and also skipped — the borrower lost their T-1/TODAY reminder entirely. The Pattern A claim in PR-3b ("15-min poll retries naturally in the send window") was silently broken. **Fix:** moved `withinSendWindow(getNow())` above `acquireRedisLock`, with `continue` log tag `[RETURN] SKIP quiet-hours tx=...` for observability.

**H2 — Third instance of `sdk.transactions.update` silent-fail (`sendReturnReminders.js:189`):** Same pattern as the April `sendLenderRequestReminders` and `sendShippingReminders` fixes. Integration SDK doesn't expose `txApi.update` / `updateMetadata` / `updateProtectedData` for transactions — writes threw, caught at :678/:702/:739, logged as "Failed to mark...as sent." Per-day Redis lock covered single-send-per-day, but `tMinus1SentAt`, `todayReminderSentAt`, `tomorrowReminderSentAt`, `returnSms.dueTodayLastSentLocalDate` never persisted + noisy error logs on every cron tick. **Fix:** replaced the `updateTransactionProtectedData` helper with `upsertProtectedData(txId, {returnSms:{...}}, {source:'return-reminders'})`. Helper deleted.

**H3 — Fourth instance (legacy `sendShipByReminders.js:257`, since deleted):** Same pattern, surfaced during the H2 fix. Fixed as a same-PR follow-on. **Post-fix sweep:** `grep -rE "sdk\.transactions\.update\s*\(" server/` returns zero active call sites. The pattern class is now fully retired across `server/**`.

**Deviation from original fix plan:** B2 required extending `ALLOWED_PROTECTED_DATA_KEYS` in `server/api-util/integrationSdk.js` to include `shippingNotification`, `lastTrackingStatus`, and `returnSms`. Without this, `upsertProtectedData` would silently drop those keys — the exact silent-failure symptom the fix resolves. `outbound` and `return` were already on the whitelist. **Lesson:** when introducing a new `protectedData` key path via `upsertProtectedData`, always verify the top-level key is on the allow-list first.

**Tests added:** 16 new regression-test assertions across 5 files: B1 (3), B2 (3 — first-scan persistence, webhook-retry idempotency, delivered persistence), H1 (3 — quiet-hours structural + lock-state), H2 (5 — 3 structural + 2 persistence), H3 (3 persistence). All pass. Pre-existing failures in `shipping-estimates.test.js` + frontend (12 total) unchanged from main baseline.

**Orphan-transition sweep clean:** `grep -r "transition/" server/ --include="*.js"` cross-referenced against `process.edn` v4 — every referenced transition exists in the live process, or is marked as a vestigial TODO with an explanatory comment. The `transition/privileged-set-overdue-notified{,-delivered}` TODO flagged in PR-2 was resolved during the PR-3a Redis migration (calls removed); no longer an orphan.

**Residual risk captured at review time (cosmetic only):** `server/test-flex-transition.js` still references `transition/store-shipping-urls`. It's a diagnostic probe script whose whole job is to check whether transitions exist — after B2 it will correctly report "no." Will retire in a future cleanup PR.

### 9.0 PR-2 — privileged late-fee transitions live + policy-skip symmetry (April 15, 2026)

**Shipped commit:** `a1d808579` on main. Process pushed as v4; alias `default-booking/release-1` flipped from v3 to v4 via `flex-cli process update-alias`.

**Process changes (`ext/transaction-processes/default-booking/process.edn`):**
- Added `transition/privileged-apply-late-fees` — `:from :state/delivered :to :state/delivered`, scoped to Scenario A (borrower shipped, scan arrived after due date).
- Added `transition/privileged-apply-late-fees-non-return` — `:from :state/accepted :to :state/accepted`, scoped to Scenario B (no scan, borrower never shipped).
- Both use a single `stripe-create-payment-intent` action with `:config {:use-customer-default-payment-method? true}` — this is the off-session shape (auto-confirms against the saved payment method, no separate confirm action, no customer interaction). Earlier draft had a separate `stripe-confirm-payment-intent` action which is the on-session shape and would have failed under Integration-SDK invocation — caught by CC review before push.
- Both actor `:actor.role/operator`, both `:privileged? true`.

**Code changes (`server/lib/lateFees.js`):**
- `MIN_PROCESS_VERSION_FOR_LATE_FEES` bumped from 3 → 4 to match the new live version.
- Scenario B branch narrowed from `(accepted || delivered) && !hasScan` to `accepted && !hasScan`. The `delivered && !hasScan` case now gets its own explicit policy-skip branch returning `{ charged: false, reason: 'delivered-without-scan' }` at WARN log level. Policy: once a tx reaches `:state/delivered`, the item is considered returned; late fees stop regardless of scan data. Covers missed webhooks, operator moves, and future non-scan return paths (e.g. hand-courier delivery).
- Added explicit `accepted && hasScan` policy-skip returning `{ charged: false, reason: 'borrower-shipped-in-transit' }`. Normal multi-day transit window — borrower shipped, carrier scanned, but `complete-return` hasn't fired yet. Log includes raw ISO `firstScanAt` (not just YMD) so future staleness investigations can grep for scans older than N days.
- Removed vestigial `'ctx/new-line-items': newLineItems` key from the `sdk.transactions.transition()` params — only `lineItems` is consumed by `:action/privileged-set-line-items`.

**SMS copy/gate changes (`server/scripts/sendOverdueReminders.js`):**
- Symmetric narrowing of SMS Scenario B gate: now `accepted && !hasScan` only. Pre-PR-2 code included `delivered` here too, which meant a tx in the `delivered-without-scan` skip state on the charging side was still getting day-1 through day-6 SMS ("ship today to avoid replacement charges") telling the borrower to do something the system has decided is done. Fixed.
- Added two explicit policy-skip branches mirroring `lateFees.js`: `delivered && !hasScan` → WARN-level `[OVERDUE] SKIP tx=... reason=delivered-without-scan`, and `accepted && hasScan` → INFO-level `[OVERDUE] SKIP tx=... reason=borrower-shipped-in-transit firstScanAt=...`. Both `continue` without SMS or shouldProcess. Remaining `else` branch is now genuinely "unexpected state" (e.g. `preauthorized`, `cancelled`).
- Removed dead `isDeliveredWithoutScan` local and its two unreachable log-branches.
- Added TODO comment flagging that `transition/privileged-set-overdue-notified{,-delivered}` (called ~line 703 to persist `lastNotifiedDay` to Flex) don't exist in any process.edn variant — every SMS send silently fails this transition, dedupe falls back to in-memory `runNotificationGuard`, and a cron restart mid-run can re-send the same day's SMS. **Resolved in PR-3a Redis migration — the calls were removed when `overdueNotified:*` Redis dedupe replaced the protectedData-based flag. No longer an orphan.**

**Test regression update (`server/scripts/scenarioTests/deliveredWithoutScan.js`):**
- Docstring rewritten to describe the post-PR-2 policy.
- Assertion changed from `lateResult.scenario === 'non-return'` to `lateResult.charged === false && lateResult.reason === 'delivered-without-scan'`.
- Day-5 replacement block left as unreachable guard with a comment explaining why (if policy ever changes to resume charging in this state, the invariant re-activates automatically rather than silently dropped).

**SMS ↔ code alignment verified for Scenario B (never returned):** Day 1 "$15/day charging" SMS + $15 charge, Days 2-4 escalating SMS + $15/day, Day 5 hedged "may be charged replacement" + $15 daily continues (auto-replacement intentionally off via `AUTO_REPLACEMENT_ENABLED=false`), Day 6 committed "replacement will be charged" + $15 daily (manual replacement action by operator), Day 7+ hard stop (no SMS, no charge). Scenario A (returned late) gets charged but no SMS — correct, no reason to chase a returned item.

**Flag status unchanged:** `OVERDUE_FEES_CHARGING_ENABLED` still defaults `false`. No charges will land in Stripe until the flag is flipped in Render (PR-6). PR-2 is purely "the charging path now has real transitions behind it and the skip-reasons are symmetric between cron and lib."

**PR-3 backlog (queued during PR-2 review, now fully scoped in `docs/9.0_pr3_operational_cleanup.md`):**
All items below have been resolved in the PR-3 scope doc (committed `70399793a`). See the "Remaining pending work" section for current status.
- ✅ SMS dedupe: migrated to Redis (`overdueNotified:*` keys) — chose Redis over adding transitions to process.edn (matches shipping/lender pattern, avoids v5 push).
- ✅ Scenario A charging fix: eliminated lump-sum entirely. Unified daily $15 model, `hasScan` stops charging. Dead Scenario A branch to be deleted.
- ✅ Day-6 email alert: fire-and-forget with `.catch()` (hard requirement), `DRY_RUN` respected.
- ✅ Daily digest email: in-cron collection with `charged` / `day6_hard_stop` / `skipped_*` buckets.
- ✅ Comment cleanup: PR-3c sub-PR.
- ✅ Additional items from CC reviews: `daysLate <= 1` scan-lag-grace guard, `'daily-overdue'` scenario value, vestigial transition documented, lenderRequest quiet-hours = Pattern B (delay to 8 AM), day 6 copy softened to "may be charged", `withinSendWindow()` testability via `FORCE_NOW`/`getNow()`.

**Deploy steps performed (for reference on future transition pushes):**
1. `flex-cli process push --process default-booking --path ext/transaction-processes/default-booking -m sherbrt` → `Version 4 successfully saved`
2. `flex-cli process list --process default-booking -m sherbrt` → confirmed v4 created, alias still on v3
3. `flex-cli process update-alias --alias release-1 --process default-booking --version 4 -m sherbrt` → alias moved
4. Re-ran `flex-cli process list` → v4 now shows `default-booking/release-1`
5. `git push origin main` → `b1cf60b8d..a1d808579`
6. Verified in Sharetribe Console → Build → Advanced → Transaction processes → default-booking → v4 marked `release-1`

### Steps 7/8/10/11 — Return-flow SMS copy refresh + 9.0/9.1 late-fee scoping (April 15, 2026)

Three shipped commits and two new scope docs. All work on return-side reminders and the late-fee charging pipeline.

**Steps 7/8/10/11 — SMS copy (commit `87d671812`)** — `server/scripts/sendReturnReminders.js` + `server/webhooks/shippoTracking.js`:
- Interpolated `${itemTitle}` into T-1, TODAY (borrower), first-scan (lender), and delivered (lender) messages. Title resolved from `included` Map via `listing.attributes.title` with `'your item'` fallback.
- Collapsed the return-label lookup to the two canonical fields everywhere: `const returnLabelUrl = pd.returnQrUrl || pd.returnLabelUrl;` — any other shape (nested `.url`, `returnQR`, etc.) is dead code now.
- **NEW Step 11**: delivered-to-lender SMS on return shipment delivery. Added a branch in `shippoTracking.js` after the `isFirstScan` block, before the `!isReturnTracking` guard. Idempotent via `protectedData.return.deliveredNotificationSentAt`. Copy: `📦 Sherbrt 🍧: "${listingTitle}" is back home! Thanks for sharing your style! 🫶🏽 Just in case: bestie@sherbrt.com 💌`. Tag `SMS_TAGS.RETURN_DELIVERED_TO_LENDER`.

**Doc split — `docs/9.0_late_fee_charging.md` + `docs/9.1_overdue_copy_refactor.md` (commit `1d44bcec4`)** — replaces earlier combined `9.x_overdue_scope.md`:
- 9.0 is P0 (revenue-critical): the privileged `transition/privileged-apply-late-fees` and `transition/privileged-apply-late-fees-non-return` referenced by `server/lib/lateFees.js:218,234` **do not exist** in the live `default-booking/process.edn` — they're only in `default-booking_backup_before_pull/process.edn`. Every overdue cron tick throws `unknown-transition` at the SDK layer; borrowers see `$15/day is being charged` SMS but `chargeHistory` in `protectedData.return` is empty across all prod txs. Zero fees have ever landed in Stripe via this path.
- 9.0 ships as 6 atomic PRs with explicit ordering: **flag + gates first (PR-1)**, transitions second (PR-2), operational cleanup (PR-3a/b/c), staging dry-run (PR-4), structured logging (PR-5), then flip `OVERDUE_FEES_CHARGING_ENABLED=true` in Render (PR-6). Transitions-first was the original plan and would have big-banged every overdue tx at the next cron tick; reordered after CC review.
- 9.1 is the Day 1–6 copy refactor into a new `server/scripts/messages/overdueMessages.js` module (pure function per day + `buildOverdueMessage(daysLate, ctx)` helper). Day 1–6 copy rewritten with `${itemTitle}`, `${shortUrl}`, consistent Sherbrt preamble, and `bestie@sherbrt.com` help line on Days 1/4/5/6. **Hard prereq on 9.0** because Day 1 copy asserts `$15/day late fee now applies` — can't ship that claim until fees actually land in Stripe.

**PR-1 — defensive gates in `server/lib/lateFees.js` (commit `b1cf60b8d`)**:
- Added four top-of-file constants: `LATE_FEE_CENTS` (with `LATE_FEE_CENTS_OVERRIDE` env hook for $0.50 staging dry-run), `OVERDUE_FEES_CHARGING_ENABLED` (defaults `false`), `MIN_PROCESS_VERSION_FOR_LATE_FEES = 3`, `MAX_CHARGEABLE_DAYS = 6`.
- Gate 1 (processVersion floor): returns `{ charged: false, reason: 'processVersion-too-old' }` for anything < v3.
- Gate 2 (day-6 cap): returns `{ charged: false, reason: 'exceeded-max-chargeable-days' }` past Day 6 — defense-in-depth alongside the cron's own Day 7+ hard-stop.
- Gate 3 (feature flag): short-circuits **immediately before** `sdkInstance.transactions.transition(...)` with `{ charged: false, reason: 'feature-flag-disabled', wouldCharge: [...] }`. Crucially, this short-circuits before the SDK call, so the missing-transition error is never triggered — next cron pass logs clean `feature-flag-disabled` with the `wouldCharge` line items instead of `unknown-transition`.
- Safe to deploy anytime because the flag is off by default; transitions can still be missing and nothing breaks.

**Gotchas captured in scope docs:**
- `shortLink()` stores in Redis with a 21-day TTL (`SHORTLINK_TTL_DAYS`, `server/lib/env.js:83`) and mints a new token every cron pass, so the short link itself never expires inside the 6-day overdue window. The real expiration risk is the **underlying Shippo URL** the short link wraps — USPS QR return codes (`pd.returnQrUrl`) ~180 days, Shippo PDF labels (`pd.returnLabelUrl`) ~30 days. Optional HEAD-check mitigation deferred.
- There is no Slack webhook integration in this codebase. PR-5's structured logging is stdout JSON parsed by Render's log drain; any Slack/email alerting is a separate follow-up.
- `AUTO_REPLACEMENT_ENABLED` stays `false`. Day 7+ hard-stopped in both the cron and `applyCharges()`.

**9.0 PR status (as of April 21, 2026):**
- PR-1 ✅ shipped (commit `b1cf60b8d`). Defensive gates in `lateFees.js`: feature flag, processVersion floor, LATE_FEE_CENTS_OVERRIDE env hook.
- PR-2 ✅ shipped April 15, 2026 (commit `a1d808579`, process v4 live). See the "9.0 PR-2" section above for full details.
- PR-3a ✅ shipped April 16, 2026 (commits `ace2e68a0` + `bdcff51c0`). Charging-path correctness: Redis SMS dedupe migration (`overdueNotified:*` keys), unified daily $15 charging with `hasScan` stop-check, scan-lag-grace guard (`daysLate <= 1`), count-based $75 cap (5 charges, `code === 'late-fee'`), cron time to 17:00 UTC, `diagnose-overdue.js` Redis migration, URL guard for return label, 5 new scenario tests. CC reviewed + signed off on blocker fixes.
- PR-3b ✅ shipped April 16, 2026 (commit `be50062b8`). Operational emails + SMS quiet-hours:
  - §3b.1: Day-6 fire-and-forget operator email alert via SendGrid (`.catch()` wrapper, `DRY_RUN` respected, rides SMS Redis dedupe). Recipient: `OPS_ALERT_EMAIL` env var (defaults `amalyb@gmail.com`).
  - §3b.2: Daily late-fee digest email (`sendLateFeeDigest` helper). Model B buckets: `charged` + `skipped_*` only (no `day6_hard_stop`). Sent after for-loop, gated by `!DRY_RUN`.
  - §3b.3: `withinSendWindow()` in `server/util/time.js` (8 AM – 11 PM PT, respects `getNow()`/`FORCE_NOW`). Pattern A gates on `sendReturnReminders.js` (1 gate) and `sendShippingReminders.js` (3 gates: 24h/eod/cancel). Pattern B gate on `sendLenderRequestReminders.js` (MAX_AGE_MS widened from 80 min → 13h, `withinSendWindow(getNow())` before markInFlight).
  - CC reviewed + signed off. Cleanup fixes applied: duplicate const removal (N1), JSDoc example fix (N2), stale comment update (N5).
- PR-3c ✅ shipped April 16, 2026 (commit `e59de3c42`). Comment cleanup in `lateFees.js`: updated AUTO_REPLACEMENT_ENABLED, isScanned(), getReplacementValue() docstrings, removed stale "Scenario B" label. Comment-only diff.
- PR-4: staging dry-run — operational step (no code change). Set `OVERDUE_FEES_CHARGING_ENABLED=true` + `LATE_FEE_CENTS_OVERRIDE=50` in Render, verify $0.50 charge in Stripe + `chargeHistory` advances. Requires an overdue test transaction. **Unblocked as of April 21 2026 after 9.2 + 9.2.1 + config drift fixes** — will run as Scenario 5 of the live QA plan (see `sherbrt_transaction_comms_v10.xlsx` → "Test Scenarios" tab).
- PR-5 ✅ shipped April 16, 2026. Structured JSON logging in `sendOverdueReminders.js` charge path: `overdue.charge`, `overdue.charge.skip`, `overdue.charge.error`, `overdue.charge.dryrun` events. Render log drain can filter on `event` field.
- PR-6: flip `OVERDUE_FEES_CHARGING_ENABLED=true` (remove `LATE_FEE_CENTS_OVERRIDE`) in Render console. Final step after PR-4 / Scenario 5 confirms pipeline works end-to-end.
- 9.1 copy refactor (blocked on 9.0 completing). Day-1 copy softened to "may apply" (scan-lag rule means we can't confirm lateness on day 1). Days 4-5 tightened ("$15/day late fee continues"). Day-6 softened to "may be charged" (not "will be charged" — matches days 4-5 framing, legally safer since replacement is operator-discretionary). Message-map JS updated to match. See `docs/9.1_overdue_copy_refactor.md` (committed `70399793a`).
- **9.2 pre-QA fixes ✅ shipped April 21, 2026 (commit `bb51f1f`, PR #53).** Eliminated 3 BLOCKERS + 2 HIGH + 1 follow-on silent-failure bugs found during pre-QA code review: B1 (undefined env var in overdue skip-path log), B2 (orphan `transition/store-shipping-urls` — the big one, unblocks `AUTO_CANCEL_DRY_RUN=0`), B3 (48h double-cancel path deleted), H1 (quiet-hours gate reordered above Redis lock in return reminders), H2 + H3 (retired `sdk.transactions.update` pattern across return + ship-by reminders — all four instances of this class now fixed). 16 new regression tests. Deviation: `ALLOWED_PROTECTED_DATA_KEYS` whitelist extended for B2. See "9.2 pre-QA fixes" section above for details.
- **9.2.1 ✅ shipped April 21, 2026 (commit `9b764e1`, PR #54).** One-line entry-point fix to `sendOverdueReminders.js` — wraps the call in `.then(process.exit(0))` / `.catch(process.exit(1))`. Previously every run was marked "Failed" in Render despite work completing, because open Redis/SDK keep-alives held the event loop until cron timeout. See "9.2.1" section above.
- **Overdue cron Render config drift ✅ resolved April 21, 2026.** Three dashboard config issues (F1: SendGrid key missing on cron service, F2: cron schedule at 09:00 UTC instead of 17:00 UTC, F4: `EMAIL_FROM_ADDRESS` missing) discovered during post-9.2 validation. All config-only fixes. 9.6-Email and 9.7-Email had never actually fired in production prior to these fixes — Log tab "Verified" status should be re-verified through Scenario 5. See "Overdue cron Render config drift" section above.

### Step 3.2 — Auto-Cancel Unshipped Bookings (April 14, 2026)

**Goal:** Auto-cancel accepted bookings that the lender never ships, with a full refund to the borrower and label recovery. Prevents the "lender accepted, item never sent, borrower still charged" scenario.

**Policy (locked in before implementation):**
- Deadline: 11:59:59pm **lender-local** on booking start date (D)
- Monday-start grace: if D is a Monday, deadline shifts to end of Tuesday (D+1) — covers the common "accepted Sunday, couldn't drop off before Monday pickup" case
- Scan detection: cancel only fires if NO outbound carrier scan exists. Three scan signals checked (`hasOutboundScan` helper): `protectedData.shippingNotification.firstScan.sent`, `protectedData.outbound.firstScanAt`, and `protectedData.lastTrackingStatus.status` in `{TRANSIT, IN_TRANSIT, ACCEPTED, OUT_FOR_DELIVERY, DELIVERED}`
- Refund: full — rental + commission + shipping line items (via `:action/calculate-full-refund` + `:action/stripe-refund-payment` in the transition)
- Labels: both outbound and return Shippo labels voided via `POST https://api.goshippo.com/refunds/` (best-effort, non-blocking on failure)
- SMS: 3.2 to borrower, 3.2b to lender (positional `sendSMS(phone, msg, {role, tag, ...})` signature)
- Cadence: hourly (`0 * * * *` cron)
- Idempotency: `protectedData.autoCancel.sent` flag + state-machine guard (`transition/auto-cancel-unshipped` only fires `from :state/accepted`, so even if flag-write fails after a successful transition, the next tick's `state: 'accepted'` query excludes the cancelled tx)
- Lender timezone: resolved via `listing.attributes.availabilityPlan.timezone`. Fallback: `America/Los_Angeles`. **Do not add `'fields.listing'` sparse-field restriction to the query — `availabilityPlan` is not on Sharetribe's sparse-fields whitelist and gets silently dropped, which makes every lender fall back to PT.**

**Files added:**
- `server/scripts/sendAutoCancelUnshipped.js` — cron daemon (supports `--once` for cron and `--daemon` for setInterval). Uses trusted SDK for query, Integration SDK for transition.
- `server/lib/shippo.js` — `voidShippoLabel(shippoTransactionId)` calls `POST /refunds/` with `ShippoToken` auth, body `{transaction, async: false}`. Uses `SHIPPO_API_TOKEN` (same as label creation).

**Files modified:**
- `ext/transaction-processes/default-booking/process.edn` — added `transition/auto-cancel-unshipped` (operator-actor, from `:state/accepted` to `:state/cancelled`, actions: `calculate-full-refund` → `stripe-refund-payment` → `cancel-booking`)
- `server/lib/txData.js` — added `hasOutboundScan(tx)` and `getOutboundFirstScanAt(tx)` helpers
- `server/webhooks/shippoTracking.js` — added canonical `protectedData.outbound.firstScanAt = timestamp()` write alongside existing `shippingNotification.firstScan.sent` write (both land in the first-scan branch). New callers should read via `hasOutboundScan()`; do not read `outbound.firstScanAt` directly unless you also check the other two signals.
- `server/scripts/sendShipByReminders.js` (since deleted) — at the time, replaced latent-bug `if (outbound.firstScanAt)` check (the field was never being written) with `if (hasOutboundScan(tx))`. The old check was always false, which is why the "skip if scanned" gate had been silently broken. File later retired in favor of `sendShippingReminders.js`.
- `render.yaml` — added `auto-cancel-unshipped` worker entry (note: `render.yaml` is not actually synced by Render on this project; the cron was created manually in the Render UI as a **Cron Job**, not a Background Worker. `render.yaml` is documentation only.)

**Deployment steps performed:**
1. `flex-cli process push --process=default-booking --path=ext/transaction-processes/default-booking -m sherbrt` → created v3
2. `flex-cli process update-alias --process=default-booking --alias=release-1 --version=3 -m sherbrt` → v3 is now live
3. Committed + pushed code to main (`f17d91b18`)
4. Created Render Cron Job "Auto-Cancel Unshipped" with `AUTO_CANCEL_DRY_RUN=1`, command `node server/scripts/sendAutoCancelUnshipped.js --once`, schedule `0 * * * *`
5. Dry-run verification: **still in progress** — first run failed with 400 on `exchangeToken()` due to env-var copy issue; fix in progress

**Gotchas learned during this work:**
- `sendSMS` is positional: `sendSMS(to, message, { role, tag, transactionId, transition, meta })`. Passing an object as the first arg silently returns `{skipped: true, reason: 'missing_phone_or_message'}` — no error, no log. **Any future SMS caller needs this exact signature.**
- With the trusted SDK, `tx.booking` does NOT exist. The booking resource is in `included` (Map-shape for trusted SDK, Array-shape for Integration SDK). Use `findIncluded()` helper (in `sendAutoCancelUnshipped.js`) to resolve booking, listing, provider, customer from their relationship refs. The helper handles both shapes.
- Sparse fields: `'fields.listing'` rejects anything not on Sharetribe's whitelist. `availabilityPlan` is NOT on the list. If you need availability data, omit the `fields.listing` line entirely.
- `:privileged? true` is NOT needed on operator-actor transitions (existing `transition/cancel` works without it; our `auto-cancel-unshipped` matches that pattern).
- Review process: this feature went through 3 Claude Code review passes before deploy. Each pass caught real bugs that would have caused silent no-ops or incorrect-timezone behavior in prod. Keep the review prompts in `drafts-3.2-auto-cancel/` (gitignored) for reference on future features.

### Day-booking date display shifted by 1 day on checkout + inbox (April 14, 2026)

**Bug:** Listing page showed booking as "Thu Apr 16 – Sun Apr 19". Checkout page (and inbox row) showed same booking as "Wed Apr 15 – Sat Apr 18" — both dates shifted back 1 day. Reproduced regardless of whether lender + borrower were in the same timezone.

**Root cause:** Sharetribe normalizes `LINE_ITEM_DAY` / `LINE_ITEM_NIGHT` bookings to **UTC-midnight** boundaries (e.g. `2026-04-16T00:00:00.000Z`) regardless of the listing's timezone. Rendering those timestamps in the listing's local timezone (e.g. `America/Los_Angeles`) interprets midnight UTC as 5pm PDT the previous day → off-by-one. The listing page "worked" only because it rendered an *estimated* booking built from raw form Date objects (browser-local midnight = 07:00 UTC for Pacific users), which happens to display correctly in either UTC or the listing tz.

**Fix:** For day/night bookings, force `displayTimeZone = 'Etc/UTC'` inside `LineItemBookingPeriod` — used for both the `BookingPeriod` render and the `subtractTime` inclusive-end adjustment. Sunday-end check switched to `getUTCDay()` for day-based bookings. Same override applied in `InboxPage.js` `bookingData()` + `TimeRange`. Hour bookings keep the listing timezone (they genuinely need local time context).

**Files:** `src/components/OrderBreakdown/LineItemBookingPeriod.js`, `src/containers/InboxPage/InboxPage.js`.

### Sunday end-date return banner (April 14, 2026)

Added a banner that appears in the checkout `OrderBreakdown` when the booking end date falls on a Sunday, telling borrowers carriers don't run Sundays and they won't be charged a late fee as long as they ship Monday.

**Copy:** "Sunday end date: Carriers don't run - ship Monday to avoid a late fee."

**Implementation:**
- Banner rendered inside `LineItemBookingPeriod` gated on `isSundayEndDate && showSundayEndDateNotice`.
- `OrderBreakdown` accepts `showSundayEndDateNotice` prop (defaults `true`) and forwards it.
- `EstimatedCustomerBreakdownMaybe` passes `showSundayEndDateNotice={false}` so the listing-page estimated breakdown does NOT show the banner — it's checkout-only by design (listing page is a browsing context; shipping logistics belong at the commitment moment).
- `BookingDatesForm` had an inline version under the date picker; also removed so it no longer duplicates on the listing page.

**Files:** `LineItemBookingPeriod.js`, `OrderBreakdown.js`, `EstimatedCustomerBreakdownMaybe.js`, `BookingDatesForm.js` (+ `.module.css` for styling).

### Sunday 24h shipping reminder — shift reminder fire to Saturday (April 14, 2026)

**Bug:** The 24h pre-shipBy reminder fired on a Sunday when `shipBy` landed on Monday, even though carriers don't pick up Sundays.

**Fix (Option A — shift the reminder, not shipBy):** Anchor `reminderAt = shipBy - 24h` explicitly. If `reminderAt.getUTCDay() === 0`, subtract another 24h so it fires Saturday. `shipBy` itself is unchanged. In-window check is `nowMs >= reminderAt && nowMs < shipBy`.

Also fixed in the same file:
- **SMS copy:** dropped the ambiguous word "tomorrow" — now `Please ship your item by ${shipByStr}` (a specific date, no relative-time confusion when the reminder fires 48h early due to the Sunday shift).
- **Cancel phase:** moved `markInFlight` + SET `:sent` inside try/catch, matching the 24h/eod phase pattern (prevents stuck `:inFlight` keys if the SMS send throws).

**File:** `server/scripts/sendShippingReminders.js`.

### USPS holidays extended through 2028 (April 14, 2026)

`server/lib/businessDays.js` `USPS_HOLIDAYS` set extended with 22 new entries covering observed 2027 and 2028 federal holidays (weekend holidays shifted to Friday/Monday per USPS policy). Added `USPS_HOLIDAYS_EXPIRES_AT = '2028-12-25'` constant and a 90-day-before-expiry `console.warn` so future maintainers get a heads-up before the calendar runs out. All dates verified via a Node script round-tripping through `isNonChargeableDate`.

**File:** `server/lib/businessDays.js`.

### Shipping Reminders — Redis idempotency + acceptedAt time-of-day anchor (April 14, 2026)

Two bugs in `sendShippingReminders.js` fixed together:

**Bug 1: silent duplicate sends.** All three phases (24h / end-of-day / auto-cancel) called `sdk.transactions.update()` to set `protectedData.shippingReminders.*` flags. Integration SDK doesn't expose `transactions.update` — the write threw, was caught & logged, the SMS had already gone out, so every hourly cron tick in the eligibility window re-sent the same reminder.

**Bug 2: reminders fired at midnight UTC.** Old code did `shipBy.setUTCHours(0, 0, 0, 0)` then checked `hoursUntilShipBy <= 24`, so the 24h SMS fired at whatever tick first hit midnight UTC on the day before shipBy. That lands at ~8pm EDT / 5pm PDT — late/weird hours.

**Bug 3 (also fixed): dead end-of-day window.** `isEndOfShipByDay` returned true only between 23:50–23:59 UTC — a 10-min window that the hourly on-the-hour cron never hit.

**Fixes:**
- Replaced all `sdk.transactions.update` calls with Redis `shippingReminder:{txId}:{phase}:{sent|inFlight}` keys (same pattern as lender request reminders).
- Anchored `shipBy` to `outbound.acceptedAt`'s UTC hour/minute instead of zeroing to midnight. Reminder now fires at the same time-of-day the lender engaged, one day before shipBy. Fallback: 15:00 UTC (11am EDT / 8am PDT) if `acceptedAt` missing.
- Widened end-of-day window to `now.getUTCHours() >= 22` (22:00 UTC onward = 6pm EDT / 3pm PDT). At least two hourly ticks fall inside; Redis `:eod:sent` ensures single-send.

**Commits:** `976228457` (Redis + acceptedAt), `db57ed1cc` (end-of-day widen) on main.

### Lender Request Reminder — Redis idempotency migration (April 14, 2026)

Same `sdk.transactions.update` bug as shipping reminders — writes to `protectedData.lenderRequestReminder` silently failed on Integration SDK. Migrated to Redis-backed idempotency (`lenderReminder:{txId}:{sent|inFlight}`). Same flag-before-send contract, now durable across cron ticks.

Also fixed in the same deploy: `lenderEarnings.js` now handles `goog.math.Long` amount objects (`{low_, high_}`) returned by the Integration SDK's transit layer, in addition to plain numbers and Money instances.

**Commits:** `63a9a192e`, `177731103`, `f348bd2b3` on main.

### Lender Request Reminder — confirm-payment state mismatch (April 2026)

**Bug:** The 60-min lender nudge script queried for transactions with
`lastTransition = request-payment` and checked `state === 'preauthorized'`.
But Stripe auto-fires `confirm-payment` within seconds, so by 60 min the
`lastTransition` is `confirm-payment` (not `request-payment`). Query returned
0 results every time.

**Fix:** Added `transition/confirm-payment` to the API query and the eligible
transitions set. State check now accepts both `pending-payment` and
`preauthorized`.

**Commit:** `6e27ccdc3` on main.

### Ship-by date Sunday adjustment

Ship-by dates falling on Sunday are automatically adjusted to Saturday.
This is handled by the `ship-by:adjust` logic with `reason: 'sunday_to_saturday'`.

## Data Structures (protectedData)

Transaction protectedData stores shipping, SMS, and late fee state:

- `customerName`, `customerPhone`, `customerEmail`
- `customerStreet`, `customerCity`, `customerState`, `customerZip`
- `shippingLabel`, `returnLabel` — Shippo label objects
- `trackingNumber`, `returnTrackingNumber`
- `outbound.acceptedAt` — ISO timestamp set on `transition/accept`. Anchors shipping reminder time-of-day.
- `outbound.firstScanAt` — ISO timestamp of first outbound carrier scan (written by `shippoTracking.js` webhook; use `hasOutboundScan()` helper to read).
- `outbound.shipByDate` — ISO timestamp of ship-by date. **Authoritative source-of-truth as of 10.0 PR-2 (April 23, 2026)** — derived from Shippo's selected rate `estimated_days` + `SAFETY_BUFFER_DAYS`, business-day-subtracted. `computeShipByDate` in `lib/shipping.js` reads this FIRST before any recomputation.
- `outbound.lockedRate` — `{rateObjectId, estimatedDays, amountCents, provider, servicelevel}` persisted at borrower checkout (10.0 PR-2). At lender accept, `transition-privileged.js` purchases this exact `rateObjectId` from Shippo — guarantees borrower preauth cost matches actual label cost.
- `return.lockedRate` — same shape as `outbound.lockedRate`, for the return label. Return shipping always picks cheapest preferred service, no deadline filter.
- `outbound.labelUrl` / `outboundTrackingNumber` — Shippo outbound shipment data
- `returnLabel`, `returnTrackingNumber`, `returnLabelUrl` — Shippo return shipment data
- `lateFee` — Late fee tracking per day
- `autoCancel.sent` / `autoCancel.sentAt` / `autoCancel.reason` — Set by `sendAutoCancelUnshipped.js` after firing `transition/auto-cancel-unshipped`. Idempotency marker (state-machine is the primary guard; this flag is belt-and-suspenders).
- `shippingNotification.firstScan.sent` — Legacy scan-detection flag. Read via `hasOutboundScan()` along with `outbound.firstScanAt` and `lastTrackingStatus.status`.
- `lastTrackingStatus.status` — Latest Shippo tracking status string. `TRANSIT`/`IN_TRANSIT`/`ACCEPTED`/`OUT_FOR_DELIVERY`/`DELIVERED` all count as "package in motion" for `hasOutboundScan()`.

**Not in protectedData anymore** (moved to Redis as of April 14, 2026):
- Lender request reminder flags → `lenderReminder:{txId}:{sent|inFlight}`
- Shipping reminder flags → `shippingReminder:{txId}:{24h|eod|cancel}:{sent|inFlight}`

## Testing

```bash
# Dry-run any worker (no real SMS, no protectedData writes)
npm run test:lender-request-reminders    # or --dry-run --verbose on any script
npm run test:shipping-reminders

# Server tests
npm run test-server

# Frontend
npm run test
```
