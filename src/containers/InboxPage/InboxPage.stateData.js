import { bool, shape, string } from 'prop-types';
import { getProcess } from '../../util/transaction';

import { getStateDataForBookingProcess } from './InboxPage.stateDataBooking.js';
import { getStateDataForProductProcess } from './InboxPage.stateDataProduct.js';

const FLEX_PRODUCT_DEFAULT_PROCESS = 'flex-product-default-process';
const FLEX_DAILY_DEFAULT_PROCESS = 'flex-default-process';

export const stateDataShape = shape({
  processName: string.isRequired,
  processState: string.isRequired,
  actionNeeded: bool,
  emphasizeTransitionMoment: bool,
  isFinal: bool,
  isSaleNotification: bool,
});

// Translated name of the state of the given transaction
export const getStateData = params => {
  const { transaction } = params;
  const processName = transaction?.attributes?.processName;
  const process = getProcess(processName);

  const processInfo = () => {
    const { getState, states } = process;
    const processState = getState(transaction);
    return {
      processName,
      processState,
      states,
    };
  };

  if (processName === FLEX_PRODUCT_DEFAULT_PROCESS) {
    return getStateDataForProductProcess(params, processInfo());
  } else if (processName === FLEX_DAILY_DEFAULT_PROCESS) {
    return getStateDataForBookingProcess(params, processInfo());
  } else {
    return {};
  }
};
