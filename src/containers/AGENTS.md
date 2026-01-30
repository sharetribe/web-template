# src/containers/AGENTS.md - Page & Container Patterns

> **This file contains page-level and container patterns for the Sharetribe Web Template.** Use this when working with PageBuilder, SectionBuilder, landing pages, search/listing pages, and custom page creation.

**You are here:** `/src/containers/AGENTS.md`
**Main guide:** [`/AGENTS.md`](../../AGENTS.md) (includes Console Configuration)
**Frontend patterns:** [`/src/AGENTS.md`](../AGENTS.md)
**Component guide:** [`/src/components/AGENTS.md`](../components/AGENTS.md)
**Backend patterns:** [`/server/AGENTS.md`](../../server/AGENTS.md)

---

## Page/Container Patterns

Containers are full-page components in [src/containers/PageName/](.).

### Creating Custom Pages

```
src/containers/CustomMyPage/
├── CustomMyPage.js              # Main component
├── CustomMyPage.duck.js         # Redux state slice
├── CustomMyPage.module.css      # Page styles
└── [SubComponents]/             # Page-specific components
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

### Connecting Pages to Routes

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

---

## PageBuilder & SectionBuilder Architecture

### How PageBuilder Works

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

### Markdown Support in Console Pages

**Console pages support Markdown** for rich text content. PageBuilder automatically processes markdown fields through a secure pipeline.

**Markdown Processing Pipeline:**

The template uses [src/containers/PageBuilder/markdownProcessor.js](../containers/PageBuilder/markdownProcessor.js):

1. `remark-parse` - Parses markdown to AST
2. `remark-rehype` - Converts markdown AST to HTML AST
3. `rehype-sanitize` - Sanitizes HTML (prevents XSS)
4. `rehype-react` - Converts to React components

**Supported Markdown in Console:**

- Headings (`#` to `######`)
- Paragraphs
- Lists (unordered `*` and ordered `1.`)
- Emphasis (`*italic*`, `**bold**`)
- Links (`[text](url)`) - automatically converted to React Router for internal links
- Images (`![alt](url)`) - lazy-loaded with proper sizing
- Code (inline and blocks)
- Anchor links (`#section-id`)

**Custom Component Mapping:**

PageBuilder maps markdown elements to custom React components:

```javascript
// src/containers/PageBuilder/Field/Field.js
const markdownComponents = {
  h1: H1,    // Custom heading components
  h2: H2,
  h3: H3,
  p: P,      // Custom paragraph component
  ul: Ul,    // Custom list components
  ol: Ol,
  li: Li,
  img: MarkdownImage,  // Lazy-loaded image component
  code: Code,          // Syntax-highlighted code
  pre: CodeBlock,      // Code block wrapper
  a: Link,             // React Router aware link
};
```

**This means:**
- All markdown is XSS-safe (automatically sanitized)
- Links work with React Router (no page reloads)
- Images are optimized and lazy-loaded
- Code blocks can be syntax-highlighted
- Custom styling via CSS Modules

**Design Implications:**

When creating custom page designs, you can:
- Use markdown fields in Console for client-editable content
- Style markdown elements via CSS Modules
- Trust that content is sanitized and safe
- Rely on internal links working without page reload

### Default Console-Managed Pages

These pages have content managed via Console (Content > Pages):

| Page | Location | Console Content Path |
|------|----------|---------------------|
| **Landing Page** | [LandingPage/](./LandingPage/) | `/content/pages/landing-page.json` |
| **About** | [AboutPage/](./AboutPage/) | `/content/pages/about.json` |
| **Privacy Policy** | [PrivacyPolicyPage/](./PrivacyPolicyPage/) | `/content/pages/privacy-policy.json` |
| **Terms of Service** | [TermsOfServicePage/](./TermsOfServicePage/) | `/content/pages/terms-of-service.json` |

### Data-Driven Pages (Not Console Content)

These pages render dynamic data, not static Console content:

