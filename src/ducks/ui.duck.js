import { USD } from '../extensions/common/config/constants/currency.constants';

// ================ Action types ================ //
export const DISABLE_SCROLLING = 'app/ui/DISABLE_SCROLLING';

export const SET_UI_CURRENCY = 'app/ui/SET_UI_CURRENCY';

// ================ Reducer ================ //

const initialState = {
  disableScrollRequests: [],
  uiCurrency: USD, // default currency
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case DISABLE_SCROLLING: {
      const { componentId, disableScrolling } = payload;
      const disableScrollRequests = state.disableScrollRequests;
      const componentIdExists = disableScrollRequests.find(c => c.componentId === componentId);

      if (componentIdExists) {
        const disableScrollRequestArray = disableScrollRequests.map(c => {
          return c.componentId === componentId ? { ...c, disableScrolling } : c;
        });
        return { ...state, disableScrollRequests: [...disableScrollRequestArray] };
      }

      const disableScrollRequestArray = [
        ...disableScrollRequests,
        { componentId, disableScrolling },
      ];
      return {
        ...state,
        disableScrollRequests: disableScrollRequestArray,
      };
    }
    case SET_UI_CURRENCY:
      return {
        ...state,
        uiCurrency: payload,
      };
    default:
      return state;
  }
}

// ================ Action creators ================ //

export const manageDisableScrolling = (componentId, disableScrolling) => ({
  type: DISABLE_SCROLLING,
  payload: { componentId, disableScrolling },
});

export const setUiCurrency = uiCurrency => ({
  type: SET_UI_CURRENCY,
  payload: uiCurrency,
});
// ================ Selectors ================ //

export const isScrollingDisabled = state => {
  const { disableScrollRequests } = state.ui;
  return disableScrollRequests.some(r => r.disableScrolling);
};
