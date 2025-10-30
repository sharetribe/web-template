import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import merge from 'lodash/merge';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { fetchCurrentUser, setCurrentUser } from '../../ducks/user.duck';

// ================ Async thunks ================ //

export const resetPasswordThunk = createAsyncThunk(
  'ContactDetailsPage/resetPassword',
  ({ email }, { extra: sdk, rejectWithValue }) => {
    return sdk.passwordReset.request({ email }).catch(e => {
      return rejectWithValue(storableError(e));
    });
  }
);
// Backward compatible wrapper for the resetPassword thunk
export const resetPassword = email => dispatch => {
  return dispatch(resetPasswordThunk({ email })).unwrap();
};

export const savePhoneNumberThunk = createAsyncThunk(
  'ContactDetailsPage/savePhoneNumber',
  ({ phoneNumber }, { dispatch, extra: sdk, rejectWithValue }) => {
    return sdk.currentUser
      .updateProfile(
        { protectedData: { phoneNumber } },
        {
          expand: true,
          include: ['profileImage'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
        }
      )
      .then(response => {
        const entities = denormalisedResponseEntities(response);
        if (entities.length !== 1) {
          throw new Error('Expected a resource in the sdk.currentUser.updateProfile response');
        }
        dispatch(setCurrentUser(entities[0]));
        return entities[0];
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);
// Backward compatible wrapper for the requestSavePhoneNumber thunk
export const savePhoneNumber = params => dispatch => {
  return dispatch(requestSavePhoneNumberThunk({ phoneNumber: params.phoneNumber })).unwrap();
};

export const saveEmailThunk = createAsyncThunk(
  'ContactDetailsPage/requestSaveEmail',
  ({ email, currentPassword }, { dispatch, extra: sdk, rejectWithValue }) => {
    return sdk.currentUser
      .changeEmail(
        { email, currentPassword },
        {
          expand: true,
          include: ['profileImage'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
        }
      )
      .then(response => {
        const entities = denormalisedResponseEntities(response);
        if (entities.length !== 1) {
          throw new Error('Expected a resource in the sdk.currentUser.changeEmail response');
        }
        dispatch(setCurrentUser(entities[0]));
        return entities[0];
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);
// Backward compatible wrapper for the requestSaveEmail thunk
export const saveEmail = params => dispatch => {
  return dispatch(
    saveEmailThunk({ email: params.email, currentPassword: params.currentPassword })
  ).unwrap();
};

export const saveEmailAndPhoneNumberThunk = createAsyncThunk(
  'ContactDetailsPage/saveEmailAndPhoneNumber',
  ({ email, phoneNumber, currentPassword }, { dispatch, rejectWithValue }) => {
    const promises = [
      dispatch(saveEmailThunk({ email, currentPassword })).unwrap(),
      dispatch(savePhoneNumberThunk({ phoneNumber })).unwrap(),
    ];

    return Promise.all(promises)
      .then(values => {
        const saveEmailUser = values[0].payload;
        const savePhoneNumberUser = values[1].payload;

        const protectedData = savePhoneNumberUser.attributes.profile.protectedData;
        const phoneNumberMergeSource = { attributes: { profile: { protectedData } } };

        const currentUser = merge(saveEmailUser, phoneNumberMergeSource);
        dispatch(setCurrentUser(currentUser));
        return currentUser;
      })
      .catch(e => {
        return rejectWithValue(e);
      });
  }
);
// Backward compatible wrapper for the saveEmailAndPhoneNumber thunk
export const saveEmailAndPhoneNumber = params => dispatch => {
  return dispatch(
    saveEmailAndPhoneNumberThunk({
      email: params.email,
      currentPassword: params.currentPassword,
      phoneNumber: params.phoneNumber,
    })
  ).unwrap();
};

export const saveContactDetailsThunk = createAsyncThunk(
  'ContactDetailsPage/saveContactDetails',
  (
    { email, currentEmail, phoneNumber, currentPhoneNumber, currentPassword },
    { dispatch, rejectWithValue }
  ) => {
    const emailChanged = email !== currentEmail;
    const phoneNumberChanged = phoneNumber !== currentPhoneNumber;

    if (emailChanged && phoneNumberChanged) {
      return dispatch(saveEmailAndPhoneNumberThunk({ email, currentPassword, phoneNumber }))
        .unwrap()
        .catch(e => rejectWithValue(e));
    } else if (emailChanged) {
      return dispatch(saveEmailThunk({ email, currentPassword }))
        .unwrap()
        .catch(e => rejectWithValue(e));
    } else if (phoneNumberChanged) {
      return dispatch(savePhoneNumberThunk({ phoneNumber }))
        .unwrap()
        .catch(e => rejectWithValue(e));
    }
    return Promise.resolve();
  }
);
// Backward compatible wrapper for the saveContactDetails thunk
export const saveContactDetails = params => dispatch => {
  return dispatch(saveContactDetailsThunk(params)).unwrap();
};

// ================ Slice ================ //

const contactDetailsSlice = createSlice({
  name: 'ContactDetailsPage',
  initialState: {
    saveEmailError: null,
    savePhoneNumberError: null,
    saveContactDetailsInProgress: false,
    contactDetailsChanged: false,
    resetPasswordInProgress: false,
    resetPasswordError: null,
  },
  reducers: {
    saveContactDetailsClear: state => {
      state.saveContactDetailsInProgress = false;
      state.saveEmailError = null;
      state.savePhoneNumberError = null;
      state.contactDetailsChanged = false;
    },
  },
  extraReducers: builder => {
    builder
      // Reset password
      .addCase(resetPasswordThunk.pending, state => {
        state.resetPasswordInProgress = true;
        state.resetPasswordError = null;
      })
      .addCase(resetPasswordThunk.fulfilled, state => {
        state.resetPasswordInProgress = false;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        console.error(action.payload); // eslint-disable-line no-console
        state.resetPasswordInProgress = false;
        state.resetPasswordError = action.payload;
      })
      // Request save phone number
      .addCase(savePhoneNumberThunk.rejected, (state, action) => {
        state.saveContactDetailsInProgress = false;
        state.savePhoneNumberError = action.payload;
      })
      // Request save email
      .addCase(saveEmailThunk.rejected, (state, action) => {
        state.saveContactDetailsInProgress = false;
        state.saveEmailError = action.payload;
      })
      // Save contact details
      .addCase(saveContactDetailsThunk.pending, state => {
        state.saveContactDetailsInProgress = true;
        state.saveEmailError = null;
        state.savePhoneNumberError = null;
        state.contactDetailsChanged = false;
      })
      .addCase(saveContactDetailsThunk.fulfilled, state => {
        state.saveContactDetailsInProgress = false;
        state.contactDetailsChanged = true;
      })
      .addCase(saveContactDetailsThunk.rejected, (state, action) => {
        state.saveContactDetailsInProgress = false;
        // Error details are handled by individual thunks
      });
  },
});

export const { saveContactDetailsClear } = contactDetailsSlice.actions;
export default contactDetailsSlice.reducer;

// ================ Load data ================ //

export const loadData = () => {
  // Since verify email happens in separate tab, current user's data might be updated
  return fetchCurrentUser();
};
