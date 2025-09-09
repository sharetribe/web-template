import { createSlice } from '@reduxjs/toolkit';

// ================ Redux Toolkit Slice ================ //

const initialState = {
  currentLocation: null,
  currentCanonicalPath: null,
};

const routingSlice = createSlice({
  name: 'routing',
  initialState,
  reducers: {
    locationChanged: (state, action) => {
      const { location, canonicalPath } = action.payload;
      state.currentLocation = location;
      state.currentCanonicalPath = canonicalPath;
    },
  },
});

// ================ Exports ================ //

export const { locationChanged } = routingSlice.actions;
export default routingSlice.reducer;
