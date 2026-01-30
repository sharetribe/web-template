# src/components/AGENTS.md - Component Development Guide

> **This file contains component development patterns for the Sharetribe Web Template.** Use this when creating new components, using external libraries, and styling components.

**You are here:** `/src/components/AGENTS.md`
**Main guide:** [`/AGENTS.md`](../../AGENTS.md) (includes Console Configuration)
**Frontend patterns:** [`/src/AGENTS.md`](../AGENTS.md)
**Page patterns:** [`/src/containers/AGENTS.md`](../containers/AGENTS.md)
**Backend patterns:** [`/server/AGENTS.md`](../../server/AGENTS.md)

---

## Component Creation Principles

### CRITICAL: Never Modify Sharetribe Components

**NEVER edit files in existing Sharetribe component directories.** Always create new components.

**NO: Modifying Sharetribe component**
```javascript
// NO: src/components/ListingCard/ListingCard.js
const ListingCard = (props) => {
  // Adding custom fields directly - BAD!
};
```

**YES: Creating new component that wraps Sharetribe component**
```javascript
// YES: src/components/CustomListingCard/CustomListingCard.js
import { ListingCard } from '../ListingCard/ListingCard';
import css from './CustomListingCard.module.css';

const CustomListingCard = (props) => {
  return (
    <div className={css.wrapper}>
      <div className={css.customBadge}>Featured</div>
      <ListingCard {...props} />
    </div>
  );
};
```

### Component File Structure

Every component should follow this structure:

```
src/components/CustomMyComponent/
├── CustomMyComponent.js              # Main component file
├── CustomMyComponent.module.css      # CSS Module (required)
├── CustomMyComponent.example.js      # Optional: Styleguide examples
└── index.js                          # Re-export for clean imports
```

**Component Template:**

```javascript
// src/components/CustomButton/CustomButton.js
import React from 'react';
import { bool, string, func, node } from 'prop-types';
import classNames from 'classnames';

import css from './CustomButton.module.css';

/**
 * CustomButton - A customized button component
 *
 * @component
 * @param {Object} props
 * @param {string} props.variant - Button variant (primary, secondary, ghost)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {function} props.onClick - Click handler
 * @param {ReactNode} props.children - Button content
 * @param {string} props.rootClassName - Override root class
 * @param {string} props.className - Additional classes
 */
const CustomButton = (props) => {
  const {
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
    children,
    rootClassName,
    className,
  } = props;

  const classes = classNames(
    rootClassName || css.button,
    className,
    css[variant],
    css[size],
    {
      [css.disabled]: disabled,
    }
  );

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};

CustomButton.defaultProps = {
  variant: 'primary',
  size: 'md',
  disabled: false,
  rootClassName: null,
  className: null,
};

CustomButton.propTypes = {
  variant: string,
  size: string,
  disabled: bool,
  onClick: func,
  children: node.isRequired,
  rootClassName: string,
  className: string,
};

export default CustomButton;
```

**Index file for clean imports:**

```javascript
// src/components/CustomButton/index.js
export { default as CustomButton } from './CustomButton';
```

---

## Component Styleguide & Preview

### Using the Styleguide Page

The Sharetribe Web Template includes a **Styleguide page** that provides a living component library where you can preview, test, and reference all components in isolation.

**Accessing the Styleguide:**
- Navigate to `/styleguide` route in your browser (e.g., `http://localhost:3000/styleguide`)
- Available in all environments (may require authentication if marketplace is private)

**Features:**
- **Filter by category**: Design elements, Shared components, Page-related components
- **View individual components**: See each component with different prop variations
- **Raw mode**: View components full-screen without wrapper styles
- **Live examples**: Test interactive components (buttons, forms, modals, etc.)
- **Component reference**: See how existing Sharetribe components work

### Adding Your Component to the Styleguide

To make your custom component visible in the styleguide, create a `.example.js` file:

**Example file structure:**

