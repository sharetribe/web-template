# Patamali Changelog

All notable changes to the Patamali customisation layer are documented here.
The existing `CHANGELOG.md` tracks upstream Sharetribe template changes — this
file tracks Patamali-specific work only.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

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