| Page | Location | Data Source |
|------|----------|-------------|
| Search Page | [SearchPage/](./SearchPage/) | Listings from Sharetribe API |
| Listing Page | [ListingPage/](./ListingPage/) | Single listing from API |
| User Profile | [ProfilePage/](./ProfilePage/) | User data from API |
| Inbox | [InboxPage/](./InboxPage/) | Messages/transactions from API |
| Checkout | [CheckoutPage/](./CheckoutPage/) | Transaction flow (not page content) |

**Key Principle**: Console for content, code for structure.

---

## Landing Page Customization Workflow

### Understanding Fixed Section Types

**CRITICAL CONSTRAINT**: Users can ONLY use the 5 fixed section types (hero, article, columns, features, carousel). They CANNOT create custom section types.

#### Available Section Types

The Sharetribe Web Template provides 5 built-in section types. Each section type has a specific layout, visual appearance, and ideal use case:

---

##### 1. `hero` - SectionHero

**Visual Appearance:**
- **Full viewport height** (min 80vh) section with centered content
- Background image support (cover, center-positioned)
- Vertically and horizontally centered title/description/CTA
- No blocks - all content is defined at section level

**Layout Structure:**
```
┌─────────────────────────────────────┐
│                                     │
│           [Title]                   │ <- Centered
│        [Description]                │ <- Centered
│       [CTA Button]                  │ <- Centered
│                                     │
│    (Background Image Optional)      │
└─────────────────────────────────────┘
```

**Common Fields:**
- `title` - Main heading (usually H1)
- `description` - Subtitle/tagline
- `callToAction` - Primary CTA button
- `appearance.backgroundImage` - Hero background image
- `appearance.textColor` - White text for dark theme

**Best Used For:**
- Landing page hero sections (first section on page)
- Product launches
- Campaign announcements
- Full-screen call-to-action sections

**Example Console Config:**
```json
{
  "sectionType": "hero",
  "sectionId": "hero-main",
  "title": { "fieldType": "heading1", "content": "Find Amazing Things" },
  "description": { "fieldType": "paragraph", "content": "The marketplace for creators" },
  "callToAction": {
    "fieldType": "internalButtonLink",
    "content": "Get Started",
    "href": "/s"
  },
  "appearance": {
    "fieldType": "customAppearance",
    "backgroundImage": { "url": "https://...", "alt": "Hero background" },
    "textColor": "white"
  }
}
```

---

##### 2. `article` - SectionArticle

**Visual Appearance:**
- **Narrower content column** (optimized for reading)
- Section header with title/description/CTA
- Block content displayed in single column
- Ideal for long-form text content

**Layout Structure:**
```
┌─────────────────────────────────────┐
│        [Section Title]              │
│     [Section Description]           │
│                                     │
│   ┌─────────────────────────┐      │
│   │   Block 1 Content       │      │ <- Narrower column
│   │   (text, images)        │      │
│   └─────────────────────────┘      │
│   ┌─────────────────────────┐      │
│   │   Block 2 Content       │      │
│   └─────────────────────────┘      │
└─────────────────────────────────────┘
```

**Common Fields:**
- `title` - Section heading
- `description` - Section introduction
- `callToAction` - Optional CTA button
- `blocks[]` - Array of content blocks
  - Each block can have: `title`, `text`, `media` (images), `callToAction`

**Best Used For:**
- Blog posts or articles
- About page content
- Terms of service / Privacy policy
- Documentation pages
- Any long-form readable content

**Example Console Config:**
```json
{
  "sectionType": "article",
  "sectionId": "about-story",
  "title": { "fieldType": "heading2", "content": "Our Story" },
  "description": { "fieldType": "paragraph", "content": "How we got started..." },
  "blocks": [
    {
      "blockType": "defaultBlock",
      "blockId": "story-1",
      "text": {
        "fieldType": "markdown",
        "content": "We started in 2020 with a simple idea..."
      },
      "media": { "fieldType": "image", "url": "...", "alt": "Team photo" }
    }
  ]
}
```

---