```javascript
// src/components/CustomButton/CustomButton.example.js
import React from 'react';
import { H3 } from '../../components';
import CustomButton from './CustomButton';

const CustomButtonExamples = () => {
  return (
    <div>
      <H3>Primary variant:</H3>
      <CustomButton variant="primary" onClick={() => alert('Clicked!')}>
        Primary Button
      </CustomButton>

      <H3>Secondary variant:</H3>
      <CustomButton variant="secondary">
        Secondary Button
      </CustomButton>

      <H3>Disabled state:</H3>
      <CustomButton disabled>
        Disabled Button
      </CustomButton>

      <H3>With icon:</H3>
      <CustomButton>
        <Heart size={16} />
        <span>Favorite</span>
      </CustomButton>
    </div>
  );
};

export const CustomButtonExample = {
  component: CustomButtonExamples,
  group: 'buttons',
  description: 'Custom button component with multiple variants',
};

export const CustomButtonPrimary = {
  component: CustomButton,
  props: {
    variant: 'primary',
    children: 'Click me',
  },
  group: 'buttons',
  description: 'Primary button variant',
};
```

**Example object properties:**

```javascript
export const ExampleName = {
  component: YourComponent,           // Required: React component to render
  group: 'group-name',                // Optional: Category for navigation
  description: 'Description text',    // Optional: Description shown in styleguide
  props: {},                          // Optional: Props to pass to component
  useDefaultWrapperStyles: true,      // Optional: Add default spacing (default: true)
  rawOnly: false,                     // Optional: Only show in raw mode (default: false)
};
```

**Group naming conventions:**
- **Design elements**: Use prefix `elements:` (e.g., `elements:buttons`, `elements:typography`)
- **Page components**: Use prefix `page:` (e.g., `page:listing`, `page:search`)
- **Shared components**: No prefix (e.g., `forms`, `navigation`, `modals`)
- **Miscellaneous**: Use `misc` group or omit group property

**Register your example in src/examples.js:**

```javascript
// src/examples.js
// ... other imports
import * as CustomButton from './components/CustomButton/CustomButton.example';

// ... at the bottom, export your component
export { CustomButton };
```

**Multiple examples per component:**

You can export multiple examples to showcase different states or variations:

```javascript
// src/components/CustomCard/CustomCard.example.js
export const CustomCardDefault = {
  component: CustomCard,
  props: { title: 'Default Card', children: 'Content here' },
  group: 'cards',
};

export const CustomCardWithImage = {
  component: CustomCard,
  props: {
    title: 'Card with Image',
    image: 'https://via.placeholder.com/300',
    children: 'Content with image',
  },
  group: 'cards',
};

export const CustomCardInteractive = {
  component: InteractiveCardExample,
  group: 'cards',
  description: 'Card with hover effects and animations',
};
```

**Testing workflow:**
1. Create your component (`CustomButton.js`)
2. Create example file (`CustomButton.example.js`)
3. Register in `src/examples.js`
4. Visit `/styleguide` in browser
5. Filter to your component's group
6. Test different states and variations
7. Use "raw" link to view component in isolation

**Benefits of using the Styleguide:**
- **Visual testing**: See components render correctly before using in pages
- **Documentation**: Provides living documentation for team members
- **Consistency**: Reference existing patterns and design elements
- **Debugging**: Isolate component issues without page context
- **Design handoff**: Share component previews with designers

---

## Using External Libraries

### Icons: lucide-react (Recommended)

**YES: Use lucide-react for icons**

```bash
yarn add lucide-react
```

```javascript
// src/components/CustomListingCard/CustomListingCard.js
import { Heart, Star, MapPin, Calendar } from 'lucide-react';
import css from './CustomListingCard.module.css';

const CustomListingCard = ({ listing }) => {
  return (
    <div className={css.card}>
      <div className={css.location}>
        <MapPin className={css.icon} size={16} />
        <span>{listing.location}</span>
      </div>

      <div className={css.rating}>
        <Star className={css.icon} size={16} fill="currentColor" />
        <span>{listing.rating}</span>
      </div>

      <button className={css.favoriteButton}>
        <Heart size={20} />
      </button>
    </div>
  );
};
```

