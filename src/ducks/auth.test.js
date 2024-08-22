import { storableError } from '../util/errors';
import { clearCurrentUser } from './user.duck';
import reducer, {
  authenticationInProgress,
  authInfoSuccess,
  logout,
  logoutRequest,
  logoutSuccess,
  logoutError,
  userLogout,
} from './auth.duck';

describe('auth duck', () => {
  describe('reducer', () => {
    it('should be logged out with no errors by default', () => {
      const state = reducer();
      expect(state.isAuthenticated).toEqual(false);
      expect(state.authInfoLoaded).toEqual(false);
      expect(state.loginError).toBeNull();
      expect(state.logoutError).toBeNull();
      expect(state.signupError).toBeNull();
      expect(state.loginInProgress).toEqual(false);
      expect(state.logoutInProgress).toEqual(false);
      expect(state.signupInProgress).toEqual(false);
      expect(authenticationInProgress({ auth: state })).toEqual(false);
    });

    it('should set initial state for unauthenticated users', () => {
      const authInfoLoggedOut = {};
      const initialState = reducer();
      expect(initialState.authInfoLoaded).toEqual(false);
      const state = reducer(initialState, authInfoSuccess(authInfoLoggedOut));
      expect(state.authInfoLoaded).toEqual(true);
      expect(state.isAuthenticated).toEqual(false);
    });

    it('should set initial state for anonymous users', () => {
      const authInfoAnonymous = { isAnonymous: true };
      const initialState = reducer();
      expect(initialState.authInfoLoaded).toEqual(false);
      const state = reducer(initialState, authInfoSuccess(authInfoAnonymous));
      expect(state.authInfoLoaded).toEqual(true);
      expect(state.isAuthenticated).toEqual(false);
    });

    it('should set initial state for authenticated users', () => {
      const authInfoLoggedIn = { isAnonymous: false };
      const initialState = reducer();
      expect(initialState.authInfoLoaded).toEqual(false);
      const state = reducer(initialState, authInfoSuccess(authInfoLoggedIn));
      expect(state.authInfoLoaded).toEqual(true);
      expect(state.isAuthenticated).toEqual(true);
    });
  });

  describe('logout thunk', () => {
    it('should dispatch success', () => {
      const dispatch = jest.fn();
      const initialState = reducer();
      const getState = () => ({ auth: initialState });
      const sdk = { logout: jest.fn(() => Promise.resolve({})) };

      return logout()(dispatch, getState, sdk).then(() => {
        expect(sdk.logout.mock.calls.length).toEqual(1);
        expect(dispatch.mock.calls).toEqual([
          [logoutRequest()],
          [logoutSuccess()],
          [clearCurrentUser()],
          [userLogout()],
        ]);
      });
    });
    it('should dispatch error', () => {
      const dispatch = jest.fn();
      const initialState = reducer();
      const getState = () => ({ auth: initialState });
      const error = new Error('could not logout');
      const sdk = { logout: jest.fn(() => Promise.reject(error)) };

      return logout()(dispatch, getState, sdk).then(() => {
        expect(sdk.logout.mock.calls.length).toEqual(1);
        expect(dispatch.mock.calls).toEqual([
          [logoutRequest()],
          [logoutError(storableError(error))],
        ]);
      });
    });
    it('should reject if another logout is in progress', () => {
      const dispatch = jest.fn();
      const initialState = reducer();
      const logoutInProgressState = reducer(initialState, logoutRequest());
      const getState = () => ({ auth: logoutInProgressState });
      const sdk = { logout: jest.fn(() => Promise.resolve({})) };

      return logout()(dispatch, getState, sdk).then(
        () => {
          throw new Error('should not succeed');
        },
        e => {
          expect(e.message).toEqual('Login or logout already in progress');
          expect(sdk.logout.mock.calls.length).toEqual(0);
          expect(dispatch.mock.calls.length).toEqual(0);
        }
      );
    });
  });
});
