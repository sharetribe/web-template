# Original Price Strikethrough — Design Spec

**Date:** 2026-05-11
**Branch:** custom-sections

## Summary

Add an `originalPrice` field to the listing pricing step so sellers can indicate a "was" price. Display it struck-through beside the current price on the listing detail page. Make the data accessible to `AVListingCard` for future use without displaying it yet.

---

## What's Already Done

The form and data layer are partially implemented:

- `EditListingPricingForm.js` — `FieldCurrencyInput` for `originalPrice` is already rendered above the price field. Has two stray test strings (`dsds`, `das`) to clean up.
- `EditListingPricingPanel.js` — `getInitialValues` reads `publicData.originalPrice` → `Money`; `onSubmit` saves `originalPrice` as `{ amount, currency }` into `publicData`.

---

## Remaining Work

### 1. Cleanup — `EditListingPricingForm.js`

Remove two accidental test strings:
- Line 142: `dsds` inside `<Form onSubmit={handleSubmit} className={classes}>dsds`
- Line 191: `das` as a bare text node after the closing `</>` of the non-variant branch

### 2. Translations — `src/translations/en.json`

Add two keys (not yet present):

```json
"EditListingPricingForm.originalPrice": "Original price",
"EditListingPricingForm.originalPricePlaceholder": "Enter original price..."
```

### 3. OrderPanel — `PriceMaybe` extension

**File:** `src/components/OrderPanel/OrderPanel.js`

Inside `PriceMaybe`, after resolving `formattedPrice`:

1. Read `publicData.originalPrice` (shape: `{ amount: number, currency: string }`).
2. Reconstruct as `new Money(originalPrice.amount, originalPrice.currency)`.
3. Format with `customFormatPrice` (same function used for the current price).
4. Guard: only show if `originalPrice.amount > price.amount` (prevents showing when the "original" is lower or equal to the sale price).
5. Render a `<s className={css.originalPrice}>…</s>` element inside the existing `priceContainer` div, above the current price `<p>`.
6. Do **not** show in the `showCurrencyMismatch` (mobile CTA) branch — too little space.

**File:** `src/components/OrderPanel/OrderPanel.module.css`

Add:

```css
.originalPrice {
  font-size: 14px;
  color: var(--colorGeyser, #8c8c8c);
  text-decoration: line-through;
  display: block;
  margin-bottom: 2px;
}
```

### 4. AVListingCard — data availability

**File:** `src/components/AVListingCard/AVListingCard.js`

Confirm that `publicData` is received as a prop or derived from the listing entity. If not, extract `publicData` from `listing.attributes.publicData` and pass it through (no display code). This makes `publicData.originalPrice` available for future card variants.

---

## Data Shape

```
listing.attributes.publicData.originalPrice = { amount: number, currency: string }
```

Stored as raw sub-units (same as Sharetribe's `Money` type). Reconstructed with `new Money(amount, currency)` before formatting.

---

## Out of Scope

- Displaying original price on `AVListingCard` — deferred to a future task.
- Validation that `originalPrice > price` on the form — intentionally omitted; guard is display-only.
- Booking/price-variant listings — `originalPrice` only shown in the non-variant branch (matching where the form field appears).