**Why lucide-react?**
- Tree-shakeable (only imports icons you use)
- Consistent design
- Highly customizable (size, color, strokeWidth)
- Accessible by default
- Modern and clean aesthetic

**Common icons:**
- `Heart`, `Star`, `MapPin`, `Calendar`, `Clock`, `User`
- `ChevronRight`, `ChevronLeft`, `ChevronUp`, `ChevronDown`
- `X`, `Menu`, `Search`, `Filter`
- `Check`, `AlertCircle`, `Info`, `Mail`

### UI Primitives: Radix UI (Recommended)

**YES: Use Radix UI for accessible headless components**

Radix UI provides unstyled, accessible component primitives that you style with CSS Modules.

```bash
yarn add @radix-ui/react-dialog
yarn add @radix-ui/react-dropdown-menu
yarn add @radix-ui/react-tabs
# etc.
```

**IMPORTANT: Always wrap Radix components in custom components**

**NO: Using Radix directly throughout codebase**
```javascript
// NO: Don't use Radix components directly everywhere
import * as Dialog from '@radix-ui/react-dialog';

const MyPage = () => {
  return <Dialog.Root>...</Dialog.Root>;
};
```

**YES: Wrap in custom component**
```javascript
// YES: src/components/CustomModal/CustomModal.js
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import css from './CustomModal.module.css';

const CustomModal = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={css.overlay} />
        <Dialog.Content className={css.content}>
          <div className={css.header}>
            <Dialog.Title className={css.title}>{title}</Dialog.Title>
            <Dialog.Close className={css.closeButton}>
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className={css.body}>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CustomModal;
```

**Why wrap Radix components?**
1. **Single source of truth** - Change styling once, updates everywhere
2. **Consistent styling** - Apply CSS Modules globally
3. **Easy replacement** - Swap libraries without touching consuming code
4. **Upstream compatibility** - Library changes don't affect Sharetribe components

**Recommended Radix UI components:**

| Component | Use Case |
|-----------|----------|
| `@radix-ui/react-dialog` | Modals, dialogs, overlays |
| `@radix-ui/react-dropdown-menu` | Dropdown menus, action menus |
| `@radix-ui/react-tabs` | Tab navigation |
| `@radix-ui/react-accordion` | Collapsible sections, FAQ |
| `@radix-ui/react-select` | Custom select dropdowns |
| `@radix-ui/react-tooltip` | Tooltips, popovers |
| `@radix-ui/react-checkbox` | Custom checkboxes |
| `@radix-ui/react-radio-group` | Custom radio buttons |
| `@radix-ui/react-switch` | Toggle switches |
| `@radix-ui/react-slider` | Range sliders |

### Design Inspiration: shadcn/ui

**YES: Use shadcn/ui for design inspiration**
**NO: Do NOT copy shadcn/ui code directly**

