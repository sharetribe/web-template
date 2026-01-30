# SearchPage - Container-Specific Guidance

> **This file contains search page customization patterns.** Use this when customizing search results, filters, map view, and listing cards.

**You are here:** `/src/containers/SearchPage/AGENTS.md`
**Main guide:** [`/AGENTS.md`](../../../AGENTS.md)
**Container patterns:** [`/src/containers/AGENTS.md`](../AGENTS.md)

---

## Overview

**SearchPage** handles:
- Listing search results (`/s`)
- Search filters (categories, price, custom fields)
- Map view vs grid view layouts
- Location search
- Keyword search
- Sort options

**Key Files:**
- [SearchPageWithMap.js](./SearchPageWithMap.js) - Map view layout (Sharetribe original)
- [SearchPageWithGrid.js](./SearchPageWithGrid.js) - Grid view layout (Sharetribe original)
- [SearchPage.shared.js](./SearchPage.shared.js) - Shared logic between variants
- [SearchPage.duck.js](./SearchPage.duck.js) - Redux state for search
- [Filter components](.) - SelectSingleFilter, SelectMultipleFilter, PriceFilter, etc.

---

## Decision: Should I Modify SearchPage Directly?

**Use this decision tree:**

```
Client wants to customize search page

┌─ What are you changing?
│
├─ LISTING CARD STYLING (how results look)
│  → NO, don't modify SearchPage
│  → Pattern: Create CustomListingCard, use in search
│  → See: src/components/ListingCard/AGENTS.md
│
├─ PAGE LAYOUT (sidebar, grid, spacing)
│  → MAYBE create custom variant
│  → Reason: SearchPage has 2 variants already (map/grid)
│  → Pattern: Modify layout via CSS or create 3rd variant
│
├─ ADDING NEW FILTER (custom listing field)
│  → NO code changes needed
│  → Pattern: Add field in Console, filter auto-appears
│  → See: "Adding Custom Filters" section below
│
├─ CHANGING FILTER STYLING (filter appearance)
│  → YES, wrap filter component
│  → Pattern: Create CustomSelectSingleFilter
│  → See: "Custom Filter Styling" section below
│
├─ CHANGING MAP vs GRID VARIANT
│  → NO code changes needed
│  → Pattern: Change in Console > Listing search > Layout
│  → See: "Layout Configuration" section below
│
└─ ADDING CUSTOM FILTER TYPES (not built-in)
   → YES, create custom filter component
   → Pattern: Create CustomBooleanFilter or CustomRangeFilter
   → See: "Custom Filter Components" section below
```

---

## Layout Configuration (Console)

**SearchPage has 2 layout variants configured via Console:**

### Variant 1: Map View (`searchPage.variantType: map`)

**Layout:**
```
┌─────────────────────────────────────┐
│          Topbar                     │
├─────────────┬───────────────────────┤
│             │                       │
│  Results +  │      Map View         │
│  Filters    │   (with markers)      │
│             │                       │
└─────────────┴───────────────────────┘
```

**Best for:**
- Location-based marketplaces (rentals, services, events)
- When geographic proximity matters
- Visual browsing by area

### Variant 2: Grid View (`searchPage.variantType: grid`)

**Layout:**
```
┌─────────────────────────────────────┐
│          Topbar                     │
├─────────┬───────────────────────────┤
│         │                           │
│ Filters │    Results Grid           │
│ Column  │   (ListingCards)          │
│         │                           │
└─────────┴───────────────────────────┘
```

**Best for:**
- Category-based browsing
- Non-location marketplaces (digital goods, services)
- Focus on listing details over location

### How to Change Layout Variant

**Console Configuration:**

Tell client to:
1. Go to Console > Search
2. Find "Layout" or "Variant type" setting
3. Choose: `map` or `grid`
4. Save

**No code changes needed!**

---

## Adding Custom Filters (Console Configuration)

**Most filter customization happens in Console, not code.**

### Step 1: Add Listing Field in Console

Tell client:

```
1. Go to Console > Listing fields
2. Add field:
   - Label: "Property Type"
   - Key: propertyType
   - Type: Enum (dropdown)
   - Options: apartment, house, condo, townhouse
3. Save
```

### Step 2: Enable Search for Field

```
4. Go to Console > Search
5. Find "Listing fields" section
6. Enable search for "propertyType"
7. Choose filter type:
   - Single select (radio buttons)
   - Multi-select (checkboxes)
8. Set filter priority:
   - Primary (always visible)
   - Secondary (in "More filters")
9. Save
```

### Step 3: Filter Automatically Appears!

**No code changes needed.** The SearchPage automatically:
- Renders appropriate filter component (SelectSingleFilter or SelectMultipleFilter)
- Fetches options from Console
- Updates URL parameters
- Triggers new search

