# Changelog

All notable changes to this marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
follows dates for versioning.

## [Unreleased]

### Added

- Initial changelog setup

### Changed

### Fixed

### Removed

---

## How to Use This Changelog

**When you make changes to the marketplace**, add them to the **[Unreleased]** section under the
appropriate category:

- **Added** - New features, components, pages
- **Changed** - Changes to existing functionality
- **Fixed** - Bug fixes
- **Removed** - Removed features or components

**Example:**

```markdown
## [Unreleased]

### Added

- Custom testimonial carousel component on landing page
- Price range filter to search page
- User profile bio field

### Changed

- Updated listing card styling with rounded corners
- Changed hero section background image

### Fixed

- Fixed mobile navigation menu overlapping with content
- Corrected search filter alignment on tablet devices
```

**When deploying to production**, create a new version section:

```markdown
## [2024-02-15]

### Added

- Custom testimonial carousel component on landing page

### Changed

- Updated listing card styling with rounded corners
```

Then start a new **[Unreleased]** section for the next round of changes.

---

## Guidelines

- **Keep entries clear and concise** - Describe what changed, not how
- **Use present tense** - "Add feature" not "Added feature"
- **Group similar changes** - Keep related items together
- **Link to issues/PRs if applicable** - Reference GitHub issues when relevant
- **Date format: YYYY-MM-DD** - Use ISO date format for version sections

**Good entries:**

- ✅ "Add custom pricing table to landing page"
- ✅ "Fix mobile menu z-index issue"
- ✅ "Update search filters to use Console configuration"

**Bad entries:**

- ❌ "Made some changes to the homepage"
- ❌ "Fixed bugs"
- ❌ "Updated code"