[shadcn/ui](https://ui.shadcn.com/) provides excellent design patterns and component examples, but uses Tailwind CSS. You should:

1. **YES: Browse shadcn/ui** for modern UI patterns and component designs
2. **YES: Use their visual design** as reference for spacing, colors, typography
3. **YES: Implement the design from scratch** using CSS Modules
4. **NO: Do NOT copy their code** or use Tailwind classes

**Example - Inspired by shadcn/ui Card:**

Visit: https://ui.shadcn.com/docs/components/card

**shadcn/ui version (uses Tailwind):**
```javascript
// NO: Don't copy this code
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
  <div className="flex flex-col space-y-1.5 p-6">
    <h3 className="text-2xl font-semibold leading-none tracking-tight">
      Card Title
    </h3>
  </div>
</div>
```

**Our version (CSS Modules, inspired by shadcn design):**

```javascript
// YES: src/components/CustomCard/CustomCard.js
import css from './CustomCard.module.css';

const CustomCard = ({ title, description, children }) => {
  return (
    <div className={css.card}>
      <div className={css.header}>
        <h3 className={css.title}>{title}</h3>
        {description && <p className={css.description}>{description}</p>}
      </div>
      <div className={css.content}>
        {children}
      </div>
    </div>
  );
};
```

```css
/* YES: CustomCard.module.css - Design inspired by shadcn/ui */
.card {
  border-radius: 8px;
  border: 1px solid var(--colorGrey300);
  background-color: var(--colorWhite);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px;
}

.title {
  font-size: 24px;
  font-weight: var(--fontWeightSemiBold);
  line-height: 1;
  letter-spacing: -0.01em;
  margin: 0;
}

.description {
  font-size: 14px;
  color: var(--colorGrey700);
  margin: 0;
}

.content {
  padding: 0 24px 24px;
}
```

**When to use shadcn/ui for inspiration:**
- Building complex UI (cards, dialogs, forms, tables)
- Need modern, accessible design patterns
- Want to see best practices for component structure
- Looking for spacing, sizing, and color patterns

**shadcn/ui components to check out:**
- Card - https://ui.shadcn.com/docs/components/card
- Button - https://ui.shadcn.com/docs/components/button
- Dialog - https://ui.shadcn.com/docs/components/dialog
- Dropdown Menu - https://ui.shadcn.com/docs/components/dropdown-menu
- Tabs - https://ui.shadcn.com/docs/components/tabs
- Form - https://ui.shadcn.com/docs/components/form

### Animation Libraries: Framer Motion (Recommended)

**YES: Use Framer Motion for animations**

Framer Motion is a production-ready animation library for React that works perfectly with CSS Modules.

```bash
yarn add framer-motion
```

**Use cases for Framer Motion:**
- Page transitions
- Component enter/exit animations
- Gesture-based interactions (drag, swipe)
- Scroll-triggered animations
- Complex orchestrated animations
- Layout animations (reordering, resizing)

**Example - Animated Card:**

```javascript
// src/components/CustomAnimatedCard/CustomAnimatedCard.js
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import css from './CustomAnimatedCard.module.css';

const CustomAnimatedCard = ({ listing, onFavorite }) => {
  return (
    <motion.div
      className={css.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <img src={listing.image} alt={listing.title} className={css.image} />

      <div className={css.content}>
        <h3 className={css.title}>{listing.title}</h3>
        <p className={css.price}>{listing.price}</p>

        <motion.button
          className={css.favoriteButton}
          onClick={onFavorite}
          whileTap={{ scale: 0.9 }}
        >
          <Heart size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
};
```

**Example - Stagger Children Animation:**

```javascript
// src/components/CustomListingGrid/CustomListingGrid.js
import { motion } from 'framer-motion';
import { CustomListingCard } from '../CustomListingCard';
import css from './CustomListingGrid.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const CustomListingGrid = ({ listings }) => {
  return (
    <motion.div
      className={css.grid}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {listings.map(listing => (
        <motion.div key={listing.id} variants={itemVariants}>
          <CustomListingCard listing={listing} />
        </motion.div>
      ))}
    </motion.div>
  );
};
```

**Example - Layout Animations:**

```javascript
// src/components/CustomFilterPanel/CustomFilterPanel.js
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import css from './CustomFilterPanel.module.css';

const CustomFilterPanel = ({ isExpanded, onToggle, children }) => {
  return (
    <div className={css.panel}>
      <motion.button
        className={css.toggle}
        onClick={onToggle}
        whileHover={{ backgroundColor: 'var(--colorGrey100)' }}
      >
        <span>Filters</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={css.content}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

**Example - Scroll-Triggered Animation:**

```javascript
// src/components/CustomHeroSection/CustomHeroSection.js
import { motion, useScroll, useTransform } from 'framer-motion';
import css from './CustomHeroSection.module.css';

const CustomHeroSection = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);

  return (
    <motion.div
      className={css.hero}
      style={{ opacity, scale }}
    >
      <h1 className={css.title}>Welcome to Our Marketplace</h1>
      <p className={css.subtitle}>Find amazing things</p>
    </motion.div>
  );
};
```

**Best Practices:**

1. **Use `layoutId` for shared element transitions**
2. **Wrap conditionally rendered components in `<AnimatePresence>`**
3. **Use variants for complex, coordinated animations**
4. **Keep animations subtle and performant** (avoid animating expensive properties)
5. **Prefer `transform` and `opacity` for performance** (GPU-accelerated)

**Performance Tips:**

```javascript
// GOOD: Animate transform and opacity (GPU-accelerated)
<motion.div
  animate={{ opacity: 1, scale: 1 }}
