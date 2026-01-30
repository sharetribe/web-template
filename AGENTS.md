# AGENTS.md - AI Agent Guidelines for Sharetribe Web Template

> **This file provides guidance for AI agents working with the Sharetribe Web Template.** For specialized topics, see the linked documentation files below.

**🎯 Agent Role**: This repository is shared with **clients for design and UI customization**. The AI agent focuses on frontend design work (custom components, styling, layouts, Console configuration). Deep technical work (transaction processes, authentication, email templates, booking logic) is handled by the developer.

---

## Documentation Navigation

**You are here:** `/AGENTS.md` (Overview, Critical Rules & Console Configuration)

**This file contains:**
- Overview & Critical Rules (top of file)
- Agent Scope & Workflow
- Quick Reference
- **Sharetribe Console Configuration** (detailed section below)
  - Branding, Layout, Search, Pages, Sections
  - Listing Fields, User Fields, Categories
  - Extended Data & Search Schemas
  - Console screenshot references

**Specialized Documentation:**

- **[src/AGENTS.md](./src/AGENTS.md)** - Frontend development patterns
  - React component patterns & hooks
  - Redux state management
  - Styling with CSS Modules
  - Forms, routing, external libraries

- **[src/components/AGENTS.md](./src/components/AGENTS.md)** - Component creation guide
  - Component creation principles & file structure
  - Using lucide-react icons
  - Using Radix UI primitives
  - Framer Motion animations
  - shadcn/ui design inspiration

- **[src/containers/AGENTS.md](./src/containers/AGENTS.md)** - Page & container patterns
  - PageBuilder & SectionBuilder architecture
  - Landing page customization
  - Search/Listing page variants
  - Custom page creation & data loading

- **[server/AGENTS.md](./server/AGENTS.md)** - Backend patterns
  - Express SSR architecture
  - API endpoints & environment variables
  - Server-side rendering patterns

---

## Project Overview

