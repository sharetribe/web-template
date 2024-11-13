const { getMethod } = require('../common/api');

export const fetchCustomCategoryConfig = () => {
  return getMethod('/api/category-custom-config');
};
