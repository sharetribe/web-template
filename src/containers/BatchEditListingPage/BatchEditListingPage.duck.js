import { fetchCurrentUser } from '../../ducks/user.duck';
import { fetchStripeAccount } from '../../ducks/stripeConnectAccount.duck';

const NEW_BATCH_LISTING_FLOW = 'new';

export function requestCreateBatchListings(payload) {
  return (dispatch, getState, sdk) => {};
}

export const loadData = params => (dispatch, getState, sdk) => {
  const { type } = params;
  const fetchCurrentUserOptions = {
    updateNotifications: false,
  };

  if (type === NEW_BATCH_LISTING_FLOW) {
    return Promise.all([dispatch(fetchCurrentUser(fetchCurrentUserOptions))])
      .then(response => {
        const currentUser = getState().user.currentUser;
        if (currentUser && currentUser.stripeAccount) {
          dispatch(fetchStripeAccount());
        }
        return response;
      })
      .catch(e => {
        throw e;
      });
  }

  return Promise.all([dispatch(fetchCurrentUser(fetchCurrentUserOptions))])
    .then(response => response)
    .catch(e => {
      throw e;
    });
};
