# AGENTS.md - AI Agent Code Generation Guide

Sharetribe Web Template: React 18 + Redux Toolkit + Final Form + Express.js + Server-Side Rendering

## Project Overview

- **Type**: React-based marketplace web application with Server-Side Rendering
- **Tech Stack**: React 18, Redux Toolkit, Final Form, Express.js, Sharetribe SDK
- **Purpose**: Full-featured two-sided marketplace template with multiple transaction processes

## Critical Conventions

### 1. File Structure

**Component:**

```
/ComponentName/
  ComponentName.js              # Main component
  ComponentName.module.css      # CSS Module (required)
  ComponentName.example.js      # Styleguide example (optional, for reusable components)
  ComponentName.test.js         # Tests (optional)
```

**Page:**

```
/PageName/
  PageName.js                   # Main page
  PageName.module.css           # Styles
  PageName.duck.js              # Redux state (Redux Toolkit)
  PageName.test.js              # Tests
```

### 2. Component Template

**Always use this template when creating new components:**

```javascript
import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { IconComponent } from '../../components';
import css from './ComponentName.module.css';

/**
 * Brief description of what this component does
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className - Additional CSS classes
 * @param {string?} props.rootClassName - Override root CSS class
 */
const ComponentName = props => {
  const { className, rootClassName, ...rest } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes} {...rest}>
      {/* content */}
    </div>
  );
};

export default ComponentName;
```

**Required:**

- Functional components with hooks (NO class components)
- Destructure `className` and `rootClassName` for style flexibility
- Use `classNames` utility
- Pattern: `rootClassName || css.root`

### 3. Import Order (CRITICAL - Prevents Circular Dependencies)

```javascript
// 1. React & third-party
import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

// 2. Context
import { useConfiguration } from '../../context/configurationContext';

// 3. Redux
import { useSelector, useDispatch } from 'react-redux';

// 4. Utils
import { formatMoney } from '../../util/currency';

// 5. Components
import { IconSpinner, Button } from '../../components';

// 6. CSS (ALWAYS LAST)
import css from './ComponentName.module.css';
```

**Never deviate from this order** - it causes circular dependency errors.

### 4. CSS Modules

```css
@import '../../styles/customMediaQueries.css';

.root {
  padding: 12px; /* Mobile-first */
}

@media (--viewportMedium) {
  /* 768px+ */
  .root {
    padding: 24px;
  }
}

@media (--viewportLarge) {
  /* 1024px+ */
  .root {
    padding: 36px;
  }
}
```

**CSS Variables** (from `/src/styles/marketplaceDefaults.css`):

- `--marketplaceColor`, `--colorSuccess`, `--colorFail`
- `--fontFamily`, `--spacingUnit`
- `--viewportSmall`, `--viewportMedium`, `--viewportLarge`

**Global Class Composition:**

```css
.primaryButton {
  composes: buttonPrimary from global;
}
```

Common globals: `buttonDefault`, `buttonPrimary`, `h1`-`h6`, `textSmall`, `a`

### 5. State Management – Redux Duck Pattern (Redux Toolkit)

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';

// Async Thunks
export const fetchDataThunk = createAsyncThunk(
  'domainName/fetchData',
  async (params, { extra: sdk, rejectWithValue }) => {
    try {
      return (await sdk.someEndpoint.show(params)).data;
    } catch (e) {
      return rejectWithValue(storableError(e));
    }
  }
);

// Slice
const slice = createSlice({
  name: 'domainName',
  initialState: { data: null, fetchInProgress: false, fetchError: null },
  reducers: {
    clearData: state => {
      state.data = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDataThunk.pending, state => {
        state.fetchInProgress = true;
      })
      .addCase(fetchDataThunk.fulfilled, (state, action) => {
        state.data = action.payload;
        state.fetchInProgress = false;
      })
      .addCase(fetchDataThunk.rejected, (state, action) => {
        state.fetchError = action.payload;
        state.fetchInProgress = false;
      });
  },
});

export default slice.reducer;
export const { clearData } = slice.actions;
export const selectData = state => state.domainName.data;
```

**Use `createAsyncThunk`, `storableError()`, state keys: `*InProgress`, `*Error`**

### 6. Forms (Final Form)

```javascript
import { Field } from 'react-final-form';
import { ValidationError } from '../../components';

const FieldComponent = ({ input, meta, label, id, ...rest }) => {
  const hasError = !!(meta.touched && meta.invalid && meta.error);
  return (
    <div>
      {label && <label htmlFor={id}>{label}</label>}
      <input {...input} id={id} {...rest} />
      {hasError && <ValidationError fieldMeta={meta} />}
    </div>
  );
};