---

## Built-in Filter Types

**SearchPage includes these filter components:**

| Filter Component | Search Schema | Use For | Example |
|------------------|---------------|---------|---------|
| **SelectSingleFilter** | enum | Single-choice filters | Category, property type |
| **SelectMultipleFilter** | multi-enum | Multi-choice filters | Amenities, features |
| **PriceFilter** | (built-in) | Price range | Min/max price |
| **KeywordFilter** | (built-in) | Text search | Search titles/descriptions |
| **BookingDateRangeFilter** | (built-in) | Date range | Availability dates |
| **IntegerRangeFilter** | (custom) | Number range | Bedrooms, guests |

---

## Custom Filter Styling

**Scenario:** Client wants to change how filters look (colors, layout, icons)

**Decision:** Wrap filter component, add custom CSS

**Pattern:**

```javascript
// src/containers/CustomSearchPage/CustomSelectSingleFilter.js
import React from 'react';
import { SelectSingleFilter } from '../SearchPage';
import { Check } from 'lucide-react';
import css from './CustomSelectSingleFilter.module.css';

const CustomSelectSingleFilter = (props) => {
  const { options, selectedOption, onSelect } = props;

  return (
    <div className={css.filterWrapper}>
      <h3 className={css.filterTitle}>{props.label}</h3>
      <div className={css.options}>
        {options.map(option => (
          <button
            key={option.key}
            className={selectedOption === option.key ? css.optionActive : css.option}
            onClick={() => onSelect(option.key)}
          >
            {option.label}
            {selectedOption === option.key && (
              <Check size={16} className={css.checkIcon} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomSelectSingleFilter;
```

Then use in SearchPage:

```javascript
// src/containers/CustomSearchPage/CustomSearchPage.js
import { SearchPageWithGrid } from '../SearchPage';
import CustomSelectSingleFilter from './CustomSelectSingleFilter';

const CustomSearchPage = (props) => {
  return (
    <SearchPageWithGrid
      {...props}
      filterConfig={{
        selectSingleFilter: CustomSelectSingleFilter,
      }}
    />
  );
};
```

---

## Custom Filter Components

**Scenario:** Client needs filter type not built-in (e.g., boolean toggle, star rating)

**Decision:** Create custom filter component

**Example: Boolean Filter (True/False toggle)**

```javascript
// src/containers/CustomSearchPage/BooleanFilter.js
import React from 'react';
import { FilterPopup, FilterPlain } from '../SearchPage';
import css from './BooleanFilter.module.css';

const BooleanFilter = (props) => {
  const {
    id,
    label,
    queryParamName,
    initialValues,
    onSubmit,
    showAsPopup,
  } = props;

  const handleToggle = (value) => {
    onSubmit({ [queryParamName]: value });
  };

  const currentValue = initialValues?.[queryParamName];

  const FilterContent = (
    <div className={css.toggleContainer}>
      <button
        className={currentValue === 'true' ? css.toggleActive : css.toggle}
        onClick={() => handleToggle(currentValue === 'true' ? null : 'true')}
      >
        {label}
      </button>
    </div>
  );

  return showAsPopup ? (
    <FilterPopup
      id={id}
      label={label}
      isSelected={!!currentValue}
      onSubmit={onSubmit}
    >
      {FilterContent}
    </FilterPopup>
  ) : (
    <FilterPlain label={label}>
      {FilterContent}
    </FilterPlain>
  );
};

export default BooleanFilter;
```

**Console Configuration:**

```
Tell client:

1. Go to Console > Listing fields
2. Add field:
   - Label: "Pet Friendly"
   - Key: petFriendly
   - Type: Boolean
3. Configure search schema (via CLI or API)
   - searchSchema: boolean
4. Add to search filters in Console
```

**Note:** Sharetribe template doesn't include boolean filters by default. Client will need to create this custom component.

---

## Custom Listing Card in Search Results

**Scenario:** Client wants custom listing card design in search results

**Decision:** Create CustomListingCard, use in search

**Pattern:**

```javascript
// src/components/CustomListingCard/CustomListingCard.js
import React from 'react';
import { ListingCard } from '../../components';
import { Star, MapPin } from 'lucide-react';
import css from './CustomListingCard.module.css';

const CustomListingCard = (props) => {
  const { listing } = props;
  const rating = listing.attributes.publicData?.rating || 0;

  return (
    <div className={css.wrapper}>
      {/* Custom badge */}
      {listing.attributes.publicData?.featured && (
        <div className={css.featuredBadge}>Featured</div>
      )}

      {/* Original listing card */}
      <ListingCard {...props} />

      {/* Custom footer */}
      <div className={css.customFooter}>
        <div className={css.rating}>
          <Star size={14} fill="currentColor" />
          <span>{rating.toFixed(1)}</span>
        </div>
        <div className={css.location}>
          <MapPin size={14} />
          <span>{listing.attributes.publicData?.city}</span>
        </div>
      </div>
    </div>
  );
};
```

