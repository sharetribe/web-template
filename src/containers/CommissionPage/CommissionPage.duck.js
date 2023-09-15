import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { getUsersAdmin, getListingOwnerAdmin } from '../../util/api';
import { parse } from '../../util/urlHelpers';
import * as log from '../../util/log';
import {ASC,DSC,sortUsersByName, sortUsersByEmail, sortUsersByCommission} from '../../util/sorting';
import { object } from 'prop-types';
import { indexOf } from 'lodash';

const { UUID } = sdkTypes;

const RESULT_PAGE_SIZE = 24;

// ================ Action types ================ //

export const SET_INITIAL_STATE = 'app/CommissionPage/SET_INITIAL_STATE';

export const SHOW_USER_REQUEST = 'app/CommissionPage/SHOW_USER_REQUEST';
export const SHOW_USER_SUCCESS = 'app/CommissionPage/SHOW_USER_SUCCESS';
export const SHOW_USER_ERROR = 'app/CommissionPage/SHOW_USER_ERROR';

export const SEARCH_USERS_REQUEST = 'app/CommissionPage/SEARCH_USERS_REQUEST';
export const SEARCH_USERS_SUCCESS = 'app/SearchPage/SEARCH_USERS_SUCCESS';
export const SEARCH_USERS_ERROR = 'app/SearchPage/SEARCH_USERS_ERROR';

export const QUERY_USERS_SUCCESS = 'app/CommissionPage/QUERY_USERS_SUCCESS';
// export const QUERY_LISTINGS_ERROR = 'app/CommissionPage/QUERY_LISTINGS_ERROR';

export const QUERY_LISTING_SUCCESS = 'app/CommissionPage/QUERY_LISTING_SUCCESS';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  users: [],
  userShowError: null,
  queryListingsError: null,
  queryUsersError: null,
  listingData: null
};

export default function CommissionPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState };
    // case SHOW_USER_REQUEST:
    //   return { ...state, userShowError: null, userId: payload.userId };
    // case SHOW_USER_SUCCESS:
    //   return state;
    // case SHOW_USER_ERROR:
    //   return { ...state, userShowError: payload };

    case QUERY_USERS_SUCCESS:
      console.log('QUERY_USERS_SUCCESS');
      console.log(payload);
      return { ...state, users: payload.usersRefs };
    // case QUERY_LISTINGS_ERROR:
    //   return { ...state, userListingRefs: [], queryListingsError: payload };
    case QUERY_LISTING_SUCCESS:
      return { ...state, listingData:payload };
  
    case SEARCH_USERS_REQUEST:
      return { ...state, users: null };
    case SEARCH_USERS_SUCCESS:
      return { ...state, users:payload.usersRefs };
    case SEARCH_USERS_ERROR:
      return { ...state, users:[], queryUsersError: payload };
      
    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialState = () => ({
  type: SET_INITIAL_STATE,
});

// export const showUserRequest = userId => ({
//   type: SHOW_USER_REQUEST,
//   payload: { userId },
// });

// export const showUserSuccess = () => ({
//   type: SHOW_USER_SUCCESS,
// });

// export const showUserError = e => ({
//   type: SHOW_USER_ERROR,
//   error: true,
//   payload: e,
// });

export const searchUsersRequest = searchParams => ({
  type: SEARCH_USERS_REQUEST,
  payload: { searchParams },
});

export const searchUsersSuccess = usersRefs => ({
  type: SEARCH_USERS_SUCCESS,
  payload: { usersRefs },
});

export const searchUsersError = e => ({
  type: SEARCH_USERS_ERROR,
  error: true,
  payload: e,
});

export const queryListingsSuccess = listingRefs => ({
  type: QUERY_LISTINGS_SUCCESS,
  payload: { listingRefs },
});

// export const queryUsersSuccess = usersRefs => ({
//   type: QUERY_USERS_SUCCESS,
//   payload: { usersRefs },
// });

// export const queryListingsError = e => ({
//   type: QUERY_LISTINGS_ERROR,
//   error: true,
//   payload: e,
// });

