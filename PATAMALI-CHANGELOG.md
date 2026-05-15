# Patamali Changelog

All notable changes to the Patamali customisation layer are documented here.
The existing `CHANGELOG.md` tracks upstream Sharetribe template changes — this
file tracks Patamali-specific work only.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [2026-05-08] — Availability Calendar Blocking Fixes

### Fixed
- **`areConsecutiveTimeSlots` timezone mismatch** — month-boundary time slots were not being
  recognised as consecutive because the UTC timestamps at adjacent slot boundaries can differ
  by up to an hour (Africa/Nairobi is UTC+3, no DST, but the API returns slightly different
  boundary times across separate fetches). Fixed by comparing at day-level in the listing's
  timezone using `getStartOf(..., 'day', timeZone)` instead of raw UTC milliseconds.
- **Dec 1 falsely available after both dates are set** — `isDayBlockedFn` was using the
  permissive `hasAvailabilityOrCheckoutOnDay` check (which allows the exclusive-end boundary
  day) even when both `startDate` and `endDate` were already filled. The boundary day (e.g.
  Dec 1 for a Nov 30 end) therefore appeared unblocked in the review state. Fixed by
  switching to the strict `hasAvailabilityOnDay` check when `endDate` is present.
- **August blocked after checkout back-navigation** — the `monthlyTimeSlots` Redux map is
  populated as async API calls complete, so months can be inserted in non-chronological order
  (e.g. Sep before Aug). `findIndexOfLastConsecutiveTimeSlot` only scans forward through the
  array, so an out-of-order slot caused the consecutive-block scan to stop prematurely,
  blocking valid end dates. Fixed by sorting all time slots chronologically in
  `getAllTimeSlots` before passing them to `removeUnnecessaryBoundaries`.
- **Calendar blocked when start-date month fetch is in-flight** — when the user picks a new
  start date immediately after back-navigating from checkout, that month's slots may not yet
  be in Redux. `combineConsecutiveTimeSlots` would return an empty array, causing all other
  months to appear blocked. Fixed with a fallback to `allTimeSlots` when the combined result
  is empty, so already-fetched months remain visible until the in-flight fetch completes.

### Changed
- `getAllTimeSlots`, `combineConsecutiveTimeSlots`, and `isDayBlockedFn` exported from
  `BookingDatesForm.js` to make them unit-testable.

### Tests
- 14 new tests added to `BookingDatesForm.test.js` (29 total, all passing):
  - `getAllTimeSlots` — chronological sort, boundary merging, in-flight month skip
  - `combineConsecutiveTimeSlots` — timezone-offset boundary merge, gap detection, out-of-order month regression
  - `isDayBlockedFn` — exclusive-end boundary awareness in both review and end-date-picking states
  - Checkout back-navigation end-to-end — Aug 2 unblocked after picking Jul 1 (all months fetched, and Jul in-flight fallback); Dec 1 blocked after returning from checkout with both dates pre-filled

---

## [2026-05-04] — Host Requirements & T&C Enforcement

### Added
- **Scroll-to-accept Terms and Conditions on signup** — clicking the T&C
  checkbox opens a modal; user must scroll to the bottom to unlock the accept
  checkbox; unchecking the form checkbox reopens the modal and requires
  re-reading.
- **Scroll-to-accept T&C before publishing a listing** — hosts must read and
  accept T&C before the Publish listing button activates. Appears on the
  Photos tab for new/draft listings only; no friction added to editing
  already-published listings. Motivation: hosts were misunderstanding platform
  rules (e.g. collecting deposits outside Patamali).
- **Unit tests** — TermsAndConditions component (8 tests), signup T&C
  checkbox in AuthenticationPage (3 tests), T&C checkbox and publish gate in
  EditListingPhotosForm (7 tests). 37 tests pass across all affected suites.

### Fixed
- **Room listing type unselectable** — selecting a different listing type
  (e.g. switching to "Room") snapped back immediately due to
  react-final-form receiving a new `initialValues` object reference on every
  Redux re-render. Fixed with `useMemo` on `getInitialValues` in
  `EditListingDetailsPanel`.

### Changed
- **T&C content unified to a single Console asset** — all three T&C surfaces
  (public `/p/terms-and-conditions` page, signup modal, listing publish modal)
  now render content from the single `terms-and-conditions` Sharetribe Console
  page asset. The old `terms-of-service` asset is no longer used.
- **Removed `/terms-of-service` route** — replaced by `/p/terms-and-conditions`.
- **Renamed "Terms of Service" → "Terms and Conditions"** throughout the UI.
  Note: the corresponding keys in Sharetribe Console → Marketplace texts must
  also be updated manually as hosted translations override `en.json`.

---

## [2026-04-03] — Booking Date Picker & Platform Setup

### Added
- **30-night minimum stay** enforced across all date pickers and search
  filters platform-wide.
- **CI testing pipeline** added.
- **Stripe** `STRIPE_SECRET_KEY` configured on Render for test.patamali.com.

### Fixed
- **Booking date picker snap-back after checkout back-navigation** — URL date
  params caused react-final-form to call `form.restart()` on every Redux
  re-render, preventing users from changing pre-filled dates. Fixed with
  `useMemo` on `initialValues` in `OrderPanel` and `BookingDatesForm`.

---

## [2026-03-15] — Topbar Search & Budget Filter

### Added
- **Airbnb-style topbar search** — collapsed pill (Where / When / Budget)
  expands to a fixed full-width bar. Uses `position: fixed` rather than
  inline in the nav row to avoid layout shifts.
- **Budget/price range filter** — $0–$10,000 USD, $50 steps (`FilterBudget`
  component). URL param format: `price=min,max` in major currency units.
- **Hero search bar (SearchCTA)** — location field required with inline
  validation; budget slider repurposed from the `keywordSearch` slot.
