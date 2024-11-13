import { getMethod } from '../common/api';

// Note: Currently this is not used anywhere
export const getCommission = () => {
  return getMethod('/api/price-breakdown/commission');
};