**Then configure SearchPage to use it:**

```javascript
// src/containers/SearchPage/SearchPageWithGrid.js
// (or create custom variant)
import CustomListingCard from '../../components/CustomListingCard';

// Use CustomListingCard instead of ListingCard in results mapping
```

---

## Custom Search Page Layout

**Scenario:** Client wants completely custom search layout (beyond map/grid variants)

**Decision:** Create CustomSearchPage component

**Pattern:**

```javascript
// src/containers/CustomSearchPage/CustomSearchPage.js
import React from 'react';
import { SearchPageWithGrid } from '../SearchPage';
import css from './CustomSearchPage.module.css';

const CustomSearchPage = (props) => {
  return (
    <div className={css.customLayout}>
      {/* Custom header/hero */}
      <div className={css.searchHero}>
        <h1>Find Your Perfect Space</h1>
        {/* Embed location search here */}
      </div>

      {/* Use existing SearchPageWithGrid but customize layout */}
      <div className={css.searchContainer}>
        <SearchPageWithGrid
          {...props}
          customClasses={{
            filterColumn: css.customFilters,
            resultsPanel: css.customResults,
          }}
        />
      </div>
    </div>
  );
};
```

---

## What Can Be Customized vs What Needs Developer

### ✅ You Can Customize (Design Work)

| Feature | How |
|---------|-----|
| **Filter styling** | Wrap filter components, CSS Modules |
| **Listing card design** | Create CustomListingCard |
| **Page layout** | CSS or create custom variant |
| **Add filters from Console fields** | Console config only |
| **Filter order/priority** | Console > Search > Filter order |
| **Map vs Grid toggle** | Console > Search > Layout |
| **Sort options** | Console > Search > Sort by |
| **"No results" message** | Customize NoSearchResultsMaybe component |

### ❌ Defer to Developer

| Feature | Why |
|---------|-----|
| **Custom search algorithms** | Backend API work |
| **Boolean/Long filter types** | Requires custom filter component + search schema |
| **Search schema changes** | Requires Sharetribe CLI |
| **Geolocation search radius** | Backend configuration |
| **Search performance optimization** | Backend indexes, API configuration |

---

## Mock Data vs Console Configuration

### No Console Config Needed

These work without Console:

- Listing card styling
- Page layout changes
- Filter styling (colors, fonts)
- Custom "no results" message

### Console Config Required

These need Console configuration:

- Adding new filters (enum, multi-enum)
- Changing filter options
- Enabling/disabling filters
- Filter order and priority
- Map vs Grid layout
- Sort options

**Workflow:**
1. Build custom components with mock listings
2. Provide exact Console config for filters
3. SearchPage auto-syncs when client adds fields

---

## Common Questions

**Q: How do I add a new filter?**

**A:** Add listing field in Console > Listing fields, then enable search in Console > Search. No code needed.

**Q: How do I change map to grid view?**

**A:** Console > Search > Layout > Select "grid" or "map". No code needed.

**Q: Can I customize how filters look?**

**A:** Yes, wrap filter components (SelectSingleFilter, SelectMultipleFilter, etc.) and add custom CSS.

**Q: How do I add boolean or range filters?**

**A:** Template doesn't include these by default. You'll need to create custom filter components. See "Custom Filter Components" section.

**Q: Can I change listing card design in search results?**

**A:** Yes, create CustomListingCard and use it in SearchPage. See "Custom Listing Card in Search Results" section.

**Q: How do I change search radius for location search?**

**A:** This is a backend setting. Defer to developer or check Console > Search > Location settings.

---

## Testing Checklist

After customizing search page:

- [ ] Search works (location or keywords)
- [ ] Filters update results
- [ ] URL parameters update correctly
- [ ] Pagination works
- [ ] Sort options work
- [ ] Map view works (if enabled)
- [ ] Grid view works (if enabled)
- [ ] Mobile filters work
- [ ] "No results" message displays
- [ ] Listing cards render correctly
- [ ] Filter styling looks good
- [ ] Responsive design works

---

## Related Documentation

- **[Sharetribe Search Filters Docs](https://www.sharetribe.com/docs/how-to/change-search-filters-in-template/)** - Official filter customization guide
- **[Console Listing Fields](../../../AGENTS.md#listing-fields)** - How to configure listing fields
- **[ListingCard Component](../../components/ListingCard/ListingCard.js)** - Default listing card
- **[Search Schemas](https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-sharetribe-cli/)** - Managing search with CLI
