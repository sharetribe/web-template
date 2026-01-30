# src/AGENTS.md - Frontend Development Patterns

> **This file contains frontend development patterns for the Sharetribe Web Template.** Use this when working with React components, Redux state, styling, forms, and external libraries.

**You are here:** `/src/AGENTS.md`
**Main guide:** [`/AGENTS.md`](../AGENTS.md) (includes Console Configuration)
**Component guide:** [`/src/components/AGENTS.md`](./components/AGENTS.md) (component creation, icons, UI libraries, animations)
**Page patterns:** [`/src/containers/AGENTS.md`](./containers/AGENTS.md)
**Backend patterns:** [`/server/AGENTS.md`](../server/AGENTS.md)

---

## Critical: Component Extension Pattern

**EXTREMELY IMPORTANT**: This template is maintained by Sharetribe and receives regular updates. Your customizations must coexist with upstream changes.

**YES: ALWAYS use composition (extend/wrap):**

```javascript
// YES: GOOD - Creating wrapper component
// src/components/ListingCardEnhanced/ListingCardEnhanced.js
import ListingCard from '../ListingCard/ListingCard';
import css from './ListingCardEnhanced.module.css';

const ListingCardEnhanced = (props) => {
  // Custom logic and state here
  const enhancedData = useCustomHook(props.listing);

  // Use original component as controller, add custom UI
  return (
    <div className={css.enhancedWrapper}>
      <CustomBadge data={enhancedData} />
      <ListingCard {...props} />
      <CustomActions listing={props.listing} />
    </div>
  );
};

export default ListingCardEnhanced;
```

**NO: NEVER modify Sharetribe components directly:**

```javascript
// NO: BAD - Modifying ListingCard.js directly
// src/components/ListingCard/ListingCard.js
const ListingCard = () => {
  // Added custom fields directly to original component
  return <div className={css.root}>{/* modifications */}</div>;
};
```

**Why This Matters:**

- Sharetribe releases template updates regularly
- Direct modifications = merge conflicts and broken functionality
- Composition = your customizations survive updates
- Client can pull upstream changes without breaking custom code

---

## Using External Libraries

**YES: Adding external libraries when needed**

You can add third-party libraries to enhance functionality, but always wrap them in custom components.

### Installing Libraries

```bash
# Icons
yarn add lucide-react

# UI libraries
yarn add @radix-ui/react-dialog
yarn add @headlessui/react

# Utilities
yarn add date-fns
yarn add clsx
```

### Icons: Use lucide-react

```javascript
// src/components/CustomListingCard/CustomListingCard.js
import { Heart, Star, MapPin } from 'lucide-react';
import css from './CustomListingCard.module.css';

const CustomListingCard = ({ listing }) => {
  return (
    <div className={css.card}>
      <div className={css.location}>
        <MapPin className={css.icon} size={16} />
        <span>{listing.attributes.publicData.location}</span>
      </div>
      <div className={css.rating}>
        <Star className={css.icon} size={16} />
        <span>{listing.rating}</span>
      </div>
      <button className={css.favorite}>
        <Heart size={20} />
      </button>
    </div>
  );
};

export default CustomListingCard;
```

### UI Libraries: Wrap in Custom Components

```javascript
// NO: DON'T - Use UI library components directly throughout the codebase
import { Dialog } from '@radix-ui/react-dialog';

const MyPage = () => {
  return <Dialog>...</Dialog>; // Don't do this everywhere
};

// YES: DO - Wrap in a custom component
// src/components/CustomModal/CustomModal.js
import * as Dialog from '@radix-ui/react-dialog';
import css from './CustomModal.module.css';

const CustomModal = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={css.overlay} />
        <Dialog.Content className={css.content}>
          <Dialog.Title className={css.title}>{title}</Dialog.Title>
          {children}
          <Dialog.Close className={css.closeButton}>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CustomModal;

// Now use your custom component throughout the app
import CustomModal from '../../components/CustomModal/CustomModal';

const MyPage = () => {
  return (
    <CustomModal isOpen={isOpen} onClose={handleClose} title="My Dialog">
      <p>Content here</p>
    </CustomModal>
  );
};
```

**Why wrap UI libraries?**

