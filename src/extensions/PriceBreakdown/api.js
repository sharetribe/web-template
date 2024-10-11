import { getMethod } from '../common/api';

export const getCommission = () => {
  return getMethod('/api/price-breakdown/commission');
};
