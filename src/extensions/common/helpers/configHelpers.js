const union = (arr1, arr2, key) => {
  const all = [...arr1, ...arr2];
  const map = new Map(all.map(obj => [obj[key], obj]));
  return [...map.values()];
};

export const mergeListingCategoryConfigs = (hostedConfigs = {}, defaultConfigs = {}) => {
  const { categories: hostedCategories, ...restHosted } = hostedConfigs;

  const categories = union(hostedCategories, defaultConfigs, 'id');
  return { ...restHosted, categories };
};