1. **Single source of truth**: Change the library once, updates everywhere
2. **Consistent styling**: Apply your CSS Modules styles
3. **Easy replacement**: Swap libraries without touching consuming code
4. **Upstream compatibility**: Library changes don't affect Sharetribe components

### Recommended Libraries

| Category | Library | Use Case |
|----------|---------|----------|
| **Icons** | `lucide-react` | Modern, tree-shakeable icon set |
| **Design Inspiration** | `shadcn/ui` | Modern UI patterns (don't copy code, use as reference) |
| **Headless UI** | `@radix-ui/*` | Accessible, unstyled UI primitives |
| **Headless UI** | `@headlessui/react` | Tailwind-maintained UI components |
| **Date/Time** | `date-fns` | Date utilities (already in template) |
| **Utilities** | `clsx` / `classnames` | Conditional classnames (classnames already in template) |
| **Forms** | React Final Form | Already in template, use this |
| **Carousels** | `embla-carousel-react` | Lightweight, accessible carousel |
| **Animation** | `framer-motion` | React animation library |

### Using shadcn/ui as Design Inspiration

[shadcn/ui](https://ui.shadcn.com/) provides modern, accessible component designs that can be used as **design inspiration**.

**Important**: Do NOT copy shadcn/ui code directly. Instead:

1. YES: Browse shadcn/ui for design patterns and UI ideas
2. YES: Use their visual design as reference for modern, accessible UI
3. YES: Implement the design from scratch using CSS Modules
4. NO: Don't copy their code or use Tailwind classes

**Example - Inspired by shadcn/ui Button:**

```javascript
// Inspired by shadcn/ui design, implemented with CSS Modules
// src/components/CustomButton/CustomButton.js
import classNames from 'classnames';
import css from './CustomButton.module.css';

const CustomButton = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const classes = classNames(
    css.button,
    css[variant],
    css[size]
  );

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default CustomButton;
```

```css
/* CustomButton.module.css - Design inspired by shadcn/ui */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: var(--fontWeightSemiBold);
  transition: var(--transitionStyleButton);
  cursor: pointer;
  border: none;
}

/* Sizes - inspired by shadcn */
.sm {
  padding: 6px 12px;
  font-size: 14px;
}

.md {
  padding: 8px 16px;
  font-size: 16px;
}

.lg {
  padding: 12px 24px;
  font-size: 18px;
}

/* Variants - inspired by shadcn */
.primary {
  background-color: var(--marketplaceColor);
  color: var(--colorWhite);
}

.primary:hover {
  opacity: 0.9;
}

.secondary {
  background-color: transparent;
  color: var(--marketplaceColor);
  border: 1px solid var(--marketplaceColor);
}

.secondary:hover {
  background-color: var(--colorGrey50);
}

.ghost {
  background-color: transparent;
  color: var(--colorGrey700);
}

.ghost:hover {
  background-color: var(--colorGrey100);
}
```

**When to use shadcn/ui for inspiration:**

- YES: Need modern, accessible design patterns
- YES: Want to see best practices for component design
- YES: Building complex UI (dialogs, dropdowns, forms, cards)
- YES: Looking for spacing, sizing, and color patterns

**NO: Avoid these libraries:**

- styled-components (conflicts with CSS Modules requirement)
- emotion (conflicts with CSS Modules requirement)
- Material-UI (too opinionated, conflicts with Sharetribe design)
- Bootstrap (too opinionated, conflicts with Sharetribe design)

---

## Project Structure

```
/
├── src/                          # Frontend React application
│   ├── components/               # 94+ reusable UI components (Sharetribe)
│   ├── containers/               # 33+ page-level containers (Sharetribe)
│   ├── ducks/                    # Redux state (ducks pattern)
│   ├── routing/                  # Route configuration
│   ├── config/                   # App configuration
│   ├── styles/                   # Global CSS and variables
│   ├── util/                     # Utility functions
│   ├── transactions/             # Transaction process logic
│   ├── translations/             # i18n files
│   └── store.js                  # Redux store setup
```

### Where to Add Custom Code

**Recommended locations for customizations:**

```
src/
├── components/
│   └── Custom*/                  # Your custom components (prefix with "Custom")
│
├── containers/
│   └── Custom*/                  # Your custom pages
│
├── ducks/
│   └── custom*.duck.js           # Your custom state slices
│
├── util/
│   └── custom*.js                # Your custom utilities
```

**Prefix custom additions with "Custom" or "custom-" to clearly distinguish from upstream code.**

---

## Styling Guidelines

### Official Design Resources (Figma & Sketch)

**IMPORTANT**: Sharetribe provides official design files for the default template design. Use these as reference when creating custom designs.

**Repository:** https://github.com/sharetribe/design-resources

**What's Included:**

- **Figma files** - Full marketplace design system
- **Sketch files** - Full marketplace design system
- **Component library** - All default UI components with variants
- **Typography system** - Font styles (Inter font from Google Fonts, SF Pro from Apple)
- **Color system** - Brand colors and semantic color tokens
- **Layout variations** - Different transaction processes and page layouts
- **Spacing system** - Consistent spacing tokens

**How to Use:**

1. **For reference** - See default design system (spacing, typography, colors)
2. **For customization** - Edit components while maintaining consistency
3. **For inspiration** - Use as base for custom marketplace designs
4. **For handoff** - Share designs with developers using same component structure

**Accessing Design Files:**

```
1. Visit: https://github.com/sharetribe/design-resources
2. Navigate to /Design folder
3. Download Figma or Sketch files
4. Open in respective design tool
5. Check "VARIATIONS" folder for different layouts
```

**When to Tell Clients About Design Files:**

YES: **Client wants to customize designs** - "Sharetribe provides official Figma/Sketch files you can use as a starting point. They contain all the default components, colors, and layouts."

YES: **Client has a designer** - "Your designer can use the official design files at https://github.com/sharetribe/design-resources as a base."

YES: **Client wants to see default design system** - "You can explore the complete design system in the Figma/Sketch files to understand spacing, typography, and component structure."

**Design System Reference:**

- **Typography**: Uses Inter font (Google Fonts) and SF Pro (Apple)
- **Components**: All components use styles that can be edited globally or customized locally
- **Consistency**: Following the design system ensures your custom designs integrate smoothly with default components

**Contact for Design Resources:**
- Questions/suggestions: hello@sharetribe.com

---

### Technology: CSS Modules Only

**ALWAYS use CSS Modules** for component styling. Never use styled-components, emotion, or inline styles.

**File Structure:**

```
src/components/MyComponent/
├── MyComponent.js
├── MyComponent.module.css        # ← Required for styles
└── MyComponent.example.js
```

**CSS Module Pattern:**

```css
/* MyComponent.module.css */

/* Compose from global styles when appropriate */
.root {
  composes: h3 from global;
  margin-bottom: 24px;
}

/* Use BEM-like naming within component scope */
.container {
  display: flex;
  flex-direction: column;
}

.header {
  padding: 16px;
}

.headerTitle {
  font-weight: var(--fontWeightSemiBold);
}

/* Responsive with custom media queries */
@media (--viewportMedium) {
  .container {
    flex-direction: row;
  }
}
```

**Component Usage:**

```javascript
import css from './MyComponent.module.css';
import classNames from 'classnames';

const MyComponent = (props) => {
  const { rootClassName, className, isActive } = props;

  const classes = classNames(rootClassName || css.root, className, {
    [css.active]: isActive,
  });

  return (
    <div className={classes}>
      <header className={css.header}>
        <h3 className={css.headerTitle}>Title</h3>
      </header>
    </div>
  );
};
```

### Global CSS Variables

Use theme variables from [src/styles/marketplaceDefaults.css](./styles/marketplaceDefaults.css):

```css
/* Colors */
--marketplaceColor
--colorPrimaryButton
--colorSecondaryButton
--colorSuccess
--colorFail
--colorWhite, --colorBlack
--colorGrey50, --colorGrey100, --colorGrey300, --colorGrey700

/* Typography */
--fontFamily
--fontWeightRegular, --fontWeightMedium, --fontWeightSemiBold, --fontWeightBold

/* Spacing */
--borderRadius, --borderRadiusMedium
--boxShadow, --boxShadowButton

/* Transitions */
--transitionStyleButton

/* Media Queries (from customMediaQueries.css) */
@media (--viewportSmall) {
}
@media (--viewportMedium) {
}
@media (--viewportLarge) {
}
@media (--viewportXLarge) {
}
```

### Responsive Design

**Mobile-first approach**. Design for mobile, then enhance for larger screens.

```css
/* Mobile default */
.container {
  padding: 16px;
}

/* Tablet and up */
@media (--viewportMedium) {
  .container {
    padding: 24px;
  }
}

/* Desktop and up */
@media (--viewportLarge) {
  .container {
    padding: 32px;
  }
}
```

---

## React Component Patterns

### Component File Structure

Every component should follow this pattern:

```javascript
import React, { useState } from 'react';
import { bool, string, func, node } from 'prop-types';
import classNames from 'classnames';

import css from './MyComponent.module.css';

/**
 * MyComponent displays... [description]
 *
 * @component
 * @param {Object} props
 * @param {string} props.title - The component title
 * @param {boolean} props.isActive - Whether component is active
 * @param {function} props.onAction - Callback for user action
 * @param {string} props.rootClassName - Override root class
 * @param {string} props.className - Additional classes
 */
const MyComponent = (props) => {
  const { title, isActive, onAction, rootClassName, className } = props;

  const [localState, setLocalState] = useState(false);

  const classes = classNames(rootClassName || css.root, className);

  return <div className={classes}>{/* Component JSX */}</div>;
};

MyComponent.defaultProps = {
  rootClassName: null,
  className: null,
  isActive: false,
};

MyComponent.propTypes = {
  title: string.isRequired,
  isActive: bool,
  onAction: func.isRequired,
  rootClassName: string,
  className: string,
};

export default MyComponent;
```

### Functional Components with Hooks

**ALWAYS** use functional components with hooks (not class components).

```javascript
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

const MyComponent = (props) => {
  // Hooks order: context, redux, state, effects, callbacks
  const config = useConfiguration();
  const routeConfig = useRouteConfiguration();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Side effects
  }, []);

  const handleClick = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (/* JSX */);
};
```

### Context Providers

Use React Context for configuration and routing:

```javascript
// Get app configuration
import { useConfiguration } from '../../context/configurationContext';
const config = useConfiguration();
const { currency, listingMinimumPriceSubUnits } = config;

// Get route configuration
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
const routeConfig = useRouteConfiguration();
const listingPageRoute = findRouteByRouteName('ListingPage', routeConfig);
```

### Code Splitting with Loadable

Use `@loadable/component` for lazy loading pages:

```javascript
import loadable from '@loadable/component';

const ListingPage = loadable(
  () => import(/* webpackChunkName: "ListingPage" */ '../containers/ListingPage')
);

// With preloading
const routeConfiguration = [
  {
    path: '/listing/:id/:slug',
    name: 'ListingPage',
    component: ListingPage,
    loadData: ListingPageLoader,
  },
];
```

---

## Redux State Management

### Architecture: Redux Toolkit + Ducks Pattern

This project uses **Redux Toolkit** with the **Ducks pattern** (actions, reducers, thunks in one file).

**Key Files:**

- [src/store.js](./store.js) - Store configuration
- [src/ducks/*.duck.js](./ducks/) - Global state slices (Sharetribe)
- `src/containers/PageName/PageName.duck.js` - Page-specific state

### Adding Custom Redux State

**Create new duck files for custom features** (don't modify existing Sharetribe ducks):

```javascript
// src/ducks/customFeature.duck.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../util/errors';

// ============================================
// Async Thunks
// ============================================

/**
 * Fetch custom data from API
 * Note: SDK is available as 'extra' argument via store configuration
 */
export const fetchCustomDataThunk = createAsyncThunk(
  'customFeature/fetchData',
  async (params, { getState, extra: sdk, rejectWithValue }) => {
    try {
      const response = await sdk.listings.query({
        include: ['author', 'images'],
        ...params,
      });

      return response.data.data;
    } catch (e) {
      return rejectWithValue(storableError(e));
    }
  }
);

// ============================================
// Slice (Reducer + Actions)
// ============================================

const initialState = {
  data: null,
  isLoading: false,
  error: null,
};

const customFeatureSlice = createSlice({
  name: 'customFeature',
  initialState,
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomDataThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomDataThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchCustomDataThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setData, clearError } = customFeatureSlice.actions;
export default customFeatureSlice.reducer;
```

**Register custom duck in store:**

```javascript
// src/ducks/index.js
import customFeature from './customFeature.duck';

export {
  // ... existing Sharetribe ducks
  customFeature,
};
```

### Using Redux in Components

```javascript
import { useSelector, useDispatch } from 'react-redux';
import { fetchCustomDataThunk, clearError } from '../../ducks/customFeature.duck';

const MyComponent = () => {
  const dispatch = useDispatch();

  // Select state
  const { data, isLoading, error } = useSelector(state => state.customFeature);
  const currentUser = useSelector(state => state.user.currentUser);

  // Dispatch thunks
  useEffect(() => {
    dispatch(fetchCustomDataThunk({ perPage: 10 }));
  }, [dispatch]);

  return (/* JSX */);
};
```

### Sharetribe Global Redux Modules

**DO NOT MODIFY** these existing ducks in [src/ducks/](./ducks/):

- `auth.duck.js` - Authentication state
- `user.duck.js` - Current user data
- `stripe.duck.js` - Stripe payment state
- `stripeConnectAccount.duck.js` - Seller payout accounts
- `paymentMethods.duck.js` - User payment methods
- `routing.duck.js` - URL/routing state
- `ui.duck.js` - UI state (modals, menus)
- `hostedAssets.duck.js` - CDN asset caching
- `marketplaceData.duck.js` - Marketplace configuration

---

## Form Handling with React Final Form

Use **React Final Form** for all forms. Never use uncontrolled inputs or other form libraries.

### Form Component Pattern

```javascript
import { Form as FinalForm, Field } from 'react-final-form';
import FieldTextInput from '../../components/FieldTextInput/FieldTextInput';
import { required } from '../../util/validators';

const MyForm = (props) => {
  const { onSubmit, initialValues } = props;

  return (
    <FinalForm
      onSubmit={onSubmit}
      initialValues={initialValues}
      render={({ handleSubmit, submitting, invalid }) => (
        <form onSubmit={handleSubmit} className={css.form}>
          <Field
            name="title"
            component={FieldTextInput}
            validate={required('Title is required')}
            label="Title"
          />

          <button type="submit" disabled={submitting || invalid}>
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}
    />
  );
};
```

### Existing Field Components

Sharetribe provides many reusable Field components in [src/components/](./components/):

- `FieldTextInput` - Text input
- `FieldSelect` - Dropdown select
- `FieldCheckbox` - Checkbox
- `FieldRadioButton` - Radio button
- `FieldCurrencyInput` - Money input
- `FieldDateInput` - Date picker

**Use these existing components whenever possible.**

---

## Routing

### Connecting Pages to Routes

Pages are defined in [src/routing/routeConfiguration.js](./routing/routeConfiguration.js):

```javascript
// src/routing/routeConfiguration.js
import CustomMyPage, {
  loadData as CustomMyPageLoader,
} from '../containers/CustomMyPage/CustomMyPage';

const routeConfiguration = () => {
  return [
    // ... existing Sharetribe routes
    {
      path: '/custom-page',
      name: 'CustomMyPage',
      component: CustomMyPage,
      loadData: CustomMyPageLoader,
    },
  ];
};
```

### Page Data Loading Pattern

Pages use a `loadData` function for SSR and initial data fetching:

```javascript
// CustomMyPage.duck.js
export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const { id } = params;

  return sdk.listings
    .query({
      include: ['author', 'images'],
    })
    .then((response) => {
      dispatch(setPageData(response.data.data));
    })
    .catch((e) => {
      dispatch(setError(storableError(e)));
    });
};
```

---

## Getting Help

- **Sharetribe Docs**: https://www.sharetribe.com/docs
- **Help Center**: https://www.sharetribe.com/help/en/
- **API Reference**: https://www.sharetribe.com/api-reference
- **Design Resources**: https://github.com/sharetribe/design-resources

---

**Remember**: For page-level patterns (PageBuilder, SectionBuilder, custom pages), see [src/containers/AGENTS.md](./containers/AGENTS.md). For backend patterns, see [server/AGENTS.md](../server/AGENTS.md).
