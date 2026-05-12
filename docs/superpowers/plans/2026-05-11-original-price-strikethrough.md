# Original Price Strikethrough Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display a struck-through original price on the listing detail page when a seller has set one, while keeping the data available on listing cards for future use.

**Architecture:** The data layer (saving/loading `publicData.originalPrice`) is already implemented in `EditListingPricingPanel.js`. This plan focuses on: cleaning up stray text in the form, adding missing translation keys, and extending the existing `PriceMaybe` component in `OrderPanel.js` to render a strikethrough original price. `AVListingCard` already receives `publicData` — no changes needed there.

**Tech Stack:** React, CSS Modules, react-intl, Sharetribe SDK Money type

---

## Files Modified

| File | Change |
|------|--------|
| `src/containers/EditListingPage/EditListingWizard/EditListingPricingPanel/EditListingPricingForm.js` | Remove two stray test strings |
| `src/translations/en.json` | Add 2 missing translation keys |
| `src/components/OrderPanel/OrderPanel.js` | Extend `PriceMaybe` to render strikethrough original price |
| `src/components/OrderPanel/OrderPanel.module.css` | Add `.originalPrice` style rule |

---

### Task 1: Remove stray test strings from EditListingPricingForm

**Files:**
- Modify: `src/containers/EditListingPage/EditListingWizard/EditListingPricingPanel/EditListingPricingForm.js`

- [ ] **Step 1: Locate and remove the two stray strings**

In `EditListingPricingForm.js`, find and fix:

Line ~142 — change:
```jsx
<Form onSubmit={handleSubmit} className={classes}>dsds
```
to:
```jsx
<Form onSubmit={handleSubmit} className={classes}>
```

Line ~191 — change (the bare `das` text node after the closing `</>`):
```jsx
          )}
das
          {isFixedLengthBooking ? (
```
to:
```jsx
          )}
          {isFixedLengthBooking ? (
```

- [ ] **Step 2: Run the existing pricing form tests to confirm nothing broke**

```bash
yarn test -- --watchAll=false --testPathPattern=EditListingPricingForm
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/containers/EditListingPage/EditListingWizard/EditListingPricingPanel/EditListingPricingForm.js
git commit -m "fix: remove stray test strings from EditListingPricingForm"
```

---

### Task 2: Add missing translation keys

**Files:**
- Modify: `src/translations/en.json`

- [ ] **Step 1: Add the two originalPrice keys**

In `src/translations/en.json`, find the block of `EditListingPricingForm.*` keys and add (maintaining alphabetical order within the block):

```json
"EditListingPricingForm.originalPrice": "Original price",
"EditListingPricingForm.originalPricePlaceholder": "Enter original price...",
```

- [ ] **Step 2: Verify the translation file is valid JSON**

```bash
node -e "require('./src/translations/en.json'); console.log('valid')"
```

Expected output: `valid`

- [ ] **Step 3: Commit**

```bash
git add src/translations/en.json
git commit -m "feat: add originalPrice translation keys"
```

---

### Task 3: Render strikethrough original price in OrderPanel

**Files:**
- Modify: `src/components/OrderPanel/OrderPanel.js`
- Modify: `src/components/OrderPanel/OrderPanel.module.css`

The `PriceMaybe` component (line ~150) already has access to `publicData`, `intl`, and `marketplaceCurrency`. The `Money` type is imported via `sdkTypes` and `customFormatPrice` is already defined in the file.

- [ ] **Step 1: Check that `Money` is imported in OrderPanel.js**

Look for this near the top of `OrderPanel.js`:
```js
const { Money } = sdkTypes;
```
If not present, add it. (The file already imports `sdkTypes` from `'../../util/sdkLoader'`.)

- [ ] **Step 2: Extend PriceMaybe to read and format originalPrice**

Inside `PriceMaybe`, after the line:
```js
const { formattedPrice, priceTitle } = customFormatPrice(price, marketplaceCurrency, intl);
```

Add:
```js
const originalPriceRaw = publicData?.originalPrice;
const originalPriceMoney =
  originalPriceRaw &&
  originalPriceRaw.amount > price.amount
    ? new Money(originalPriceRaw.amount, originalPriceRaw.currency)
    : null;
const formattedOriginalPrice = originalPriceMoney
  ? customFormatPrice(originalPriceMoney, marketplaceCurrency, intl).formattedPrice
  : null;
```

- [ ] **Step 3: Render the strikethrough in the non-CTA branch**

Find the non-CTA return branch (the `else` branch, currently):
```jsx
  <div className={css.priceContainer}>
    <p className={css.price}>
      <FormattedMessage id="OrderPanel.price" values={{ priceValue, pricePerUnit }} />
    </p>
  </div>
```

Replace with:
```jsx
  <div className={css.priceContainer}>
    {formattedOriginalPrice ? (
      <s className={css.originalPrice}>{formattedOriginalPrice}</s>
    ) : null}
    <p className={css.price}>
      <FormattedMessage id="OrderPanel.price" values={{ priceValue, pricePerUnit }} />
    </p>
  </div>
```

- [ ] **Step 4: Add the `.originalPrice` CSS rule**

In `src/components/OrderPanel/OrderPanel.module.css`, add after the existing `.price` block:

```css
.originalPrice {
  font-size: 14px;
  color: var(--colorGrey500);
  text-decoration: line-through;
  display: block;
  margin: 0 0 2px 24px;

  @media (--viewportMedium) {
    margin: 0 0 2px 0;
  }
}
```

- [ ] **Step 5: Run OrderPanel tests**

```bash
yarn test -- --watchAll=false --testPathPattern=OrderPanel
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/OrderPanel/OrderPanel.js src/components/OrderPanel/OrderPanel.module.css
git commit -m "feat: show strikethrough original price in OrderPanel"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
yarn run dev
```

- [ ] **Step 2: Edit a listing's pricing step**

Navigate to a listing's edit page → Pricing & stock tab. Confirm:
- "Original price" field appears above the price field
- The field accepts currency input in the same format as the price field

- [ ] **Step 3: Save and view the listing page**

After saving, open the listing detail page. Confirm:
- If original price was set and is **greater** than the listing price: struck-through original price appears above the current price
- If original price was not set, or is equal/less than the price: no struck-through text appears

- [ ] **Step 4: Verify AVListingCard has no display change**

Check the search results page. Confirm no original price is shown on any listing card.