##### 3. `columns` - SectionColumns

**Visual Appearance:**
- **Multi-column grid layout** (1-4 columns)
- Mobile: Always single column
- Desktop: Configured number of columns
- Equal-width columns with gap spacing
- Blocks displayed side-by-side

**Layout Structure:**
```
Desktop (numColumns: 3):
┌─────────────────────────────────────┐
│        [Section Title]              │
│     [Section Description]           │
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │Block 1 │ │Block 2 │ │Block 3 │  │
│  │        │ │        │ │        │  │
│  └────────┘ └────────┘ └────────┘  │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │Block 4 │ │Block 5 │ │Block 6 │  │
│  └────────┘ └────────┘ └────────┘  │
└─────────────────────────────────────┘

Mobile:
┌──────────────┐
│  [Title]     │
│              │
│ ┌──────────┐ │
│ │ Block 1  │ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │ Block 2  │ │
│ └──────────┘ │
└──────────────┘
```

**Common Fields:**
- `numColumns` - Number of columns (1-4)
- `title` - Section heading
- `description` - Section introduction
- `callToAction` - Optional CTA button
- `blocks[]` - Array of content blocks

**Best Used For:**
- Pricing plans (3 columns)
- Feature highlights (2-4 columns)
- Team member bios (3-4 columns)
- Service offerings (2-3 columns)
- Stats or metrics (4 columns)
- Product categories (3-4 columns)

**Example Console Config:**
```json
{
  "sectionType": "columns",
  "sectionId": "pricing-tiers",
  "numColumns": 3,
  "title": { "fieldType": "heading2", "content": "Choose Your Plan" },
  "blocks": [
    {
      "blockType": "defaultBlock",
      "blockId": "plan-basic",
      "title": { "fieldType": "heading3", "content": "Basic" },
      "text": { "fieldType": "markdown", "content": "$9/month\n\n- Feature 1\n- Feature 2" },
      "callToAction": { "fieldType": "internalButtonLink", "content": "Sign Up", "href": "/signup" }
    },
    {
      "blockType": "defaultBlock",
      "blockId": "plan-pro",
      "title": { "fieldType": "heading3", "content": "Pro" },
      "text": { "fieldType": "markdown", "content": "$29/month\n\n- All Basic features\n- Feature 3" }
    }
  ]
}
```

---

##### 4. `features` - SectionFeatures

**Visual Appearance:**
- **Alternating row layout** (text + image side-by-side)
- Desktop: Image and text swap sides on each row
  - Odd rows: Image right, text left
  - Even rows: Image left, text right
- Mobile: Always image on top, text below
- Creates visual rhythm down the page

**Layout Structure:**
```
Desktop:
┌─────────────────────────────────────┐
│        [Section Title]              │
│                                     │
│  ┌────────────┐    ┌──────────┐    │
│  │            │    │          │    │ <- Block 1: Text left, image right
│  │   Text 1   │    │  Image 1 │    │
│  └────────────┘    └──────────┘    │
│                                     │
│  ┌──────────┐    ┌────────────┐    │
│  │          │    │            │    │ <- Block 2: Image left, text right
│  │  Image 2 │    │   Text 2   │    │
│  └──────────┘    └────────────┘    │
│                                     │
│  ┌────────────┐    ┌──────────┐    │
│  │   Text 3   │    │  Image 3 │    │ <- Block 3: Text left, image right
│  └────────────┘    └──────────┘    │
└─────────────────────────────────────┘

Mobile:
┌──────────────┐
│ ┌──────────┐ │
│ │ Image 1  │ │
│ └──────────┘ │
│   Text 1     │
│              │
│ ┌──────────┐ │
│ │ Image 2  │ │
│ └──────────┘ │
│   Text 2     │
└──────────────┘
```

**Common Fields:**
- `title` - Section heading
- `description` - Section introduction
- `blocks[]` - Array of feature blocks
  - Each block: `title`, `text`, `media`

