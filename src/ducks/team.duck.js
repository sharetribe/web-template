/**
 * Global duck for NextRep team membership.
 *
 * All operations here write to the *current user's own* profile, so they work with the
 * Marketplace SDK alone (no Integration API needed):
 * - ensureTeamCode: a Team account generates + persists its join code if it doesn't have one.
 * - joinTeam / leaveTeam: an Individual adds/removes a team code on their own profile.
 *
 * Note: joinTeam validates the code *format* only. Verifying that a code maps to a real team
 * requires looking up another user, which is not possible from the browser Marketplace API —
 * that existence check belongs in a server endpoint backed by the Integration API. See
 * NEXTREP_BUILD_PLAN.md (Phase 4) and the team-data constraint.
 */
import { createSlice } from '@reduxjs/toolkit';
import { denormalisedResponseEntities, ensureCurrentUser } from '../util/data';
import { storableError } from '../util/errors';
import { lookupTeam, fetchTeamNames } from '../util/api';
import {
  isTeamAccount,
  getTeamCode,
  getJoinedTeamCodes,
  generateTeamCode,
  normalizeTeamCode,
  isValidTeamCodeFormat,
  addTeamCode,
  removeTeamCode,
} from '../util/teams';
import { setCurrentUser } from './user.duck';

const updateProfileQueryParams = {
  expand: true,
  include: ['profileImage'],
  'fields.image': ['variants.square-small', 'variants.square-small2x'],
};

// ================ Slice ================ //

const initialState = {
  ensureCodeInProgress: false,
  ensureCodeError: null,
  joinInProgress: false,
  joinError: null,
  // Map of canonical team code -> team name, populated lazily for display.
  teamNames: {},
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    ensureCodeRequest: state => {
      state.ensureCodeInProgress = true;
      state.ensureCodeError = null;
    },
    ensureCodeSuccess: state => {
      state.ensureCodeInProgress = false;
    },
    ensureCodeError: (state, action) => {
      state.ensureCodeInProgress = false;
      state.ensureCodeError = action.payload;
    },
    joinRequest: state => {
      state.joinInProgress = true;
      state.joinError = null;
    },
    joinSuccess: state => {
      state.joinInProgress = false;
    },
    joinError: (state, action) => {
      state.joinInProgress = false;
      state.joinError = action.payload;
    },
    setTeamNames: (state, action) => {
      state.teamNames = { ...state.teamNames, ...action.payload };
    },
  },
});

export const {
  ensureCodeRequest,
  ensureCodeSuccess,
  ensureCodeError,
  joinRequest,
  joinSuccess,
  joinError,
  setTeamNames,
} = teamSlice.actions;

export default teamSlice.reducer;

// ================ Thunks ================ //

const updateCurrentUserProfile = (sdk, dispatch, params) =>
  sdk.currentUser.updateProfile(params, updateProfileQueryParams).then(response => {
    const entities = denormalisedResponseEntities(response);
    if (entities.length !== 1) {
      throw new Error('Expected a resource in the sdk.currentUser.updateProfile response');
    }
    const currentUser = entities[0];
    // Keep state.user.currentUser in sync (same pattern as ProfileSettingsPage.duck).
    dispatch(setCurrentUser(currentUser));
    return currentUser;
  });

/**
 * Ensure the current Team account has a join code, generating + persisting one if missing.
 * No-op (resolves null) for non-team accounts; resolves the existing code if already set.
 * @returns {Function} thunk resolving to the team code (or null)
 */
export const ensureTeamCode = () => (dispatch, getState, sdk) => {
  const currentUser = ensureCurrentUser(getState().user.currentUser);
  if (!isTeamAccount(currentUser)) {
    return Promise.resolve(null);
  }
  const existing = getTeamCode(currentUser);
  if (existing) {
    return Promise.resolve(existing);
  }

  const teamCode = generateTeamCode();
  dispatch(ensureCodeRequest());
  return updateCurrentUserProfile(sdk, dispatch, { publicData: { teamCode } })
    .then(() => {
      dispatch(ensureCodeSuccess());
      return teamCode;
    })
    .catch(e => {
      dispatch(ensureCodeError(storableError(e)));
      throw e;
    });
};

/**
 * Individual joins a team by entering its code. Validates format client-side, then verifies the
 * code maps to a real team via the server (Integration API). If the server can't verify (no
 * Integration creds), the code is stored unverified rather than blocking the user.
 * @param {String} rawCode user-entered code
 * @returns {Function} thunk resolving to the updated list of joined codes
 */
export const joinTeam = rawCode => (dispatch, getState, sdk) => {
  const code = normalizeTeamCode(rawCode);
  if (!isValidTeamCodeFormat(code)) {
    const error = storableError(new Error('Invalid team code format'));
    dispatch(joinError(error));
    return Promise.reject(error);
  }

  const currentUser = ensureCurrentUser(getState().user.currentUser);
  const current = getJoinedTeamCodes(currentUser);
  if (current.includes(code)) {
    return Promise.resolve(current);
  }

  const teamCodes = addTeamCode(current, code);
  dispatch(joinRequest());
  return lookupTeam({ teamCode: code })
    .then(({ verified, found }) => {
      // Only block when the server actually checked and found no such team.
      if (verified && found === false) {
        throw new Error('No team found for that code');
      }
      return updateCurrentUserProfile(sdk, dispatch, { publicData: { teamCodes } });
    })
    .then(() => {
      dispatch(joinSuccess());
      return teamCodes;
    })
    .catch(e => {
      dispatch(joinError(storableError(e)));
      throw e;
    });
};

/**
 * Resolve a list of team codes to names (for display) and cache them in state.team.teamNames.
 * Best-effort: failures are swallowed so the UI just falls back to showing the code.
 * @param {String[]} codes canonical team codes
 * @returns {Function} thunk resolving to the names map
 */
export const loadTeamNames = codes => dispatch => {
  const list = Array.isArray(codes) ? codes : [];
  if (list.length === 0) {
    return Promise.resolve({});
  }
  return fetchTeamNames(list)
    .then(({ names }) => {
      const resolved = names || {};
      dispatch(setTeamNames(resolved));
      return resolved;
    })
    .catch(() => ({}));
};

/**
 * Individual leaves a team they previously joined.
 * @param {String} rawCode the code to remove
 * @returns {Function} thunk resolving to the updated list of joined codes
 */
export const leaveTeam = rawCode => (dispatch, getState, sdk) => {
  const code = normalizeTeamCode(rawCode);
  const currentUser = ensureCurrentUser(getState().user.currentUser);
  const teamCodes = removeTeamCode(getJoinedTeamCodes(currentUser), code);

  dispatch(joinRequest());
  return updateCurrentUserProfile(sdk, dispatch, { publicData: { teamCodes } })
    .then(() => {
      dispatch(joinSuccess());
      return teamCodes;
    })
    .catch(e => {
      dispatch(joinError(storableError(e)));
      throw e;
    });
};
