# Photos in Details Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move photo upload from its own wizard step into the first section of the Details step, with free-form gallery upload, minimum 3 images required, and maximum 100.

**Architecture:** A new `PhotoGallerySection` component renders above `EditListingDetailsForm` in `EditListingDetailsPanel`. It calls `onImageUpload`/`onRemoveImage` directly (no React Final Form). The panel's `onSubmit` validates image count before calling the listing update. The PHOTOS wizard tab is removed from all tab arrays and completion checks.

**Tech Stack:** React, CSS Modules, Sharetribe Web Template (`ListingImage`, `requireListingImage` from configHelpers), react-intl

---

## File Map

| File | Change |
|---|---|
| `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/PhotoGallerySection.js` | **Create** |
| `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/PhotoGallerySection.module.css` | **Create** |
| `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsPanel.js` | **Modify** — add photo section and submit validation |
| `src/containers/EditListingPage/EditListingWizard/EditListingWizard.js` | **Modify** — remove PHOTOS tab, update tabCompleted |
| `src/containers/EditListingPage/EditListingWizard/EditListingWizardTab.js` | **Modify** — pass image props to DETAILS, remove PHOTOS case |
| `src/translations/en_av.json` | **Modify** — 5 new keys |
| `src/translations/es_av.json` | **Modify** — 5 new keys |

`EditListingDetailsForm.js` is **not touched**.

---

### Task 1: Add translation keys

**Files:**
- Modify: `src/translations/en_av.json`
- Modify: `src/translations/es_av.json`

- [ ] **Step 1: Add 5 keys to `src/translations/en_av.json`**

