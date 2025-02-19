import { bool, shape, string } from 'prop-types';
import {
  BOOKING_PROCESS_NAME,
  INQUIRY_PROCESS_NAME,
  PURCHASE_PROCESS_NAME,
  resolveLatestProcessName,
  getProcess,
} from '../../transactions/transaction';
import { SELL_PURCHASE_PROCESS_NAME } from '../../extensions/transactionProcesses/sellPurchase/transactions/transactionProcessSellPurchase.js';

import { getStateDataForBookingProcess } from './InboxPage.stateDataBooking.js';
import { getStateDataForInquiryProcess } from './InboxPage.stateDataInquiry.js';
import { getStateDataForPurchaseProcess } from './InboxPage.stateDataPurchase.js';
import { getStateDataForSellPurchaseProcess } from '../../extensions/transactionProcesses/sellPurchase/stateData/InboxPage.stateDataSellPurchase.js';

export const stateDataShape = shape({
  processName: string.isRequired,
  processState: string.isRequired,
  actionNeeded: bool,
  isFinal: bool,
  isSaleNotification: bool,
});

// Translated name of the state of the given transaction
export const getStateData = params => {
  const { transaction } = params;
  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
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

  switch (processName) {
    case PURCHASE_PROCESS_NAME:
      return getStateDataForPurchaseProcess(params, processInfo());
    case BOOKING_PROCESS_NAME:
      return getStateDataForBookingProcess(params, processInfo());
    case INQUIRY_PROCESS_NAME:
      return getStateDataForInquiryProcess(params, processInfo());
    case SELL_PURCHASE_PROCESS_NAME:
      return getStateDataForSellPurchaseProcess(params, processInfo());
    default:
      return {};
  }
};
