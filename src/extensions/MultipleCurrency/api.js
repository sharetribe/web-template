import { postMethod } from '../common/api';

export const updateCurrentUserProfile = body => {
  return postMethod('/api/user/profile', body);
};