Find any existing block and add (alphabetical position relative to other `EditListingDetailsPanel.*` keys doesn't matter — just keep JSON valid):

```json
"EditListingDetailsPanel.photosTitle": "Photos",
"EditListingDetailsPanel.photosMinRequired": "Add at least 3 photos to continue.",
"EditListingDetailsPanel.photosAddTip": "You can add up to 100 photos.",
"EditListingDetailsPanel.photosMaxReached": "Maximum of 100 photos reached.",
"EditListingDetailsPanel.photosUploadInProgress": "Please wait for all photos to finish uploading.",
```

- [ ] **Step 2: Add 5 keys to `src/translations/es_av.json`**

```json
"EditListingDetailsPanel.photosTitle": "Fotos",
"EditListingDetailsPanel.photosMinRequired": "Agrega al menos 3 fotos para continuar.",
"EditListingDetailsPanel.photosAddTip": "Puedes agregar hasta 100 fotos.",
"EditListingDetailsPanel.photosMaxReached": "Has alcanzado el máximo de 100 fotos.",
"EditListingDetailsPanel.photosUploadInProgress": "Espera a que terminen de subir todas las fotos.",
```

- [ ] **Step 3: Validate both files are valid JSON**

```bash
cd /Users/alex/hk/ArchivoVintach/github_sharetribe-web-template/sharetribe-web-template
node -e "require('./src/translations/en_av.json'); console.log('en_av OK')"
node -e "require('./src/translations/es_av.json'); console.log('es_av OK')"
```

Expected:
```
en_av OK
es_av OK
```

---

### Task 2: Create `PhotoGallerySection.js`

**Files:**
- Create: `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/PhotoGallerySection.js`

This component renders photo thumbnails + an add-photo button. It uses the existing `ListingImage` component from the adjacent `EditListingPhotosPanel` directory. No React Final Form involved — all state lives in the wizard's Redux store via the `onImageUpload`/`onRemoveImage` callbacks.

- [ ] **Step 1: Create the file**

```jsx
import React, { useRef } from 'react';

import { FormattedMessage, useIntl } from '../../../../util/reactIntl';

import ListingImage from '../EditListingPhotosPanel/ListingImage';

import css from './PhotoGallerySection.module.css';

const MAX_IMAGES = 100;

/**
 * Free-form photo gallery section for the Details panel.
 * Renders current images as thumbnails with remove buttons,
 * plus an "Add" button. No React Final Form — upload/remove
 * are fired immediately via callbacks.
 *
 * @param {Object} props
 * @param {Array} props.images - Renderable image objects from Redux
 * @param {Function} props.onImageUpload - (data, listingImageConfig) => void
 * @param {Function} props.onRemoveImage - (imageId) => void
 * @param {Object|null} props.uploadImageError - API error from last upload attempt
 * @param {Object} props.listingImageConfig - { aspectWidth, aspectHeight, variantPrefix }
 * @param {string|null} props.photoError - intl key for validation error set by panel
 */
const PhotoGallerySection = props => {
  const {
    images = [],
    onImageUpload,
    onRemoveImage,
    uploadImageError,
    listingImageConfig,
    photoError,
  } = props;

  const intl = useIntl();
  const fileInputRef = useRef(null);

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = listingImageConfig || {};

  const isMaxReached = images.length >= MAX_IMAGES;

  const handleFileChange = e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      onImageUpload({ id: `${file.name}_${Date.now()}`, file }, listingImageConfig);
    });
    e.target.value = '';
  };

  const savedImageAltText = intl.formatMessage({
    id: 'EditListingPhotosForm.savedImageAltText',
  });

  return (
    <div className={css.root}>
      <h3 className={css.title}>
        <FormattedMessage id="EditListingDetailsPanel.photosTitle" />
      </h3>

      <div className={css.imageGrid}>
        {images.map(image => (
          <div key={image.id} className={css.imageWrapper}>
            <ListingImage
              image={image}
              savedImageAltText={savedImageAltText}
              onRemoveImage={onRemoveImage}
              aspectWidth={aspectWidth}
              aspectHeight={aspectHeight}
              variantPrefix={variantPrefix}
            />
          </div>
        ))}

        {!isMaxReached && (
          <div className={css.addImageWrapper}>
            <label className={css.addImageLabel} htmlFor="gallery-add-image">
              <span className={css.addImageIcon}>+</span>
            </label>
            <input
              ref={fileInputRef}
              id="gallery-add-image"
              className={css.fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {photoError && (
        <p className={css.error}>
          <FormattedMessage id={photoError} />
        </p>
      )}

      {uploadImageError && !photoError && (
        <p className={css.error}>
          <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
        </p>
      )}

      <p className={css.tip}>
        <FormattedMessage
          id={
            isMaxReached
              ? 'EditListingDetailsPanel.photosMaxReached'
              : 'EditListingDetailsPanel.photosAddTip'
          }
        />
      </p>
    </div>
  );
};

export default PhotoGallerySection;
```

---

### Task 3: Create `PhotoGallerySection.module.css`

**Files:**
- Create: `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/PhotoGallerySection.module.css`

- [ ] **Step 1: Create the file**

```css
@import '../../../../styles/customMediaQueries.css';

.root {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--colorGrey100);
}

.title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.imageGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 8px;

  @media (--viewportMedium) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (--viewportLarge) {
    grid-template-columns: repeat(5, 1fr);
  }
}

.imageWrapper {
  position: relative;
}

.addImageWrapper {
  border: 2px dashed var(--colorGrey200);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  cursor: pointer;

  &:hover {
    border-color: var(--colorGrey400);
  }
}

.addImageLabel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.addImageIcon {
  font-size: 36px;
  line-height: 1;
  color: var(--colorGrey400);
}

.fileInput {
  display: none;
}

.error {
  color: var(--colorFail);
  font-size: 14px;
  margin: 8px 0 0 0;
}

.tip {
  color: var(--colorGrey500);
  font-size: 13px;
  margin: 8px 0 0 0;
}
```

---

### Task 4: Update `EditListingDetailsPanel.js`

**Files:**
- Modify: `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsPanel.js`

Four targeted changes: add imports, add new props + state, render `PhotoGallerySection`, wrap `onSubmit`.

- [ ] **Step 1: Add two imports at the top of the file**

After the existing `import { H3, ListingLink } from '../../../../components';` line, add:

```js
import { requireListingImage } from '../../../../util/configHelpers';
```

After the existing `import EditListingDetailsForm from './EditListingDetailsForm';` line, add:

```js
import PhotoGallerySection from './PhotoGallerySection';
```

Also update the React import line (line 1) to include `useState`:

Current:
```js
import React, { useEffect } from 'react';
```

Replace with:
```js
import React, { useEffect, useState } from 'react';
```

- [ ] **Step 2: Add new props to the destructuring (around line 294)**

Current destructuring (inside `const EditListingDetailsPanel = props => {`):
```js
  const {
    className,
    rootClassName,
    params: pathParams,
    locationSearch,
    listing,
    disabled,
    ready,
    onSubmit,
    onListingTypeChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    config,
    updatePageTitle: UpdatePageTitle,
    intl,
  } = props;
```

Replace with:
```js
  const {
    className,
    rootClassName,
    params: pathParams,
    locationSearch,
    listing,
    disabled,
    ready,
    onSubmit,
    onListingTypeChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    config,
    updatePageTitle: UpdatePageTitle,
    intl,
    images = [],
    onImageUpload,
    onRemoveImage,
    listingImageConfig,
  } = props;
```

- [ ] **Step 3: Add `requiresImages` computation and `photoError` state**

After the `const isPublished = ...` line (around line 357), add:

```js
  const [photoError, setPhotoError] = useState(null);

  const listingTypeConfig = listingTypes.find(
    conf => conf.listingType === existingListingTypeInfo.listingType
  );
  const requiresImages = requireListingImage(listingTypeConfig);
```

- [ ] **Step 4: Add `PhotoGallerySection` render before `EditListingDetailsForm`**

Inside the `{canShowEditListingDetailsForm ? (` block, add `PhotoGallerySection` as the FIRST child before `<EditListingDetailsForm>`. The current render block starts with:

```jsx
      {canShowEditListingDetailsForm ? (
        <EditListingDetailsForm
```

Replace with:
```jsx
      {canShowEditListingDetailsForm ? (
        <>
          {requiresImages && (
            <PhotoGallerySection
              images={images}
              onImageUpload={onImageUpload}
              onRemoveImage={onRemoveImage}
              uploadImageError={errors?.uploadImageError}
              listingImageConfig={listingImageConfig}
              photoError={photoError}
            />
          )}
          <EditListingDetailsForm
```

And close the fragment at the end of the block. The block currently closes with:
```jsx
        />
      ) : (
```

Replace that closing with:
```jsx
          />
        </>
      ) : (
```

- [ ] **Step 5: Wrap the `onSubmit` handler with image validation**

Inside `<EditListingDetailsForm>`, the current `onSubmit` prop is:
```js
          onSubmit={values => {
            const {
              title,
              description,
              ...
            } = values;
            ...
            onSubmit(updateValues);
          }}
```

Wrap the final `onSubmit(updateValues)` call with the image validation. Replace only the last line of the handler:

Current last line:
```js
            onSubmit(updateValues);
```

Replace with:
```js
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
            onSubmit({ ...updateValues, images });
```

- [ ] **Step 6: Run tests**

```bash
yarn test -- --watchAll=false 2>&1 | tail -15
```

Expected: passes (or only pre-existing failures).

---

### Task 5: Update `EditListingWizard.js`

**Files:**
- Modify: `src/containers/EditListingPage/EditListingWizard/EditListingWizard.js`

Three changes: (1) remove PHOTOS from tab arrays, (2) update DETAILS `tabCompleted` check, (3) remove PHOTOS from `tabLabelAndSubmit`.

- [ ] **Step 1: Change `styleOrPhotosTab` in `tabsForListingType` (around line 92)**

Current:
```js
  const styleOrPhotosTab = requireListingImage(listingTypeConfig) ? [PHOTOS] : [STYLE];
```

Replace with:
```js
  const styleOrPhotosTab = requireListingImage(listingTypeConfig) ? [] : [STYLE];
```

- [ ] **Step 2: Update `tabCompleted` DETAILS case to include image count check (around line 250)**

Current:
```js
    case DETAILS:
      return !!(
        (!descriptionRequired || hasValidDescription) &&
        title &&
        listingType &&
        transactionProcessAlias &&
        unitType &&
        hasValidListingFieldsInExtendedData(publicData, privateData, config)
      );
```

Replace with:
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

- [ ] **Step 3: Remove the PHOTOS case from `tabCompleted` (around line 269)**

Current:
```js
    case PHOTOS:
      return images && images.length > 0;
```

Delete those two lines entirely (or replace with `case PHOTOS: return false;` if a dead-code label is preferred — deleting is cleaner).

- [ ] **Step 4: Remove the PHOTOS branch from `tabLabelAndSubmit` (around line 145)**

Current:
```js
  } else if (tab === PHOTOS) {
    labelKey = 'EditListingWizard.tabLabelPhotos';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.savePhotos`;
  } else if (tab === STYLE) {
```

Delete the 3-line PHOTOS block so STYLE immediately follows AVAILABILITY:
```js
  } else if (tab === STYLE) {
```

- [ ] **Step 5: Run tests**

```bash
yarn test -- --watchAll=false 2>&1 | tail -15
```

Expected: passes or only pre-existing failures.

---

### Task 6: Update `EditListingWizardTab.js`

**Files:**
- Modify: `src/containers/EditListingPage/EditListingWizard/EditListingWizardTab.js`

Two changes: pass image props to DETAILS case, remove PHOTOS case.

- [ ] **Step 1: Add image props to the DETAILS case (around line 201)**

Current:
```jsx
    case DETAILS: {
      return (
        <EditListingDetailsPanel
          {...panelProps(DETAILS)}
          onListingTypeChange={onListingTypeChange}
          config={config}
        />
      );
    }
```

Replace with:
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

- [ ] **Step 2: Remove the PHOTOS case entirely (around line 261)**

Current:
```jsx
    case PHOTOS: {
      return (
        <EditListingPhotosPanel
          {...panelProps(PHOTOS)}
          listingImageConfig={config.layout.listingImage}
          images={images}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          photoMode={config?.listing?.photoMode}
        />
      );
    }
```

Delete the entire `case PHOTOS: { ... }` block.

- [ ] **Step 3: Run the full test suite**

```bash
yarn test -- --watchAll=false 2>&1 | tail -20
```

Expected: passes (or only pre-existing failures — update snapshots if needed):

```bash
yarn test -- --watchAll=false --updateSnapshot 2>&1 | tail -10
```

---

### Task 7: Commit

- [ ] **Step 1: Stage all changed and new files**

```bash
git add \
  src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/PhotoGallerySection.js \
  src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/PhotoGallerySection.module.css \
  src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsPanel.js \
  src/containers/EditListingPage/EditListingWizard/EditListingWizard.js \
  src/containers/EditListingPage/EditListingWizard/EditListingWizardTab.js \
  src/translations/en_av.json \
  src/translations/es_av.json \
  docs/superpowers/specs/2026-05-11-photos-in-details-panel-design.md \
  docs/superpowers/plans/2026-05-11-photos-in-details-panel.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: merge photo upload into listing details step

Photos are now the first section of the Details wizard step.
The Photos sidebar tab is removed from all transaction processes.
Requires minimum 3 images before details can be saved (up to 100).

- New PhotoGallerySection: free-form add/remove above DetailsForm
- EditListingDetailsPanel validates image count on submit
- tabCompleted DETAILS now requires images.length >= 3
- PHOTOS removed from tabsForListingType, tabCompleted, tabLabelAndSubmit
- EditListingDetailsForm.js not touched

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
