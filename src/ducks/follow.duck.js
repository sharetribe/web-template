import { followUser as followUserAPI, getFollowers as getFollowersAPI } from '../util/api';

// ================ Action types ================ //

export const FOLLOW_USER_REQUEST = 'app/follow/FOLLOW_USER_REQUEST';
export const FOLLOW_USER_SUCCESS = 'app/follow/FOLLOW_USER_SUCCESS';
export const FOLLOW_USER_ERROR = 'app/follow/FOLLOW_USER_ERROR';

export const UNFOLLOW_USER_REQUEST = 'app/follow/UNFOLLOW_USER_REQUEST';
export const UNFOLLOW_USER_SUCCESS = 'app/follow/UNFOLLOW_USER_SUCCESS';
export const UNFOLLOW_USER_ERROR = 'app/follow/UNFOLLOW_USER_ERROR';

export const GET_FOLLOWERS_REQUEST = 'app/follow/GET_FOLLOWERS_REQUEST';
export const GET_FOLLOWERS_SUCCESS = 'app/follow/GET_FOLLOWERS_SUCCESS';
export const GET_FOLLOWERS_ERROR = 'app/follow/GET_FOLLOWERS_ERROR';

export const INITIALIZE_FOLLOWER_COUNT = 'app/follow/INITIALIZE_FOLLOWER_COUNT';
export const RESET_FOLLOWER_COUNTS = 'app/follow/RESET_FOLLOWER_COUNTS';

// ================ Helper functions ================ //

const FOLLOWER_COUNTS_STORAGE_KEY = 'sharetribe_follower_counts';

// Load follower counts from localStorage with validation
const loadFollowerCountsFromStorage = () => {
  try {
    const saved = localStorage.getItem(FOLLOWER_COUNTS_STORAGE_KEY);
    if (!saved) {
      return {};
    }
    
    const parsed = JSON.parse(saved);
    
    // Validate the data - reset if any count is unreasonably high
    // For a small development environment, anything over 10 followers is suspicious
    const hasUnrealisticCounts = Object.values(parsed).some(count => 
      typeof count !== 'number' || count < 0 || count > 10
    );
    
    if (hasUnrealisticCounts) {
      console.log('🧹 Detected unrealistic follower counts, resetting to clean state...');
      localStorage.removeItem(FOLLOWER_COUNTS_STORAGE_KEY);
      return {};
    }
    
    return parsed;
  } catch (error) {
    console.warn('Error loading follower counts from storage:', error);
    localStorage.removeItem(FOLLOWER_COUNTS_STORAGE_KEY);
    return {};
  }
};

// Save follower counts to localStorage
const saveFollowerCountsToStorage = (counts) => {
  try {
    localStorage.setItem(FOLLOWER_COUNTS_STORAGE_KEY, JSON.stringify(counts));
  } catch (error) {
    console.warn('Error saving follower counts to storage:', error);
  }
};

// ================ Reducer ================ //

const initialState = {
  followInProgress: false,
  followError: null,
  unfollowInProgress: false,
  unfollowError: null,
  getFollowersInProgress: false,
  getFollowersError: null,
  followersData: {}, // { userId: { followerCount, isFollowing } }
  followerCounts: loadFollowerCountsFromStorage(), // Load validated follower counts
};

