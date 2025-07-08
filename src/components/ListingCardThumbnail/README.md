# Adding a new background color option to ListingCardThumbnail

This document explains how to add a new background color option to the ListingCardThumbnail
component.

## Overview

The ListingCardThumbnail component supports multiple background color schemes that are used when
listing images are disabled. These color schemes are defined in multiple files that need to be
updated when adding new options.

## Files to modify

When adding a new background color option, you'll need to modify the following files:

1. **`src/util/types.js`** - Define the color scheme value
2. **`src/containers/EditListingPage/EditListingWizard/EditListingStylePanel/EditListingStyleForm.js`** -
   Map color scheme to CSS variable
3. **`src/components/ListingCardThumbnail/ListingCardThumbnail.module.css`** - Define the visual
   styling

## Step-by-Step Instructions

### Step 1: Add Color Scheme to types.js

Location: `src/util/types.js:727`

Add your new color scheme value to the `colorSchemes` array:

```javascript
export const colorSchemes = [
  'white',
  'grey',
  'black',
  'main-brand',
  'primary-button',
  'your-new-color',
];
```

### Step 2: Update EditListingStyleForm.js

Location:
`src/containers/EditListingPage/EditListingWizard/EditListingStylePanel/EditListingStyleForm.js:23-29`

Add your new color scheme to the `colorSchemeMap` object in the `FieldCardStyle` component. Note:
you can use a CSS variable available in the global scope. Use an existing one defined in
marketplaceDefaults.css or add a new variable.

```javascript
const colorSchemeMap = {
  white: '--colorWhite',
  grey: '--colorGrey50',
  black: '--colorBlack',
  'main-brand': '--marketplaceColor',
  'primary-button': '--colorPrimaryButton',
  'your-new-color': '--your-css-variable-name',
};
```

### Step 3: Add CSS Styles

Location: `src/components/ListingCardThumbnail/ListingCardThumbnail.module.css`

Add a new CSS class for your color scheme following the existing pattern:

```css
.your-new-color {
  color: red;
  background-color: green;
}
```

## Important Notes

- The color scheme value in `types.js` must match the key in the `colorSchemeMap` object
- The CSS class name in `ListingCardThumbnail.module.css` must match the color scheme value
- Consider contrast ratios when choosing text and background colors for accessibility
- Remember that the listing style is stored in the listing extended data, under `cardStyle`. If you
  have existing listings, make sure not to remove the corresponding keys from the template or update
  the values stored in your listings

## Example

To add a new "blue" color scheme:

1. **types.js**: Add `'blue'` to the `colorSchemes` array
2. **EditListingStyleForm.js**: Add `'blue': '--colorBlue'` to the `colorSchemeMap`
3. **marketplaceDefaults.css** Define `--colorBlue: #0000FF`
4. **ListingCardThumbnail.module.css**: Add:
   ```css
   .blue {
     color: var(--colorWhite);
     background-color: var(--colorBlue);
   }
   ```

## Testing

After making these changes:

1. Navigate to the listing style editor
2. Verify that your new color option appears in the radio button selection
3. Test that the preview thumbnail displays the correct colors
4. Ensure the styling persists when the listing is saved and displayed elsewhere