**Best Used For:**
- Product features with screenshots
- How-it-works steps with images
- Benefits with illustrations
- Process explanations
- Before/after comparisons
- Case studies with visuals

**Example Console Config:**
```json
{
  "sectionType": "features",
  "sectionId": "how-it-works",
  "title": { "fieldType": "heading2", "content": "How It Works" },
  "blocks": [
    {
      "blockType": "defaultBlock",
      "blockId": "step-1",
      "title": { "fieldType": "heading3", "content": "1. Create Your Listing" },
      "text": { "fieldType": "paragraph", "content": "Add photos and details..." },
      "media": { "fieldType": "image", "url": "...", "alt": "Create listing screenshot" }
    },
    {
      "blockType": "defaultBlock",
      "blockId": "step-2",
      "title": { "fieldType": "heading3", "content": "2. Connect with Buyers" },
      "text": { "fieldType": "paragraph", "content": "Get messages from interested buyers..." },
      "media": { "fieldType": "image", "url": "...", "alt": "Messages screenshot" }
    }
  ]
}
```

---

##### 5. `carousel` - SectionCarousel

**Visual Appearance:**
- **Horizontal scrolling carousel** with navigation arrows
- Shows multiple blocks at once (based on `numColumns`)
- Smooth scroll animation
- Desktop: Arrow buttons for navigation
- Mobile: Touch swipe + arrows
- Keyboard accessible (left/right arrow keys)

**Layout Structure:**
```
Desktop (numColumns: 3):
┌─────────────────────────────────────┐
│        [Section Title]              │
│                                     │
│   ← ┌────┐ ┌────┐ ┌────┐ [→]       │
│     │ 1  │ │ 2  │ │ 3  │  4  5     │ <- Visible blocks (can scroll to 4, 5)
│     └────┘ └────┘ └────┘            │
└─────────────────────────────────────┘

Mobile (numColumns: 1):
┌──────────────┐
│  [Title]     │
│              │
│  ← ┌──────┐→ │
│    │Block1│  │ <- Swipe to see Block 2, 3, etc.
│    └──────┘  │
└──────────────┘
```

**Common Fields:**
- `numColumns` - Blocks visible at once (1-4)
- `title` - Section heading
- `description` - Section introduction
- `blocks[]` - Array of carousel items

**Best Used For:**
- Testimonials / reviews
- Logo showcases (partners, clients)
- Product galleries
- Featured listings
- Team members
- Category browsing
- Image galleries

**Example Console Config:**
```json
{
  "sectionType": "carousel",
  "sectionId": "testimonials",
  "numColumns": 2,
  "title": { "fieldType": "heading2", "content": "What Our Users Say" },
  "blocks": [
    {
      "blockType": "defaultBlock",
      "blockId": "testimonial-1",
      "text": { "fieldType": "paragraph", "content": "\"Amazing marketplace! Found exactly what I needed.\"" },
      "title": { "fieldType": "heading4", "content": "Sarah J." },
      "media": { "fieldType": "image", "url": "...", "alt": "Sarah's photo" }
    },
    {
      "blockType": "defaultBlock",
      "blockId": "testimonial-2",
      "text": { "fieldType": "paragraph", "content": "\"Great experience from start to finish.\"" },
      "title": { "fieldType": "heading4", "content": "Mike D." }
    }
  ]
}
```

---

##### 6. `footer` - SectionFooter (Special)

**Visual Appearance:**
- **Multi-column footer layout** (1-4 columns for content blocks)
- Left side: Logo, slogan, social media links, copyright
- Right side: Link columns (configurable 1-4 columns)
- Mobile: Stacked layout (logo → links → social → copyright)

**Layout Structure:**
```
Desktop:
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │   [Logo]    │  │Col 1 │ │Col 2 │ │Col 3 │ │Col 4 │  │
│  │             │  │      │ │      │ │      │ │      │  │
│  │  [Slogan]   │  │Links │ │Links │ │Links │ │Links │  │
│  │             │  │      │ │      │ │      │ │      │  │
│  │ [Social] [Copyright] │ │      │ │      │ │      │  │
│  └─────────────┘  └──────┘ └──────┘ └──────┘ └──────┘  │
└─────────────────────────────────────────────────────────┘
```