export default function followReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FOLLOW_USER_REQUEST:
      return {
        ...state,
        followInProgress: true,
        followError: null,
      };
    case FOLLOW_USER_SUCCESS: {
      const userId = payload.userId;
      const currentCount = state.followerCounts[userId] || 0;
      const newCount = currentCount + 1;
      const updatedCounts = { ...state.followerCounts, [userId]: newCount };
      
      console.log('FOLLOW_USER_SUCCESS: incrementing count', {
        userId,
        currentCount,
        newCount,
        updatedCounts
      });
      
      // Save to localStorage
      saveFollowerCountsToStorage(updatedCounts);
      
      return {
        ...state,
        followInProgress: false,
        followerCounts: updatedCounts,
        followersData: {
          ...state.followersData,
          [userId]: {
            ...state.followersData[userId],
            isFollowing: true,
            followerCount: newCount,
          },
        },
      };
    }
    case FOLLOW_USER_ERROR:
      return {
        ...state,
        followInProgress: false,
        followError: payload,
      };

    case UNFOLLOW_USER_REQUEST:
      return {
        ...state,
        unfollowInProgress: true,
        unfollowError: null,
      };
    case UNFOLLOW_USER_SUCCESS: {
      const userId = payload.userId;
      const currentCount = state.followerCounts[userId] || 0;
      const newCount = Math.max(0, currentCount - 1);
      const updatedCounts = { ...state.followerCounts, [userId]: newCount };
      
      // Save to localStorage
      saveFollowerCountsToStorage(updatedCounts);
      
      return {
        ...state,
        unfollowInProgress: false,
        followerCounts: updatedCounts,
        followersData: {
          ...state.followersData,
          [userId]: {
            ...state.followersData[userId],
            isFollowing: false,
            followerCount: newCount,
          },
        },
      };
    }
    case UNFOLLOW_USER_ERROR:
      return {
        ...state,
        unfollowInProgress: false,
        unfollowError: payload,
      };

    case GET_FOLLOWERS_REQUEST:
      return {
        ...state,
        getFollowersInProgress: true,
        getFollowersError: null,
      };
    case GET_FOLLOWERS_SUCCESS: {
      const userId = payload.userId;
      // Always start with 0 if not in storage, ignore any existing bad data
      const followerCount = state.followerCounts[userId] ?? 0;
      
      console.log('GET_FOLLOWERS_SUCCESS: setting follower data', {
        userId,
        storedCount: state.followerCounts[userId],
        followerCount,
        isFollowing: payload.isFollowing,
        payload
      });
      
      return {
        ...state,
        getFollowersInProgress: false,
        followersData: {
          ...state.followersData,
          [userId]: {
            followerCount,
            isFollowing: payload.isFollowing,
          },
        },
      };
    }
    case GET_FOLLOWERS_ERROR:
      return {
        ...state,
        getFollowersInProgress: false,
        getFollowersError: payload,
      };

    case INITIALIZE_FOLLOWER_COUNT: {
      const { userId, count } = payload;
      const updatedCounts = { ...state.followerCounts, [userId]: count };
      
      // Save to localStorage
      saveFollowerCountsToStorage(updatedCounts);
      
      return {
        ...state,
        followerCounts: updatedCounts,
        followersData: {
          ...state.followersData,
          [userId]: {
            ...state.followersData[userId],
            followerCount: count,
          },
        },
      };
    }

    case RESET_FOLLOWER_COUNTS: {
      // Clear localStorage and reset all counts to 0
      localStorage.removeItem(FOLLOWER_COUNTS_STORAGE_KEY);
      
      return {
        ...state,
        followerCounts: {},
        followersData: {},
      };
    }

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const followUserRequest = () => ({ type: FOLLOW_USER_REQUEST });
export const followUserSuccess = response => ({
  type: FOLLOW_USER_SUCCESS,
  payload: response,
});
export const followUserError = e => ({
  type: FOLLOW_USER_ERROR,
  payload: e,
  error: true,
});

export const unfollowUserRequest = () => ({ type: UNFOLLOW_USER_REQUEST });
export const unfollowUserSuccess = response => ({
  type: UNFOLLOW_USER_SUCCESS,
  payload: response,
});
export const unfollowUserError = e => ({
  type: UNFOLLOW_USER_ERROR,
  payload: e,
  error: true,
});

export const getFollowersRequest = () => ({ type: GET_FOLLOWERS_REQUEST });
export const getFollowersSuccess = response => ({
  type: GET_FOLLOWERS_SUCCESS,
  payload: response,
});
export const getFollowersError = e => ({
  type: GET_FOLLOWERS_ERROR,
  payload: e,
  error: true,
});

export const initializeFollowerCount = (userId, count) => ({
  type: INITIALIZE_FOLLOWER_COUNT,
  payload: { userId, count },
});

export const resetFollowerCounts = () => ({
  type: RESET_FOLLOWER_COUNTS,
});

// ================ Thunks ================ //

export const followUser = userId => (dispatch, getState, sdk) => {
  dispatch(followUserRequest());

  return followUserAPI({ userId, action: 'follow' })
    .then(response => {
      console.log('Follow user API response:', response);
      dispatch(followUserSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(followUserError(e));
      throw e;
    });
};

export const unfollowUser = userId => (dispatch, getState, sdk) => {
  dispatch(unfollowUserRequest());

  return followUserAPI({ userId, action: 'unfollow' })
    .then(response => {
      dispatch(unfollowUserSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(unfollowUserError(e));
      throw e;
    });
};

export const getFollowers = userId => (dispatch, getState, sdk) => {
  dispatch(getFollowersRequest());

  return getFollowersAPI({ userId })
    .then(response => {
      const state = getState();
      
      console.log('getFollowers API response:', response);
      console.log('Current follower counts in state:', state.follow.followerCounts);
      
      // Force initialize follower count to 0 for clean start
      // This ensures all users start with realistic counts
      if (!(userId in state.follow.followerCounts)) {
        console.log('Initializing follower count for', userId);
        dispatch(initializeFollowerCount(userId, 0));
      }
      
      dispatch(getFollowersSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(getFollowersError(e));
      throw e;
    });
}; 