const FieldTextInput = props => <Field component={FieldComponent} {...props} />;
```

**Validators:** `required`, `minLength`, `maxLength`, `emailFormatValid` (from
`/src/util/validators.js`)

### 7. Internationalization (i18n)

```javascript
import { FormattedMessage, useIntl } from 'react-intl';

<FormattedMessage id="ComponentName.key" defaultMessage="Text with {var}" values={{ var }} />
// or programmatic: intl.formatMessage({ id: 'ComponentName.key', defaultMessage: 'Text' })
```

**Add to:** `/src/translations/{en,de,es,fr}.json` | **Naming:** `ComponentName.specificKey`

### 8. Common Utilities

**Currency:** `formatMoney(intl, new Money(5000, 'USD'))` → "\$50.00" **Dates:**
`parseDateFromISO8601`, `daysBetween`, `addTime` from `/src/util/dates.js` **PropTypes:**
`import { propTypes } from '../../util/types'`

### 9. Component Export & Code Splitting

Export in `/src/components/index.js`:
`export { default as ComponentName } from './ComponentName/ComponentName';`

Pages in `/src/routing/routeConfiguration.js`:

```javascript
const PageName = loadable(() =>
  import(/* webpackChunkName: "PageName" */ '../containers/PageName/PageName')
);
// Route: { path: '/page', name: 'PageName', component: PageName, auth: true }
```

### 10. API Calls

**Client:** Use `/src/util/api.js` functions like `transactionLineItems({ listingId, bookingData })`

**Server:** Create in `/server/api/`, use `getSdk(req, res)`, `handleError`, `serialize`. Register
in `/server/apiRouter.js`

### 11. Testing & Configuration

**Testing:** Use `renderWithProviders()`, `fakeIntl`, `createUser()`, `createListing()` from test
helpers. Co-locate tests with components.

**Config:** `useConfiguration()`, `useRouteConfiguration()` from context

### 12. Hosted Configuration Assets

**DO NOT modify hosted asset configurations directly in code.** The marketplace configuration is
managed through **Sharetribe Console** and fetched at runtime via the Asset Delivery API.

#### How Hosted Assets Work

1. **Server-Side (SSR)**: `src/index.js` fetches assets during server rendering, passes version hash
   to browser via preloaded Redux state
2. **Client-Side**: `src/ducks/hostedAssets.duck.js` manages asset fetching using Redux Toolkit
   thunks
3. **Merging**: `src/util/configHelpers.js` contains `mergeConfig()` which validates and merges
   hosted assets with local defaults

   **Asset Paths** are defined in `/src/config/configDefault.js` under `appCdnAssets`.

#### Configuration Access in Components

Always use React Context hooks to access configuration:

```javascript
import { useConfiguration } from '../../context/configurationContext';

const MyComponent = () => {
  const config = useConfiguration();

  // Access merged configuration
  const { branding, listing, search, user } = config;
  const marketplaceColor = branding.marketplaceColor;
  const listingTypes = listing.listingTypes;

  // ...
};
```

#### Important Rules

1. **Never hardcode** configuration values that can be set in Console (colors, listing types, user
   fields, etc.)
2. **Always check** if a configuration exists before using it: `config.footer` can be `undefined` if
   not set in Console
3. **Use validation helpers** from `configHelpers.js` when working with extended data configurations
4. **Respect the merge order**: Hosted configs override local defaults from `src/config/*.js`. See
   `mergeConfig()` in `src/util/configHelpers.js` for the full merge logic.

## Don't & Do

### Do:

✅ Functional components, CSS Modules, i18n, Redux Toolkit, correct import order

### Don't:

❌ Class components, inline styles, hard-coded text, manual Redux, wrong import order

## Checklist

- [ ] Functional components | Correct import order | CSS Modules | `rootClassName`/`className` props
- [ ] All text i18n | Components exported in `/src/components/index.js` | Pages lazy-loaded
- [ ] Redux Toolkit | Final Form | Mobile-first | PropTypes

## Key Files

`/src/components/index.js` | `/src/routing/routeConfiguration.js` | `/src/store.js` |
`/src/util/{validators,types,currency,dates,api}.js` | `/src/styles/marketplaceDefaults.css` |
`/server/apiRouter.js`

## Transaction Processes

Booking | Purchase | Inquiry | Negotiation - see `/src/transactions/`

## Formatting

Prettier: single quotes, 2 spaces, trailing commas, max line 100 | Run: `yarn format`

---

**Production codebase with strict conventions.** Follow patterns to ensure consistency and prevent
circular dependencies.
