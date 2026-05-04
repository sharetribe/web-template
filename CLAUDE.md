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

## Other Completed Work (merged to main/develop)
- 30-night minimum stay enforced across all date pickers and search filter sync.
- Booking date picker back-navigation snap-back fixed (`useMemo` on `initialValues` in `OrderPanel` and `BookingDatesForm`).
- CI testing pipeline added.
- Stripe `STRIPE_SECRET_KEY` env var configured in Render for test.patamali.com.
- Room listing type snap-back fixed (`useMemo` on `getInitialValues` in `EditListingDetailsPanel`).
- T&C scroll-to-accept on signup and listing publish (see T&C section above).
