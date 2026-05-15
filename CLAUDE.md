# Patamali — Claude Context

## Project Overview
Patamali is a Sharetribe web template marketplace for furnished monthly rentals in Kenya/Africa.

**Target audience:** expats, corporate travelers, relocating families, digital nomads.

**Tech stack:** React + Redux + React Final Form, CSS Modules with PostCSS, Sharetribe Flex web template.

**Currency:** USD (not KES). Target audience budgets in USD; Stripe processes USD. Always use USD for price display.

**30-night minimum stay** is enforced across all date pickers and search filters.

---

## Key Customisations

### Topbar Search (complete)
Airbnb-style collapsed pill → fixed expanded bar (not inline in nav).
- Collapsed: pill showing Where / When / Budget; uses `visibility: hidden` when expanded so topbar layout doesn't shift.
- Expanded: `position: fixed; top: var(--topbarHeightDesktop)`, full-width, max 800px centered, 220ms ease-in animation.
- Key files: `src/containers/TopbarContainer/Topbar/TopbarSearchForm/TopbarSearchForm.js` and `.module.css`
- Don't try to put the expanded form inline in the topbar flex row — always use the fixed/absolute approach.

### Price / Budget Filter
- Range: $0–$10,000 USD, $50 steps (`FilterBudget` component).
- URL param format: `price=min,max` in **major currency units** (not subunits).

### Hero Search Bar (SearchCTA)
- Location is required; shows inline error + asterisk if omitted.
- `keywordSearch` slot is repurposed for the monthly budget slider (`FilterBudget`).

---

## Terms & Conditions — Architecture (complete)

All T&C content is served from a **single Sharetribe Console page asset**: `terms-and-conditions`.

- The old `terms-of-service` asset and `/terms-of-service` route have been **removed**. Do not reference them.
- The `TermsOfServiceContent` component (from `TermsOfServicePage`) renders the live Console content everywhere T&C appears.
- Three surfaces all read from the same asset: `/p/terms-and-conditions` public page, signup modal, listing publish modal.

### Scroll-to-accept UX (signup + listing publish)
Both surfaces use the same pattern: checkbox click → modal opens → user must scroll to bottom → modal checkbox unlocks → checking it closes modal and marks form checkbox accepted → unchecking form checkbox reopens modal.

Key files:
- `src/containers/AuthenticationPage/AuthenticationPage.js` — signup modal state (`tosAccepted`, `tosRead`, `tosModalOpen`)
- `src/containers/AuthenticationPage/TermsAndConditions/TermsAndConditions.js` — custom `Field` + `TermsInput` sub-component; syncs `tosAccepted` prop → form field via `useEffect`
- `src/containers/EditListingPage/EditListingWizard/EditListingWizard.js` — listing publish modal state (`tcAccepted`, `tcScrolled`); `handleTCCheckboxClick`; `handlePublishListing` no longer opens the modal
- `src/containers/EditListingPage/EditListingWizard/EditListingPhotosPanel/EditListingPhotosForm.js` — T&C checkbox rendered above submit button when `isNewListingFlow=true`; submit gated on `tcAccepted`

The T&C checkbox on listing publish only appears for new/draft listings (`isNewListingFlow`), not for editing already-published listings.

---

## Booking Date Picker — Architecture (complete)

All calendar logic lives in `src/components/OrderPanel/BookingDatesForm/BookingDatesForm.js`.

### Key functions and invariants

**`getAllTimeSlots(monthlyTimeSlots)`**
Flattens the Redux `monthlyTimeSlots` map into a single array, **sorted chronologically**, then
runs `removeUnnecessaryBoundaries` to merge back-to-back same-seat slots. The sort is critical:
async API fetches complete in unpredictable order, so months may be inserted out of sequence.
`findIndexOfLastConsecutiveTimeSlot` only scans forward — without the sort, out-of-order months
break the consecutive-block detection.

**`areConsecutiveTimeSlots(slotA, slotB, timeZone)`**
Compares at **day-level in the listing's timezone**, not raw UTC milliseconds. The Sharetribe API
returns slightly different UTC timestamps for adjacent slot boundaries across separate fetches
(Africa/Nairobi UTC+3, no DST). Raw UTC comparison misses valid consecutive pairs.

**`combineConsecutiveTimeSlots(allTimeSlots, startDate, timeZone)`**
When the user picks a start date, narrows available end dates to the continuous availability
block containing that start date. If the result is empty (start-date month still in-flight),
the caller falls back to `allTimeSlots` so other fetched months remain visible.

**`isDayBlockedFn({ allTimeSlots, startDate, endDate, timeZone })`**
Controls the strikethrough rendering in `FieldDateRangePicker`.
- When **only `startDate` is set** (user picking end date): uses the permissive
  `hasAvailabilityOrCheckoutOnDay` check, which allows the slot's exclusive-end boundary day
  to appear unblocked so it can be selected as a checkout day.
- When **both dates are set** (calendar in review state): uses the strict `hasAvailabilityOnDay`
  check so the exclusive-end boundary stays correctly blocked.

Do not collapse these two paths back into a single check — the Dec 1 / exclusive-end bug
reappears immediately.

### Relevant time slot helpers
- `hasAvailabilityOnDay` — strict: returns false for the exclusive-end boundary day.
- `hasAvailabilityOrCheckoutOnDay` — permissive: returns true for the exclusive-end boundary day (checkout day).
- `removeUnnecessaryBoundaries` — merges adjacent slots with the same seat count; must receive chronologically sorted input.

---

## Other Completed Work (merged to main/develop)
- 30-night minimum stay enforced across all date pickers and search filter sync.
- Booking date picker back-navigation snap-back fixed (`useMemo` on `initialValues` in `OrderPanel` and `BookingDatesForm`).
- Availability calendar blocking fixes — consecutive-slot timezone comparison, exclusive-end boundary, async fetch ordering (see changelog 2026-05-08).
- CI testing pipeline added.
- Stripe `STRIPE_SECRET_KEY` env var configured in Render for test.patamali.com.
- Room listing type snap-back fixed (`useMemo` on `getInitialValues` in `EditListingDetailsPanel`).
- T&C scroll-to-accept on signup and listing publish (see T&C section above).
