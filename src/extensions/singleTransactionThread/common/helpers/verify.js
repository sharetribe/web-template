import {
  getProcess,
  isInquiryProcess,
  resolveLatestProcessName,
} from '../../../../transactions/transaction';
import { STOCK_ONE_ITEM } from '../../../../util/types';
import { getListingProcessName } from '../../../common/helpers/getProcessName';

/**
 * Function to check whether we should reuse the transaction to avoid multiple threads
 *
 * Check if the tx is not finsished yet by getting available transitions
 *
 * @param {Object?} tx Transation info from sdk response
 * @param {Object?} listing Current listing
 */
export const getInProgressTxId = ({ tx, listing }) => {
  if (!tx) {
    return null;
  }

  const { lastTransition, processName: txProcessName } = tx.attributes;
  const processName = resolveLatestProcessName(txProcessName);
  const listingProcessName = getListingProcessName(listing);
  if (!processName || processName !== listingProcessName) {
    return null;
  }
  const process = getProcess(processName);

  const { getStateAfterTransition, graph } = process;
  const currentState = getStateAfterTransition(lastTransition);

  // graph.states[currentState] could be empty
  const availableTransitions = Object.keys(graph.states[currentState].on || {});
  return availableTransitions.length > 0 || isInquiryProcess(processName) ? tx.id : null;
};

export const isSingleItemStockType = ({ listing, listingConfig = {} }) =>
  listingConfig.listingTypes?.some(
    ({ listingType, stockType }) =>
      listingType === listing.attributes?.publicData.listingType && stockType === STOCK_ONE_ITEM
  );