**Common Fields:**
- `numberOfColumns` - Link columns (1-4)
- `slogan` - Footer tagline
- `copyright` - Copyright text
- `socialMediaLinks[]` - Social media icons
- `blocks[]` - Link column blocks

**Best Used For:**
- Site-wide footer (automatically rendered on most pages)
- Navigation links
- Legal links
- Social media presence
- Company info

**Note:** Footer is special - it's fetched as a hosted asset and rendered automatically via FooterContainer.

---

#### Choosing the Right Section Type

| Want to Build | Use Section Type | Why |
|---------------|------------------|-----|
| **Hero banner** | `hero` | Full-height, centered content, background image |
| **Pricing table** | `columns` (numColumns: 3) | Equal-width cards side-by-side |
| **Testimonials** | `carousel` (numColumns: 1-2) | Scrollable reviews with navigation |
| **Feature showcase** | `features` | Alternating image/text creates visual interest |
| **Blog post** | `article` | Narrow reading column, optimal for text |
| **Stats grid** | `columns` (numColumns: 4) | Compact equal-width display |
| **How-it-works steps** | `features` | Image + text alternating shows progression |
| **Team members** | `columns` (numColumns: 3-4) | Grid of bios with photos |
| **Partner logos** | `carousel` (numColumns: 4) | Many logos, scrollable |
| **About page content** | `article` | Long-form narrative content |

---

When a user wants a custom designed landing page:

### Step 1: User Adds Sections in Console Using Closest Matching Type

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

### Step 2: Agent Creates Custom Page Component

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

### Step 3: Create Section Components

**Each section component reads its content from props (provided by Console):**

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

### Step 4: Update Route to Use Custom Component

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

### Summary: The Correct Workflow

1. **User cannot create custom section types** - only 5 fixed types available
2. **User picks closest matching type**:
   - Want testimonials? → Use `carousel`
   - Want pricing? → Use `columns`
   - Want stats? → Use `features`
3. **User assigns unique section IDs** in Console
4. **Agent creates custom components** tied to those specific IDs
5. **Page name + Section IDs = Custom Design** with Console-managed content

**Why This Pattern is Superior:**

1. **Console is the CMS**: Non-technical users control all content, images, and copy
2. **Code is the View**: Developers control how content is rendered and styled
3. **No Code Changes for Content**: User updates content in Console, no deployments needed
4. **Reusable Components**: Section components can be reused across pages
5. **Upstream Compatible**: Original `LandingPage` remains untouched
6. **Scalable**: Easy to add new section types as needed

---

## Console Page Naming and Asset Access

**CRITICAL**: The Console page name directly determines the asset API path and is required for loading page data.

### How Console Page Names Map to Asset Paths

Console page names become the filename in the Asset Delivery API path:

| Console Page Name | Asset Path | Used In |
|-------------------|------------|---------|
| `landing-page` | `content/pages/landing-page.json` | LandingPage |
| `about` | `content/pages/about.json` | AboutPage |
| `privacy-policy` | `content/pages/privacy-policy.json` | PrivacyPolicyPage |
| `terms-of-service` | `content/pages/terms-of-service.json` | TermsOfServicePage |
| `{custom-page-name}` | `content/pages/{custom-page-name}.json` | CMSPage (dynamic) |

### Standard Asset Access Pattern

**All Console pages work the same way** - they all fetch data from `content/pages/{page-name}.json` using the same pattern. Pages like LandingPage, PrivacyPolicyPage, TermsOfServicePage are just dynamic pages with custom routes added for SEO.

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

### Console Page Routing Patterns

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

### Adding a New Console Page with Custom Route

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

**Step 4: Update Sitemap (for SEO)**

When adding a custom route for a Console page, you need to update the sitemap in two places:

```javascript
// server/resources/sitemap.js

// 1. Add to defaultPublicPaths (around line 47-54)
const defaultPublicPaths = {
  landingPage: { url: '/' },
  termsOfService: { url: '/terms-of-service' },
  privacyPolicy: { url: '/privacy-policy' },
  aboutUs: { url: '/about-us' }, // Add your custom page
  signup: { url: '/signup' },
  login: { url: '/login' },
  search: { url: '/s' },
};

// 2. Add to permanentPaths array (around line 272)
const permanentPaths = ['landing-page', 'terms-of-service', 'privacy-policy', 'about-us'];
```

This ensures:
- The page appears in the default sitemap at its custom route (`/about-us`)
- It's excluded from the dynamic CMS pages sitemap (which lists `/p/:pageId` routes)

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

### Debugging Asset Loading Issues

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

## SearchPage and ListingPage Layout Variants

**CRITICAL**: Console layout settings control which page variants are loaded. This affects styling and component structure.

### SearchPage Layout Variants

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

### ListingPage Layout Variants

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

### Customizing Layout Variants

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

### Why This Matters for Design Work

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

---

## Sanitizing User Data (XSS Prevention)

**CRITICAL SECURITY**: When rendering user-generated content OUTSIDE of JSX `{...}` tags, you MUST use sanitization utilities to prevent XSS attacks.

### When Sanitization is Needed

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

### Using the Sanitize Utility

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

### Available Sanitization Functions

See [src/util/sanitize.js](../util/sanitize.js):

- `sanitizeUrl(url)` - Prevents javascript:, data:, vbscript: URLs
- `sanitizeText(str)` - Escapes `<` and `>` characters
- `sanitizeUser(entity, config)` - Sanitizes user entity data
- `sanitizeListing(entity, config)` - Sanitizes listing entity data
- `sanitizeEntity(entity, config)` - Auto-detects entity type

### Custom Public Data Sanitization

If you add custom public data fields, update the sanitization:

```javascript
// src/util/sanitize.js

const sanitizeConfiguredPublicData = (publicData, config = {}) => {
  const publicDataObj = publicData || {};
  return Object.entries(publicDataObj).reduce((sanitized, entry) => {
    const [key, value] = entry;
    const foundListingFieldConfig = config?.listingFields?.find(d => d.key === key);
    const foundUserFieldConfig = config?.userFields?.find(d => d.key === key);

    // Add your custom field keys here if needed
    const knownKeysWithString = [
      'listingType',
      'transactionProcessAlias',
      'unitType',
      'userType',
      'cardStyle',
      'customWebsiteUrl', // Your custom field
    ];

    const sanitizedValue = knownKeysWithString.includes(key)
      ? sanitizeText(value)
      : foundListingFieldConfig
      ? sanitizedExtendedDataFields(value, foundListingFieldConfig)
      : foundUserFieldConfig
      ? sanitizedExtendedDataFields(value, foundUserFieldConfig)
      : typeof value === 'string'
      ? sanitizeText(value)
      : value;

    return {
      ...sanitized,
      [key]: sanitizedValue,
    };
  }, {});
};
```

### Best Practices

1. **Always sanitize user-generated URLs** before using in `href`, `src`, etc.
2. **Always sanitize text** before using in HTML attributes (`title`, `alt`, `data-*`)
3. **JSX content is automatically escaped** - no need to sanitize `{variable}` in JSX
4. **Configure sanitization for custom fields** in Console
5. **Never use `dangerouslySetInnerHTML`** with user data without proper sanitization

---

## Getting Help

- **Sharetribe Docs**: https://www.sharetribe.com/docs
- **Help Center**: https://www.sharetribe.com/help/en/
- **API Reference**: https://www.sharetribe.com/api-reference
- **Design Resources**: https://github.com/sharetribe/design-resources

---

**Remember**: For frontend patterns (React, Redux, styling), see [src/AGENTS.md](../AGENTS.md). For backend patterns, see [server/AGENTS.md](../../server/AGENTS.md).