export const queryReviewsRequest = () => ({
  type: QUERY_REVIEWS_REQUEST,
});

export const queryListingSuccess = listingData => ({
  type: QUERY_LISTING_SUCCESS,
  payload: 'listingData',
});


// ================ Thunks ================ //


// export const showUser = userId => (dispatch, getState, sdk) => {
//   dispatch(showUserRequest(userId));
//   return sdk.users
//     .show({
//       id: userId,
//       include: ['profileImage'],
//       'fields.image': ['variants.square-small', 'variants.square-small2x'],
//     })
//     .then(response => {
//       dispatch(addMarketplaceEntities(response));
//       dispatch(showUserSuccess());
//       return response;
//     })
//     .catch(e => dispatch(showUserError(storableError(e))));
// };

// export const queryUsers = search => (dispatch, getState, sdk) => {
  
//   // Clear state so that previously loaded data is not visible
//   // in case this page load fails.
//   // dispatch(setInitialState());

//   let params = {};

//   return getUsersAdmin(params)
//   .then(res => {
//     return res;
//   })
//   .then(response => {
//     // dispatch(addMarketplaceEntities(response));
//     dispatch(queryUsersSuccess(response));
//   })
//   .catch(e => {
//     log.error(e, 'create-user-with-idp-failed', { params });
//   });

// };

const keywordsSearch = (keywords,user)=>{
  const paramsKeys = Object.keys(user);
  const {id, attributes } = user;
  const {email, profile} = attributes;
  const {firstName, lastName} = profile;
  const fullName = firstName + ' ' + lastName;
  const userId = id.uuid;

  return email.includes(keywords) ||
    firstName.toLowerCase().includes(keywords) ||
    lastName.toLowerCase().includes(keywords) ||
    fullName.toLowerCase().includes(keywords) ||
    userId.toLowerCase().includes(keywords);
}

const applySearchParams = (searchParams, usersData) => {
  const filterUsers = [];
  const {keywords} = searchParams;

  if(keywords){
    const usersKeys = Object.keys(usersData);

    usersKeys.forEach((key)=>{
      if(keywordsSearch(keywords.toLowerCase(),usersData[key])){
        // const listingUserKey = Object.keys(filterUsers).length;
        filterUsers[filterUsers.length] = usersData[key];
      }
    });

    return filterUsers;
  }
  
  return usersData;
}


const applySortParams = (sortParams, usersData) => {
  const {sort} = sortParams;

  if(sort){
    var filter = function(key, val) {
      return val.indexOf(key) !== -1 && val !== undefined;
    };

    const sortChoice = sort.replace('-','');
    const order = filter('-',sort) ? ASC : DSC;

    switch (sortChoice) {
      case 'name':
        usersData.sort((a,b)=>sortUsersByName(a,b,order));
        break;
      case 'email':
        usersData.sort((a,b)=>sortUsersByEmail(a,b,order));
        break;
      case 'commission':
        usersData.sort((a,b)=>sortUsersByCommission(a,b,order));
        break;
    }
  }
  
  return usersData;
}

export const searchUsers = (searchParams, config) => (dispatch, getState, sdk) => {
  dispatch(searchUsersRequest(searchParams));

  return getUsersAdmin()
  .then(res => {
    return res;
  })
  .then(response => {
    const filteredUsers = applySearchParams(searchParams,response);
    const sortedUsers = applySortParams(searchParams,filteredUsers);
    dispatch(searchUsersSuccess(sortedUsers));
  })
  .catch(e => {
    log.error(e, 'create-user-with-idp-failed', { searchParams });
  });
  
}

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const userId = new UUID(params);

  const queryParams = parse(search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  const { page = 1, ...rest } = queryParams;

  const searchUsersDis = searchUsers(
    {
      ...rest,
      page,
      perPage: RESULT_PAGE_SIZE,
    },
    config
  );


  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  dispatch(setInitialState());

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(searchUsersDis),
  ]);
};


