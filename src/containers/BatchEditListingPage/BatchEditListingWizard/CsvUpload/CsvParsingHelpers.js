import { MAX_CATEGORIES } from '../../constants';

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
             const match = categories.find(({ label, value }) => {
               // Normalize and split label and value into words
               const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9 ]/g, '');
               const normalizedValue = value.toLowerCase().replace(/[^a-z0-9 ]/g, '');

               const labelWords = normalizedLabel.split(/\s+/);
               const valueWords = normalizedValue.split(/\s+/);

               // Check if any word in the category matches part of the label or value
               return (
                 labelWords.some(word => cat.includes(word)) ||
                 valueWords.some(word => cat.includes(word))
               );
             });

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
