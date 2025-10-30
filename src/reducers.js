import { combineReducers } from '@reduxjs/toolkit';
import { logoutThunk } from './ducks/auth.duck';
import * as globalReducers from './ducks';
import * as pageReducers from './containers/reducers';

/**
 * Function _createReducer_ combines global reducers (reducers that are used in
 * multiple pages) and reducers that are handling actions happening inside one page container.
 * Since we combineReducers, pageReducers will get page specific key (e.g. SearchPage)
 * which is page specific.
 * Future: this structure could take in asyncReducers, which are changed when you navigate pages.
 */
const appReducer = combineReducers({ ...globalReducers, ...pageReducers });

const createReducer = () => {
  return (state, action) => {
    // Clear state when logout is successful
    const shouldClearState = action.type === logoutThunk.fulfilled.type;
    const appState = shouldClearState ? undefined : state;

    // Clear sessionStorage when logging out.
    if (shouldClearState && typeof window !== 'undefined' && !!window.sessionStorage) {
      window.sessionStorage.clear();
    }

    return appReducer(appState, action);
  };
};

export default createReducer;
