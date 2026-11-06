/////////////////////////////////////
// Built-in localization defaults //
/////////////////////////////////////

// Optional
// Hosted asset: /general/localization.json (appCdnAssets.localization)
// To use only these built-ins, omit/ignore the hosted asset
// (see localization/localization.js).
export const locale = 'en-US';

// First day of week
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo#return_value
// 1: Monday
// ...
// 6: Saturday
// 7: Sunday
// Note: merged config applies `% 7` so Sunday (7) becomes 0 for DatePicker / moment.
export const firstDayOfWeek = 1;

// Note: marketplace currency default stays top-level on configDefault.js
// (`currency: 'USD'`). Hosted localization.currency elevates to that key.