/>

// AVOID: Animating width/height (triggers layout recalculation)
<motion.div
  animate={{ width: 200, height: 300 }}
/>

// INSTEAD: Use scaleX/scaleY
<motion.div
  animate={{ scaleX: 2, scaleY: 1.5 }}
/>
```

**Other Animation Libraries:**

While Framer Motion is recommended, these are also acceptable:

- `react-spring` - Physics-based animations
- `gsap` - Professional animation library (requires custom React wrapper)
- CSS animations/transitions - For simple animations

**Animation Library Resources:**

- **Framer Motion Docs**: https://www.framer.com/motion/
- **Framer Motion Examples**: https://www.framer.com/motion/examples/

---

## Styling Components

### CSS Modules (Required)

**ALWAYS use CSS Modules** for component styling. Never use inline styles, styled-components, or Tailwind.

```javascript
import css from './CustomComponent.module.css';

const CustomComponent = () => {
  return <div className={css.root}>...</div>;
};
```

### Using Global Design Tokens

Use CSS variables from [src/styles/marketplaceDefaults.css](../styles/marketplaceDefaults.css):

```css
/* CustomComponent.module.css */
.button {
  /* Colors */
  background-color: var(--marketplaceColor);
  color: var(--colorWhite);
  border: 1px solid var(--colorGrey300);

  /* Typography */
  font-family: var(--fontFamily);
  font-weight: var(--fontWeightSemiBold);

  /* Spacing */
  padding: 12px 24px;
  border-radius: var(--borderRadius);

  /* Effects */
  box-shadow: var(--boxShadowButton);
  transition: var(--transitionStyleButton);
}

.button:hover {
  opacity: 0.9;
}
```

### Responsive Design

Use custom media queries from [src/styles/customMediaQueries.css](../styles/customMediaQueries.css):

```css
/* CustomComponent.module.css */

/* Mobile default */
.container {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

/* Tablet and up (768px+) */
@media (--viewportMedium) {
  .container {
    padding: 24px;
    flex-direction: row;
  }
}

/* Desktop and up (1024px+) */
@media (--viewportLarge) {
  .container {
    padding: 32px;
    max-width: 1200px;
  }
}
```

### Composing Styles

Use `classNames` utility for conditional classes:

```javascript
import classNames from 'classnames';
import css from './CustomButton.module.css';

const CustomButton = ({ variant, isLoading, disabled, className }) => {
  const classes = classNames(
    css.button,
    css[variant],
    {
      [css.loading]: isLoading,
      [css.disabled]: disabled,
    },
    className
  );

  return <button className={classes}>...</button>;
};
```

---

## Component Patterns

### Wrapping Sharetribe Components

**Pattern for extending existing components:**

```javascript
// src/components/CustomListingCard/CustomListingCard.js
import { ListingCard } from '../ListingCard/ListingCard';
import { Heart, Star } from 'lucide-react';
import css from './CustomListingCard.module.css';

const CustomListingCard = (props) => {
  const { listing, onFavorite, isFavorited } = props;

  // Custom logic
  const rating = listing.attributes.publicData.rating;

  return (
    <div className={css.wrapper}>
      {/* Custom additions */}
      <div className={css.customHeader}>
        <div className={css.rating}>
          <Star size={16} fill="currentColor" />
          <span>{rating}</span>
        </div>
        <button
          className={css.favoriteButton}
          onClick={() => onFavorite(listing.id)}
        >
          <Heart
            size={20}
            fill={isFavorited ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Original Sharetribe component */}
      <ListingCard {...props} />
    </div>
  );
};

export default CustomListingCard;
```

### Using Radix UI + lucide-react

**Complete example of custom component using both libraries:**

```javascript
// src/components/CustomDropdownMenu/CustomDropdownMenu.js
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Edit, Trash, Share } from 'lucide-react';
import css from './CustomDropdownMenu.module.css';