This is the **Sharetribe Web Template** - a production-ready React marketplace application built on top of the [Sharetribe Marketplace API](https://www.sharetribe.com/docs).

- **Upstream Repository**: https://github.com/sharetribe/web-template
- **Official Docs**: https://www.sharetribe.com/docs
- **API Reference**: https://www.sharetribe.com/api-reference
- **Frontend**: React 18.3 + Redux Toolkit + React Router v5
- **Backend**: Express 5.2 with SSR (Server-Side Rendering)
- **Styling**: CSS Modules with PostCSS
- **Forms**: React Final Form
- **i18n**: React Intl

---

## Critical Rules - Read First

### Upstream Compatibility Strategy

**EXTREMELY IMPORTANT**: This template is maintained by Sharetribe and receives regular updates. Your customizations must coexist with upstream changes.

**✅ ALWAYS use composition (extend/wrap):**
```javascript
// ✅ CORRECT - Composition
import { ListingCard } from '../../components';
import css from './CustomListingCard.module.css';

const CustomListingCard = ({ listing, ...props }) => {
  return (
    <div className={css.wrapper}>
      <div className={css.customBadge}>Featured</div>
      <ListingCard listing={listing} {...props} />
    </div>
  );
};
```

**❌ NEVER modify Sharetribe components directly:**
```javascript
// ❌ WRONG - Direct modification
// Editing src/components/ListingCard/ListingCard.js directly
// This breaks when Sharetribe updates the component
```

### Why This Matters

- Sharetribe releases template updates regularly
- Direct modifications = merge conflicts and broken functionality
- Composition = your customizations survive updates
- **Client can pull upstream changes without breaking custom code**

### Component Extension Pattern

When customizing any Sharetribe component:

1. **Create new component file** in your own directory
2. **Import original component** from Sharetribe
3. **Wrap or extend** with your customizations
4. **Use CSS Modules** for styling (never modify Sharetribe's CSS files)

### ⚠️ CRITICAL: View + Styling Only Pattern

**The most important rule:** Keep customizations to **view and styling**. Delegate all functionality to the original Sharetribe components.

**Why:** When Sharetribe updates a component with bug fixes, new features, or security patches, your wrapped version automatically gets those updates.

#### ✅ The Right Pattern

```javascript
// ✅ CORRECT - View and styling only
const CustomListingCard = (props) => {
  return (
    <div className={css.wrapper}>
      {/* Add visual elements */}
      <div className={css.badge}>Featured</div>
      {/* Wrap the original - it handles all logic */}
      <ListingCard {...props} />
    </div>
  );
};
```

**Key rules:**
- ✅ Wrap the component (don't reimplement it)
- ✅ Add visual elements around it
- ✅ CSS positions/styles elements
- ✅ No Redux state in your wrapper
- ✅ No form handling in your wrapper
- ✅ No duplicating logic

#### ❌ What NOT to Do: Don't Reimplement

```javascript
// ❌ WRONG - You've duplicated all the logic
const CustomListingCard = (props) => {
  // ❌ Now you handle Redux state
  const dispatch = useDispatch();

  // ❌ Now you handle data fetching
  useEffect(() => {
    dispatch(fetchListing(props.listingId));
  }, []);

  // ❌ You're maintaining a parallel version
  return <div>...</div>;
};
```

**Why:**
- If Sharetribe fixes a bug, you don't get it
- If they add features, you have to manually merge
- You're now maintaining two versions of the same code
- Updates become a nightmare

### ✅ Minimal CSS Overrides

```css
/* ✅ YES - Positioning and layout */
.wrapper {
  display: flex;
  gap: 16px;
}

.badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

/* ❌ NO - Don't override component internals */
.wrapper :global(.cardTitle) {
  font-size: 20px; /* Don't do this */
}

.wrapper :global(.cardContent) {
  padding: 24px; /* Don't do this */
}
```

**Rule:** Use `:global()` only for positioning/layout. Never to override styling or hide elements you didn't add.

### Container-Specific Guidance

Each major container has its own customization guide. **Always read the container-specific AGENTS.md for recommendations:**

- `src/containers/AuthenticationPage/AGENTS.md` - Login/signup customization (minimal CSS, wrap only)
- Other containers - (Create as needed, following the same view+styling-only pattern)

---

## Critical: Always Check for Build Errors

**NEVER declare work complete without verifying:**

1. **Check browser console** - Look for JavaScript errors
2. **Check build output** - Ensure no TypeScript/compilation errors
3. **Test the feature** - Actually use it in the browser, not just look at code
4. **Verify no regressions** - Check related pages still work

If errors appear in browser console:
- READ the error message carefully
- Identify the file and line number
- Check what props are missing or wrong
- Fix and verify again

**Never tell user "it's done" until you've verified zero errors in browser.**

---

## Git Workflow - Always Use New Branches

**CRITICAL:** Always create a new git branch when working on features or changes.

### Branch Creation Pattern

**Before starting ANY work:**

```bash
# Check current branch
git status

# Create and switch to new branch
git checkout -b feature/custom-testimonials
# or
git checkout -b fix/listing-card-styling
# or
git checkout -b enhancement/search-filters
```

**Branch naming conventions:**

| Type | Prefix | Example |
|------|--------|---------|
| New feature | `feature/` | `feature/custom-pricing-table` |
| Bug fix | `fix/` | `fix/mobile-nav-overlap` |
| Enhancement | `enhancement/` | `enhancement/listing-card-badges` |
| Styling | `style/` | `style/hero-section-redesign` |
| Documentation | `docs/` | `docs/update-component-guide` |

**Keep branch names:**
- Lowercase with hyphens
- Descriptive (not "updates" or "changes")
- Focused on single feature/fix

### Workflow

**1. Create branch for work:**

```bash
git checkout -b feature/custom-auth-layout
```

**2. Make changes and commit:**

```bash
git add .
git commit -m "Add split-screen authentication layout with branding"
```

**3. Push to remote:**

```bash
git push -u origin feature/custom-auth-layout
```

**4. When ready, create pull request:**

Use GitHub UI or CLI to create PR from your branch to `main` (or whatever the main branch is).

**5. After PR merged, switch back to main:**

```bash
git checkout main
git pull origin main
```

### Why This Matters

✅ **Benefits:**
- Isolates changes (easier to test, review, rollback)
- Keeps main branch stable
- Enables parallel work on multiple features
- Makes code review clearer
- Easier to track what changed and why

❌ **Never work directly on main/master:**
- Risky (no easy rollback)
- Can't isolate changes
- Harder to collaborate
- Makes debugging harder

### Checking Current Branch

**Before starting work, always check:**

```bash
git status

# Output shows:
# On branch main  (❌ Don't work here!)
# or
# On branch feature/custom-layout  (✅ Good!)
```

**If on main branch:**

```bash
# Stop! Create new branch first
git checkout -b feature/your-feature-name
```

### Example Workflow

```bash
# User: "Add custom testimonials carousel"

# 1. Check current status
git status
# On branch main ← Need to switch!

# 2. Create feature branch
git checkout -b feature/custom-testimonials
# Switched to a new branch 'feature/custom-testimonials'

# 3. Build feature (component, styling, etc.)
# ... create files, write code ...

# 4. Commit work
git add src/components/CustomTestimonials/
git commit -m "Add custom testimonials carousel component

- Create CustomTestimonials component
- Add Framer Motion animations
- Add translations for testimonial labels
- Update landing page to use testimonials section"

# 5. Push to remote
git push -u origin feature/custom-testimonials

# 6. Create PR (via GitHub UI)

# 7. After merged, switch back
git checkout main
git pull origin main
```

### Multiple Features

**Work on features in parallel:**

```bash
# Feature 1
git checkout -b feature/pricing-table
# ... work on pricing table ...
git commit -m "Add pricing table"
git push -u origin feature/pricing-table

# Switch to new feature
git checkout main
git checkout -b feature/testimonials
# ... work on testimonials ...
git commit -m "Add testimonials"
git push -u origin feature/testimonials
```

### Checklist: Before Starting Work

- [ ] Check current branch: `git status`
- [ ] If on main → Create new branch
- [ ] Branch name is descriptive (e.g., `feature/custom-auth`)
- [ ] Branch follows naming convention
- [ ] Ready to work!

### Common Questions

**Q: What if I already started work on main branch?**

**A:** Move your changes to a new branch:

```bash
# Don't commit yet!
git stash                          # Save changes temporarily
git checkout -b feature/your-work  # Create new branch
git stash pop                      # Restore changes
git add .
git commit -m "Your message"
```

**Q: What if I need to switch branches mid-work?**

**A:** Commit or stash your changes first:

```bash
# Option 1: Commit work-in-progress
git add .
git commit -m "WIP: testimonials layout"
git checkout other-branch

# Option 2: Stash changes
git stash
git checkout other-branch
# Later: git checkout feature/testimonials && git stash pop
```

**Q: Should I delete branches after merging?**

**A:** Yes, clean up merged branches:

```bash
# After PR merged
git checkout main
git pull
git branch -d feature/custom-testimonials  # Delete local branch
git push origin --delete feature/custom-testimonials  # Delete remote (optional)
```

**Q: What branch should pull requests target?**

**A:** Usually `main` (check with user or repo settings). The git status output shows this.

---

## AI Agent Scope 🎯 AI Agent Scope & Role Role

**⚠️ CRITICAL**: This repository is shared with clients for design and UI customization work. The AI agent's role is focused on **frontend design**, not deep technical implementation.

### What the Agent SHOULD Handle (Design & UI)

The agent helps clients with:

✅ **UI/Design Customization**
- Custom page layouts and components
- Styling with CSS Modules
- Custom section designs (testimonials, pricing tables, hero sections)
- Listing cards, user profiles, search results
- Responsive design and mobile layouts
- **Reference official design files**: https://github.com/sharetribe/design-resources (Figma & Sketch files with complete design system)

✅ **Console Content Management**
- Configuring pages and sections in Console
- Adding listing fields, user fields, categories
- Page content and copy
- Section IDs and configuration
- See Sharetribe Console Configuration section below for complete reference

✅ **Frontend-Only Features**
- Search filters (using Console fields)
- Custom forms and validation
- UI components wrapping external libraries
- Client-side data display and formatting

✅ **Component Architecture**
- Creating custom components with CSS Modules
- Extending Sharetribe components (composition pattern)
- Redux state management for UI
- React hooks and patterns
- See [src/AGENTS.md](./src/AGENTS.md) for patterns

### What the Agent Should DEFER to Developer

The agent should tell clients: **"This requires technical implementation by your developer"** for:

❌ **Transaction Process Changes**
- Modifying booking flows, payment flows
- Adding custom transaction states
- Changing commission structure
- Custom pricing logic beyond line items

❌ **Backend/API Work**
- Setting up authentication (Facebook, Google, SSO)
- Email template modifications (requires CLI)
- Custom API endpoints
- Integration API usage
- Webhook/event handlers

❌ **Deep Technical Features**
- Custom transaction processes
- Payment gateway integration
- Booking intervals and buffer times
- Email notifications and templates
- Server-side security features

### Agent Response Pattern

**When client asks for design work:**
```
✅ "I'll create a custom testimonials carousel component with mock data...

   If you'd like design inspiration, Sharetribe provides official Figma and
   Sketch design files at https://github.com/sharetribe/design-resources
   with the complete default design system."
```

**When client has a designer:**
```
✅ "Your designer can reference the official design files at
   https://github.com/sharetribe/design-resources which include all
   default components, typography, colors, and spacing. This helps
   ensure custom designs integrate smoothly with the template."
```

**When client asks for technical work:**
```
❌ "Modifying the transaction process requires technical implementation.
   I recommend discussing this with your developer who can:
   - Update the transaction process via CLI
   - Test the changes in your test environment
   - Deploy to production when ready

   I can help with the UI side - would you like a custom booking
   confirmation page design?"
```

---

## AI Assistant Decision Framework

This section provides decision trees, checklists, and criteria for making operational decisions as an AI assistant.

### How to Identify Sharetribe vs Custom Files

**🔍 Identification Rules:**

1. **Location-based identification:**
   - Files in `/src/components/`, `/src/containers/`, `/src/ducks/` = **Assume Sharetribe unless proven otherwise**
   - Files in `/src/components/Custom*/` or `/src/containers/Custom*/` = **Custom (safe to modify)**
   - Files you just created = **Custom (safe to modify)**

2. **Check git history:**
   ```bash
   # If file exists in first commit, it's from Sharetribe
   git log --follow --diff-filter=A -- src/components/ListingCard/ListingCard.js
   ```

3. **Look for custom prefixes:**
   - `CustomListingCard` = Custom wrapper
   - `ListingCard` in `/src/components/ListingCard/` = Sharetribe original

4. **When in doubt:**
   - **ASSUME IT'S SHARETRIBE** → Wrap it, don't modify
   - Better to over-wrap than to accidentally modify upstream

**Quick Reference Table:**

| File Pattern | Type | Action |
|--------------|------|--------|
| `/src/components/ListingCard/ListingCard.js` | Sharetribe | Wrap, don't modify |
| `/src/components/CustomListingCard/CustomListingCard.js` | Custom | Safe to modify |
| `/src/containers/LandingPage/LandingPage.js` | Sharetribe | Wrap or create Custom version |
| `/src/containers/CustomAuthPage/CustomAuthPage.js` | Custom | Safe to modify |
| `/src/ducks/user.duck.js` | Sharetribe | Don't modify, create new duck |
| `/src/ducks/customFeature.duck.js` | Custom | Safe to modify |
| Any file in `/src/custom/` | Custom | Safe to modify |

---

### Decision Tree: Should I Wrap or Create New Component?

Use this decision tree for every component customization:

```
START: Client wants to customize Component X

┌─ Does Component X exist in Sharetribe?
│
├─ NO → Create new component from scratch
│         (e.g., CustomTestimonialCard, CustomPricingTable)
│
└─ YES → How much are you changing?
    │
    ├─ STYLING ONLY (colors, spacing, fonts)
    │  → Wrap component, add custom CSS
    │  Example: CustomListingCard wraps ListingCard
    │
    ├─ ADDING UI ELEMENTS (badges, icons, extra info)
    │  → Wrap component, add elements around it
    │  Example: Add "Featured" badge to ListingCard
    │
    ├─ LAYOUT CHANGES < 50% (reordering, minor structure changes)
    │  → Wrap component, override some styles
    │  Example: Change card layout from vertical to horizontal
    │
    ├─ LAYOUT CHANGES > 50% (major restructure)
    │  → Check: Is this used in multiple places?
    │     │
    │     ├─ YES (multiple places) → Wrap anyway
    │     │   (Wrapping preserves compatibility everywhere)
    │     │
    │     └─ NO (single use, like AuthenticationPage) → Create new component
    │         (Complete custom layout, not reused, wrap is overkill)
    │
    └─ BEHAVIORAL CHANGES (new props, logic, functionality)
       → Create new component, optionally use original as reference
       Example: Completely custom booking flow component
```

**Examples Applied:**

| Scenario | Decision | Reasoning |
|----------|----------|-----------|
| "Add a heart icon to listing cards" | Wrap ListingCard | Adding UI element, keep compatibility |
| "Change card background color" | Wrap ListingCard | Styling only |
| "Complete redesign of auth page layout" | Create CustomAuthenticationPage | >50% change, single use, total restructure |
| "Reorder elements in listing card" | Wrap ListingCard | <50% change, used in many places |
| "Create pricing table (doesn't exist)" | Create new PricingTable | Doesn't exist upstream |
| "Custom testimonial carousel" | Create new TestimonialsSection | Doesn't exist upstream |

---

### Decision Tree: When to Use Redux vs Component State?

```
START: Where should this state live?

┌─ Does state need to persist across pages?
│
├─ YES → Redux
│  Example: User profile, auth status, cart contents
│
└─ NO → Is state shared by multiple components on different levels?
    │
    ├─ YES → Redux
    │  Example: Search filters (used by SearchPage, FilterPanel, ResultsCount)
    │
    └─ NO → Is this UI state for a single component/feature?
        │
        ├─ YES → Component state (useState)
        │  Example: Modal open/close, form input values, dropdown state
        │
        └─ MAYBE → Is this a form?
            │
            ├─ YES → React Final Form (already in template)
            │  Example: Listing creation form, profile edit form
            │
            └─ NO → Component state (useState)
                Example: Button hover state, accordion open/closed
```

**Redux Decision Criteria:**

✅ **USE Redux when:**
- State persists across page navigation
- Multiple unrelated components need same data
- State needs to be cached/synchronized
- Examples: User profile, search results, listing data cache

❌ **DON'T use Redux when:**
- State is local to one component
- State is UI-only (modal visibility, dropdown state)
- State is form data (use React Final Form)
- Examples: Button clicked state, input focus, tooltip visibility

**Can I Modify Existing Ducks?**

- **NO** - Don't modify existing Sharetribe duck files
- **YES** - Create new custom duck files for your features

```javascript
// ❌ DON'T modify src/ducks/user.duck.js
// ✅ DO create src/ducks/customUserPreferences.duck.js
```

---

### Decision Tree: When to Ask About Console Configuration?

```
START: Building a feature that might need Console data

┌─ Is this a UI-only feature? (styling, layout, animations)
│
├─ YES → NO Console config needed
│  Build it, don't ask about Console
│  Example: Custom hero section layout, testimonial carousel design
│
└─ NO → Does feature need dynamic data?
    │
    ├─ Listing fields (rental type, categories, amenities)
    │  → Build with mock data + Provide exact Console config
    │  Example: "When ready, add field with key 'propertyType'"
    │
    ├─ User fields (bio, experience, skills)
    │  → Build with mock data + Provide exact Console config
    │  Example: "Add user field with key 'experienceLevel'"
    │
    ├─ Search filters
    │  → Build with mock data + Provide exact Console config
    │  Example: "Enable search for field 'propertyType'"
    │
    ├─ Page content (hero text, about page, footer)
    │  → Point to Console > Content > Pages
    │  User edits content directly, no config needed
    │
    └─ Sections (hero, columns, carousel)
       → Point to Console > Content > Pages > Sections
       User adds sections, you provide section IDs to use
```

**Timing Guidelines:**

- **Upfront (before building):** Ask if client has existing Console fields
- **During build:** Use mock data, don't block
- **After build:** Provide exact Console config as checklist

**Example: The Right Approach**

```
Client: "Add experience level filter to search"

Agent: "I'll build this with mock data so you can test it now.

[Builds feature with mock options: Beginner, Intermediate, Expert]

When you're ready, add this to Console:

1. Go to Console > Listing fields
2. Add field:
   - Label: Experience Level
   - Key: experienceLevel
   - Type: Select (dropdown)
   - Options: Beginner, Intermediate, Expert
3. Go to Console > Search
4. Enable search for 'experienceLevel'

The component will automatically pick up the Console data."
```

---

### Decision Tree: PageBuilder Constraints

```
START: Client wants custom landing page design

┌─ Can it be built with 5 section types?
│  (hero, article, columns, features, carousel)
│
├─ YES → Guide client to use PageBuilder
│  │
│  ├─ Hero section needed? → Use 'hero' type
│  ├─ Testimonials? → Use 'carousel' type
│  ├─ Pricing table? → Use 'columns' type (numColumns: 3)
│  ├─ Features showcase? → Use 'features' type
│  ├─ Blog content? → Use 'article' type
│  └─ Footer? → Use 'footer' type (auto-rendered)
│
└─ NO → Two options:
   │
   ├─ OPTION 1: Use closest section type + custom styling
   │  - Client adds section in Console with closest type
   │  - You create custom component tied to section ID
   │  - See src/containers/AGENTS.md "Landing Page Customization"
   │
   └─ OPTION 2: Create completely custom page
      - Create new page component (e.g., CustomLandingPage)
      - Fetch Console data via Asset Delivery API
      - Build custom layout with custom components
      - See src/containers/AGENTS.md "Custom Page Creation"
```

**Ask Client First:**

Before building landing page customization:

```
"Your design needs [testimonials / pricing / features / etc].

The template provides 5 section types:
1. hero - Full-height hero with centered content
2. columns - Multi-column grid (1-4 columns)
3. carousel - Scrollable blocks with navigation
4. features - Alternating image/text rows
5. article - Single-column content (blog-style)

Which of these best fits your [testimonials] design?
- Carousel (scrolling testimonials)?
- Columns (grid of testimonials)?
- Something else (we'll build custom)?"
```

---

### Checklist: Before Creating a Component

Before creating any component, check:

- [ ] **Does an upstream component already exist?**
  - Search in `/src/components/` and `/src/containers/`
  - If yes → Use decision tree "Wrap or Create New?"

- [ ] **Is this UI-only or does it need Console data?**
  - UI-only → Build it, no Console config
  - Needs data → Build with mock + provide Console config

- [ ] **Will this component be reused?**
  - Reused → Strongly prefer wrapping existing components
  - Single-use → New component is OK

- [ ] **What's the file structure?**
  - [ ] Component file (e.g., `CustomCard.js`)
  - [ ] CSS Module (e.g., `CustomCard.module.css`)
  - [ ] PropTypes defined
  - [ ] Index file for exports (e.g., `index.js`)
  - [ ] Optional: Example file (e.g., `CustomCard.example.js` for styleguide)

- [ ] **Will state be needed?**
  - Use decision tree "Redux vs Component State"

---

### Checklist: After Building a Feature

After completing any feature:

- [ ] **Component uses composition pattern**
  - Wraps existing components (doesn't modify them)
  - OR is completely new (doesn't conflict with upstream)

- [ ] **Mock data works**
  - Component renders correctly with example data
  - No Console configuration required to test

- [ ] **Console config provided to client**
  - Exact field keys, labels, and types
  - Step-by-step Console UI instructions
  - Clear checklist format

- [ ] **Responsive design**
  - Mobile layout tested
  - Desktop layout tested
  - Uses CSS Modules custom media queries

- [ ] **PropTypes defined**
  - All props have type validation
  - Required props marked as required

- [ ] **Accessibility considered**
  - Semantic HTML where possible
  - ARIA labels where needed
  - Keyboard navigation if interactive

---

### Container-Specific Guidance

Different containers have different customization patterns. **See detailed container-specific guides:**

- **[src/containers/AuthenticationPage/AGENTS.md](./src/containers/AuthenticationPage/AGENTS.md)** - Auth page customization patterns
- **[src/containers/SearchPage/AGENTS.md](./src/containers/SearchPage/AGENTS.md)** - Search page & filter customization
- **[src/containers/ListingPage/AGENTS.md](./src/containers/ListingPage/AGENTS.md)** - Listing detail page customization
- **[src/containers/LandingPage/AGENTS.md](./src/containers/LandingPage/AGENTS.md)** - Landing page & PageBuilder patterns

*(Create these files as you encounter patterns worth documenting)*

---

### Role Clarity: What Decisions Should AI Make vs Defer?

**✅ AI Should Decide Independently:**

| Decision | Example |
|----------|---------|
| Component structure | "I'll wrap ListingCard vs create new" |
| Styling approach | "Use CSS Modules with custom media queries" |
| Mock data structure | "Mock listing with 3 amenities for testing" |
| File organization | "Create in `/src/components/CustomCard/`" |
| Use composition pattern | "Wrap existing Button component" |
| UI/UX improvements | "Add loading state, error handling" |

**⚠️ AI Should Ask Client:**

| Decision | Example |
|----------|---------|
| Design choices | "Should testimonials be carousel or grid?" |
| Section type selection | "Which of the 5 types fits your design?" |
| Content/copy | "What should the hero title say?" |
| Field naming | "What should we call this filter?" |
| Existing Console setup | "Do you have listing fields already?" |

**❌ AI Should Defer to Developer:**

| Decision | Example |
|----------|---------|
| Transaction changes | "Modifying booking flow → developer" |
| Email templates | "Email customization → developer with CLI" |
| Payment integration | "Stripe setup → developer" |
| Backend endpoints | "Custom API → developer" |
| Auth providers | "Google login → developer" |

---

### Self-Updating Documentation

**As you learn patterns, update these docs:**

1. **Encountered a common scenario?** → Add to decision trees
2. **Found container-specific pattern?** → Create `AGENTS.md` in that container's directory
3. **Discovered edge case?** → Add to relevant section
4. **Client asked repeated questions?** → Add FAQ section

**Where to document:**

- **General patterns** → Update this file (main `AGENTS.md`)
- **Frontend patterns** → Update `src/AGENTS.md`
- **Component patterns** → Update `src/components/AGENTS.md`
- **Container-specific** → Create `src/containers/[ContainerName]/AGENTS.md`
- **Backend patterns** → Update `server/AGENTS.md`

---

### Changelog Maintenance

**CRITICAL:** Keep a changelog of all customizations in `docs/CHANGELOG.md`.

**When to update the changelog:**

After completing ANY feature, component, or change, add an entry to the changelog:

```markdown
## [Unreleased]

### Added
- Custom testimonial carousel component on landing page
- Price range filter to search page

### Changed
- Updated listing card styling with rounded corners

### Fixed
- Fixed mobile navigation menu z-index issue
```

**Changelog categories:**

- **Added** - New features, components, pages, fields
- **Changed** - Changes to existing functionality, styling updates
- **Fixed** - Bug fixes
- **Removed** - Removed features or components

**Format:**
- Use present tense ("Add" not "Added")
- Be specific and clear
- Reference components/pages by name
- Group related changes together

**Example good entries:**

```markdown
### Added
- CustomPricingTable component with 3-column layout on landing page
- Experience level filter (Console: listing field 'experienceLevel')
- User bio field in profile page (Console: user field 'bio')

### Changed
- Updated SearchPage listing cards to show rating stars
- Changed hero section from default to custom split-screen layout

### Fixed
- Corrected CustomListingCard mobile responsive layout
- Fixed filter dropdown z-index overlapping map markers
```

**Location:** `docs/CHANGELOG.md`

**When deploying:** Create a dated version section (YYYY-MM-DD format), then start new [Unreleased] section.

**This helps:**
- Track what's been customized
- Communicate changes to client
- Debug when things break
- Understand what's custom vs Sharetribe original

---

## Translations & Internationalization (i18n)

### Critical Rule: Always Use React Intl for UI Text

**NEVER hardcode user-facing text in components.** Always use React Intl's `FormattedMessage` or `intl.formatMessage()`.

**Why:**
- Marketplace texts are managed in **Console > Build > Content > Marketplace texts**
- Clients can customize all UI text without touching code
- Supports multiple languages
- Template auto-syncs with Console text changes

---

### How Translations Work in Sharetribe

**3-Tier Translation System:**

```
1. Console > Build > Content > Marketplace texts (hosted)
   ↓ (fetched from /content/translations.json)
2. If hosted text missing → Fallback to src/translations/en.json
3. If fallback missing → Shows translation key as placeholder
```

**Translation Flow:**

```
Client edits text in Console
        ↓
Hosted translations.json updated
        ↓
Template fetches on next load
        ↓
Component displays new text
        ↓
If translation missing → Falls back to en.json
```

---

### Pattern: Using FormattedMessage in Components

**✅ CORRECT - Use FormattedMessage:**

```javascript
// src/components/CustomButton/CustomButton.js
import { FormattedMessage } from '../../util/reactIntl';
import css from './CustomButton.module.css';

const CustomButton = (props) => {
  return (
    <button className={css.button}>
      <FormattedMessage id="CustomButton.submitLabel" />
    </button>
  );
};
```

**❌ WRONG - Hardcoded text:**

```javascript
// ❌ DON'T DO THIS
const CustomButton = (props) => {
  return (
    <button className={css.button}>
      Submit  {/* ❌ Hardcoded text - can't be changed in Console */}
    </button>
  );
};
```

---

### Pattern: Translations with Variables

**Use variables for dynamic content:**

```javascript
import { FormattedMessage } from '../../util/reactIntl';

const WelcomeMessage = ({ userName }) => {
  return (
    <h1>
      <FormattedMessage
        id="WelcomeMessage.title"
        values={{ name: userName }}
      />
    </h1>
  );
};
```

**Fallback translation in `src/translations/en.json`:**

```json
{
  "WelcomeMessage.title": "Welcome back, {name}!"
}
```

**Client can customize in Console:**
```
"Welcome back, {name}!" → "Hey {name}, good to see you!"
```

---

### Pattern: Using intl Hook for Dynamic Text

**For text in props, placeholders, or dynamic content:**

```javascript
import { useIntl } from '../../util/reactIntl';

const CustomForm = () => {
  const intl = useIntl();

  return (
    <input
      type="text"
      placeholder={intl.formatMessage({
        id: 'CustomForm.emailPlaceholder'
      })}
      aria-label={intl.formatMessage({
        id: 'CustomForm.emailLabel'
      })}
    />
  );
};
```

**Fallback in `src/translations/en.json`:**

```json
{
  "CustomForm.emailPlaceholder": "Enter your email address",
  "CustomForm.emailLabel": "Email"
}
```

---

### Builder.io Agent Workflow: Adding Translations

**When creating any custom component with UI text:**

**Step 1: Use FormattedMessage in component**

```javascript
// src/components/CustomPricingCard/CustomPricingCard.js
import { FormattedMessage } from '../../util/reactIntl';

const CustomPricingCard = ({ isPopular }) => {
  return (
    <div>
      {isPopular && (
        <div className={css.badge}>
          <FormattedMessage id="CustomPricingCard.popularBadge" />
        </div>
      )}
    </div>
  );
};
```

**Step 2: Add fallback to `src/translations/en.json`**

```json
{
  "CustomPricingCard.popularBadge": "Most Popular",
  "CustomPricingCard.perMonthSuffix": "/month",
  "CustomPricingCard.ctaButton": "Get Started"
}
```

**Step 3: Tell client how to customize in Console**

```
"I've added fallback text in the code:
- 'Most Popular' badge
- '/month' suffix
- 'Get Started' button

To customize these texts:
1. Go to Console > Build > Content > Marketplace texts
2. Search for: CustomPricingCard
3. Edit the text values
4. Save

Your custom text will override the fallback automatically."
```

---

### Translation Key Naming Convention

**Follow this pattern:**

```
{ComponentName}.{purpose}
```

**Examples:**

```json
{
  "CustomButton.submitLabel": "Submit",
  "CustomButton.cancelLabel": "Cancel",

  "CustomTestimonial.verifiedLabel": "Verified Customer",
  "CustomTestimonial.readMoreLink": "Read more",

  "CustomPricingCard.perMonthSuffix": "/month",
  "CustomPricingCard.popularBadge": "Most Popular"
}
```

**Key naming guidelines:**
- Start with component name (match file name)
- Use descriptive purpose (not "text1", "label2")
- Use camelCase for purpose part
- Keep it short but clear

---

### Adding Translations to en.json

**Location:** `src/translations/en.json`

**IMPORTANT:** Keys are **alphabetically sorted**. Maintain sort order when adding new keys.

**Pattern:**

1. Read `src/translations/en.json`
2. Find alphabetical position for your component
3. Add all translations for your component together
4. Maintain alphabetical sort order

**Example:**

```json
{
  "AuthenticationPage.loginFailed": "Login failed",
  "AuthenticationPage.signupFailed": "Signup failed",

  "Avatar.bannedUserDisplayName": "Banned user",

  "CustomButton.cancelLabel": "Cancel",     // ← Add all CustomButton keys here
  "CustomButton.submitLabel": "Submit",

  "CustomPricingCard.ctaButton": "Get Started",
  "CustomPricingCard.perMonthSuffix": "/month",
  "CustomPricingCard.popularBadge": "Most Popular",

  "ListingCard.perUnit": "/ night",
  "ListingCard.soldOut": "Sold out"
}
```

---

### Console Configuration (Client Customization)

**Tell clients:**

```
To customize any text in your marketplace:

1. Go to Console > Build > Content > Marketplace texts
2. Search for the translation key (e.g., "CustomButton.submitLabel")
3. Edit the text
4. Save

Changes appear immediately (no code deployment needed).

The template will use:
- Your Console text (if set)
- Fallback from en.json (if not set in Console)
```

---

### Common Translation Patterns

#### Pattern 1: Simple Button Labels

```javascript
<button>
  <FormattedMessage id="CustomComponent.buttonLabel" />
</button>
```

```json
{
  "CustomComponent.buttonLabel": "Click Me"
}
```

#### Pattern 2: Text with Variables

```javascript
<h2>
  <FormattedMessage
    id="CustomComponent.heading"
    values={{ count: listings.length }}
  />
</h2>
```

```json
{
  "CustomComponent.heading": "{count} listings found"
}
```

#### Pattern 3: Input Placeholders

```javascript
const intl = useIntl();

<input
  placeholder={intl.formatMessage({ id: 'CustomForm.namePlaceholder' })}
/>
```

```json
{
  "CustomForm.namePlaceholder": "Enter your name"
}
```

#### Pattern 4: Links with Variables

```javascript
<FormattedMessage
  id="CustomComponent.termsText"
  values={{
    termsLink: (
      <NamedLink name="TermsOfServicePage">
        <FormattedMessage id="CustomComponent.termsLinkText" />
      </NamedLink>
    )
  }}
/>
```

```json
{
  "CustomComponent.termsText": "By continuing, you agree to our {termsLink}",
  "CustomComponent.termsLinkText": "Terms of Service"
}
```

---

### Checklist: Translation Requirements

Before finishing any component:

- [ ] All user-facing text uses `FormattedMessage` or `intl.formatMessage()`
- [ ] No hardcoded text strings in JSX
- [ ] Translations added to `src/translations/en.json` (alphabetically sorted)
- [ ] Translation keys follow naming convention (`ComponentName.purpose`)
- [ ] Client instructions provided for Console customization
- [ ] Variables used for dynamic content (names, counts, etc.)
- [ ] Update `docs/CHANGELOG.md` with translation keys added

---

### Common Questions

**Q: Can I hardcode text if it's just for testing?**

**A:** No. Always use FormattedMessage. Add fallback to `en.json`. This prevents technical debt and makes text immediately customizable.

**Q: What if I forget to add a translation key?**

**A:** The component will display the translation key as a placeholder (e.g., "CustomButton.submitLabel"). This makes missing translations obvious.

**Q: Can clients add new translation keys in Console?**

**A:** Yes, but better to add fallback in `en.json` first. This ensures it works even if Console isn't configured yet.

**Q: What about dynamic text from Console (listing fields, user data)?**

**A:** Dynamic content from API doesn't use translations. Only static UI text (labels, buttons, headings) uses React Intl.

---

## AI Agent Workflow - Mock Data First, Console Config Later

**⚠️ CRITICAL**: Don't block the client's flow waiting for Console configuration. Use this workflow:

### The Correct Agent Workflow

**1. Build with Mock Data First**
- Create components that work immediately with example/mock data
- User can see and test features right away
- Don't wait for Console configuration to start coding

**2. Provide Exact Console Configuration**
- Give user specific field keys, IDs, and names to use
- Provide complete configuration in a clear, formatted block
- User can add to Console when ready (doesn't block development)
- See Sharetribe Console Configuration section below for exact Console UI instructions

**3. Component Auto-Adapts**
- Use defensive coding to handle both mock and real Console data
- Component works with mock data initially
- Automatically picks up Console data when user adds it
- No code changes needed when switching from mock to real data

### Example: The Right Way

**❌ BAD (blocking workflow):**
```
Agent: "Please create a field in Console with key 'experienceLevel'"
User: *stops, goes to Console, creates field*
User: "Okay, done"
Agent: *now builds the component*
```

**✅ GOOD (non-blocking workflow):**
```
Agent: "I'll build this with mock data so you can test it immediately.

When you're ready, add this field to Console:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Console > Build > Users > User Fields

Field Key: experienceLevel
Label: Experience Level
Type: enum
Options:
  - beginner
  - intermediate
  - expert
Required: No
Show on: Profile page
User Types: All
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The component will automatically use Console data once you add it."

Agent: *builds component with mock data that works immediately*
```

### Naming Conventions

When providing Console configuration, use these naming conventions:

- **Page names**: `kebab-case` (landing-page, about-us, contact-form)
- **Field keys**: `camelCase` (experienceLevel, companyName, phoneNumber)
- **Section IDs**: `kebab-case` (hero-main, testimonials-carousel, pricing-grid)
- **Enum options**: `kebab-case` or `lowercase` (new, like-new, for-parts)

### Mock Data Pattern

```javascript
// Component works with both mock and real Console data
const CustomUserProfile = ({ user }) => {
  const config = useConfiguration();
  const userFields = config.user?.userFields || [];
  const publicData = user.attributes?.profile?.publicData || {};

  // Check if Console field exists
  const expField = userFields.find(f => f.key === 'experienceLevel');
  const hasConsoleData = expField && publicData.experienceLevel;

  // Use Console data if available, otherwise use mock data
  const experienceLevel = hasConsoleData
    ? publicData.experienceLevel
    : 'intermediate'; // Mock data for testing

  const experienceOptions = hasConsoleData
    ? expField.enumOptions
    : ['beginner', 'intermediate', 'expert']; // Mock options

  // Optional: Show indicator when using mock data
  const isMockData = !hasConsoleData;

  return (
    <div className={css.experienceSection}>
      {isMockData && (
        <div className={css.mockDataBadge}>
          ⚠️ Using mock data - Add field to Console to use real data
        </div>
      )}
      <h3>{expField?.label || 'Experience Level'}</h3>
      <div className={css.experienceBadge}>
        {experienceLevel === 'expert' && <ExpertIcon />}
        {experienceLevel === 'intermediate' && <IntermediateIcon />}
        {experienceLevel === 'beginner' && <BeginnerIcon />}
        <span>{experienceLevel}</span>
      </div>
    </div>
  );
};
```

### Why This Workflow Works

✅ **User sees progress immediately** - No waiting for Console configuration
✅ **No context switching** - User stays in development flow
✅ **Testable right away** - Mock data allows immediate testing
✅ **Smooth transition** - Component auto-adapts when Console data is added
✅ **Clear instructions** - User knows exactly what to configure later
✅ **Defensive coding** - Graceful fallback if Console config missing

---

## Finding the Right Documentation

**Need to know about:**

- **Console configuration, branding, pages?** → See Sharetribe Console Configuration section in this file
- **React patterns, Redux, styling?** → [src/AGENTS.md](./src/AGENTS.md)
- **PageBuilder, custom pages, data loading?** → [src/containers/AGENTS.md](./src/containers/AGENTS.md)
- **Backend, SSR, API endpoints?** → [server/AGENTS.md](./server/AGENTS.md)

**Each specialized file contains:**
- Deep-dive technical details
- Code examples and patterns
- Best practices for that domain
- Cross-references to related documentation

---

## Quick Reference

### Key Principles

1. **Console for content, code for structure** - Content managed in Console, code renders the view
2. **Composition over modification** - Extend, don't edit Sharetribe components
3. **CSS Modules only** - No Tailwind, styled-components, or emotion in production
4. **Defensive coding** - Handle missing Console data gracefully
5. **Mock data first** - Don't block on Console configuration

### Common Patterns

**Custom Component:**
```javascript
// Wrap Sharetribe component
import { ListingCard } from '../../components';
import css from './CustomListingCard.module.css';

const CustomListingCard = ({ listing, ...props }) => {
  return (
    <div className={css.wrapper}>
      <ListingCard listing={listing} {...props} />
      <div className={css.customContent}>
        {/* Your customizations */}
      </div>
    </div>
  );
};
```

**Access Console Config:**
```javascript
import { useConfiguration } from '../../context/configurationContext';

const MyComponent = () => {
  const config = useConfiguration();
  const listingFields = config.listing?.listingFields || [];
  const brandColor = config.branding?.marketplaceColor;

  return <div style={{ color: brandColor }}>...</div>;
};
```

**Defensive Field Access:**
```javascript
// Always use optional chaining and fallbacks
const brandField = config.listing?.listingFields?.find(f => f.key === 'brand');
const brandOptions = brandField?.enumOptions || [];

// Check before rendering
{brandField && <div>{brandField.label}</div>}
```

---

## Design Resources

**Official Sharetribe Design Files:** https://github.com/sharetribe/design-resources

- Figma & Sketch files with complete design system
- Component library with variants
- Typography (Inter, SF Pro), colors, spacing
- Layout variations for different transaction processes

**When to mention to clients:**
- Client wants to customize designs
- Client has a designer
- Client wants to see default design system

---

## Getting Help

- **Sharetribe Docs**: https://www.sharetribe.com/docs
- **Help Center**: https://www.sharetribe.com/help/en/
- **API Reference**: https://www.sharetribe.com/api-reference
- **Design Resources**: https://github.com/sharetribe/design-resources

---

**Remember**: AI agents should read the closest AGENTS.md to the code they're working on for relevant, context-specific guidance. Start here for overview, then navigate to specialized docs as needed.

---

## Global CSS Variables & Styling System

### Overview: How Global Styles Work

**File:** [src/styles/marketplaceDefaults.css](src/styles/marketplaceDefaults.css:1-203)

**3-Tier CSS Variable System:**

```
1. src/styles/marketplaceDefaults.css (fallback values)
   ↓
2. Console > Build > Branding (/general/branding.json)
   ↓
3. JavaScript sets CSS Properties dynamically (document.documentElement.style.setProperty())
```

**Flow:**

```
Client sets branding in Console
        ↓
Hosted at /general/branding.json
        ↓
Merged with src/config/configBranding.js fallbacks
        ↓
getCustomCSSPropertiesFromConfig() extracts CSS vars
        ↓
includeCSSProperties() sets them on <html> element
        ↓
All components access via var(--variableName)
```

---

### What Comes from Console vs What Doesn't

**✅ These CSS variables come from Console > Build > Branding:**

| CSS Variable | Console Setting | Fallback File |
|--------------|----------------|---------------|
| `--marketplaceColor` | Main color | [configBranding.js:21](src/config/configBranding.js:21) |
| `--marketplaceColorDark` | (auto: main color -10% lightness) | Auto-generated |
| `--marketplaceColorLight` | (auto: main color +10% lightness) | Auto-generated |
| `--colorPrimaryButton` | Primary button color | Auto-generated |
| `--colorPrimaryButtonDark` | (auto: button color -10%) | Auto-generated |
| `--colorPrimaryButtonLight` | (auto: button color +10%) | Auto-generated |

**❌ These CSS variables do NOT come from Console (code-only):**

All other variables are defined in [marketplaceDefaults.css](src/styles/marketplaceDefaults.css:16-203):

- **Colors:** `--colorSuccess`, `--colorFail`, `--colorAttention`, `--colorGrey*`, etc.
- **Typography:** `--fontFamily`, `--fontWeight*`
- **Spacing:** `--spacingUnit`, `--spacingUnitDesktop`, `--contentMaxWidth`
- **Shadows:** `--boxShadow`, `--boxShadowButton`, etc.
- **Z-indexes:** `--zIndexTopbar`, `--zIndexModal`, etc.
- **Border radius:** `--borderRadius`, `--borderRadiusMedium`
- **Transitions:** `--transitionStyle`, `--transitionStyleButton`

**To change these, edit [src/styles/marketplaceDefaults.css](src/styles/marketplaceDefaults.css) directly.**

---

### How to Add New Global CSS Variables

#### Option A: Fixed Variable (No Console Control) ✅ Recommended

**Use when:** Standard design values that don't need client customization

**Steps:**

**1. Add to** [src/styles/marketplaceDefaults.css](src/styles/marketplaceDefaults.css:16-203):

```css
:root {
  /* ... existing variables ... */

  /* Custom variables (add at appropriate section) */
  --customCardShadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
  --customBorderRadiusLarge: 8px;
  --customAccentColor: #ff6b6b;
}
```

**2. Use in components:**

```css
/* src/components/CustomCard/CustomCard.module.css */
.card {
  box-shadow: var(--customCardShadow);
  border-radius: var(--customBorderRadiusLarge);
  border-left: 3px solid var(--customAccentColor);
}
```

**3. Update** [docs/CHANGELOG.md](docs/CHANGELOG.md):

```markdown
### Added
- Global CSS variables: `--customCardShadow`, `--customBorderRadiusLarge`, `--customAccentColor`
```

**That's it!** No JavaScript changes needed.

---

#### Option B: Console-Controlled Variable ⚠️ Advanced

**Use when:** Branding values clients should control in Console

**⚠️ WARNING:** This requires changes in 4 files. Only do this for truly brand-critical values.

<details>
<summary><strong>Click to expand: Steps for Console-controlled variables</strong></summary>

**1. Add fallback to** [src/styles/marketplaceDefaults.css](src/styles/marketplaceDefaults.css):

```css
:root {
  /**
   * Custom accent color (overwritten by Console > Build > Branding)
   */
  --colorAccent: #ff6b6b; /* Fallback */
  --colorAccentDark: #cc5656; /* Fallback */
  --colorAccentLight: #ff8585; /* Fallback */
}
```

**2. Add fallback to** [src/config/configBranding.js](src/config/configBranding.js):

```javascript
export const marketplaceColor = '#7c3aed';
// ADD THIS:
export const accentColor = '#ff6b6b';
```

**3. Update** [src/util/style.js](src/util/style.js:7-24):

```javascript
export const getCustomCSSPropertiesFromConfig = brandingConfig => {
  const marketplaceColorsMaybe = brandingConfig.marketplaceColor
    ? {
        ['--marketplaceColor']: brandingConfig.marketplaceColor,
        ['--marketplaceColorDark']: brandingConfig.marketplaceColorDark,
        ['--marketplaceColorLight']: brandingConfig.marketplaceColorLight,
      }
    : {};

  const primaryButtonColorsMaybe = brandingConfig.colorPrimaryButton
    ? {
        ['--colorPrimaryButton']: brandingConfig.colorPrimaryButton,
        ['--colorPrimaryButtonDark']: brandingConfig.colorPrimaryButtonDark,
        ['--colorPrimaryButtonLight']: brandingConfig.colorPrimaryButtonLight,
      }
    : {};

  // ADD THIS:
  const accentColorsMaybe = brandingConfig.colorAccent
    ? {
        ['--colorAccent']: brandingConfig.colorAccent,
        ['--colorAccentDark']: brandingConfig.colorAccentDark,
        ['--colorAccentLight']: brandingConfig.colorAccentLight,
      }
    : {};

  return {
    ...marketplaceColorsMaybe,
    ...primaryButtonColorsMaybe,
    ...accentColorsMaybe, // ADD THIS
  };
};
```

**4. Update** [src/util/configHelpers.js](src/util/configHelpers.js:225-260) - `mergeBranding()`:

```javascript
const mergeBranding = (brandingConfig, defaultBranding) => {
  const {
    marketplaceColors,
    logo,
    logoSettings,
    loginBackgroundImage,
    socialSharingImage,
    ...rest
  } = brandingConfig || {};

  const marketplaceColor = marketplaceColors?.mainColor || defaultBranding.marketplaceColor;
  const marketplaceColorDark = marketplaceColor ? hexToCssHsl(marketplaceColor, -10) : null;
  const marketplaceColorLight = marketplaceColor ? hexToCssHsl(marketplaceColor, 10) : null;

  const colorPrimaryButton = marketplaceColors?.primaryButton;
  const colorPrimaryButtonDark = colorPrimaryButton ? hexToCssHsl(colorPrimaryButton, -10) : null;
  const colorPrimaryButtonLight = colorPrimaryButton ? hexToCssHsl(colorPrimaryButton, 10) : null;

  // ADD THIS:
  const colorAccent = marketplaceColors?.accentColor || defaultBranding.accentColor;
  const colorAccentDark = colorAccent ? hexToCssHsl(colorAccent, -10) : null;
  const colorAccentLight = colorAccent ? hexToCssHsl(colorAccent, 10) : null;

  // ... rest of function ...

  return {
    marketplaceColor,
    marketplaceColorDark,
    marketplaceColorLight,
    colorPrimaryButton,
    colorPrimaryButtonDark,
    colorPrimaryButtonLight,
    colorAccent, // ADD THIS
    colorAccentDark, // ADD THIS
    colorAccentLight, // ADD THIS
    // ... other properties
  };
};
```

**5. Tell client:**

```
"I've added support for a custom accent color.

Fallback: The code defaults to #ff6b6b.

To customize in Console:
1. Go to Console > Build > Branding
2. (Console may not have this field yet - contact Sharetribe support)
3. Set your accent color

⚠️ Note: Console branding UI only supports main color and primary button
by default. Custom color fields require Sharetribe support."
```

</details>

---

### Common Global Variables Reference

**Colors (Console-controlled):**

```css
--marketplaceColor           /* Main brand color */
--marketplaceColorDark       /* -10% lightness */
--marketplaceColorLight      /* +10% lightness */
--colorPrimaryButton         /* Primary button */
--colorPrimaryButtonDark
--colorPrimaryButtonLight
```

**Colors (Code-only):**

```css
/* Functional colors */
--colorSuccess: #138041;
--colorSuccessDark: #0d542a;
--colorFail: #e7000b;
--colorAttention: #ffaa00;

/* Grayscale */
--colorWhite, --colorBlack
--colorGrey50 through --colorGrey900
```

**Typography:**

```css
--fontFamily: -apple-system, BlinkMacSystemFont, 'Inter', ...;
--fontWeightRegular: 400;
--fontWeightMedium: 500;
--fontWeightSemiBold: 600;
--fontWeightBold: 700;
--fontWeightBlack: 900;
```

**Spacing (use multiples):**

```css
--spacingUnit: 6px;              /* Mobile: 6px units */
--spacingUnitDesktop: 8px;       /* Desktop: 8px units */

/* Usage: */
padding: calc(2 * var(--spacingUnit));           /* = 12px mobile */
margin: calc(3 * var(--spacingUnitDesktop));     /* = 24px desktop */

--contentMaxWidth: 1056px;
--contentMaxWidthPages: 1120px;
```

**Shadows:**

```css
--boxShadow                  /* Standard: 0 2px 4px rgba(0,0,0,0.1) */
--boxShadowButton            /* Button hover */
--boxShadowPopup             /* Dropdowns */
--boxShadowListingCard       /* Listing cards */
```

**Z-indexes (layering):**

```css
--zIndexTopbar: 10;
--zIndexPopup: 50;
--zIndexModal: 100;
--zIndexGenericError: 200;
```

**Border & Transitions:**

```css
--borderRadius: 2px;
--borderRadiusMedium: 4px;
--transitionStyle: ease-in 0.2s;
--transitionStyleButton: ease-in-out 0.1s;
```

---

### Pattern: Using Global Variables in Components

**In CSS Modules:**

```css
/* src/components/CustomCard/CustomCard.module.css */
.card {
  /* Colors */
  background-color: var(--colorWhite);
  border: 1px solid var(--colorGrey200);
  color: var(--colorGrey900);

  /* Spacing (multiples of spacing units) */
  padding: calc(2 * var(--spacingUnit));
  margin-bottom: calc(3 * var(--spacingUnit));

  /* Shadows & radius */
  box-shadow: var(--boxShadow);
  border-radius: var(--borderRadiusMedium);

  /* Transitions */
  transition: var(--transitionStyle);

  @media (--viewportMedium) {
    padding: calc(2 * var(--spacingUnitDesktop));      /* = 16px */
    margin-bottom: calc(3 * var(--spacingUnitDesktop)); /* = 24px */
  }
}

.card:hover {
  border-color: var(--marketplaceColor);
  box-shadow: var(--boxShadowButton);
}

.cardTitle {
  font-weight: var(--fontWeightBold);
  color: var(--colorGrey900);
}

.cardAccent {
  background-color: var(--marketplaceColorLight);
  color: var(--marketplaceColor);
}
```

**Benefits:**
- Automatic theme updates when Console branding changes
- Consistent spacing/colors across entire app
- Responsive spacing (mobile: 6px units, desktop: 8px units)
- Easy maintenance

---

### Checklist: Adding Global Variables

- [ ] Check if variable already exists in [marketplaceDefaults.css](src/styles/marketplaceDefaults.css)
- [ ] Decide: Fixed (Option A) or Console-controlled (Option B)?
- [ ] Follow naming convention: `--camelCase`
- [ ] Add fallback value in `marketplaceDefaults.css`
- [ ] If Console-controlled: Update 4 files (see Option B)
- [ ] Use in components via `var(--variableName)`
- [ ] Update [docs/CHANGELOG.md](docs/CHANGELOG.md)

---

### Common Questions

**Q: Can I use inline styles?**

**A:** No. Always use CSS Modules + CSS variables for consistency and theme compatibility.

**Q: What if I need a color not in the palette?**

**A:** Add it as a new CSS variable in `marketplaceDefaults.css` (Option A). Follow naming conventions.

**Q: Can clients customize any CSS variable in Console?**

**A:** By default, only `--marketplaceColor` and `--colorPrimaryButton`. Adding more requires Option B (advanced).

**Q: How do I know what spacing to use?**

**A:** Use multiples of `--spacingUnit` (mobile: 6px) / `--spacingUnitDesktop` (8px). Common: 2x, 3x, 4x.

**Q: Should I modify existing color variables?**

**A:** Only modify fallback values in `marketplaceDefaults.css`. Don't touch values set by JavaScript (from Console).

**Q: What about component-specific variables?**

**A:** Define them in the component's CSS Module, not globally. Global = used in 3+ places.

---

## Sharetribe Console Configuration

**CRITICAL**: Before writing any code, configure your marketplace in Sharetribe Console.

### Console vs Code - What Goes Where?

**Sharetribe Console** (https://console.sharetribe.com) is your no-code management interface. The
template fetches most marketplace configuration from Console, not code.

**WARNING: Configure in Console FIRST (Required):**

- YES: Branding (logo, colors, marketplace name)
- YES: User Types (customer, provider roles)
- YES: Listing Types (products, services, rentals)
- YES: **Listing Categories** (3-level category hierarchy)
- YES: Listing Fields (custom listing data + data types)
- YES: User Fields (custom user profile data)
- YES: **Search Schemas** (enable filtering on custom fields)
- YES: Minimum Transaction Size
- YES: Commission Settings
- YES: Email Templates
- YES: Pages & Content

**Configure in Code (Advanced/Optional):**

- Custom transaction processes (requires Console + code)
- Custom UI beyond template capabilities
- Extended API integrations
- Complex validation logic

---

### Hosted Assets (Fetched from Console)

The template automatically fetches these from Console at runtime:

```javascript
// Asset paths (auto-fetched by template)
/general/localization.json           → Language settings
/content/translations.json           → UI text strings
/content/footer.json                 → Footer configuration
/design/branding.json                → Logo, colors, brand
/design/layout.json                  → Page layouts
/users/user-types.json               → User types & roles
/users/user-fields.json              → Custom user fields
/listings/listing-types.json         → Listing types
/listings/listing-categories.json    → Category hierarchy
/listings/listing-fields.json        → Custom listing fields
/listings/listing-search.json        → Search filter config
/transactions/minimum-transaction-size.json
/transactions/commission.json
/integrations/map.json               → Mapbox/Google Maps
/integrations/analytics.json         → Analytics tracking
```

**Merge Priority**: Console (hosted) > Code (local defaults in `src/config/`)

---

### 1. Branding (Design > Branding)

**Configure in Console:**

```
- Marketplace Color: Primary color (buttons, links, highlights)
- Logo:
  - Desktop logo (recommended: 240x60px PNG)
  - Mobile logo (recommended: 120x30px PNG)
- Marketplace Name: Shown in header, emails, page titles
- Social Sharing Images:
  - Facebook image (1200x630px)
  - Twitter image (600x314px)
- Email Branding:
  - Email button color
  - Email link color
```

**Access in Code:**

```javascript
import { useConfiguration } from '../../context/configurationContext';

const config = useConfiguration();
const { branding } = config;

// branding.marketplaceColor → e.g., "#4A90E2"
// branding.marketplaceName  → e.g., "My Marketplace"
// branding.logo             → Logo URL
// branding.logoSettings     → Dimensions, alt text
```

---

### 2. User Types (Build > Users > User Types)

**What are User Types?** Categorize users by role (Customer, Provider, Vendor, etc.)

**Configure in Console:**

```
- User Type Name: Visible on signup page
- User Type ID: URL identifier (e.g., "customer", "provider")
- User Roles: Provider, Customer, or both
  - Provider → Can create listings, manage sales
  - Customer → Can purchase/book, review sellers
- Account Links (toggle per user type):
  - "Post & Manage Listings"
  - "Payout Details" (Provider only)
  - "Payment Methods"
```

**Limits**: Maximum 20 user types

**Example User Types:**

```
1. Individual Customer
   ID: customer
   Roles: Customer
   Can: Browse, purchase, leave reviews

2. Service Provider
   ID: provider
   Roles: Provider, Customer
   Can: Post services, sell, also purchase

3. Business Account
   ID: business
   Roles: Provider
   Can: Post listings, manage team, receive payouts
```

**Access in Code:**

```javascript
const currentUser = useSelector((state) => state.user.currentUser);
const userType = currentUser?.attributes?.profile?.publicData?.userType;

// Check user roles
const roles = currentUser?.attributes?.profile?.publicData?.roles || [];
const isProvider = roles.includes('provider');
const isCustomer = roles.includes('customer');
```

---

### 3. Listing Types (Build > Listings > Listing Types)

**What are Listing Types?** Define what can be listed: products for sale, hourly bookings, daily
rentals, etc.

**Configure in Console:**

```
- Listing Type Name: Visible to users
- Listing Type ID: Code identifier (e.g., "product-sale", "hourly-booking")
- Transaction Process:
  - default-booking (time-based bookings)
  - default-purchase (one-time purchases)
  - default-inquiry (inquiry/quote requests)
  - Custom process (requires code)
- Unit Type: hour, day, night, item
- Stock Management: Track inventory/availability
- Default Listing Fields: Which fields apply to this type
```

**Common Examples:**

```
1. Product for Sale
   ID: product-sale
   Process: default-purchase
   Unit: item
   Stock: yes

2. Hourly Service
   ID: hourly-service
   Process: default-booking
   Unit: hour
   Stock: calendar-based

3. Equipment Rental
   ID: equipment-rental
   Process: default-booking
   Unit: day
   Stock: yes
```

**Access in Code:**

```javascript
const config = useConfiguration();
const { listing } = config;

// All listing types
const listingTypes = listing.listingTypes;

// Find specific type
const productType = listingTypes.find((t) => t.id === 'product-sale');

// Get listing's type
const listingTypeId = listing.attributes.publicData.listingType;
```

---

### 4. Listing Categories (Build > Listings > Listing Categories)

**What are Listing Categories?** Organize listings into hierarchical groups (up to 3 levels deep).

**Category Hierarchy:**

```
Main Category
├── Subcategory
│   ├── Sub-subcategory
│   ├── Sub-subcategory
│   └── Sub-subcategory
└── Subcategory
    └── Sub-subcategory
```

**Configure in Console:**

```
- Category Name: Visible to users (e.g., "Electronics")
- Category ID: Code identifier (e.g., "electronics")
- Parent Category: For subcategories
```

**Limits**: ~100 total categories (all levels combined, 200KB file limit)

**Example Structure:**

```
Electronics (main)
├── Computers (sub)
│   ├── Laptops (sub-sub)
│   ├── Desktops (sub-sub)
│   └── Tablets (sub-sub)
├── Phones (sub)
│   ├── Smartphones (sub-sub)
│   └── Feature Phones (sub-sub)
└── Accessories (sub)

Furniture (main)
├── Living Room (sub)
├── Bedroom (sub)
└── Office (sub)
```

**Important**: A listing can only be assigned to ONE category/subcategory.

**Access in Code:**

```javascript
const config = useConfiguration();
const { listing } = config;

// All categories
const categories = listing.listingCategories;

// Get listing's category
const categoryId = listing.attributes.publicData.category;
const category = categories.find((c) => c.id === categoryId);

// Check if category has subcategories
const hasSubcategories = category?.subcategories?.length > 0;
```

**Categories vs Listing Types vs Listing Fields:**

- **Types**: Transaction method (booking, purchase, inquiry)
- **Categories**: Organizational groups (Electronics, Furniture)
- **Fields**: Specific attributes (brand, condition, color)

---

### 5. Listing Fields (Build > Listings > Listing Fields)

**What are Listing Fields?** Custom data fields for listings beyond title, description, and price.

**Field Configuration:**

```
- Field Key: Code identifier (e.g., "brand", "condition", "size")
- Field Label: Shown to users (e.g., "Product Brand")
- Field Type: See schema types below
- Required: Mandatory or optional
- Search Schema: Enable filtering (see Search Schemas section)
- Applicable Listing Types: Which types use this field
```

**Schema Types (Data Types):**

| Type           | Description                              | Example                         | UI Element      |
| -------------- | ---------------------------------------- | ------------------------------- | --------------- |
| **enum**       | Single selection from predefined options | `condition: "new"`              | Dropdown select |
| **multi-enum** | Multiple selections                      | `features: ["WiFi", "Parking"]` | Checkboxes      |
| **boolean**    | Yes/No toggle                            | `petFriendly: true`             | Checkbox        |
| **long**       | Integer number                           | `bedrooms: 3`                   | Number input    |
| **text**       | Short text (listing search only)         | Search-optimized text           | Text input      |

**Example Fields:**

```javascript
// Enum field - Single selection
{
  key: "condition",
  label: "Condition",
  type: "enum",
  enumOptions: ["new", "like-new", "good", "fair"],
  required: true,
  listingTypes: ["product-sale"]
}

// Multi-enum field - Multiple selections
{
  key: "amenities",
  label: "Amenities",
  type: "multi-enum",
  enumOptions: ["WiFi", "Parking", "Pool", "Gym", "Pet-friendly"],
  required: false,
  listingTypes: ["apartment-rental"]
}

// Boolean field
{
  key: "isNegotiable",
  label: "Price is negotiable",
  type: "boolean",
  required: false,
  listingTypes: ["product-sale"]
}

// Long field - Number
{
  key: "bedrooms",
  label: "Number of Bedrooms",
  type: "long",
  required: true,
  listingTypes: ["apartment-rental"]
}
```

**Where Console Listing Fields Are Stored:**

**WARNING: CRITICAL**: All listing fields created in Console automatically appear in `listing.attributes.publicData.{fieldKey}`

```javascript
// Console field with key "brand" → automatically stored at:
listing.attributes.publicData.brand

// Console field with key "condition" → automatically stored at:
listing.attributes.publicData.condition

// Console field with key "amenities" (multi-enum) → stored as array:
listing.attributes.publicData.amenities // ["WiFi", "Parking", "Pool"]

// Categories → automatically stored at:
listing.attributes.publicData.categoryLevel1 // "electronics"
listing.attributes.publicData.categoryLevel2 // "laptops"
listing.attributes.publicData.categoryLevel3 // "gaming-laptops"
```

**Access Field Configuration & Data (with Defensive Fallbacks):**

```javascript
// Get field configuration from Console
const config = useConfiguration();
const listingFields = config.listing?.listingFields || [];

// YES: DEFENSIVE: Find field config with fallback
const conditionField = listingFields.find((f) => f.key === 'condition');

// YES: DEFENSIVE: Access field value with optional chaining
const condition = listing.attributes?.publicData?.condition;
const amenities = listing.attributes?.publicData?.amenities || [];

// YES: DEFENSIVE: Access field config properties with fallbacks
const isRequired = conditionField?.required || false;
const allowedValues = conditionField?.enumOptions || [];
const fieldLabel = conditionField?.label || 'Condition';

// YES: DEFENSIVE: Check if field exists before rendering
if (condition && conditionField) {
  // Safe to render
  return <div>{fieldLabel}: {condition}</div>;
}
```

**WARNING: Defensive Coding - Handle Missing Console Config:**

Always use fallbacks to prevent website breakage if Console fields are accidentally deleted:

```javascript
// NO: BAD - Will crash if field deleted from Console
const brandOptions = config.listing.listingFields
  .find(f => f.key === 'brand')
  .enumOptions;

// YES: GOOD - Graceful fallback
const brandField = config.listing?.listingFields?.find(f => f.key === 'brand');
const brandOptions = brandField?.enumOptions || [];
const hasBrandField = brandOptions.length > 0;

{hasBrandField && (
  <select>
    {brandOptions.map(option => (
      <option key={option} value={option}>{option}</option>
    ))}
  </select>
)}
```

**Default publicData Fields (Automatically Added):**

Depending on the listing type and transaction process, certain fields are automatically added to `publicData`. You DON'T need to create these fields - they're managed by the template:

**Example: Purchase Listing Type**
```json
{
  "publicData": {
    // Category (if categories enabled)
    "categoryLevel1": "cat1",
    "categoryLevel2": "cat2",
    "categoryLevel3": "cat3",

    // Listing type and process (automatically set)
    "listingType": "product-test",
    "transactionProcessAlias": "default-purchase/release-1",
    "unitType": "item",

    // Shipping options (for purchase listings)
    "pickupEnabled": false,
    "shippingEnabled": true,
    "shippingPriceInSubunitsOneItem": 1000,
    "shippingPriceInSubunitsAdditionalItems": 0,

    // Custom fields you created in Console
    "exampleField": "option2",
    "brand": "Apple",
    "condition": "new"
  }
}
```

**Common Default Fields by Transaction Type:**

| Field | Type | Transaction Types | Purpose |
|-------|------|-------------------|---------|
| `listingType` | string | All | Listing type ID (e.g., "product-sale", "rental-booking") |
| `transactionProcessAlias` | string | All | Transaction process alias |
| `unitType` | string | All | Unit of measure ("item", "hour", "day", "night") |
| `categoryLevel1`, `categoryLevel2`, `categoryLevel3` | string | All (if categories enabled) | Category hierarchy |
| `shippingEnabled` | boolean | Purchase | Allow shipping |
| `pickupEnabled` | boolean | Purchase | Allow local pickup |
| `shippingPriceInSubunitsOneItem` | number | Purchase | Shipping cost for 1 item (in cents) |
| `shippingPriceInSubunitsAdditionalItems` | number | Purchase | Shipping cost per additional item |

**Important Notes:**
- These fields are managed by the template code - don't manually set them unless customizing
- `listingType` and `transactionProcessAlias` are set when creating/editing listings
- Categories are set via the category picker UI component
- Shipping fields are set via the EditListingDeliveryPanel component
- Custom fields you create in Console are stored alongside these defaults

---

### 6. Extended Data & Scopes

**What is Extended Data?** Custom data storage on listings, users, and transactions. Six different scopes control who can read/write data.

#### Extended Data Scopes - Permissions & Use Cases

| Scope | Write Permission | Read Permission | Expected Use Case |
|-------|------------------|-----------------|-------------------|
| **publicData** | Author (owner), Operators | Everyone (including anonymous) | Filterable listing details (brand, condition), user skills, visible attributes |
| **protectedData** | Author (owner), Operators | Transaction participants only | Contact info after booking, delivery address, phone number |
| **privateData** | Author (owner), Operators | Author (owner), Operators | Internal seller notes, draft content, integrations data |
| **publicMetadata** | Operators only (via Integration API) | Everyone (including anonymous) | Featured badges, verification status, admin-controlled flags |
| **protectedMetadata** | Operators only (via Integration API) | Transaction participants only | Zoom meeting links, access codes generated by backend |
| **privateMetadata** | Operators only (via Integration API) | Operators only | Admin tracking, moderation flags, analytics data |

**Key Differences:**

- **Data** scopes: Can be written by listing/user authors through client app
- **Metadata** scopes: Can ONLY be written by operators via Integration API or privileged backend endpoints
- **Public**: Visible to everyone
- **Protected**: Visible only within transactions
- **Private**: Visible only to owner/operators

#### Who Can Do What?

**Writing Extended Data:**

| Scope | Client App (SDK) | Integration API | Privileged Endpoints |
|-------|------------------|-----------------|----------------------|
| publicData | YES: Author can write | YES: Operator can write | YES: Operator can write |
| protectedData | YES: Author can write | YES: Operator can write | YES: Operator can write |
| privateData | YES: Author can write | YES: Operator can write | YES: Operator can write |
| publicMetadata | NO: Cannot write | YES: Operator can write | YES: Operator can write |
| protectedMetadata | NO: Cannot write | YES: Operator can write | YES: Operator can write |
| privateMetadata | NO: Cannot write | YES: Operator can write | YES: Operator can write |

**Reading Extended Data:**

| Scope | Anonymous Users | Authenticated Users | Transaction Participants | Author/Owner | Operators |
|-------|----------------|---------------------|--------------------------|--------------|-----------|
| publicData | YES: Read | YES: Read | YES: Read | YES: Read | YES: Read |
| protectedData | NO: No access | NO: No access | YES: Read | YES: Read | YES: Read |
| privateData | NO: No access | NO: No access | NO: No access | YES: Read | YES: Read |
| publicMetadata | YES: Read | YES: Read | YES: Read | YES: Read | YES: Read |
| protectedMetadata | NO: No access | NO: No access | YES: Read | YES: Read | YES: Read |
| privateMetadata | NO: No access | NO: No access | NO: No access | NO: No access | YES: Read |

**Scope Prefixes in Code:**

```javascript
// Public data
listing.attributes.publicData.brand;
user.attributes.profile.publicData.skills;
transaction.attributes.protectedData.deliveryAddress; // Note: transactions don't have publicData

// Protected data
listing.attributes.protectedData.sellerPhone;
user.attributes.profile.protectedData.phoneNumber;
transaction.attributes.protectedData.meetingLink;

// Private data
listing.attributes.privateData.internalNotes;
user.attributes.profile.privateData.draftBio;
transaction.attributes.privateData.internalFlag; // Note: transactions don't have privateData

// Metadata (operator-only write)
listing.attributes.publicMetadata.isFeatured;
listing.attributes.protectedMetadata.accessCode;
listing.attributes.privateMetadata.moderationFlag;
```

#### Entity-Specific Scope Availability

**Listings:**
- YES: publicData, protectedData, privateData
- YES: publicMetadata, protectedMetadata, privateMetadata

**Users:**
- YES: profile.publicData, profile.protectedData, profile.privateData
- YES: profile.publicMetadata, profile.protectedMetadata, profile.privateMetadata

**Transactions:**
- NO: NO publicData (transactions don't have public data)
- YES: protectedData (visible to both parties)
- NO: NO privateData (transactions don't have private data)
- YES: publicMetadata, protectedMetadata, privateMetadata

**Which Scopes Support Search?**

| Entity | Searchable Scopes | Not Searchable |
|--------|-------------------|----------------|
| **Listings** | publicData, publicMetadata | protectedData, privateData, protectedMetadata, privateMetadata |
| **Users** | publicData, protectedData, privateData, publicMetadata, protectedMetadata, privateMetadata | (all scopes searchable) |
| **Transactions** | protectedData, publicMetadata, protectedMetadata, privateMetadata | publicData (doesn't exist), privateData (doesn't exist) |

#### Expected Use Cases by Scope

**publicData** - Searchable, visible to everyone
- YES: Listing: brand, condition, size, color, features
- YES: User: skills, experience level, location, bio
- NO: Listing: seller phone (use protectedData)
- NO: Listing: internal notes (use privateData)

**protectedData** - Visible in transactions only
- YES: Listing: seller contact info (revealed after booking)
- YES: User: phone number, email (for transaction communication)
- YES: Transaction: delivery address, shipping details
- NO: Public details (use publicData)

**privateData** - Owner and operators only
- YES: Listing: internal notes, draft content, Stripe product ID
- YES: User: draft bio, integration tokens, preferences
- NO: Transaction: (transactions don't have privateData)
- NO: Operator-only data (use privateMetadata)

**publicMetadata** - Operator-controlled, visible to everyone
- YES: Listing: featured badge, verified status, quality score
- YES: User: verified badge, trust score
- YES: Transaction: public transaction type
- NO: User-editable (users cannot write metadata)

**protectedMetadata** - Operator-controlled, visible in transactions
- YES: Transaction: Zoom meeting link, access code
- YES: Listing: special booking instructions revealed after booking
- NO: Public badges (use publicMetadata)

**privateMetadata** - Operator-only (hidden from users)
- YES: Listing: moderation flags, admin notes, analytics tracking
- YES: User: risk score, internal admin notes
- YES: Transaction: fraud detection flags, internal status
- NO: Public data (use publicData or publicMetadata)

#### How to Write Extended Data

**From Client App (publicData, protectedData, privateData only):**

```javascript
// Create/update listing
sdk.ownListings.create({
  title: 'Vintage Chair',
  publicData: {
    brand: 'Herman Miller',  // Visible to everyone
    condition: 'excellent'
  },
  protectedData: {
    sellerPhone: '+1234567890'  // Only visible in transactions
  },
  privateData: {
    internalNotes: 'Acquired from estate sale'  // Only owner/operators
  }
});

// Update user profile
sdk.currentUser.updateProfile({
  publicData: {
    experienceLevel: 'expert'  // Visible to everyone
  },
  protectedData: {
    phoneNumber: '+1234567890'  // Only visible in transactions
  },
  privateData: {
    preferences: { newsletter: true }  // Only owner/operators
  }
});
```

**From Backend - Integration API (metadata scopes):**

```javascript
// server/api/custom-set-featured.js
// Metadata can ONLY be set via Integration API or privileged endpoints

const integrationSdk = require('sharetribe-flex-integration-sdk');
const sdk = integrationSdk.createInstance({ clientId, clientSecret });

// Set featured badge (publicMetadata)
await sdk.listings.update({
  id: listingId,
  publicMetadata: {
    isFeatured: true,  // Visible to everyone, but only operators can set
    featuredUntil: '2024-12-31'
  }
});

// Set access code (protectedMetadata)
await sdk.transactions.update({
  id: transactionId,
  protectedMetadata: {
    zoomLink: 'https://zoom.us/j/123456',  // Only transaction participants see
    accessCode: 'ABC123'
  }
});

// Set moderation flag (privateMetadata)
await sdk.listings.update({
  id: listingId,
  privateMetadata: {
    moderationFlag: 'needs-review',  // Only operators see this
    flaggedAt: new Date().toISOString()
  }
});
```

---

### 7. Search & Filtering

There are **TWO types** of search/filter parameters:

#### A. Built-in API Search Parameters (No Schema Required)

These work out-of-the-box without any search schema configuration:

**Listing Search (Built-in):**
- `keywords` - Full-text search in title and description
- `price` - Filter by price (min,max in subunits)
- `origin` - Geolocation center point (lat,lng)
- `bounds` - Bounding box (ne_lat,ne_lng,sw_lat,sw_lng)
- `start`, `end` - Availability date range (for bookings)
- `states` - Listing states (published, closed, etc.)
- `authorId` - Filter by listing author
- `ids` - Filter by specific listing IDs

**User Search (Built-in):**
- `keywords` - Search in display name, bio
- `createdAtStart`, `createdAtEnd` - User creation date range

**Transaction Search (Built-in):**
- `customerId`, `providerId` - Filter by customer or provider
- `lastTransitionedAt` - Filter by transition date
- `states` - Transaction states (enquired, accepted, etc.)

**Example using built-in filters:**
```javascript
// No search schema needed - these work by default
const response = await sdk.listings.query({
  keywords: 'vintage furniture',
  price: '5000,50000',  // $50-$500 in cents
  origin: '40.7128,-74.0060',  // NYC coordinates
  bounds: '41.0,-73.0,40.0,-75.0',  // Bounding box
  start: '2024-12-01',
  end: '2024-12-07',
  authorId: 'user-uuid',
  states: 'published',
});
```

#### B. Extended Data Search Schemas (CLI Required - Only for Filtering)

**WARNING: CRITICAL**: Search schemas are ONLY needed if you want to **filter or search** by extended data fields. You can store extended data without a search schema - it just won't be filterable.

**When you need a search schema:**
- YES: Filtering listings by brand, condition, amenities
- YES: Searching users by experience level, skills
- YES: Filtering by featured badge, verification status

**When you DON'T need a search schema:**
- NO: Just storing extra data for display (seller notes, custom descriptions)
- NO: Data that's only shown on detail pages, not used for filtering
- NO: Internal tracking data that users don't filter by

**WARNING: IMPORTANT**: Search schemas only define the **field name** and **type**. They do NOT define enum options - those come from the field configuration in Console.

**Configure via Sharetribe CLI:**

```bash
# View existing schemas
flex-cli search -m my-marketplace

# Add search schema for listing field (enum)
# Note: You only specify the type (enum), NOT the enum options
# The actual enum options come from Console field configuration
flex-cli search set \
  --key condition \
  --type enum \
  --scope public \
  -m my-marketplace

# Add schema for user profile field
flex-cli search set \
  --schema-for userProfile \
  --key experienceLevel \
  --type enum \
  --scope public \
  -m my-marketplace

# Add schema with default value
flex-cli search set \
  --key isFeatured \
  --type boolean \
  --scope metadata \
  --default false \
  -m my-marketplace

# Remove schema
flex-cli search unset \
  --key condition \
  --scope public \
  -m my-marketplace
```

**Extended Data Search Schema Types:**

| Schema Type    | Query Behavior                        | Example Query                                             |
| -------------- | ------------------------------------- | --------------------------------------------------------- |
| **enum**       | Exact match, OR logic                 | `pub_condition=new,used` → new OR used                    |
| **multi-enum** | has_all (AND) or has_any (OR)         | `pub_amenities=WiFi,Pool`                                 |
| **boolean**    | Exact true/false                      | `pub_petFriendly=true`                                    |
| **long**       | Range queries                         | `pub_bedrooms=2` or `pub_bedrooms_min=2&pub_bedrooms_max=4` |
| **text**       | Partial keyword match (listings only) | Integrated with keyword search                            |

**Important Rules:**

- Fields created in Console automatically get search schemas (if marked filterable)
- CLI-created schemas prevent creating Console fields with same key
- Use scope prefixes in queries: `pub_` (publicData), `prot_` (protectedData), `priv_` (privateData), `meta_` (metadata)
- Enum options are NOT part of the search schema - they come from field configuration

**Access in Code:**

```javascript
// Template automatically creates filters for enum/multi-enum fields from Console
// Check src/config/configSearch.js for filter configuration

// Custom API query with built-in + extended data search
const response = await sdk.listings.query({
  // Built-in filters (no schema needed)
  keywords: 'modern sofa',
  price: '10000,50000',
  origin: '40.7128,-74.0060',

  // Extended data filters (require search schemas)
  pub_condition: 'new,like-new', // Enum: OR match
  pub_amenities: 'WiFi,Pool', // Multi-enum
  pub_petFriendly: true, // Boolean
  pub_bedrooms: 2, // Long: exact
  meta_isFeatured: true, // Metadata
});
```

**What Data Can Be Searched?**

| Entity Type | Searchable Scopes | Not Searchable |
|-------------|-------------------|----------------|
| **Listings** | publicData, publicMetadata | protectedData, privateData, protectedMetadata, privateMetadata |
| **Users** | publicData, protectedData, privateData, publicMetadata, protectedMetadata, privateMetadata | (all scopes searchable) |
| **Transactions** | protectedData, publicMetadata, protectedMetadata, privateMetadata | publicData, privateData |

**Supported Search Schema Types:**

Only these data types can have search schemas:
- YES: `enum` - Single selection fields
- YES: `multi-enum` - Multiple selection fields
- YES: `boolean` - Yes/No fields
- YES: `long` - Integer numbers
- YES: `text` - Short text (listings only, integrated with keyword search)

**NOT searchable:**
- NO: Free-form text longer than 255 characters (use title/description instead)
- NO: Arrays of objects
- NO: Nested JSON structures
- NO: Floating-point numbers (use `long` for integers only)

**Console vs CLI for Search Schemas:**

| Method | When to Use | Limitations |
|--------|-------------|-------------|
| **Console** (automatic) | Fields created via Build > Listings > Listing Fields | Only for listings publicData. Search schema created automatically when field marked as "filterable" |
| **CLI** (manual) | User profiles, metadata, transactions, custom schemas | Prevents creating Console fields with same key. More control over configuration. |

**Console field marked as "filterable"** → Search schema created automatically
**CLI schema exists** → Cannot create Console field with same key

---

### Understanding Data Storage Needs - Decision Guide

When a user asks for a feature requiring data storage, use this guide:

#### Common Storage Scenarios

**Scenario 1: "I want to filter listings by [X]"**

YES: **Solution**: Add Console listing field with search schema

```javascript
// User: "I want to filter listings by brand"
// Agent: Creates Console field

{
  key: "brand",
  label: "Brand",
  type: "enum",  // or text if many brands
  enumOptions: ["Apple", "Samsung", "Google"],  // if enum
  required: false,
  listingTypes: ["product-sale"],
  filterable: true  // Creates search schema automatically
}

// Stored at: listing.attributes.publicData.brand
// Searchable: Yes (pub_brand query parameter)
// Visible: Everyone
```

**Scenario 2: "I want to store seller's phone number for buyers"**

YES: **Solution**: Use protectedData (visible only to transaction participants)

```javascript
// User: "Show seller phone to buyer after booking"
// Agent: Uses protectedData

listing.attributes.protectedData.sellerPhone = "+1234567890";

// Stored at: listing.attributes.protectedData.sellerPhone
// Searchable: No (and shouldn't be)
// Visible: Only in active transactions
```

**Scenario 3: "I want to mark some listings as 'Featured'"**

YES: **Solution**: Use publicMetadata with CLI search schema

```bash
# Add search schema via CLI
flex-cli search set \
  --key isFeatured \
  --type boolean \
  --scope metadata \
  --default false \
  -m my-marketplace
```

```javascript
// Set via Integration API or custom backend
listing.attributes.publicMetadata.isFeatured = true;

// Stored at: listing.attributes.publicMetadata.isFeatured
// Searchable: Yes (meta_isFeatured=true)
// Visible: Everyone
// Editable: Only operators (not listing authors)
```

**Scenario 4: "I want internal notes visible only to admins"**

YES: **Solution**: Use privateData or privateMetadata

```javascript
// User: "Add admin notes that users can't see"
// Agent: Uses privateData

listing.attributes.privateData.adminNotes = "Requires manual approval";

// Stored at: listing.attributes.privateData.adminNotes
// Searchable: No
// Visible: Only listing owner and operators
```

**Scenario 5: "I want to track how many times a listing was viewed"**

YES: **Solution**: Use privateMetadata (operator-only, not user-editable)

```javascript
// User: "Track listing view count"
// Agent: Uses privateMetadata

listing.attributes.privateMetadata.viewCount = 42;

// Stored at: listing.attributes.privateMetadata.viewCount
// Searchable: Yes (can add search schema via CLI)
// Visible: Only operators
// Editable: Only operators (users can't manipulate count)
```

**Scenario 6: "I want to store user's experience level and filter by it"**

YES: **Solution**: Add Console user field + CLI search schema

```javascript
// Step 1: Create Console user field
{
  key: "experienceLevel",
  label: "Experience Level",
  type: "enum",
  enumOptions: ["beginner", "intermediate", "expert"],
  required: false,
  userTypes: ["provider"]
}

// Step 2: Add search schema via CLI
// flex-cli search set --schema-for userProfile --key experienceLevel --type enum --scope public

// Stored at: user.attributes.profile.publicData.experienceLevel
// Searchable: Yes (pub_experienceLevel query parameter)
// Visible: Everyone (public profile)
```

**Scenario 7: "I want to store Zoom meeting link for bookings"**

YES: **Solution**: Use transaction protectedData

```javascript
// User: "Share Zoom link with buyer after booking confirmed"
// Agent: Uses transaction protectedData

transaction.attributes.protectedData.zoomLink = "https://zoom.us/j/123456";

// Stored at: transaction.attributes.protectedData.zoomLink
// Searchable: Yes (can add search schema via CLI)
// Visible: Only transaction participants (buyer + seller)
```

#### Quick Reference: Which Scope to Use?

| Need | Scope | Searchable? | Who Can Edit? | Who Can View? |
|------|-------|-------------|---------------|---------------|
| Filter/search listings | `publicData` | YES: Yes | Author, Operator | Everyone |
| Display extra listing details | `publicData` | YES: Yes | Author, Operator | Everyone |
| Contact info after booking | `protectedData` | NO: No | Author, Operator | Transaction members |
| Admin/internal notes | `privateData` | NO: No | Author, Operator | Author, Operator |
| Featured/verified badges | `publicMetadata` | YES: Yes (CLI) | Operator only | Everyone |
| Transaction-specific info | `protectedData` (tx) | YES: Yes (CLI) | Operator only | Transaction members |
| Admin flags/tracking | `privateMetadata` | YES: Yes (CLI) | Operator only | Operator only |

#### Data Type Selection Guide

| User Wants to Store | Use Type | Why |
|---------------------|----------|-----|
| Category/selection from dropdown | `enum` | Single choice, searchable with OR logic |
| Multiple checkboxes | `multi-enum` | Multiple choices, searchable with has_any/has_all |
| Yes/No toggle | `boolean` | True/false, searchable |
| Count/quantity/age | `long` | Integer, supports range queries |
| Short text for search | `text` | Keyword search (listings only) |
| Long description | N/A | Use `title` or `description` standard fields |
| Price | N/A | Use `price` standard field |
| Location | N/A | Use `geolocation` standard field |
| Images | N/A | Use `images` standard field |
| Complex nested data | NO: Not supported | Flatten into multiple fields or store JSON string (not searchable) |

#### Common Mistakes to Avoid

NO: **DON'T** add searchable fields users don't need to filter by
- Increases complexity, slows search performance

NO: **DON'T** use publicData for sensitive information
- Phone numbers, addresses → Use `protectedData`

NO: **DON'T** use text schema for structured data
- Use `enum` for predefined options, not free text

NO: **DON'T** create CLI search schemas for fields that will be in Console
- Console fields auto-create schemas. CLI schemas prevent Console field creation.

NO: **DON'T** try to search privateData on listings
- Only publicData and metadata are searchable for listings

YES: **DO** use Console for user-facing filterable fields
- Easier management, no CLI commands needed

YES: **DO** use metadata for operator-controlled features
- Featured listings, verification badges, admin tracking

YES: **DO** use appropriate scope for data visibility needs
- Think about who needs to see the data

---

### 8. User Fields (Build > Users > User Fields)

**Default User Fields (Always Available):**

- Email address (mandatory)
- Password (mandatory)
- First name (mandatory)
- Last name (mandatory)
- Display name (optional, toggle in Console)
- Phone number (optional, toggle in Console)

**Custom User Fields:** Same configuration as listing fields (enum, multi-enum, boolean, long,
text).

**Example Custom Fields:**

```javascript
{
  key: "companyName",
  label: "Company Name",
  type: "text",
  required: false,
  userTypes: ["business"]
}

{
  key: "experienceLevel",
  label: "Experience Level",
  type: "enum",
  enumOptions: ["beginner", "intermediate", "expert"],
  required: true,
  userTypes: ["provider"]
}
```

**Where Console User Fields Are Stored:**

**WARNING: CRITICAL**: All user fields created in Console automatically appear in `user.attributes.profile.publicData.{fieldKey}`

```javascript
// Console user field with key "companyName" → automatically stored at:
user.attributes.profile.publicData.companyName

// Console user field with key "experienceLevel" → automatically stored at:
user.attributes.profile.publicData.experienceLevel

// Console user field with key "skills" (multi-enum) → stored as array:
user.attributes.profile.publicData.skills // ["JavaScript", "React", "Node.js"]
```

**Where User Fields Appear (Configurable in Console):**

User fields can be configured to show in two places:

1. **Signup Page** - Collect data during registration
2. **Profile Page** - Collect/edit data on user profile

**Note**: This is configured per-field in Console when creating the user field.

**Access User Field Data (with Defensive Fallbacks):**

```javascript
const currentUser = useSelector((state) => state.user.currentUser);
const publicData = currentUser?.attributes?.profile?.publicData || {};

// YES: DEFENSIVE: Access with optional chaining and fallbacks
const companyName = publicData?.companyName;
const experienceLevel = publicData?.experienceLevel;
const skills = publicData?.skills || [];

// YES: DEFENSIVE: Get field configuration
const config = useConfiguration();
const userFields = config.user?.userFields || [];
const experienceField = userFields.find(f => f.key === 'experienceLevel');
const experienceOptions = experienceField?.enumOptions || [];

// YES: DEFENSIVE: Check field exists before rendering
{experienceLevel && experienceField && (
  <div>
    {experienceField.label}: {experienceLevel}
  </div>
)}
```

**Workflow: Customizing User Field Display**

When a user wants custom-designed rendering of Console user fields:

1. **User creates field in Console:**
   - Go to Build > Users > User Fields
   - Create field (e.g., key: `experienceLevel`, type: `enum`)
   - Configure where to show it (signup page, profile page, or both)

2. **User provides field name to agent:**
   - "I created a field called `experienceLevel`"

3. **Agent writes custom UI code:**
   ```javascript
   // src/components/CustomUserProfile/CustomUserProfile.js
   const CustomUserProfile = ({ user }) => {
     const config = useConfiguration();
     const publicData = user.attributes?.profile?.publicData || {};

     // YES: DEFENSIVE: Get field and data with fallbacks
     const userFields = config.user?.userFields || [];
     const expField = userFields.find(f => f.key === 'experienceLevel');
     const experienceLevel = publicData?.experienceLevel;

     // YES: DEFENSIVE: Only render if field exists in Console
     if (!expField || !experienceLevel) {
       return null; // Graceful degradation
     }

     return (
       <div className={css.experienceSection}>
         <h3>{expField.label}</h3>
         <div className={css.experienceBadge}>
           {experienceLevel === 'expert' && <ExpertIcon />}
           {experienceLevel === 'intermediate' && <IntermediateIcon />}
           {experienceLevel === 'beginner' && <BeginnerIcon />}
           <span>{experienceLevel}</span>
         </div>
       </div>
     );
   };
   ```

**Defensive Coding Patterns for User Fields:**

```javascript
// NO: BAD - Will crash if field deleted from Console
const experienceOptions = config.user.userFields
  .find(f => f.key === 'experienceLevel')
  .enumOptions;

// YES: GOOD - Graceful fallback
const userFields = config.user?.userFields || [];
const expField = userFields.find(f => f.key === 'experienceLevel');
const experienceOptions = expField?.enumOptions || [];

// YES: GOOD - Provide default if Console field missing
const getFieldLabel = (fieldKey) => {
  const field = userFields.find(f => f.key === fieldKey);
  return field?.label || fieldKey; // Fallback to key name
};

// YES: GOOD - Handle missing data gracefully
const renderUserField = (fieldKey) => {
  const field = userFields.find(f => f.key === fieldKey);
  const value = publicData?.[fieldKey];

  if (!field) {
    // Field deleted from Console - skip rendering
    return null;
  }

  if (!value) {
    // User hasn't filled in field yet
    return <div>{field.label}: Not provided</div>;
  }

  return <div>{field.label}: {value}</div>;
};
```

**Why Defensive Coding Matters:**

- Operators may accidentally delete fields from Console during configuration
- Users may not have filled in optional fields
- Field configuration may change over time
- Website should degrade gracefully, not crash with errors
- Show fallback content or hide sections rather than breaking the page

---

### 9. Email Templates (Content > Email Templates)

Configure in Console:

- Transactional emails (booking confirmed, payment received, etc.)
- Email subject lines
- Email body content with variables
- Email branding (logo, colors)

**Not editable in code** - all email customization via Console.

---

### 10. Pages & Content (Content > Pages)

Configure in Console:

- Landing page
- About page
- FAQ page
- Terms of Service
- Privacy Policy
- Custom pages

**Console pages support Markdown** for rich text content. When editing page sections in Console, you can use markdown formatting in text fields.

**Supported Markdown Features:**

- **Headings**: `# H1`, `## H2`, `### H3`, `#### H4`, `##### H5`, `###### H6`
- **Paragraphs**: Regular text paragraphs
- **Lists**:
  - Unordered lists with `*` or `-`
  - Ordered lists with `1.`, `2.`, etc.
- **Emphasis**: `*italic*`, `**bold**`
- **Links**: `[link text](https://example.com)` or `[internal link](/about)`
- **Images**: `![alt text](https://example.com/image.jpg)`
- **Code**: Inline `` `code` `` and code blocks with triple backticks
- **Anchor links**: `#section-id` for same-page navigation

**Markdown Processing Pipeline:**

The template uses a secure markdown pipeline that automatically sanitizes content:

1. `remark-parse` - Parses markdown to AST
2. `remark-rehype` - Converts markdown AST to HTML AST
3. `rehype-sanitize` - Sanitizes HTML (prevents XSS attacks)
4. `rehype-react` - Converts HTML AST to React components

**This means:**
- Content is automatically XSS-safe
- Links are automatically converted to React Router links for internal navigation
- Images are lazy-loaded with proper sizing
- HTML tags in markdown are sanitized for security

**Example Markdown in Console:**

```markdown
## Welcome to Our Marketplace

We connect **buyers** and **sellers** in a trusted community.

### Features

- Secure payments
- Verified users
- 24/7 support

[Learn more](/about) or [start browsing](/s).
```

**Access in Code:**

```javascript
// Template fetches page content from:
/content/pages/{pageId}.json

// Rendered by PageBuilder which processes markdown fields
// See src/containers/PageBuilder/markdownProcessor.js
```

---

### 10a. Layout Configuration (Console > Design > Layout)

**WARNING: CRITICAL**: Console layout settings control which page variants are loaded. This affects styling and component structure.

#### SearchPage Layout Variants

Console setting: `searchPage.variantType`

**Two variants available:**

| Variant | When to Use | Layout | File |
|---------|-------------|--------|------|
| **map** | Location-based search (rentals, venues) | Search results + interactive map side-by-side | `SearchPageWithMap.js` |
| **grid** | General listings (products, services) | Grid of listing cards with filters sidebar | `SearchPageWithGrid.js` |

**Key Differences:**

**Map Variant:**
- Interactive map shows listing locations
- Click map markers to view listings
- Map updates as you pan/zoom
- Better for location-based browsing
- Filters shown in modal/dropdown

**Grid Variant:**
- No map, more screen space for listings
- Filter sidebar always visible on desktop
- Vertical scrolling grid layout
- Better for category/attribute browsing
- More listings visible at once

**Console Configuration:**

```
Console > Design > Layout

searchPage:
  variantType: map  (or 'grid')
```

**Checking Active Variant in Code:**

```javascript
import { useConfiguration } from '../../context/configurationContext';

const MyComponent = () => {
  const config = useConfiguration();
  const searchVariant = config.layout?.searchPage?.variantType || 'map';

  const isMapVariant = searchVariant === 'map';
  const isGridVariant = searchVariant === 'grid';

  // Adapt styling/behavior based on variant
  return (
    <div className={isMapVariant ? css.mapLayout : css.gridLayout}>
      {/* Custom content */}
    </div>
  );
};
```

#### ListingPage Layout Variants

Console setting: `listingPage.variantType`

**Two variants available:**

| Variant | Image Display | File |
|---------|---------------|------|
| **carousel** | Original aspect ratio, horizontal carousel | `ListingPageCarousel.js` |
| **coverPhoto** | Cropped hero image at top, thumbnails below | `ListingPageCoverPhoto.js` |

**Key Differences:**

**Carousel Variant:**
- Images shown in full aspect ratio
- Horizontal scrolling carousel
- Better for showcasing image details
- More traditional product page feel

**Cover Photo Variant:**
- Hero image cropped to 16:9
- More dramatic visual impact
- Better for properties/venues
- Modern magazine-style layout

**Console Configuration:**

```
Console > Design > Layout

listingPage:
  variantType: carousel  (or 'coverPhoto')
```

**How Variants Are Applied:**

```javascript
// src/routing/routeConfiguration.js
const routeConfiguration = (layoutConfig, accessControlConfig) => {
  // SearchPage variant selection
  const SearchPage = layoutConfig.searchPage?.variantType === 'map'
    ? SearchPageWithMap
    : SearchPageWithGrid;

  // ListingPage variant selection
  const ListingPage = layoutConfig.listingPage?.variantType === 'carousel'
    ? ListingPageCarousel
    : ListingPageCoverPhoto;

  return [
    {
      path: '/s',
      name: 'SearchPage',
      component: SearchPage, // Uses selected variant
    },
    {
      path: '/l/:slug/:id',
      name: 'ListingPage',
      component: ListingPage, // Uses selected variant
    },
  ];
};
```

#### Customizing Layout Variants

**Option 1: Work with Existing Variant (Recommended)**

Customize the active variant without changing Console:

```javascript
// Custom styles for SearchPageWithMap
// src/containers/SearchPage/SearchPageWithMap.module.css
.mapContainer {
  /* Your custom map styling */
}

// Or create custom wrapper
// src/containers/SearchPage/CustomSearchPageWithMap.js
const CustomSearchPageWithMap = (props) => {
  return (
    <div className={css.customMapLayout}>
      <SearchPageWithMap {...props} />
      {/* Additional custom UI */}
    </div>
  );
};
```

**Option 2: Create Custom Variant (Advanced)**

If you need fundamentally different layout:

1. **Tell user which variant to configure in Console**
2. **Create custom component that checks variant**
3. **Apply custom styling based on variant**

```javascript
// Check which variant is active, apply custom design
const config = useConfiguration();
const searchVariant = config.layout?.searchPage?.variantType;

if (searchVariant === 'map') {
  // Custom design for map variant
} else {
  // Custom design for grid variant
}
```

#### Why This Matters for Design Work

**When client asks: "I want to customize the search page"**

Agent should:

1. **Check Console layout setting:**
   ```
   "What's your current SearchPage layout in Console?
   (Console > Design > Layout > searchPage.variantType)

   Is it 'map' or 'grid'?"
   ```

2. **Design for the correct variant:**
   - Map variant: Consider map placement, marker styling
   - Grid variant: Consider filter sidebar, card grid layout

3. **Test with active variant:**
   - Don't design map features for grid variant
   - Don't design sidebar features that won't appear in map variant

#### Main Search Type (Topbar Search)

Console setting: `mainSearch.searchType`

Controls what search input appears in the top navigation bar.

**Two options:**

| Search Type | Use Case | Topbar Displays |
|-------------|----------|-----------------|
| **location** | Location-based marketplace (rentals, venues, local services) | Location autocomplete input (powered by Mapbox/Google Maps) |
| **keywords** | Product marketplace, general listings | Keywords text input (searches title + description) |

**Console Configuration:**

```
Console > Build > Listings > Search

mainSearch:
  searchType: location  (or 'keywords')
```

**Impact on Design:**

**Location Search:**
- Shows location autocomplete in topbar
- User types address, sees suggestions
- Usually paired with `map` SearchPage variant
- Location displayed in topbar search

**Keywords Search:**
- Shows simple text input in topbar
- User types keywords, searches title/description
- Usually paired with `grid` SearchPage variant
- Keywords displayed in topbar search

**Checking in Code:**

```javascript
import { useConfiguration } from '../../context/configurationContext';
import { isMainSearchTypeKeywords } from '../../util/search';

const MyComponent = () => {
  const config = useConfiguration();
  const isKeywordsSearch = isMainSearchTypeKeywords(config);

  return (
    <div>
      {isKeywordsSearch ? (
        <div>Design for keywords search</div>
      ) : (
        <div>Design for location search</div>
      )}
    </div>
  );
};
```

**Common Console Configurations:**

| Marketplace Type | SearchPage Variant | Main Search Type |
|------------------|-------------------|------------------|
| **Vacation Rentals** | map | location |
| **Event Venues** | map | location |
| **Product Marketplace** | grid | keywords |
| **Services Marketplace** | grid | keywords or location |
| **Local Services** | map | location |

**Agent Checklist for Search/Listing Page Customization:**

```
Before customizing SearchPage or ListingPage:

[ ] Check Console > Design > Layout settings
[ ] Identify SearchPage variant (map or grid)
[ ] Identify ListingPage variant (carousel or coverPhoto)
[ ] Check main search type (location or keywords)
[ ] Design components for the ACTIVE variant
[ ] Consider topbar search type in design
[ ] Use defensive coding to handle variant checks
[ ] Test with Console configuration
```

---

### 11. Landing Page - Where Design and Content Come From

**The landing page combines TWO sources:**

#### 1. Design/Layout (Code)
**Location**: [src/containers/LandingPage/LandingPage.js](src/containers/LandingPage/LandingPage.js)

Defines:
- Component structure (hero, search bar, sections, featured listings)
- Styling ([LandingPage.module.css](src/containers/LandingPage/LandingPage.module.css))
- Layout and responsive behavior
- Interactive elements (search, filters, navigation)
- Data fetching logic ([LandingPage.duck.js](src/containers/LandingPage/LandingPage.duck.js))

#### 2. Content/Copy (Console)
**Console Path**: Content > Pages > Landing Page
**API Path**: `/content/pages/landing-page.json`

Configurable via Console:
- Hero section text (headline, description)
- Section titles and descriptions
- Call-to-action button text
- Marketing copy
- Custom sections content
- **UI Component Toggles**:
  - Central search bar (enable/disable)
  - Featured listings section (enable/disable)
  - Location search (enable/disable)

**How They Work Together:**

The landing page uses **PageBuilder** architecture - a dynamic page renderer that reads section configuration from Console:

```javascript
// src/containers/LandingPage/LandingPage.js
import PageBuilder from '../PageBuilder/PageBuilder';

const LandingPage = props => {
  const { pageAssetsData } = props; // Fetched from Console

  return (
    <PageBuilder
      pageAssetsData={pageAssetsData} // Console configuration
      // PageBuilder renders sections dynamically based on Console data
    />
  );
};
```

**PageBuilder** reads `/content/pages/landing-page.json` and renders:
- `sections[]` - Array of section objects with `sectionType` and configuration
- `meta` - Page title, description, SEO metadata

Example Console structure:
```json
{
  "sections": [
    { "sectionType": "hero", "title": "...", "backgroundImage": "..." },
    { "sectionType": "search", "enabled": true },
    { "sectionType": "featured-listings", "title": "Popular Listings" }
  ],
  "meta": {
    "pageTitle": { "content": "Welcome to Our Marketplace" },
    "pageDescription": { "content": "Find amazing things" }
  }
}
```

**This means the entire landing page is Console-driven, no code changes needed for:**
- Adding/removing sections
- Changing section order
- Toggling features on/off
- Updating content and images

**Redesigning the Landing Page - Headless CMS Pattern:**

**YES: RECOMMENDED APPROACH**: Use Console as a headless CMS, code as the view layer.

If a user wants to completely redesign the landing page:

#### Step 1: User Configures Custom Sections in Console

**Console > Content > Pages > Landing Page**

Ask the user to:
1. Add custom sections with unique IDs
2. Configure content for each section (text, images, CTAs)
3. Provide you with the section IDs they created

**Example Console configuration:**
```json
// Console creates this at /content/pages/landing-page.json
{
  "sections": [
    {
      "sectionId": "hero_custom",
      "sectionType": "hero",
      "title": "Find Your Perfect Space",
      "subtitle": "Discover unique rentals around the world",
      "backgroundImage": "https://cdn.example.com/hero.jpg",
      "ctaText": "Start Exploring",
      "ctaLink": "/s"
    },
    {
      "sectionId": "features_grid",
      "sectionType": "features",
      "title": "Why Choose Us",
      "features": [
        {
          "icon": "verified",
          "title": "Verified Listings",
          "description": "All listings verified by our team"
        },
        {
          "icon": "support",
          "title": "24/7 Support",
          "description": "We're here when you need us"
        }
      ]
    },
    {
      "sectionId": "testimonials_carousel",
      "sectionType": "testimonials",
      "title": "What Our Users Say",
      "testimonials": [
        {
          "quote": "Amazing experience!",
          "author": "John Doe",
          "avatar": "https://cdn.example.com/avatar1.jpg"
        }
      ]
    }
  ]
}
```

#### Step 2: AI Agent Fetches Console Configuration to Discover Sections

**IMPORTANT**: The AI agent can autonomously fetch Console assets to see what the user configured.

**How to Fetch Console Assets:**

```javascript
// Asset Delivery API URL Pattern (no authentication required)
// https://console.sharetribe.com/api/asset-delivery/v1.0/assets/{clientId}/{assetPath}

// Example:
// https://console.sharetribe.com/api/asset-delivery/v1.0/assets/abc123-def456-ghi789/content/pages/landing-page.json
```

**Constructing the URL:**

1. **Find the Marketplace Client ID**:
   - Check `.env` file: `REACT_APP_SHARETRIBE_SDK_CLIENT_ID`
   - Or from `src/config/configDefault.js`: `sdkClientId`
   - Format: `abc123-def456-ghi789` (UUID format)

2. **Construct Asset URL**:
   ```
   https://console.sharetribe.com/api/asset-delivery/v1.0/assets/{CLIENT_ID}/{ASSET_PATH}
   ```

3. **Common Asset Paths**:
   - Landing page: `content/pages/landing-page.json`
   - Branding: `design/branding.json`
   - Listing types: `listings/listing-types.json`
   - Listing fields: `listings/listing-fields.json`
   - User types: `users/user-types.json`

**Agent Workflow - Autonomous Discovery:**

```javascript
// Step 1: Read client ID from .env
const clientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;

// Step 2: Fetch landing page configuration
const assetUrl = `https://console.sharetribe.com/api/asset-delivery/v1.0/assets/${clientId}/content/pages/landing-page.json`;

fetch(assetUrl)
  .then(res => res.json())
  .then(data => {
    // Step 3: Inspect sections
    console.log('User configured sections:', data.sections);

    // Extract section IDs and types
    const sectionInfo = data.sections.map(s => ({
      id: s.sectionId,
      type: s.sectionType
    }));

    console.log('Section IDs:', sectionInfo);
    // Now the agent knows what to build!
  });
```

**Questions to ask the user (after fetching):**
- "I see you've configured these sections in Console: [list section IDs]. What custom styling or layout do you need for each?"
- For any missing sections: "Do you want me to create additional section types?"

**Create custom landing page component:**

```javascript
// src/containers/LandingPageCustom/LandingPageCustom.js
import React, { useEffect, useState } from 'react';
import { useConfiguration } from '../../context/configurationContext';

// Import custom section components
import HeroSection from './sections/HeroSection';
import FeaturesGrid from './sections/FeaturesGrid';
import TestimonialsCarousel from './sections/TestimonialsCarousel';

import css from './LandingPageCustom.module.css';

/**
 * Custom landing page that reads sections from Console configuration
 * Console acts as headless CMS, this component is the view layer
 */
const LandingPageCustom = (props) => {
  const config = useConfiguration();
  const [pageContent, setPageContent] = useState(null);

  useEffect(() => {
    // Fetch landing page content from Console
    fetch('/api/asset-delivery/content/pages/landing-page.json')
      .then((res) => res.json())
      .then((data) => setPageContent(data))
      .catch((err) => console.error('Failed to load landing page content:', err));
  }, []);

  if (!pageContent) {
    return <div className={css.loading}>Loading...</div>;
  }

  // Map section IDs to React components
  const sectionComponents = {
    hero_custom: HeroSection,
    features_grid: FeaturesGrid,
    testimonials_carousel: TestimonialsCarousel,
    // Add more mappings as user creates sections
  };

  return (
    <div className={css.root}>
      {pageContent.sections?.map((section, index) => {
        const SectionComponent = sectionComponents[section.sectionId];

        if (!SectionComponent) {
          console.warn(`No component found for section ID: ${section.sectionId}`);
          return null;
        }

        return (
          <SectionComponent
            key={section.sectionId}
            {...section}
            index={index}
          />
        );
      })}
    </div>
  );
};

export default LandingPageCustom;
```

#### Step 3: Create Section Components

**Each section component reads its content from props (provided by Console):**

```javascript
// src/containers/LandingPageCustom/sections/HeroSection.js
import React from 'react';
import { NamedLink } from '../../../components';
import css from './HeroSection.module.css';

const HeroSection = (props) => {
  const { title, subtitle, backgroundImage, ctaText, ctaLink } = props;

  return (
    <section
      className={css.hero}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className={css.heroContent}>
        <h1 className={css.title}>{title}</h1>
        <p className={css.subtitle}>{subtitle}</p>
        <NamedLink name="SearchPage" className={css.cta}>
          {ctaText}
        </NamedLink>
      </div>
    </section>
  );
};

export default HeroSection;
```

```javascript
// src/containers/LandingPageCustom/sections/FeaturesGrid.js
import React from 'react';
import css from './FeaturesGrid.module.css';

const FeaturesGrid = (props) => {
  const { title, features } = props;

  return (
    <section className={css.features}>
      <h2 className={css.title}>{title}</h2>
      <div className={css.grid}>
        {features.map((feature, index) => (
          <div key={index} className={css.feature}>
            <div className={css.icon}>{feature.icon}</div>
            <h3 className={css.featureTitle}>{feature.title}</h3>
            <p className={css.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesGrid;
```

```javascript
// src/containers/LandingPageCustom/sections/TestimonialsCarousel.js
import React from 'react';
import css from './TestimonialsCarousel.module.css';

const TestimonialsCarousel = (props) => {
  const { title, testimonials } = props;

  return (
    <section className={css.testimonials}>
      <h2 className={css.title}>{title}</h2>
      <div className={css.carousel}>
        {testimonials.map((testimonial, index) => (
          <div key={index} className={css.testimonial}>
            <blockquote className={css.quote}>{testimonial.quote}</blockquote>
            <div className={css.author}>
              <img src={testimonial.avatar} alt={testimonial.author} className={css.avatar} />
              <p className={css.authorName}>{testimonial.author}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
```

#### Step 4: Update Route to Use Custom Component

```javascript
// src/routing/routeConfiguration.js
import LandingPageCustom from '../containers/LandingPageCustom/LandingPageCustom';

const routeConfiguration = () => {
  return [
    {
      path: '/',
      name: 'LandingPage',
      component: LandingPageCustom, // ← Use custom component
    },
    // ...
  ];
};
```

---

**Why This Pattern is Superior:**

1. **Console is the CMS**: Non-technical users control all content, images, and copy
2. **Code is the View**: Developers control how content is rendered and styled
3. **No Code Changes for Content**: User updates content in Console, no deployments needed
4. **Reusable Components**: Section components can be reused across pages
5. **Upstream Compatible**: Original `LandingPage` remains untouched
6. **Scalable**: Easy to add new section types as needed

**Agent Instructions for Landing Page Redesigns:**

**WARNING: CRITICAL CONSTRAINT**: Users can ONLY use the 5 fixed section types (hero, article, columns, features, carousel). They CANNOT create custom section types.

### The Correct Redesign Workflow

When a user wants a custom designed landing page:

**Step 1: User Adds Sections in Console Using Closest Matching Type**

Ask the user to:
1. Go to Console > Content > Pages > Landing Page
2. Add sections using the **closest matching type** from the 5 available:
   - Want testimonials? → Use `carousel` or `columns` type
   - Want pricing? → Use `columns` type
   - Want stats? → Use `features` type
   - Want custom hero? → Use `hero` type
3. Configure content (text, images, CTAs) for each section
4. **Give each section a unique ID** (e.g., "testimonials-main", "pricing-grid", "hero-custom")
5. Provide you with the section IDs they created

**Step 2: Agent Fetches Configuration and Creates Custom Components**

```javascript
// Fetch to see what user configured
const clientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const url = `https://console.sharetribe.com/api/asset-delivery/v1.0/assets/${clientId}/content/pages/landing-page.json`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('User configured sections:', data.sections);
    // You'll see sections with their IDs and types
  });
```

**Step 3: Create Custom Page Component**

Use the page name ("landing-page") and section IDs to create custom components:

**Example - User wants testimonials carousel:**

User configured in Console:
- Section type: `carousel` (closest match)
- Section ID: `testimonials-main`
- Content: Testimonial quotes, authors, avatars

Agent creates custom component tied to that ID:
```javascript
// src/containers/LandingPageCustom/LandingPageCustom.js
import React, { useEffect, useState } from 'react';
import HeroCustom from './sections/HeroCustom';
import TestimonialsCarousel from './sections/TestimonialsCarousel';
import PricingGrid from './sections/PricingGrid';
import css from './LandingPageCustom.module.css';

const LandingPageCustom = () => {
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    // Fetch landing page asset
    fetch('/api/asset-delivery/content/pages/landing-page.json')
      .then(res => res.json())
      .then(data => setPageData(data))
      .catch(err => console.error('Failed to load page data:', err));
  }, []);

  if (!pageData) return <div>Loading...</div>;

  // Find sections by the specific IDs user created in Console
  const heroSection = pageData.sections?.find(s => s.sectionId === 'hero-main');
  const testimonialsSection = pageData.sections?.find(s => s.sectionId === 'testimonials-main');
  const pricingSection = pageData.sections?.find(s => s.sectionId === 'pricing-grid');

  return (
    <div className={css.page}>
      {/* Custom designed components tied to specific section IDs */}
      {/* User used type "hero" in Console, we render custom hero design */}
      {heroSection && <HeroCustom {...heroSection} />}

      {/* User used type "carousel" in Console, we render as testimonials */}
      {testimonialsSection && <TestimonialsCarousel {...testimonialsSection} />}

      {/* User used type "columns" in Console, we render as pricing */}
      {pricingSection && <PricingGrid {...pricingSection} />}
    </div>
  );
};

export default LandingPageCustom;
```

**Custom section components read Console data:**

```javascript
// src/containers/LandingPageCustom/sections/TestimonialsCarousel.js
import React from 'react';
import { Star } from 'lucide-react';
import css from './TestimonialsCarousel.module.css';

const TestimonialsCarousel = (props) => {
  // User configured this in Console as type "carousel"
  // We render it as a custom testimonials design
  const { title, description, blocks = [] } = props;

  return (
    <section className={css.testimonials}>
      <div className={css.header}>
        <h2 className={css.title}>{title?.content}</h2>
        {description && <p className={css.description}>{description?.content}</p>}
      </div>

      <div className={css.carousel}>
        {blocks.map((block, i) => (
          <div key={i} className={css.testimonial}>
            <div className={css.stars}>
              {[...Array(5)].map((_, j) => (
                <Star key={j} size={16} fill="currentColor" className={css.star} />
              ))}
            </div>
            <blockquote className={css.quote}>
              {block.text?.content}
            </blockquote>
            <cite className={css.author}>{block.title?.content}</cite>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
```

```javascript
// src/containers/LandingPageCustom/sections/PricingGrid.js
import React from 'react';
import { Check } from 'lucide-react';
import { NamedLink } from '../../../components';
import css from './PricingGrid.module.css';

const PricingGrid = (props) => {
  // User configured this in Console as type "columns"
  // We render it as a custom pricing design
  const { title, blocks = [] } = props;

  return (
    <section className={css.pricing}>
      <h2 className={css.title}>{title?.content}</h2>

      <div className={css.grid}>
        {blocks.map((block, i) => (
          <div key={i} className={css.pricingCard}>
            <h3 className={css.planName}>{block.title?.content}</h3>
            <div className={css.price}>{block.text?.content}</div>
            <ul className={css.features}>
              {/* Parse features from block description or custom field */}
              <li><Check size={16} /> Feature 1</li>
              <li><Check size={16} /> Feature 2</li>
            </ul>
            <NamedLink name="SignupPage" className={css.cta}>
              Get Started
            </NamedLink>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingGrid;
```

**Update route:**
```javascript
// src/routing/routeConfiguration.js
import LandingPageCustom from '../containers/LandingPageCustom/LandingPageCustom';

const routeConfiguration = () => {
  return [
    {
      path: '/',
      name: 'LandingPage',
      component: LandingPageCustom, // ← Use custom page
    },
    // ...
  ];
};
```

---

### Summary: The Correct Workflow

1. **User cannot create custom section types** - only 5 fixed types available
2. **User picks closest matching type**:
   - Want testimonials? → Use `carousel`
   - Want pricing? → Use `columns`
   - Want stats? → Use `features`
3. **User assigns unique section IDs** in Console
4. **Agent creates custom components** tied to those specific IDs
5. **Page name + Section IDs = Custom Design** with Console-managed content

**Default Console-Managed Pages:**

These pages have content managed via Console (Content > Pages):

| Page | Location | Console Content Path |
|------|----------|---------------------|
| **Landing Page** | `src/containers/LandingPage/` | `/content/pages/landing-page.json` |
| **About** | `src/containers/AboutPage/` | `/content/pages/about.json` |
| **Privacy Policy** | `src/containers/PrivacyPolicyPage/` | `/content/pages/privacy-policy.json` |
| **Terms of Service** | `src/containers/TermsOfServicePage/` | `/content/pages/terms-of-service.json` |

**Data-Driven Pages (Not Console Content):**

These pages render dynamic data, not static Console content:

| Page | Location | Data Source |
|------|----------|-------------|
| Search Page | `src/containers/SearchPage/` | Listings from Sharetribe API |
| Listing Page | `src/containers/ListingPage/` | Single listing from API |
| User Profile | `src/containers/ProfilePage/` | User data from API |
| Inbox | `src/containers/InboxPage/` | Messages/transactions from API |
| Checkout | `src/containers/CheckoutPage/` | Transaction flow (not page content) |

**Key Principle**: Console for content, code for structure.

---

### Console Page Naming and Asset Access

**WARNING: CRITICAL**: The Console page name directly determines the asset API path and is required for loading page data.

#### How Console Page Names Map to Asset Paths

Console page names become the filename in the Asset Delivery API path:

| Console Page Name | Asset Path | Used In |
|-------------------|------------|---------|
| `landing-page` | `content/pages/landing-page.json` | LandingPage |
| `about` | `content/pages/about.json` | AboutPage |
| `privacy-policy` | `content/pages/privacy-policy.json` | PrivacyPolicyPage |
| `terms-of-service` | `content/pages/terms-of-service.json` | TermsOfServicePage |
| `{custom-page-name}` | `content/pages/{custom-page-name}.json` | CMSPage (dynamic) |

#### Standard Asset Access Pattern

**WARNING: All Console pages work the same way** - they all fetch data from `content/pages/{page-name}.json` using the same pattern. Pages like LandingPage, PrivacyPolicyPage, TermsOfServicePage are just dynamic pages with custom routes added for SEO.

```javascript
// Example: LandingPage.duck.js (all Console pages use this same pattern)
import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

export const ASSET_NAME = 'landing-page'; // Console page name

export const loadData = (params, search) => dispatch => {
  // Construct asset path from page name
  const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
```

**Accessing Asset Data in Component:**

```javascript
// Example: LandingPage.js
import { camelize } from '../../util/string';
import { ASSET_NAME } from './LandingPage.duck';

const LandingPageComponent = props => {
  const { pageAssetsData, inProgress, error } = props;

  return (
    <PageBuilder
      pageAssetsData={pageAssetsData?.[camelize(ASSET_NAME)]?.data}
      inProgress={inProgress}
      error={error}
    />
  );
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};
```

**Key Points:**
- All Console pages are dynamic pages - the only difference is some have custom routes
- The **key** in `pageAsset` object (e.g., `landingPage`) must match the key used to access data from Redux state
- Use `camelize()` when accessing camelCase keys (e.g., `'landing-page'` → `'landingPage'`)

#### Console Page Routing Patterns

**All Console pages use the same asset loading pattern.** Some just have custom routes added for SEO:

**Default Route: `/p/:pageId`** (most pages)

```javascript
// src/routing/routeConfiguration.js
{
  path: '/p/:pageId',
  name: 'CMSPage',
  component: CMSPage,
  loadData: pageDataLoadingAPI.CMSPage.loadData,
}
```

Examples:
- `/p/about` → fetches `content/pages/about.json`
- `/p/faq` → fetches `content/pages/faq.json`

**Custom Routes** (for SEO - same underlying mechanism)

```javascript
// src/routing/routeConfiguration.js
{
  path: '/',  // Custom route instead of /p/landing-page
  name: 'LandingPage',
  component: LandingPage,
  loadData: pageDataLoadingAPI.LandingPage.loadData,
},
{
  path: '/privacy-policy',  // Custom route instead of /p/privacy-policy
  name: 'PrivacyPolicyPage',
  component: PrivacyPolicyPage,
  loadData: pageDataLoadingAPI.PrivacyPolicyPage.loadData,
},
```

**The difference is ONLY the route** - both use the same `fetchPageAssets()` pattern to load Console data.

#### Adding a New Console Page with Custom Route

When a user wants a new Console page with a custom route (not `/p/:pageId`):

**Example: User wants `/about-us` instead of `/p/about-us`**

**Step 1: User Creates Page in Console**

Ask the user to:
1. Create a new page in Console > Content > Pages
2. Name it (e.g., `about-us`)
3. Configure sections and content
4. Provide you with the page name

**Step 2: Create Page Component**

The component works exactly like LandingPage - it just fetches Console data and passes to PageBuilder:

```javascript
// src/containers/AboutUsPage/AboutUsPage.duck.js
import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

export const ASSET_NAME = 'about-us'; // Must match Console page name

export const loadData = (params, search) => dispatch => {
  const pageAsset = { aboutUs: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
```

```javascript
// src/containers/AboutUsPage/AboutUsPage.js
import React from 'react';
import loadable from '@loadable/component';
import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';
import { ASSET_NAME } from './AboutUsPage.duck';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

export const AboutUsPageComponent = props => {
  const { pageAssetsData, inProgress, error } = props;

  return (
    <PageBuilder
      pageAssetsData={pageAssetsData?.[camelize(ASSET_NAME)]?.data}
      inProgress={inProgress}
      error={error}
    />
  );
};

AboutUsPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const AboutUsPage = compose(connect(mapStateToProps))(AboutUsPageComponent);

export default AboutUsPage;
```

**Step 3: Add Route**

```javascript
// src/routing/routeConfiguration.js
import AboutUsPage from '../containers/AboutUsPage/AboutUsPage';
import { loadData as AboutUsPageLoader } from '../containers/AboutUsPage/AboutUsPage.duck';

const routeConfiguration = () => {
  return [
    // ... existing routes
    {
      path: '/about-us',
      name: 'AboutUsPage',
      component: AboutUsPage,
      loadData: AboutUsPageLoader,
    },
    // ...
  ];
};
```

**Step 4: Update PreviewResolverPage (For Console Preview)**

When operators click "Preview" in Console, they're redirected to the client app. PreviewResolverPage determines which route to show based on the Console page name.

```javascript
// src/containers/PreviewResolverPage/PreviewResolverPage.js

// Add import
import { createResourceLocatorString } from '../../util/routes';
import { AboutUsPage as AboutUsPageRoute } from '../../routing/routeConfiguration';

// Update PreviewResolverPage component
const PreviewResolverPage = props => {
  const { pageAssetsData, location, history } = props;

  // Extract Console page name from asset path
  const getPageAssetName = assetPath => {
    const cmsPageRegex = new RegExp('content/pages/(.*).json');
    const matches = assetPath.match(cmsPageRegex);
    return matches?.[1];
  };

  const assetPath = new URLSearchParams(location.search).get('assetPath');
  const pageAssetName = getPageAssetName(assetPath);

  // Route based on Console page name
  const redirectToPage = pageAssetName === 'terms-of-service'
    ? toTermsOfServicePage
    : pageAssetName === 'privacy-policy'
    ? toPrivacyPolicyPage
    : pageAssetName === 'landing-page'
    ? toLandingPage
    : pageAssetName === 'about-us' // ← Add your custom page
    ? createResourceLocatorString('AboutUsPage', {}, {}, {})
    : hasCMSPagePath
    ? toCMSPage
    : toLandingPage;

  // Redirect to resolved route
  useEffect(() => {
    history.push(redirectToPage);
  }, [redirectToPage]);

  return null;
};
```

**Alternative: Use Default `/p/:pageId` Route**

If you don't need a custom route, just use the default CMSPage:

1. User creates page in Console with any name (e.g., `about-us`)
2. Page is automatically available at `/p/about-us`
3. No code changes needed

**When to Use Custom Routes vs Default:**

| Scenario | Use |
|----------|-----|
| Simple content page, no custom design | Default `/p/:pageId` |
| SEO-critical page (homepage, about, contact) | Custom route (e.g., `/about`) |
| Custom page design with specialized components | Custom route + custom page component |
| Marketing/landing pages | Custom route + custom component |

#### Debugging Asset Loading Issues

**Check if Console page name matches code:**

```javascript
// In browser console or React component
useEffect(() => {
  const pageAsset = 'about-us'; // Console page name
  const url = `/api/asset-delivery/content/pages/${pageAsset}.json`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log('Page data:', data);
      console.log('Sections:', data.sections);
    })
    .catch(err => {
      console.error('Failed to load page:', err);
      console.error('Check Console page name matches:', pageAsset);
    });
}, []);
```

**Common Issues:**

1. **Asset not found (404)**: Console page name doesn't match code
   - Fix: Ensure `ASSET_NAME` or `pageId` matches Console page name exactly

2. **Data not rendering**: Wrong key used to access Redux state
   - Fix: Ensure key in `pageAsset` object matches key in `mapStateToProps`

3. **Preview redirect not working**: PreviewResolverPage doesn't handle page name
   - Fix: Add page name case to PreviewResolverPage component

---

### Sanitizing User Data (XSS Prevention)

**WARNING: CRITICAL SECURITY**: When rendering user-generated content OUTSIDE of JSX `{...}` tags, you MUST use sanitization utilities to prevent XSS attacks.

#### When Sanitization is Needed

**React automatically escapes values in JSX:**
```javascript
// YES: SAFE - React escapes automatically
<div>{user.profile.bio}</div>
<h1>{listing.title}</h1>
```

**Sanitization REQUIRED when:**
- Setting HTML attributes from user data
- Using `dangerouslySetInnerHTML`
- Building URLs from user data
- Setting `href`, `src`, `title`, `alt`, etc. from user data

#### Using the Sanitize Utility

```javascript
import { sanitizeUrl, sanitizeText } from '../../util/sanitize';

// NO: DANGEROUS - XSS vulnerability
<a href={listing.publicData.websiteUrl}>Visit</a>

// YES: SAFE - sanitized URL
<a href={sanitizeUrl(listing.publicData.websiteUrl)}>Visit</a>

// NO: DANGEROUS - XSS vulnerability
<img src={user.profileImage} alt={user.displayName} />

// YES: SAFE - sanitized attributes
<img src={sanitizeUrl(user.profileImage)} alt={sanitizeText(user.displayName)} />

// NO: DANGEROUS - XSS vulnerability
<div title={listing.publicData.customTooltip}>Content</div>

// YES: SAFE - sanitized attribute
<div title={sanitizeText(listing.publicData.customTooltip)}>Content</div>
```

#### Available Sanitization Functions

From [src/util/sanitize.js](src/util/sanitize.js):

| Function | Use Case | What It Does |
|----------|----------|--------------|
| `sanitizeUrl(url)` | URLs, links, image sources | Blocks `javascript:`, `data:`, `vbscript:` protocols. Returns `'about:blank'` for invalid URLs |
| `sanitizeText(str)` | Text content in attributes | Replaces `<` and `>` with full-width characters to prevent tag injection |
| `sanitizeEntity(entity, config)` | Listings, users from API | Sanitizes all public data fields based on config |
| `sanitizeListing(listing, config)` | Listing entities | Sanitizes title, description, publicData |
| `sanitizeUser(user, config)` | User entities | Sanitizes bio, displayName, publicData |

#### Extended Data Sanitization

Extended data from Console configuration is automatically sanitized when entities are loaded:

```javascript
// This happens automatically in Redux when entities are fetched
import { sanitizeEntity } from '../../util/sanitize';
import { useConfiguration } from '../../context/configurationContext';

const MyComponent = ({ listing }) => {
  const config = useConfiguration();

  // Sanitize listing before use (usually done in Redux, but shown for reference)
  const sanitizedListing = sanitizeEntity(listing, config);

  // Now safe to use in attributes
  const websiteUrl = sanitizedListing.attributes.publicData.websiteUrl;

  return <a href={websiteUrl}>Visit</a>;
};
```

#### Custom Public Data Sanitization

If you add custom public data fields, update sanitization:

```javascript
// src/util/sanitize.js

// Add custom field sanitization
const sanitizePublicData = publicData => {
  const { location, customWebsite, customDescription, ...restPublicData } = publicData || {};

  const locationMaybe = location ? { location: sanitizeLocation(location) } : {};
  const customWebsiteMaybe = customWebsite ? { customWebsite: sanitizeUrl(customWebsite) } : {};
  const customDescriptionMaybe = customDescription
    ? { customDescription: sanitizeText(customDescription) }
    : {};

  const sanitizedConfiguredPublicData = sanitizeConfiguredPublicData(restPublicData, config);

  return publicData
    ? {
        publicData: {
          ...locationMaybe,
          ...customWebsiteMaybe,
          ...customDescriptionMaybe,
          ...sanitizedConfiguredPublicData
        }
      }
    : {};
};
```

#### Best Practices

1. **Always sanitize user data in attributes** (href, src, title, alt, etc.)
2. **React handles JSX content** - `{value}` is automatically escaped
3. **Never use `dangerouslySetInnerHTML`** with unsanitized user content
4. **URLs are the highest risk** - always use `sanitizeUrl()` for links and images
5. **Update sanitization** when adding custom publicData fields
6. **Test with malicious input** - try `javascript:alert('XSS')` in URLs during development

---

### 12. Console Section Templates (FIXED - Cannot Be Customized)

**WARNING: CRITICAL**: Users **CANNOT create custom section types** in Console. There are **FIVE FIXED** section templates provided by Sharetribe.

**Available Section Templates** (from [Sharetribe Help](https://www.sharetribe.com/help/en/articles/8387253-what-are-section-templates)):

| Section Type | Purpose | Use Case |
|--------------|---------|----------|
| **hero** | Tall section (80%+ screen height) for page introductions | Homepage hero, landing banners |
| **article** | Long-form text in narrow, reading-friendly layout | Blog posts, policies, about page |
| **columns** | Side-by-side elements (1-4 columns on desktop, stacked mobile) | Feature grids, service lists |
| **features** | Text and visual content alternating | Value propositions, storytelling |
| **carousel** | Scrollable slideshow (1-4 blocks) | Image galleries, testimonials |

**How Sections Work:**

1. **User adds sections in Console** using ONE of the five fixed types
2. **User configures content** for each section (text, images, CTAs)
3. **User assigns section IDs** (e.g., "hero-main", "testimonials-carousel")
4. **PageBuilder** reads `/content/pages/landing-page.json`
5. **SectionBuilder** maps `sectionType` to React component
6. Each section can contain:
   - `sectionId` - Unique identifier (set by user)
   - `sectionType` - One of the five fixed types
   - `title` - Section title
   - `description` - Section description
   - `callToAction` - CTA button configuration
   - `blocks[]` - Array of content blocks within the section
   - `appearance` - Styling options (background color, text color, etc.)

**WARNING: IMPORTANT - Console UI Paths**:

I **cannot provide specific Console UI navigation paths** (e.g., "Go to Console > Content > Pages > Landing Page > Sections") without access to the actual Sharetribe Console interface or official Console documentation.

**What AI Agents SHOULD DO:**

1. **Fetch the current configuration** using Asset Delivery API to see what sections exist:
   ```javascript
   const clientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
   const url = `https://console.sharetribe.com/api/asset-delivery/v1.0/assets/${clientId}/content/pages/landing-page.json`;

   fetch(url)
     .then(res => res.json())
     .then(data => {
       console.log('Current sections:', data.sections);
       // Analyze what sections are configured
     });
   ```

2. **Ask the user** about their Console configuration instead of assuming:
   - "Can you check your Sharetribe Console to see what sections are currently on your landing page?"
   - "In your Console, can you add a new section with type 'carousel'?"

3. **Refer to official docs**: Direct users to https://www.sharetribe.com/docs/ for Console navigation help

**Example Agent Response:**

NO: **BAD** (hallucinated paths):
> "Go to Console > Content > Pages > Landing Page > Sections > Featured Listings > Toggle ON"

YES: **GOOD** (honest about limitations):
> "The landing page uses a PageBuilder architecture with configurable sections. I can see from the code that section types like 'hero', 'carousel', 'features' are supported. Let me fetch your current landing page configuration to see what you have set up, and then I can help you add or customize sections. Can you also check your Sharetribe Console under Content > Pages to see the current section configuration UI?"

---

### Console Configuration Quick Reference (from Actual Console UI)

**WARNING: IMPORTANT**: This reference shows EXACT field names, UI options, and notes from the actual Sharetribe Console interface. All details are verified against screenshots in `/screenshots/` folder.

**Screenshot References:**
- `/screenshots/branding.png` - Branding settings (colors, logo, images)
- `/screenshots/layout.png` - Layout settings (search page, listing page variants)
- `/screenshots/search.png` - Search configuration (search type, filters)
- `/screenshots/top-bar.png` - Top bar configuration (logo link, search bar, custom links)
- `/screenshots/footer.png` - Footer configuration (slogan, social links, content blocks)
- `/screenshots/landing-page-sections.png` - Page section editor interface

**Use this to guide clients with PRECISE Console instructions.**

#### Branding (Console > Design > Branding)

**Colors:**
- **Main Brand Color**: Buttons, links, icons (`#hex-code`)
- **Primary Button Color**: Critical actions (default `#138041` green for accessibility)
- **Email Color**: Email notification buttons/links

**Logo Display Height (exact UI shown in `/screenshots/branding.png`):**
- ( ) Small (24px)
- (*) Medium (36px) ← **Default, recommended**
- ( ) Large (48px)

**Logo Section:**
- Shows uploaded file: `logo-[filename].png`
- Note: "Recommended minimum height: 72 pixels. Maximum width: 640 pixels."
- Buttons: "Show" | "Remove"

**Favicon:**
- Note: "The icon in web browser tabs and bookmarks. Recommended size: 48x48 pixels. Supported formats: .png and .jpg."

**App icon:**
- Note: "The icon in mobile bookmarks and browser tabs. Use a square image. Recommended minimum size: 512x512 pixels."

**Background image for login pages:**
- Note: "The background image for authentication pages: Login, Sign up, Email verification, Password recovery, and Password reset. Recommended aspect ratio: 2:1. Recommended minimum size: 1200x600 pixels."

**Default social media image:**
- Note: "Your marketplace's social media sharing image for Facebook, X, LinkedIn, and other channels. You can add unique social media images to content pages. Recommended aspect ratio: 1.9:1. Recommended minimum size: 1200x630 pixels."

**Tell clients (exact Console UI):**
```
Console > Design > Branding

Colors (each shows color bar above):
- Main brand color
- Primary button color
- Email color

Logo display height on desktop:
  (*) Medium (36px)  ← Select this

Images to upload:
- Logo: 72px height min, 640px max width
- Favicon: 48x48px square
- App icon: 512x512px min square
- Background image: 1200x600px (2:1)
- Social media image: 1200x630px (1.9:1)
```

#### Layout (Console > Design > Layout)

**Screenshot reference:** See `/screenshots/layout.png`

**Search page layout (exact UI options):**

( ) **Map view**
  - Note shown: "This layout works great for location-based marketplaces. See how it looks."

(*) **Grid view** ← **Selected in screenshot**
  - Note shown: "This layout works great for marketplaces that are not location-based. See how it looks."

**Listing page image layout (exact UI options):**

(*) **Image carousel with thumbnails** ← **Selected in screenshot**
  - Note shown: "This layout works great for product marketplaces and most other marketplace types. See how it looks."

( ) **Screen-wide cover photo**
  - Note shown: "This layout works great for property rentals and other marketplaces that feature listings with beautiful landscape images. See how it looks."

**Listing thumbnail aspect ratio (exact UI options):**

(*) **Landscape (4:3)** ← **Selected in screenshot**
  - "See how it looks."

( ) **Portrait (3:4)**
  - "See how it looks."

( ) **Square (1:1)**
  - "See how it looks."

**Tell clients (exact Console UI):**
```
Console > Design > Layout

Search page layout:
  (*) Grid view  (for general/product marketplaces)
  ( ) Map view   (for location-based)

Listing page image layout:
  (*) Image carousel with thumbnails  (for products)
  ( ) Screen-wide cover photo         (for properties)

Listing thumbnail aspect ratio:
  (*) Landscape (4:3)  (most common)
  ( ) Portrait (3:4)
  ( ) Square (1:1)
```

#### Search Configuration (Console > Build > Listings > Listing search)

**Screenshot reference:** See `/screenshots/search.png`

**Search type (exact UI options):**

( ) **Keyword search**

(*) **Location search** ← **Selected in screenshot**

**Available Filters (checkboxes in UI):**

**Keyword filter:**
[ ] Let users filter search results by keyword
  - Note: "Available with location search."

**Listing type filter:**
[ ] Let users filter search results by listing type

**Category filter:**
[X] Let users filter search results by category ← **Checked in screenshot**

**Date range filter:**
[ ] Let users filter search results by dates

**Seats filter:**
[ ] Let users filter search results by available seats
  - Note: "Available with date range filter."

**Price filter:**
[X] Let users filter search results by price ← **Checked in screenshot**
  - Shows: "Price filter minimum value" field (0 in screenshot)

**Common Configurations:**
- Vacation Rentals: Location search + map layout + date range filter
- Product Marketplace: Keyword search + grid layout + category filter + price filter
- Local Services: Location search + map layout + category filter

**Tell clients (exact Console UI):**
```
Console > Build > Listings > Listing search

Search type:
  (*) Location search  (for rentals, venues, local services)
  ( ) Keyword search   (for products, general search)

Enable filters as checkboxes:
  [X] Category filter
  [X] Price filter
  [ ] Keyword filter (if using location search)
  [ ] Listing type filter
  [ ] Date range filter
```

#### Top Bar (Console > Content > Top bar)

**Screenshot reference:** See `/screenshots/top-bar.png`

**Logo link section:**

**Logo target URL:**
- Field shows: `https://`
- Note: "If you don't specify a target URL, clicking the logo takes you to the landing page."

**Search bar section (exact UI options):**

(*) **Always display** ← **Selected in screenshot**

( ) **Don't display on the landing page**

( ) **Only display on the search page**

**Link for posting a new listing:**

[X] **Show to users who aren't logged in** ← **Checked in screenshot**
  - Note: "When this setting is disabled, only logged-in users will see the link. If you want to show the link to specific user types only, modify your user types settings."

**Custom links:**

+ **Add a new link** (blue button)

**Tell clients (exact Console UI):**
```
Console > Content > Top bar

Logo link:
  Logo target URL: https:// (leave default for landing page)

Search bar:
  (*) Always display
  ( ) Don't display on the landing page
  ( ) Only display on the search page

Link for posting a new listing:
  [X] Show to users who aren't logged in

Custom links:
  Click "+ Add a new link" to add navigation links
```

#### Footer (Console > Content > Footer)

**Screenshot reference:** See `/screenshots/footer.png`

**Note shown at top:**
"Edit your footer. The footer is at the bottom of every page in your marketplace except the search results."
Links: "Watch a video | Learn more about the footer"

**Footer details section:**

**Slogan:**
- Field shows: "In Console, go to Content → Footer to add your slogan here."
- Note: "Displayed below the logo in the leftmost column."

**Copyright:**
- Field shows: "© 2025 Your marketplace. All rights reserved."
- Note: "Displayed below social media links in the leftmost column."

**Number of content columns:**

( ) 1
(*) 2 ← **Selected in screenshot**
( ) 3
( ) 4

Note: "After the leftmost column, you can have up to four additional columns in your footer."

**Social media links (3):**
Shows draggable list with:
- Facebook (with menu icon)
- X (Twitter) (with menu icon)
- YouTube (with menu icon)

+ **Add a new social media link** (blue button)

**Content blocks (2):**
- Shows count of content blocks
- (Interface for managing blocks shown below)

**Tell clients (exact Console UI):**
```
Console > Content > Footer

Footer details:
  Slogan: [Your slogan text]
  Copyright: © 2025 Your marketplace. All rights reserved.

  Number of content columns:
    (*) 2  (recommended)

Social media links:
  - Facebook, X (Twitter), YouTube shown
  - Click "+ Add a new social media link" to add more

Content blocks:
  - Add blocks for custom links/content
  - Use Markdown: [Link Text](/url)
  - Example: [About Us](/p/about)
```

#### Pages (Console > Content > Pages)

**Screenshot reference:** See `/screenshots/landing-page-sections.png`

**Page Structure:**
- Each page: up to 24 sections
- Each section: up to 24 blocks
- Each section is collapsible in the UI with expand/collapse arrows

**5 Fixed Section Types:**
- **hero**: Full-screen intro (80%+ height)
- **article**: Narrow text layout
- **columns**: 1-4 columns side-by-side
- **features**: Alternating text + visuals
- **carousel**: Scrollable slideshow

**Section Editor UI (from screenshot):**

Each section shows:
- Section type badge (e.g., "hero", "columns")
- Collapse/expand arrow
- Section configuration fields:
  - Section details
  - Section anchor (optional)
  - Section appearance (background color, text color)
  - Number of blocks
  - Individual block editors (collapsible)

**Block Fields:**
- Name
- Media (image/video upload)
- Title
- Text (Markdown supported)
- Call to action (button)
- Alignment
- Anchor link ID

**Section Appearance Options:**
- Background color
- Background image
- Text color (affects whether dark theme applied)

**Markdown Support:**
- YES: Works in: Content block text
- NO: Doesn't work in: Section titles, section descriptions, block titles

**Tell clients (exact Console UI):**
```
Console > Content > Pages > landing-page

Each section is collapsible - click to expand/edit.

Add Section button at bottom.

For custom landing page:

1. Add Section → Select: Carousel
   Section details:
     - Section anchor: testimonials-main
     - Title: What Our Users Say
     - Description: [optional]

   Section appearance:
     - Background color: [choose]
     - Text color: dark/white

   Blocks:
     - Add 3-5 blocks
     - Each block: Name, Text (quote), Title (author)

2. Add Section → Select: Columns
   Section anchor: featured-listings
   Add 3-4 column blocks

3. Add Section → Select: Columns
   Section anchor: pricing-table
   Add pricing tier blocks
```

---

### Before You Code: Console Setup Checklist

**Ask the user to complete in Console FIRST:**

- [ ] **Branding**: Upload logo, set marketplace color and name
- [ ] **User Types**: Create user types (Customer, Provider, etc.)
- [ ] **Listing Types**: Define what can be listed (products, services, rentals)
- [ ] **Listing Categories**: Build category hierarchy (up to 3 levels)
- [ ] **Listing Fields**: Add custom fields with correct schema types
- [ ] **Search Schemas**: Enable filtering via CLI for custom fields
- [ ] **User Fields**: Add custom user profile fields (if needed)
- [ ] **Minimum Transaction**: Set minimum payment amount
- [ ] **Payment Setup**: Connect Stripe account
- [ ] **Email Templates**: Customize transactional emails
- [ ] **Pages**: Create About, FAQ, Terms pages
- [ ] **Test Data**: Create test users and listings

**Then write code** for:

- Custom UI components
- Extended validation
- Custom API endpoints
- Advanced features beyond Console

---

### Debugging Console Configuration

**View loaded configuration in browser:**

```javascript
// In React component
import { useConfiguration } from '../../context/configurationContext';

const DebugConfig = () => {
  const config = useConfiguration();

  useEffect(() => {
    console.log('===== CONSOLE CONFIGURATION =====');
    console.log('Branding:', config.branding);
    console.log('Listing Types:', config.listing.listingTypes);
    console.log('Listing Categories:', config.listing.listingCategories);
    console.log('Listing Fields:', config.listing.listingFields);
    console.log('User Types:', config.user?.userTypes);
    console.log('Full config:', config);
  }, [config]);

  return null;
};
```

**Check raw asset responses:**

```bash
# In browser console
fetch('/api/asset-delivery/branding.json')
  .then(r => r.json())
  .then(data => console.log('Branding:', data));

fetch('/api/asset-delivery/listing-types.json')
  .then(r => r.json())
  .then(data => console.log('Listing Types:', data));

fetch('/api/asset-delivery/listing-categories.json')
  .then(r => r.json())
  .then(data => console.log('Categories:', data));

fetch('/api/asset-delivery/listing-fields.json')
  .then(r => r.json())
  .then(data => console.log('Listing Fields:', data));

fetch('/api/asset-delivery/user-types.json')
  .then(r => r.json())
  .then(data => console.log('User Types:', data));
```

**Enable debug mode for config merge:**

```javascript
// src/util/configHelpers.js
const mergeDefaultTypesAndFieldsForDebugging = true; // Shows Console + local

// See both hosted and local configs merged
```

---

### Customizing Config Merge (Advanced - Only When Strictly Necessary)

**WARNING: WARNING**: Only customize config merging when you have **specific advanced requirements** that can't be handled by Console configuration alone.

**Default behavior**: Console config (hosted) completely replaces local config.

**When to customize merge logic:**
- YES: Using a custom transaction process alongside Console-defined listing types
- YES: Combining Console listing types with local-only listing types
- YES: Adding computed/derived config values based on Console data
- NO: **DON'T** customize just to add new fields (use Console instead)
- NO: **DON'T** customize to override Console values (change in Console)

---

#### Config Merge Location

All config merging happens in **`src/util/configHelpers.js`**

```javascript
// src/util/configHelpers.js

/**
 * Merge default config with hosted config from Console
 *
 * Priority: Hosted (Console) > Local (defaults)
 */
export const mergeConfig = (defaultConfig, hostedConfig, hostedTranslations) => {
  const { listing, ...rest } = defaultConfig;

  return {
    ...rest,

    // Branding: Hosted overrides local
    branding: mergeBranding(defaultConfig.branding, hostedConfig?.branding),

    // Layout: Hosted overrides local
    layout: mergeLayouts(defaultConfig.layout, hostedConfig?.layout),

    // Listing: Complex merge (where customization happens)
    listing: mergeListingConfig(
      defaultConfig.listing,
      hostedConfig?.listing,
      hostedTranslations
    ),

    // Search: Hosted overrides local
    search: mergeSearch(defaultConfig.search, hostedConfig?.search),

    // User: Hosted overrides local
    user: mergeUser(defaultConfig.user, hostedConfig?.user),
  };
};
```

---

#### Example 1: Combining Console + Local Listing Types

**Use Case**: You have a standard "product-sale" listing type in Console, but you also need a custom "negotiation" listing type with a custom transaction process.

**Default behavior** (don't modify): Console listing types replace local ones.

**Custom behavior** (modify `mergeListingConfig`):

```javascript
// src/util/configHelpers.js

const mergeListingConfig = (
  defaultListingConfig,
  hostedListingConfig,
  hostedTranslations
) => {
  const defaultListingTypes = defaultListingConfig?.listingTypes;
  const hostedListingTypes = hostedListingConfig?.listingTypes;

  // NO: DEFAULT: Console replaces local (standard behavior)
  // const listingTypes = hostedListingTypes || defaultListingTypes;

  // YES: CUSTOM: Combine both Console AND local listing types
  const listingTypes = hostedListingTypes
    ? [...hostedListingTypes, ...defaultListingTypes] // Both sources
    : defaultListingTypes; // Fallback to local if Console unavailable

  // Rest of merge logic...
  return {
    ...defaultListingConfig,
    listingTypes,
    listingFields: hostedListingConfig?.listingFields || defaultListingConfig?.listingFields,
    listingCategories: hostedListingConfig?.listingCategories || [],
    // ...
  };
};
```

**Result**: Both Console listing types AND local listing types are available.

---

#### Example 2: Adding Computed Config Values

**Use Case**: Add computed values based on Console data.

```javascript
// src/util/configHelpers.js

const mergeListingConfig = (
  defaultListingConfig,
  hostedListingConfig,
  hostedTranslations
) => {
  const listingTypes = hostedListingConfig?.listingTypes || defaultListingConfig?.listingTypes;

  // YES: Add computed values
  const listingTypesWithFlags = listingTypes.map(type => ({
    ...type,
    // Add flag: does this listing type use bookings?
    isBookingType: type.transactionType?.process === 'default-booking',
    // Add flag: does this listing type track stock?
    hasStock: type.stockType === 'oneItem' || type.stockType === 'multipleItems',
  }));

  return {
    ...defaultListingConfig,
    listingTypes: listingTypesWithFlags,
    // ...
  };
};
```

---

#### When NOT to Customize Config Merge

**NO: Don't customize for these scenarios:**

1. **"I want to add a new listing field"** → Add in Console: Build > Listings > Listing Fields
2. **"I want to change the marketplace color"** → Change in Console: Design > Branding
3. **"I want to override Console listing type names"** → Change names in Console, not code
4. **"I want to add a user type"** → Add in Console: Build > Users > User Types
5. **"Console config is wrong"** → Fix it in Console (maintain single source of truth)

---

#### YES: When to Customize Config Merge

**Only for these advanced scenarios:**

1. **Custom transaction process alongside Console types** - Local-only listing type with custom process
2. **Computed/derived configuration** - Adding flags, metadata, or lookup tables based on Console data
3. **Multi-tenant or complex marketplace** - Different configs for different subdomains

---

### Configuration Best Practices

**1. Console First, Code Second** Configure everything possible in Console. Let non-technical team
members manage marketplace settings.

**2. Document Console Dependencies** If your code depends on specific Console configuration,
document it:

```javascript
/**
 * CustomProductCard component
 *
 * REQUIRES Console Configuration:
 * - Listing Type: "product-sale" must exist
 * - Listing Field: "condition" (enum) with options: new, used, refurbished
 * - Listing Field: "brand" (text)
 * - Search Schema: condition (enum, public scope)
 *
 * Console Path: Build > Listings > Listing Fields
 */
const CustomProductCard = (props) => {
  // ...
};
```

**3. Use Schema Type Correctly**

- **enum** → Single selection dropdown
- **multi-enum** → Multiple checkboxes
- **boolean** → Yes/No toggle
- **long** → Number input
- **text** → Text input (search-optimized)

**4. Enable Search Schemas** Console fields get search schemas automatically IF marked as
"filterable". CLI schemas require manual setup but offer more control.

**5. Test with Real Data** Create test listings with all field combinations to verify configuration.

**6. Version Control Console Config** Export/document Console settings for team reference and
disaster recovery.

---

### Hierarchical AGENTS.md Files

This repository uses hierarchical AGENTS.md files for better context management:

- **`/AGENTS.md`** (this file) - High-level overview, Console configuration, project structure
- **`/src/AGENTS.md`** - Frontend React patterns, component creation, Redux usage
- **`/server/AGENTS.md`** - Backend Express patterns, API structure, SSR
- **`/src/components/AGENTS.md`** - Component-specific patterns and examples
- **`/src/containers/AGENTS.md`** - Page/container patterns, data loading

**AI agents should read the closest AGENTS.md** to the code they're working on for relevant,
context-specific guidance.

---

## 🎯 AI Agent Scope & Role

**WARNING: CRITICAL**: This repository is shared with clients for design and UI customization work. The AI agent's role is focused on **frontend design**, not deep technical implementation.

### What the Agent SHOULD Handle (Design & UI)

The agent helps clients with:

YES: **UI/Design Customization**
- Custom page layouts and components
- Styling with CSS Modules
- Custom section designs (testimonials, pricing tables, hero sections)
- Listing cards, user profiles, search results
- Responsive design and mobile layouts
- **Reference official design files**: https://github.com/sharetribe/design-resources (Figma & Sketch files with complete design system)

YES: **Console Content Management**
- Configuring pages and sections in Console
- Adding listing fields, user fields, categories
- Page content and copy
- Section IDs and configuration

YES: **Frontend-Only Features**
- Search filters (using Console fields)
- Custom forms and validation
- UI components wrapping external libraries
- Client-side data display and formatting

YES: **Component Architecture**
- Creating custom components with CSS Modules
- Extending Sharetribe components (composition pattern)
- Redux state management for UI
- React hooks and patterns

### What the Agent Should DEFER to Developer

The agent should tell clients: **"This requires technical implementation by your developer"** for:

NO: **Transaction Process Changes**
- Modifying booking flows, payment flows
- Adding custom transaction states
- Changing commission structure
- Custom pricing logic beyond line items

NO: **Backend/API Work**
- Setting up authentication (Facebook, Google, SSO)
- Email template modifications (requires CLI)
- Custom API endpoints
- Integration API usage
- Webhook/event handlers

NO: **Deep Technical Features**
- Custom transaction processes
- Payment gateway integration
- Booking intervals and buffer times
- Email notifications and templates
- Server-side security features

### Agent Response Pattern

**When client asks for design work:**
```
YES: "I'll create a custom testimonials carousel component with mock data...

   If you'd like design inspiration, Sharetribe provides official Figma and
   Sketch design files at https://github.com/sharetribe/design-resources
   with the complete default design system."
```

**When client has a designer:**
```
YES: "Your designer can reference the official design files at
   https://github.com/sharetribe/design-resources which include all
   default components, typography, colors, and spacing. This helps
   ensure custom designs integrate smoothly with the template."
```

**When client asks for technical work:**
```
NO: "Modifying the transaction process requires technical implementation.
   I recommend discussing this with your developer who can:
   - Update the transaction process via CLI
   - Test the changes in your test environment
   - Deploy to production when ready

   I can help with the UI side - would you like a custom booking
   confirmation page design?"
```

---

## 🎯 AI Agent Workflow - Mock Data First, Console Config Later

**WARNING: CRITICAL**: Don't block the client's flow waiting for Console configuration. Use this workflow:

### The Correct Agent Workflow

**1. Build with Mock Data First**
- Create components that work immediately with example/mock data
- User can see and test features right away
- Don't wait for Console configuration to start coding

**2. Provide Exact Console Configuration**
- Give user specific field keys, IDs, and names to use
- Provide complete configuration in a clear, formatted block
- User can add to Console when ready (doesn't block development)

**3. Component Auto-Adapts**
- Use defensive coding to handle both mock and real Console data
- Component works with mock data initially
- Automatically picks up Console data when user adds it
- No code changes needed when switching from mock to real data

### Example: The Right Way

**NO: BAD (blocking workflow):**
```
Agent: "Please create a field in Console with key 'experienceLevel'"
User: *stops, goes to Console, creates field*
User: "Okay, done"
Agent: *now builds the component*
```

**YES: GOOD (non-blocking workflow):**
```
Agent: "I'll build this with mock data so you can test it immediately.

When you're ready, add this field to Console:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Console > Console > Build > Users > User Fields

Field Key: experienceLevel
Label: Experience Level
Type: enum
Options:
  - beginner
  - intermediate
  - expert
Required: No
Show on: Profile page
User Types: All
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The component will automatically use Console data once you add it."

Agent: *builds component with mock data that works immediately*
```

### Mock Data Pattern

```javascript
// Component works with both mock and real Console data
const CustomUserProfile = ({ user }) => {
  const config = useConfiguration();
  const userFields = config.user?.userFields || [];
  const publicData = user.attributes?.profile?.publicData || {};

  // Check if Console field exists
  const expField = userFields.find(f => f.key === 'experienceLevel');
  const hasConsoleData = expField && publicData.experienceLevel;

  // Use Console data if available, otherwise use mock data
  const experienceLevel = hasConsoleData
    ? publicData.experienceLevel
    : 'intermediate'; // Mock data for testing

  const experienceOptions = hasConsoleData
    ? expField.enumOptions
    : ['beginner', 'intermediate', 'expert']; // Mock options

  // Optional: Show indicator when using mock data (helpful for development)
  const isMockData = !hasConsoleData;

  return (
    <div className={css.experienceSection}>
      {isMockData && (
        <div className={css.mockDataBadge}>
          WARNING: Using mock data - Add field to Console to use real data
        </div>
      )}
      <h3>{expField?.label || 'Experience Level'}</h3>
      <div className={css.experienceBadge}>
        {experienceLevel === 'expert' && <ExpertIcon />}
        {experienceLevel === 'intermediate' && <IntermediateIcon />}
        {experienceLevel === 'beginner' && <BeginnerIcon />}
        <span>{experienceLevel}</span>
      </div>
    </div>
  );
};
```

### Providing Console Configuration - Best Practices

**1. Be Specific with IDs and Keys:**

NO: **BAD:**
"Create a page in Console for the landing page"

YES: **GOOD:**
```
Create a page in Console with:
  Page Name: landing-page
  (This will be accessible at /)
```

**2. Suggest Professional Naming Conventions:**

- **Page names**: `kebab-case` (landing-page, about-us, contact-form)
- **Field keys**: `camelCase` (experienceLevel, companyName, phoneNumber)
- **Section IDs**: `kebab-case` (hero-main, testimonials-carousel, pricing-grid)
- **Enum options**: `kebab-case` or `lowercase` (new, like-new, for-parts)

**3. Provide Complete Field Configuration:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Console > Console > Build > Listings > Listing Fields

Field Key: condition
Label: Condition
Type: enum
Options:
  - new
  - like-new
  - good
  - fair
  - for-parts
Required: Yes
Filterable: Yes (creates search schema automatically)
Listing Types: product-sale, rental-daily
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**4. Provide Section Configuration for Pages:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Console > Console > Content > Pages > Landing Page

Section 1:
  Type: carousel
  Section ID: testimonials-main
  Title: What Our Users Say
  Description: Hear from our community
  Blocks: Add 3-5 testimonial blocks with:
    - Text: Customer quote
    - Title: Customer name
    - Media: Customer photo (optional)

Section 2:
  Type: columns
  Section ID: featured-listings
  Title: Featured Properties
  Blocks: Add 3-4 column blocks (content can be placeholder)

Section 3:
  Type: columns
  Section ID: pricing-table
  Title: Choose Your Plan
  Blocks: Add 3 pricing tier blocks with:
    - Title: Plan name (Basic, Pro, Enterprise)
    - Text: Plan description
    - Call to action: Sign up button
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Why This Workflow Works

YES: **User sees progress immediately** - No waiting for Console configuration
YES: **No context switching** - User stays in development flow
YES: **Testable right away** - Mock data allows immediate testing
YES: **Smooth transition** - Component auto-adapts when Console data is added
YES: **Clear instructions** - User knows exactly what to configure later
YES: **Defensive coding** - Graceful fallback if Console config missing

### Updating Scenario 1 Example

Now update the scenarios to follow this pattern. Here's how Scenario 1 should work:

**User:** "I want a custom landing page with testimonials carousel, featured listings, and a pricing table"

**Agent Response:**

"I'll build a custom landing page with those sections using mock data so you can see it working immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Console > Console Configuration (add when ready)

Console > Content > Pages > Create new page

Page Name: landing-page

Add these sections:

1. Carousel section:
   - Section ID: testimonials-main
   - Title: What Our Users Say
   - Add 3-5 blocks with testimonial quotes

2. Columns section:
   - Section ID: featured-listings
   - Title: Featured Properties
   - Add 3-4 blocks

3. Columns section:
   - Section ID: pricing-table
   - Title: Choose Your Plan
   - Add 3 blocks for pricing tiers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now building the components..."

*Agent creates components with mock data that work immediately*

---

## 🎯 Common User Scenarios - How to Respond

Here are realistic scenarios users will ask you to build. Use these to understand the correct approach:

### Scenario 1: "I want a custom landing page with testimonials carousel, featured listings, and a pricing table"

**Correct Approach (Using Mock Data First):**

**Agent Response:**

"I'll create a custom landing page with those sections. I'll use mock data so you can see it working immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Console > Console Configuration (add when ready)

Console > Content > Pages > landing-page

Section 1 - Testimonials:
  Type: carousel
  Section ID: testimonials-main
  Title: What Our Users Say
  Description: Hear from our community
  Blocks: Add 3-5 testimonial blocks

Section 2 - Featured Listings:
  Type: columns
  Section ID: featured-listings
  Title: Featured Properties
  Blocks: Add 3-4 column blocks

Section 3 - Pricing:
  Type: columns
  Section ID: pricing-table
  Title: Choose Your Plan
  Blocks: Add 3 pricing tier blocks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Building components now..."

**Agent Implementation:**

1. **Create page component with mock data fallbacks:**

```javascript
// src/containers/LandingPageCustom/LandingPageCustom.js
const LandingPageCustom = () => {
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    fetch('/api/asset-delivery/content/pages/landing-page.json')
      .then(res => res.json())
      .then(data => setPageData(data))
      .catch(err => {
        console.warn('Console data not available, using mock data');
        setPageData(null);
      });
  }, []);

  // Find sections by ID, with fallback to undefined
  const sections = pageData?.sections || [];
  const testimonialsSection = sections.find(s => s.sectionId === 'testimonials-main');
  const featuredSection = sections.find(s => s.sectionId === 'featured-listings');
  const pricingSection = sections.find(s => s.sectionId === 'pricing-table');

  return (
    <div className={css.page}>
      <TestimonialsCarousel section={testimonialsSection} />
      <FeaturedListings section={featuredSection} />
      <PricingTable section={pricingSection} />
    </div>
  );
};
```

2. **Create section components with mock data:**

```javascript
// src/containers/LandingPageCustom/sections/TestimonialsCarousel.js
const MOCK_TESTIMONIALS = [
  { text: 'Amazing experience!', author: 'John Doe', rating: 5 },
  { text: 'Highly recommend!', author: 'Jane Smith', rating: 5 },
  { text: 'Great service!', author: 'Bob Johnson', rating: 5 }
];

const TestimonialsCarousel = ({ section }) => {
  // Use Console data if available, otherwise use mock data
  const testimonials = section?.blocks || MOCK_TESTIMONIALS.map(t => ({
    text: { content: t.text },
    title: { content: t.author }
  }));

  const title = section?.title?.content || 'What Our Users Say';
  const usingMockData = !section;

  return (
    <section className={css.testimonials}>
      {usingMockData && (
        <div className={css.mockBadge}>Using mock data</div>
      )}
      <h2>{title}</h2>
      <div className={css.carousel}>
        {testimonials.map((block, i) => (
          <div key={i} className={css.testimonial}>
            <blockquote>{block.text?.content}</blockquote>
            <cite>{block.title?.content}</cite>
          </div>
        ))}
      </div>
    </section>
  );
};
```

**What NOT to do:**
- NO: Block development waiting for Console config
- NO: Create custom section types (only 5 fixed types exist)
- NO: Hardcode content without mock data fallback
- NO: Modify Sharetribe's PageBuilder components

---

### Scenario 2: "I want users to filter listings by brand, and I want featured listings to show at the top"

**Correct Approach:**

**Part 1: Brand filtering (publicData + Console field)**

1. **Console field:**
   - "Please create a listing field in Console: Build > Listings > Listing Fields"
   - Field key: `brand`
   - Type: `enum` (if limited brands) or `text` (if many brands)
   - Mark as "filterable" - this auto-creates search schema
   - Applicable to listing types that need it

2. **Filter automatically appears:**
   - Template auto-generates filter UI from Console config
   - Users can filter by `pub_brand` parameter

**Part 2: Featured listings (publicMetadata + CLI schema + backend)**

1. **Search schema via CLI:**
   ```bash
   flex-cli search set \
     --key isFeatured \
     --type boolean \
     --scope metadata \
     --default false
   ```

2. **Backend endpoint to set featured:**
   ```javascript
   // server/custom/listings/setFeatured.js
   // Uses Integration SDK to set publicMetadata.isFeatured
   ```

3. **Update search query:**
   ```javascript
   // Sort by featured first
   sdk.listings.query({
     meta_isFeatured: true,
     pub_brand: 'Apple'
   });
   ```

**What NOT to do:**
- NO: Try to set metadata from client app (requires Integration API)
- NO: Use protectedData for brand (needs to be public and searchable)
- NO: Create CLI search schema before checking if Console field exists

---

### Scenario 3: "I want sellers to provide their phone number, but only show it to buyers after they book"

**Correct Approach:**

1. **Use protectedData (transaction-only visibility):**
   ```javascript
   // In EditListingWizard or custom listing form
   sdk.ownListings.update({
     id: listingId,
     protectedData: {
       sellerPhone: '+1234567890'
     }
   });
   ```

2. **Access in transaction:**
   ```javascript
   // In TransactionPage or custom transaction component
   const sellerPhone = listing.attributes.protectedData?.sellerPhone;

   // Only visible to transaction participants
   {isTransactionParticipant && sellerPhone && (
     <div>Contact seller: {sanitizeText(sellerPhone)}</div>
   )}
   ```

**What NOT to do:**
- NO: Use publicData (would be visible to everyone)
- NO: Use privateData (seller and operators only, buyer can't see)
- NO: Use metadata (operators only can write)

---

### Scenario 4: "I want a seller dashboard showing total earnings, active listings, and booking calendar"

**Correct Approach:**

1. **Create custom page:**
   ```
   src/containers/SellerDashboardPage/
   ├── SellerDashboardPage.js
   ├── SellerDashboardPage.duck.js
   ├── SellerDashboardPage.module.css
   └── components/
       ├── EarningsCard.js
       ├── ListingsOverview.js
       └── BookingCalendar.js
   ```

2. **Fetch data in loadData:**
   ```javascript
   // SellerDashboardPage.duck.js
   export const loadData = () => (dispatch, getState, sdk) => {
     // Fetch user's listings
     const listingsPromise = sdk.ownListings.query({ perPage: 100 });

     // Fetch transactions
     const transactionsPromise = sdk.transactions.query({
       only: 'sale',
       lastTransitions: ['transition/complete']
     });

     return Promise.all([listingsPromise, transactionsPromise]);
   };
   ```

3. **Calculate earnings from transactions:**
   ```javascript
   const totalEarnings = transactions.reduce((sum, tx) => {
     const payoutTotal = tx.attributes.payoutTotal?.amount || 0;
     return sum + payoutTotal;
   }, 0);
   ```

4. **Add route:**
   ```javascript
   // src/routing/routeConfiguration.js
   {
     path: '/dashboard',
     name: 'SellerDashboardPage',
     component: SellerDashboardPage,
     loadData: SellerDashboardPageLoader,
     authPage: 'LoginPage' // Require authentication
   }
   ```

**What NOT to do:**
- NO: Modify existing ProfilePage component
- NO: Store earnings in extended data (calculate from transactions)
- NO: Fetch all marketplace transactions (only user's own)

---

### Scenario 5: "I want users to filter by price range, location, and multiple amenities like WiFi and Parking"

**Correct Approach:**

**Part 1: Price range (built-in, no schema needed)**
```javascript
// Already works out of the box
sdk.listings.query({
  price: '5000,50000' // $50-$500 in cents
});
```

**Part 2: Location (built-in, no schema needed)**
```javascript
// Already works with origin or bounds
sdk.listings.query({
  origin: '40.7128,-74.0060', // NYC
  // or
  bounds: '41.0,-73.0,40.0,-75.0'
});
```

**Part 3: Amenities (Console field + auto schema)**

1. **Console field:**
   - Create field: `amenities`
   - Type: `multi-enum`
   - Options: `["WiFi", "Parking", "Pool", "Gym", "Pet-friendly"]`
   - Mark as "filterable"

2. **Query with multi-enum:**
   ```javascript
   sdk.listings.query({
     price: '5000,50000',
     origin: '40.7128,-74.0060',
     pub_amenities: 'WiFi,Parking', // Both required (has_all)
     // or
     pub_amenities_op: 'has_any', // Either one (has_any)
     pub_amenities: 'WiFi,Parking'
   });
   ```

**What NOT to do:**
- NO: Create CLI search schema for price (built-in)
- NO: Use enum for amenities (use multi-enum for multiple selections)
- NO: Store location in extended data (use built-in geolocation)

---

### Scenario 6: "I want to add a 'verified seller' badge that only admins can assign"

**Correct Approach:**

1. **Use publicMetadata (operator-controlled, visible to all)**

2. **CLI search schema:**
   ```bash
   flex-cli search set \
     --schema-for userProfile \
     --key isVerified \
     --type boolean \
     --scope metadata \
     --default false
   ```

3. **Backend endpoint to verify users:**
   ```javascript
   // server/custom/users/verifyUser.js
   const integrationSdk = require('sharetribe-flex-integration-sdk');

   module.exports = async (req, res) => {
     const { userId } = req.body;
     const { user } = req; // Current user (must be admin)

     // Check if user is admin
     if (user.publicData?.role !== 'admin') {
       return res.status(403).json({ error: 'Forbidden' });
     }

     const sdk = integrationSdk.createInstance({ clientId, clientSecret });

     await sdk.users.updateProfile({
       id: userId,
       publicMetadata: {
         isVerified: true,
         verifiedAt: new Date().toISOString()
       }
     });

     return res.status(200).json({ success: true });
   };
   ```

4. **Display badge in UI:**
   ```javascript
   // In UserCard or ProfilePage
   const isVerified = user.attributes.profile.publicMetadata?.isVerified;

   {isVerified && (
     <span className={css.verifiedBadge}>
       <CheckIcon /> Verified Seller
     </span>
   )}
   ```

5. **Filter verified sellers:**
   ```javascript
   sdk.users.query({
     meta_isVerified: true
   });
   ```

**What NOT to do:**
- NO: Use publicData (users could set it themselves)
- NO: Try to set metadata from client app (requires Integration API)
- NO: Use privateMetadata (badge needs to be visible to everyone)

---

### Scenario 7: "I want a referral program where users get a discount code after referring 3 people"

**Correct Approach:**

1. **Store referral data in privateMetadata (operator-controlled to prevent fraud):**
   ```javascript
   user.attributes.profile.privateMetadata = {
     referralCount: 3,
     referredUserIds: ['uuid1', 'uuid2', 'uuid3'],
     discountCodesEarned: ['REFER10']
   };
   ```

2. **Backend webhook/endpoint:**
   ```javascript
   // server/custom/referrals/trackReferral.js
   // When new user signs up with referral code:
   // 1. Increment referrer's privateMetadata.referralCount
   // 2. If count >= 3, generate discount code
   // 3. Store code in privateMetadata.discountCodesEarned
   ```

3. **Display earned codes in UI:**
   ```javascript
   // In ProfilePage or custom ReferralsPage
   const currentUser = useSelector(state => state.user.currentUser);
   const earnedCodes = currentUser.attributes.profile.privateMetadata?.discountCodesEarned || [];

   {earnedCodes.map(code => (
     <div key={code}>Your discount code: {code}</div>
   ))}
   ```

**What NOT to do:**
- NO: Use publicData or protectedData (users could manipulate count)
- NO: Track referrals client-side only (security risk)
- NO: Store referral count in transaction extended data (wrong entity)

---

### Scenario 8: "I want custom listing cards that show condition, brand, and a 'New Arrival' badge for listings created in last 7 days"

**Correct Approach:**

1. **Create custom component:**
   ```javascript
   // src/components/CustomListingCard/CustomListingCard.js
   import { ListingCard } from '../../components'; // Wrap existing
   import css from './CustomListingCard.module.css';

   const CustomListingCard = ({ listing, ...props }) => {
     const { publicData } = listing.attributes;
     const createdAt = new Date(listing.attributes.createdAt);
     const isNewArrival = Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000;

     return (
       <div className={css.wrapper}>
         {isNewArrival && <span className={css.badge}>New Arrival</span>}
         <ListingCard listing={listing} {...props} />
         <div className={css.metadata}>
           {publicData.brand && <span>Brand: {publicData.brand}</span>}
           {publicData.condition && <span>Condition: {publicData.condition}</span>}
         </div>
       </div>
     );
   };
   ```

2. **Use in SearchPage:**
   ```javascript
   // Pass as custom component to search results
   <SearchResults
     listingComponent={CustomListingCard}
     listings={listings}
   />
   ```

**What NOT to do:**
- NO: Modify Sharetribe's ListingCard component directly
- NO: Store "new arrival" in extended data (calculate from createdAt)
- NO: Use Tailwind classes (use CSS Modules only)

---

### Key Patterns Across Scenarios:

1. **Console for content/configuration** → PageBuilder for rendering
2. **Built-in API parameters** → No schema needed (price, location, dates, keywords, authorId, states)
3. **Extended data scopes** → Choose based on who can write/read
4. **Metadata** → Operator-controlled features (badges, verification, tracking)
5. **Custom components** → Composition over modification (wrap, don't edit)
6. **CSS Modules** → Never Tailwind/styled-components in production code
7. **Integration API** → Required for metadata writes from backend
8. **Sanitization** → Always sanitize user data in HTML attributes

---

