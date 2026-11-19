//////////////////////////////////////////////////////////////
// Built-in category configuration (optional local fallback) //
//////////////////////////////////////////////////////////////

// Hosted listing-categories.json (appCdnAssets.categories) takes priority when present.
// Leave `categories` empty unless you want local built-in fallbacks for marketplaces
// that do not use the hosted categories asset.
//
// To add built-in categories, use the same tree shape as the hosted asset:
//   - name (string): non-empty label shown in the UI
//   - id (string): non-empty unique identifier (also used in public data / filters).
//     Use letters, numbers, dashes (-), or underscores (_) only — no spaces.
//   - subcategories (array): nested categories with the same shape (optional / [])
//
// Example:
// export const categories = [
//   {
//     name: 'Cats',
//     id: 'cats',
//     subcategories: [
//       { name: 'Burmese', id: 'burmese', subcategories: [] },
//       { name: 'Egyptian Mau', id: 'egyptian-mau', subcategories: [] },
//     ],
//   },
// ];
//
// Note: Sharetribe Listing categories use public data keys categoryLevel1,
// categoryLevel2, and categoryLevel3 (up to three levels). Those keys have
// been added to search index. The handler derives categoryLevelKeys from the
// tree depth — do not invent custom key names here.

export const categories = [];
