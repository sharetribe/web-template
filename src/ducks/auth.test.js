import * as log from '../util/log';
import { storableError } from '../util/errors';
import { createCurrentUser } from '../util/testData';
import configureStore from '../store';
import { clearCurrentUser } from './user.duck';
import reducer, { authenticationInProgress, login, logout, signup } from './auth.duck';

const logger = actions => () => {
  return next => action => {
    actions.push(action);
    // Call the next dispatch method in the middleware chain.
    return next(action);
  };
};

describe('auth duck', () => {
  describe('reducer', () => {
    it('should be logged out with no errors by default', () => {
      const state = reducer(undefined, { type: '@@INIT' });
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

    it('should login successfully', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const loginRequestState = reducer(initialState, {
        type: 'auth/login/pending',
        meta: { arg: { username: 'test', password: 'test' } },
      });
      expect(loginRequestState.isAuthenticated).toEqual(false);
      expect(loginRequestState.loginError).toBeNull();
      expect(loginRequestState.loginInProgress).toEqual(true);
      expect(authenticationInProgress({ auth: loginRequestState })).toEqual(true);

      const loginSuccessState = reducer(loginRequestState, {
        type: 'auth/login/fulfilled',
        payload: { username: 'test', password: 'test' },
      });
      expect(loginSuccessState.isAuthenticated).toEqual(true);
      expect(loginSuccessState.loginError).toBeNull();
      expect(loginSuccessState.loginInProgress).toEqual(false);
    });

    it('should handle failed login', () => {
      let state = reducer(undefined, { type: '@@INIT' });
      state = reducer(state, {
        type: 'auth/login/pending',
        meta: { arg: { username: 'test', password: 'test' } },
      });
      expect(state.isAuthenticated).toEqual(false);
      expect(state.loginError).toBeNull();
      expect(state.loginInProgress).toEqual(true);
      expect(authenticationInProgress({ auth: state })).toEqual(true);

      const error = new Error('test error');
      state = reducer(state, {
        type: 'auth/login/rejected',
        payload: error,
        meta: { arg: { username: 'test', password: 'test' } },
      });
      expect(state.isAuthenticated).toEqual(false);
      expect(state.loginError).toEqual(error);
      expect(state.loginInProgress).toEqual(false);
      expect(authenticationInProgress({ auth: state })).toEqual(false);
    });

    it('should login and logout properly', () => {
      let state = reducer(undefined, { type: '@@INIT' });
      expect(state.isAuthenticated).toEqual(false);
      expect(authenticationInProgress({ auth: state })).toEqual(false);

      // request login
      state = reducer(state, {
        type: 'auth/login/pending',
        meta: { arg: { username: 'test', password: 'test' } },
      });
      expect(authenticationInProgress({ auth: state })).toEqual(true);

      // login successful
      state = reducer(state, {
        type: 'auth/login/fulfilled',
        payload: { username: 'test', password: 'test' },
      });
      expect(state.isAuthenticated).toEqual(true);
      expect(authenticationInProgress({ auth: state })).toEqual(false);

      // request logout
      state = reducer(state, { type: 'auth/logout/pending' });
      expect(state.isAuthenticated).toEqual(true);
      expect(authenticationInProgress({ auth: state })).toEqual(true);

      // logout successful
      state = reducer(state, { type: 'auth/logout/fulfilled', payload: true });
      expect(state.isAuthenticated).toEqual(false);
      expect(authenticationInProgress({ auth: state })).toEqual(false);
    });

    it('should signup successfully', () => {
      let state = reducer(undefined, { type: '@@INIT' });

      // request signup
      state = reducer(state, {
        type: 'auth/signup/pending',
        meta: { arg: { email: 'test@example.com', password: 'test' } },
      });
      expect(state.signupInProgress).toEqual(true);
      expect(authenticationInProgress({ auth: state })).toEqual(true);

      // signup successful
      state = reducer(state, {
        type: 'auth/signup/fulfilled',
        payload: { email: 'test@example.com', password: 'test' },
      });
      expect(state.signupInProgress).toEqual(false);
      expect(authenticationInProgress({ auth: state })).toEqual(false);
    });

    it('should clear signup error when logging in', () => {
      let state = reducer(undefined, { type: '@@INIT' });

      // request signup
      state = reducer(state, {
        type: 'auth/signup/pending',
        meta: { arg: { email: 'test@example.com', password: 'test' } },
      });
      expect(state.signupInProgress).toEqual(true);
      expect(authenticationInProgress({ auth: state })).toEqual(true);

      // signup error
      const error = new Error('test signup error');
      state = reducer(state, {
        type: 'auth/signup/rejected',
        payload: error,
        meta: { arg: { email: 'test@example.com', password: 'test' } },
      });
      expect(state.signupInProgress).toEqual(false);
      expect(authenticationInProgress({ auth: state })).toEqual(false);
      expect(state.signupError).toEqual(error);
      expect(state.isAuthenticated).toEqual(false);

      // login request
      state = reducer(state, {
        type: 'auth/login/pending',
        meta: { arg: { username: 'test', password: 'test' } },
      });
      expect(authenticationInProgress({ auth: state })).toEqual(true);
      expect(state.isAuthenticated).toEqual(false);

      // login successful
      state = reducer(state, {
        type: 'auth/login/fulfilled',
        payload: { username: 'test', password: 'test' },
      });
      expect(authenticationInProgress({ auth: state })).toEqual(false);
      expect(state.isAuthenticated).toEqual(true);
      expect(state.signupError).toBeNull();
    });

    it('should set initial state for unauthenticated users', () => {
      const authInfoLoggedOut = {};
      const initialState = reducer(undefined, { type: '@@INIT' });
      expect(initialState.authInfoLoaded).toEqual(false);
      const state = reducer(initialState, {
        type: 'auth/authInfo/fulfilled',
        payload: authInfoLoggedOut,
      });
      expect(state.authInfoLoaded).toEqual(true);
      expect(state.isAuthenticated).toEqual(false);
    });

    it('should set initial state for anonymous users', () => {
      const authInfoAnonymous = { isAnonymous: true };
      const initialState = reducer(undefined, { type: '@@INIT' });
      expect(initialState.authInfoLoaded).toEqual(false);
      const state = reducer(initialState, {
        type: 'auth/authInfo/fulfilled',
        payload: authInfoAnonymous,
      });
      expect(state.authInfoLoaded).toEqual(true);
      expect(state.isAuthenticated).toEqual(false);
    });

    it('should set initial state for authenticated users', () => {
      const authInfoLoggedIn = { isAnonymous: false };
      const initialState = reducer(undefined, { type: '@@INIT' });
      expect(initialState.authInfoLoaded).toEqual(false);
      const state = reducer(initialState, {
        type: 'auth/authInfo/fulfilled',
        payload: authInfoLoggedIn,
      });
      expect(state.authInfoLoaded).toEqual(true);
      expect(state.isAuthenticated).toEqual(true);
    });
  });

  describe('login thunk', () => {
    it('should dispatch success and fetch current user', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const fakeCurrentUser = createCurrentUser('test-user');
      const fakeCurrentUserResponse = { data: { data: fakeCurrentUser, include: [] } };
      const fakeTransactionsResponse = { data: { data: [], include: [] } };
      const sdk = {
        login: jest.fn(() => Promise.resolve({})),
        authInfo: jest.fn(() => Promise.resolve({})),
        currentUser: { show: jest.fn(() => Promise.resolve(fakeCurrentUserResponse)) },
        transactions: { query: jest.fn(() => Promise.resolve(fakeTransactionsResponse)) },
      };
      let actions = [];
      const store = configureStore({
        initialState: {
          auth: initialState,
          user: { currentUserHasListings: true }, // Set to true so fetchCurrentUserHasListings won't be dispatched
        },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;
      const username = 'x.x@example.com';
      const password = 'pass';

      return login(username, password)(dispatch, getState, sdk).then(() => {
        expect(sdk.login.mock.calls).toEqual([[{ username, password }]]);

        // Check that the expected action types are present
        expect(actions[0].type).toBe('auth/login/pending');
        expect(actions[0].meta.arg).toEqual({ username, password });

        expect(actions[1].type).toEqual('user/fetchCurrentUser/pending');
        expect(actions[2].type).toEqual('user/fetchCurrentUserNotifications/pending');
        expect(actions[3].type).toBe('auth/authInfo/pending');
        expect(actions[4].type).toBe('auth/authInfo/fulfilled');
        expect(actions[5].type).toEqual('user/fetchCurrentUser/fulfilled');
        expect(actions[5].payload).toEqual(fakeCurrentUser);

        expect(actions[6].type).toEqual('user/fetchCurrentUserNotifications/fulfilled');
        expect(actions[7].type).toBe('auth/login/fulfilled');
      });
    });
    it('should dispatch error', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const error = new Error('could not login');
      const sdk = { login: jest.fn(() => Promise.reject(error)) };
      let actions = [];
      const store = configureStore({
        initialState: { auth: initialState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;
      const username = 'x.x@example.com';
      const password = 'pass';

      return login(username, password)(dispatch, getState, sdk).catch(() => {
        expect(sdk.login.mock.calls).toEqual([[{ username, password }]]);

        expect(actions[0].type).toBe('auth/login/pending');
        expect(actions[0].meta.arg).toEqual({ username, password });

        expect(actions[1].type).toBe('auth/login/rejected');
        expect(actions[1].payload).toEqual(storableError(error));
        expect(actions[1].meta.arg).toEqual({ username, password });
      });
    });
    it('should reject if another login is in progress', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const loginInProgressState = reducer(initialState, {
        type: 'auth/login/pending',
        meta: { arg: { username: 'test', password: 'test' } },
      });
      const sdk = { login: jest.fn(() => Promise.resolve({})) };
      let actions = [];
      const store = configureStore({
        initialState: { auth: loginInProgressState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;
      const username = 'x.x@example.com';
      const password = 'pass';

      return login(username, password)(dispatch, getState, sdk).then(
        () => {
          throw new Error('should not succeed');
        },
        e => {
          expect(e.message).toEqual('Aborted due to condition callback returning false.');
          expect(sdk.login.mock.calls.length).toEqual(0);
          expect(actions.length).toEqual(0);
        }
      );
    });
    it('should reject if logout is in progress', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const logoutInProgressState = reducer(initialState, { type: 'auth/logout/pending' });
      const sdk = { login: jest.fn(() => Promise.resolve({})) };
      let actions = [];
      const store = configureStore({
        initialState: { auth: logoutInProgressState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;
      const username = 'x.x@example.com';
      const password = 'pass';

      return login(username, password)(dispatch, getState, sdk).then(
        () => {
          throw new Error('should not succeed');
        },
        e => {
          expect(e.message).toEqual('Aborted due to condition callback returning false.');
          expect(sdk.login.mock.calls.length).toEqual(0);
          expect(actions.length).toEqual(0);
        }
      );
    });
  });

  describe('logout thunk', () => {
    it('should dispatch success', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const sdk = { logout: jest.fn(() => Promise.resolve({})) };
      let actions = [];
      const store = configureStore({
        initialState: { auth: initialState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      return logout()(dispatch, getState, sdk).then(() => {
        expect(sdk.logout.mock.calls.length).toEqual(1);

        expect(actions[0].type).toBe('auth/logout/pending');
        expect(actions[1]).toEqual(clearCurrentUser());
        expect(actions[2].type).toBe('auth/logout/fulfilled');
      });
    });
    it('should dispatch error', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const error = new Error('could not logout');
      const sdk = { logout: jest.fn(() => Promise.reject(error)) };
      let actions = [];
      const store = configureStore({
        initialState: { auth: initialState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      return logout()(dispatch, getState, sdk).catch(() => {
        expect(sdk.logout.mock.calls.length).toEqual(1);
        expect(actions[0].type).toBe('auth/logout/pending');
        expect(actions[1].type).toBe('auth/logout/rejected');
        expect(actions[1].payload).toEqual(storableError(error));
      });
    });
    it('should reject if another logout is in progress', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const logoutInProgressState = reducer(initialState, { type: 'auth/logout/pending' });
      const sdk = { logout: jest.fn(() => Promise.resolve({})) };
      let actions = [];
      const store = configureStore({
        initialState: { auth: logoutInProgressState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      return logout()(dispatch, getState, sdk).then(
        () => {
          throw new Error('should not succeed');
        },
        e => {
          expect(e.message).toEqual('Aborted due to condition callback returning false.');
          expect(sdk.logout.mock.calls.length).toEqual(0);
          expect(actions.length).toEqual(0);
        }
      );
    });
    it('should reject if login is in progress', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const loginInProgressState = reducer(initialState, { type: 'auth/login/pending' });
      const sdk = { logout: jest.fn(() => Promise.resolve({})) };
      let actions = [];
      const store = configureStore({
        initialState: { auth: loginInProgressState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      return logout()(dispatch, getState, sdk).then(
        () => {
          throw new Error('should not succeed');
        },
        e => {
          expect(e.message).toEqual('Aborted due to condition callback returning false.');
          expect(sdk.logout.mock.calls.length).toEqual(0);
          expect(actions.length).toEqual(0);
        }
      );
    });
  });

  describe('signup thunk', () => {
    it('should dispatch success and login', () => {
      const fakeCurrentUser = createCurrentUser({ id: 'test-user' });
      const fakeCurrentUserResponse = { data: { data: fakeCurrentUser, include: [] } };
      const fakeTransactionsResponse = { data: { data: [], include: [] } };
      const sdk = {
        currentUser: {
          create: jest.fn(() => Promise.resolve({})),
          show: jest.fn(() => Promise.resolve(fakeCurrentUserResponse)),
        },
        login: jest.fn(() => Promise.resolve({})),
        authInfo: jest.fn(() => Promise.resolve({})),
        transactions: { query: jest.fn(() => Promise.resolve(fakeTransactionsResponse)) },
      };
      const initialState = reducer(undefined, { type: '@@INIT' });
      let actions = [];
      const store = configureStore({
        initialState: { auth: initialState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      const email = 'pekka@example.com';
      const password = 'some pass';
      const params = {
        email,
        password,
        firstName: 'Pekka',
        lastName: 'Pohjola',
        protectedData: {
          phoneNumber: '+123 555 1234567',
        },
      };

      return signup(params)(dispatch, getState, sdk).then(() => {
        // signup > login > fetchCurrentUser
        expect(sdk.currentUser.create.mock.calls).toEqual([[params]]);
        expect(actions[0].type).toBe('auth/signup/pending');
        expect(actions[1].type).toBe('auth/login/pending');
        expect(actions[2].type).toBe('user/fetchCurrentUser/pending');
        expect(actions[3].type).toBe('user/fetchCurrentUserHasListings/pending');
        expect(actions[4].type).toBe('user/fetchCurrentUserNotifications/pending');
        expect(actions[5].type).toBe('auth/authInfo/pending');
        expect(actions[6].type).toBe('user/fetchCurrentUserHasListings/fulfilled');
        expect(actions[7].type).toBe('auth/authInfo/fulfilled');
        expect(actions[8].type).toBe('user/fetchCurrentUser/fulfilled');
        expect(actions[9].type).toBe('user/fetchCurrentUserNotifications/fulfilled');
        expect(actions[10].type).toBe('auth/login/fulfilled');
      });
    });
    it('should dispatch error', () => {
      const error = new Error('test signup error');
      const sdk = {
        currentUser: {
          create: jest.fn(() => Promise.reject(error)),
        },
      };
      const initialState = reducer(undefined, { type: '@@INIT' });
      let actions = [];
      const store = configureStore({
        initialState: { auth: initialState },
        sdk,
        extraMiddlewares: [logger(actions)],
      });
      const dispatch = store.dispatch;
      const getState = store.getState;

      const email = 'pekka@example.com';
      const password = 'some pass';
      const params = {
        email,
        password,
        firstName: 'Pekka',
        lastName: 'Pohjola',
        protectedData: {
          phoneNumber: '+123 555 1234567',
        },
      };

      // disable error logging
      log.error = jest.fn();

      return signup(params)(dispatch, getState, sdk).catch(() => {
        expect(sdk.currentUser.create.mock.calls).toEqual([[params]]);
        expect(actions[0].type).toBe('auth/signup/pending');
        expect(actions[1].type).toBe('auth/signup/rejected');
        expect(actions[1].payload?.message).toEqual(error.message);
      });
    });
  });
});