const CustomDropdownMenu = ({ listing, onEdit, onDelete, onShare }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={css.trigger}>
        <MoreVertical size={20} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={css.content}>
          <DropdownMenu.Item
            className={css.item}
            onSelect={onEdit}
          >
            <Edit size={16} />
            <span>Edit listing</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={css.item}
            onSelect={onShare}
          >
            <Share size={16} />
            <span>Share listing</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className={css.separator} />

          <DropdownMenu.Item
            className={css.itemDanger}
            onSelect={onDelete}
          >
            <Trash size={16} />
            <span>Delete listing</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default CustomDropdownMenu;
```

```css
/* CustomDropdownMenu.module.css */
.trigger {
  all: unset;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--borderRadius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.trigger:hover {
  background-color: var(--colorGrey100);
}

.content {
  min-width: 200px;
  background-color: var(--colorWhite);
  border-radius: var(--borderRadius);
  padding: 8px;
  box-shadow: 0 10px 38px -10px rgba(22, 23, 24, 0.35);
  animation: slideUpAndFade 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.item {
  all: unset;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--colorGrey700);
}

.item:hover {
  background-color: var(--colorGrey100);
  outline: none;
}

.itemDanger {
  composes: item;
  color: var(--colorFail);
}

.separator {
  height: 1px;
  background-color: var(--colorGrey300);
  margin: 8px 0;
}
```

---

## Component Naming Conventions

### Prefix Custom Components

**Always prefix custom components with "Custom" to distinguish from Sharetribe components:**

- `CustomButton`
- `CustomCard`
- `CustomListingCard`
- `CustomModal`
- `CustomDropdownMenu`

**This makes it clear:**
- Which components are custom
- Which components are from Sharetribe
- What can be safely modified
- What should not be touched

---

## Libraries to AVOID

**NO: Do NOT use these in production:**

- `styled-components` - Conflicts with CSS Modules requirement
- `emotion` - Conflicts with CSS Modules requirement
- `@emotion/styled` - Conflicts with CSS Modules requirement
- `tailwindcss` - Conflicts with CSS Modules requirement
- Material-UI / `@mui/material` - Too opinionated, conflicts with Sharetribe design
- Bootstrap - Too opinionated, conflicts with Sharetribe design
- Ant Design - Too opinionated, conflicts with Sharetribe design

**Use CSS Modules + Radix UI + lucide-react instead.**

---

## Getting Help

- **Sharetribe Docs**: https://www.sharetribe.com/docs
- **Radix UI Docs**: https://www.radix-ui.com/primitives/docs/overview/introduction
- **lucide-react Icons**: https://lucide.dev/icons/
- **shadcn/ui (inspiration)**: https://ui.shadcn.com/
- **Design Resources**: https://github.com/sharetribe/design-resources

---

**Remember**: Create new components, never modify Sharetribe components. Wrap external libraries in custom components. Use CSS Modules for all styling.
