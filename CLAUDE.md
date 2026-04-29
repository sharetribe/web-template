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

## Work In Progress — Booking Date Picker (branch: `feature/session2-require-30-plus-days-across-platform`)

### The problem
User selects dates (e.g. May 9 – Jun 30), goes to checkout, clicks browser Back. URL now has `?startDate=2026-05-09&endDate=2026-06-30`. The form pre-fills those dates but the user can't change them — any attempt to pick new dates fails.

### Root causes identified (two separate bugs)

**Bug 1 — FinalForm snap-back (FIXED)**
`initialBookingDates` in `OrderPanel.js` created new `Date` objects on every Redux re-render → new `initialValues` object reference → react-final-form called `form.restart()` → form snapped back to URL dates.

Fix: `useMemo` on `initialBookingDates` in `OrderPanel.js` (keyed on URL param strings) and `useMemo` on `memoizedInitialValues` in `BookingDatesForm.js`. FinalForm only sees a changed `initialValues` when URL params actually change.

**Bug 2 — `isBlockedBetween` falsely blocking June (fix applied, needs testing)**
When loading with URL params, `firstAvailableDate = null` (guarded by `!initialBookingDates`), so the June pre-fetch is skipped. The initial page load only fetches April + May time slots. When the user selects a new range spanning June, `isBlockedBetween` finds no time slot data for June and blocks it — the date picker resets to just the clicked end date as a new start.

Fix: New `useEffect` in `BookingDatesForm.js` fires once on mount when `initialBookingDates` is set. Pre-fetches `startDate's month + 1` and `endDate's month` (if further ahead). Also syncs `currentMonth` to startDate's month so navigation arrows work correctly.

### Files changed on this branch
| File | Change |
|------|--------|
| `src/components/OrderPanel/OrderPanel.js` | `useMemo` for `initialBookingDates`; `key` prop on `BookingDatesForm` tied to URL date params |
| `src/components/OrderPanel/BookingDatesForm/BookingDatesForm.js` | `useMemo` for `memoizedInitialValues`; new pre-fetch `useEffect` for initial range months; `currentMonth` sync for URL-param case; removed `keepDirtyOnReinitialize` |
| `src/containers/ListingPage/ListingPage.shared.js` | `history.replace` with date params before navigating to CheckoutPage (so back-button restores dates in URL) |

### What to test next
1. Load a listing page with `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` in the URL.
2. Verify the calendar opens with those dates pre-filled.
3. Try selecting a completely different date range (including one that spans a month boundary).
4. Confirm the new dates are accepted and the price breakdown updates.
5. Check Redux DevTools that `monthlyTimeSlots` has entries for all months in the selected range.

---

## Other Completed Work (merged to main/develop)
- 30-night minimum stay enforced across all date pickers and search filter sync.
- CI testing pipeline added.
- Stripe `STRIPE_SECRET_KEY` env var configured in Render for test.patamali.com.
