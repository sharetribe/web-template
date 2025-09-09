import { createSlice } from '@reduxjs/toolkit';

// ================ Slice ================ //

const initialState = {
  disableScrollRequests: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    disableScrolling: (state, action) => {
      const { componentId, disableScrolling } = action.payload;
      const disableScrollRequests = state.disableScrollRequests;
      const componentIdExists = disableScrollRequests.find(c => c.componentId === componentId);

      if (componentIdExists) {
        const disableScrollRequestArray = disableScrollRequests.map(c => {
          return c.componentId === componentId ? { ...c, disableScrolling } : c;
        });
        state.disableScrollRequests = [...disableScrollRequestArray];
      } else {
        state.disableScrollRequests = [...disableScrollRequests, { componentId, disableScrolling }];
      }
    },
  },
});

// ================ Exports ================ //

export const { disableScrolling } = uiSlice.actions;
export default uiSlice.reducer;

// ================ Helper function ================ //

export const manageDisableScrolling = (componentId, shouldDisableScrolling) =>
  disableScrolling({ componentId, disableScrolling: shouldDisableScrolling });

// ================ Selectors ================ //

export const isScrollingDisabled = state => {
  const { disableScrollRequests } = state.ui;
  return disableScrollRequests.some(r => r.disableScrolling);
};
