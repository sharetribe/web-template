# Photos in Details Panel — Design

**Date:** 2026-05-11

Move the listing photo upload experience from its own wizard step into the first section of the Details step. The Photos sidebar tab is removed entirely. Images are uploaded via free-form gallery (add/remove any number), minimum 3 required to save, maximum 100.

---

## Goals

1. Photo upload appears as the **first section** of the Details wizard step
2. The Photos wizard tab is **removed** from the sidebar (all 4 transaction processes)
3. Minimum **3 images** required before the Details form can be submitted
4. Maximum **100 images** — the Add button is disabled when `images.length >= 100`
5. `EditListingDetailsForm.js` is **not touched** (it's on the merge-conflict watchlist)
6. Only applies when the listing type requires images (`requireListingImage` config is true); STYLE tab behavior is unchanged

---

## New Files

### `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/PhotoGallerySection.js`

A standalone React component (no React Final Form). Receives all image state and callbacks as props. Renders:

1. **Section heading** — "Photos" (`EditListingDetailsPanel.photosTitle`)
2. **Image grid** — each uploaded image rendered using the existing `ListingImage` component from `EditListingPhotosPanel/ListingImage` with a remove button
3. **Add button** — `<input type="file" accept="image/*" multiple>` wrapped in a styled label; calls `onImageUpload` per file; disabled when `images.length >= 100`
4. **Error message** — shown when `photoError` is non-null (e.g. "Add at least 3 photos to continue"); also shows `uploadImageError` from `errors`
5. **Upload tip** — static text "You can add up to 100 photos" (`EditListingDetailsPanel.photosAddTip`)

Props:
```js
{
  images,              // Array — current renderable images
  onImageUpload,       // (file) => void — fires immediately, no form needed
  onRemoveImage,       // (imageId) => void
  uploadImageError,    // error | null — from errors.uploadImageError
  listingImageConfig,  // config.layout.listingImage
  photoError,          // string | null — validation error set by panel
}
```

### `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/PhotoGallerySection.module.css`

Styles for the photo section: grid layout for thumbnails, add-button styling.

---

## Modified Files

### `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsPanel.js`

**New props:**
```js
images,           // from listing.images (via WizardTab)
onImageUpload,    // (file, listingImageConfig) => void
onRemoveImage,    // (imageId) => void
listingImageConfig, // config.layout.listingImage
requiresImages,   // boolean — computed from listing type config
```

**New local state:**
```js
const [photoError, setPhotoError] = useState(null);
```

**Render change:** When `requiresImages && canShowEditListingDetailsForm`, render `<PhotoGallerySection>` as the first child of the `<main>` element, before `<EditListingDetailsForm>`. Pass all image props + `photoError`.

**Submit interception:** Wrap the existing `onSubmit` call with image validation:
```js
onSubmit={values => {
  if (requiresImages) {
    const uploadInProgress = images.some(img => img.file && !img.imageId);
    if (uploadInProgress) {
      setPhotoError('EditListingDetailsPanel.photosUploadInProgress');
      return;
    }
    if (images.length < 3) {
      setPhotoError('EditListingDetailsPanel.photosMinRequired');
      return;
    }
  }
  setPhotoError(null);
  // ... existing submit logic ...
  onSubmit({ ...updateValues, images });
}}
```

The `images` array is passed alongside the other update values so the listing update call persists the image associations (same as `EditListingPhotosPanel.submitGallery` does).

**`requiresImages` computation:**
```js
const listingTypeConfig = listingTypes.find(
  conf => conf.listingType === existingListingTypeInfo.listingType
);
const requiresImages = requireListingImage(listingTypeConfig);
```

Import `requireListingImage` from `EditListingWizard.js` — this function must be exported (currently it is not; we export it).

---

### `src/containers/EditListingPage/EditListingWizard/EditListingWizard.js`

**Export `requireListingImage`:** Change `const requireListingImage = ...` to `export const requireListingImage = ...` so `EditListingDetailsPanel` can import it.

**`tabsForListingType`:** Change the `styleOrPhotosTab` line:
```js
// Before:
const styleOrPhotosTab = requireListingImage(listingTypeConfig) ? [PHOTOS] : [STYLE];
// After:
const styleOrPhotosTab = requireListingImage(listingTypeConfig) ? [] : [STYLE];
```

**`tabCompleted` — DETAILS case:** Add image count check:
```js
case DETAILS:
  return !!(
    (!descriptionRequired || hasValidDescription) &&
    title &&
    listingType &&
    transactionProcessAlias &&
    unitType &&
    hasValidListingFieldsInExtendedData(publicData, privateData, config) &&
    (!requireListingImage(listingTypeConfig) || (images && images.length >= 3))
  );
```

**`tabCompleted` — PHOTOS case:** Remove entirely (or return `false` as dead code; removing is cleaner).

**`tabLabelAndSubmit` — PHOTOS case:** Remove entirely.

---

### `src/containers/EditListingPage/EditListingWizard/EditListingWizardTab.js`

**DETAILS case:** Pass image props directly (not via `panelProps`):
```jsx
case DETAILS: {
  return (
    <EditListingDetailsPanel
      {...panelProps(DETAILS)}
      onListingTypeChange={onListingTypeChange}
      config={config}
      images={images}
      onImageUpload={onImageUpload}
      onRemoveImage={onRemoveImage}
      listingImageConfig={config.layout.listingImage}
    />
  );
}
```

**PHOTOS case:** Remove entirely.

---

## Translations

Add to `src/translations/en_av.json` and `src/translations/es_av.json`:

```json
"EditListingDetailsPanel.photosTitle": "Photos",
"EditListingDetailsPanel.photosMinRequired": "Add at least 3 photos to continue.",
"EditListingDetailsPanel.photosAddTip": "You can add up to 100 photos.",
"EditListingDetailsPanel.photosMaxReached": "Maximum of 100 photos reached.",
"EditListingDetailsPanel.photosUploadInProgress": "Please wait for all photos to finish uploading."
```

```json
"EditListingDetailsPanel.photosTitle": "Fotos",
"EditListingDetailsPanel.photosMinRequired": "Agrega al menos 3 fotos para continuar.",
"EditListingDetailsPanel.photosAddTip": "Puedes agregar hasta 100 fotos.",
"EditListingDetailsPanel.photosMaxReached": "Has alcanzado el máximo de 100 fotos.",
"EditListingDetailsPanel.photosUploadInProgress": "Espera a que terminen de subir todas las fotos."
```

---

## Data Flow

```
EditListingPage
  └─ EditListingWizard (images, onImageUpload, onRemoveImage already here)
       └─ EditListingWizardTab (passes image props to DETAILS case)
            └─ EditListingDetailsPanel
                 ├─ PhotoGallerySection (renders above form, fires upload/remove directly)
                 └─ EditListingDetailsForm (unchanged)
```

On submit: panel calls `onSubmit({ ...detailsValues, images })`. The `images` array at this point contains only finalized images (temp-id images with pending uploads are still in the array but their `imageId` has been resolved by the time the user clicks save — upload is fire-and-wait).

---

## Upstream Merge Risk

| File | Risk | Notes |
|---|---|---|
| `EditListingWizard.js` | Medium | Remove PHOTOS from 3 places + export one function; changes are isolated |
| `EditListingWizardTab.js` | Low | Add 3 props to DETAILS case; remove PHOTOS case |
| `EditListingDetailsPanel.js` | Medium | New props + local state + PhotoGallerySection render + submit wrap |
| `EditListingDetailsForm.js` | **None** | Not touched |

---

## Out of Scope

- Gallery mode (non-slot photo mode) — behavior unchanged; STYLE tab unchanged
- `EditListingPhotosPanel` files — left in place, just not rendered
- URL redirect for `?tab=photos` — existing wizard guard already handles unknown tabs by falling back to DETAILS
- Image reordering — not part of this change
