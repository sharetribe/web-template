import { MAX_CATEGORIES } from '../../constants';

// Define column mappings, including the fallback positions
const fieldMapping = {
  fileName: { aliases: ['File Name'], position: 0 },
  title: { aliases: ['Title'], position: 1 },
  description: { aliases: ['Description'], position: 2 },
  isIllustration: { aliases: ['Illustration?'], position: 3 },
  category: { aliases: ['Categories (1-3 max)'], position: 4 },
  usage: { aliases: ['Usage'], position: 5 },
  released: {
    aliases: ["If Commercial, do you have releases on file? (Select 'No' if releases are not needed)"],
    position: 6
  },
  keywords: {
    aliases: ['Keywords (30 max, separate by commas)'],
    position: 7,
  },
  price: { aliases: ['Price'], position: 8 },
};

export const getCsvFieldValue = (row, headers, fieldKey, fallbackRow) => {
  const field = fieldMapping[fieldKey];

  // Try to find the column by its aliases
  const columnName = field.aliases.find(alias => headers.includes(alias));
  if (columnName) {
    return row[columnName];
  }

  // If no alias matches, fall back to the position
  const position = field.position;
  if (position !== undefined && position < fallbackRow.length) {
    return fallbackRow[position];
  }

  return undefined; // Return undefined if not found
};

export const normalizeBoolean = (value, currentValue) => {
  if (value === undefined || value === null) {
    return currentValue; // Keep the current value if not provided
  }
  return ['yes', 'true', '1'].includes(String(value).toLowerCase());
};

export const normalizeCategory = (value, categories, currentCategories = []) => {
  const inputCategories = value ? value.split(',').map(cat => cat.trim().toLowerCase()) : [];

  const normalizedCategories = inputCategories
    .map(cat => {
      const match = categories.find(({ label, value }) =>
        [label.toLowerCase(), value.toLowerCase()].includes(cat)
      );
      return match ? match.value : null;
    })
    .filter(id => id !== null); // Remove unmatched categories

  // Merge existing categories and new ones (limit to MAX_CATEGORIES unique values)
  return Array.from(new Set([...currentCategories, ...normalizedCategories])).slice(
    0,
    MAX_CATEGORIES
  );
};

export const normalizeUsage = (value, usageOptions) => {
  const normalizedValue = String(value || '').toLowerCase();
  const match = usageOptions.find(({ value }) => value.toLowerCase() === normalizedValue);
  return match ? match.value : null; // Return normalized usage or null if invalid
};
