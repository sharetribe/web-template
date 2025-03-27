const purchaseProcess = require('./transactionProcessPurchase');

// Supported unit types
const ITEM = 'item';

// Then names of supported processes
const PURCHASE_PROCESS_NAME = 'default-purchase';
const BOOKING_PROCESS_NAME = 'default-booking';
const INQUIRY_PROCESS_NAME = 'default-inquiry';

/**
 * A process should export:
 * - graph
 * - states
 * - transitions
 * - isRelevantPastTransition(transition)
 * - isPrivileged(transition)
 * - isCompleted(transition)
 * - isRefunded(transition)
 * - isCustomerReview(transition)
 * - isProviderReview(transition)
 * - statesNeedingCustomerAttention
 */
const PROCESSES = [
  {
    name: PURCHASE_PROCESS_NAME,
    alias: `${PURCHASE_PROCESS_NAME}/release-1`,
    process: purchaseProcess,
    unitTypes: [ITEM],
  },
];

/**
 * Helper functions to figure out if transaction is in a specific state.
 * State is based on lastTransition given by transaction object and state description.
 *
 * @param {Object} tx transaction entity
 */
const txLastTransition = tx => tx?.attributes?.lastTransition;

/**
 * Get states from the graph.
 *
 * Note: currently we assume that state description is in stateX format
 *       and it doesn't contain nested states.
 *
 * @param {Object} graph Description of transaction process graph in StateX format
 */
const statesObjectFromGraph = graph => graph.states || {};

/**
 * This is a helper function that's attached to exported 'getProcess'.
 * Get next process state after given transition.
 *
 * @param {Object} process imported from a separate file
 * @returns {function} Returns a function to check the next state after given transition.
 */
const getStateAfterTransition = process => transition => {
  const statesObj = statesObjectFromGraph(process.graph);
  const stateNames = Object.keys(statesObj);
  const fromState = stateNames.find(stateName => {
    const transitionsForward = Object.keys(statesObj[stateName]?.on || {});
    return transitionsForward.includes(transition);
  });
  return fromState && transition && statesObj[fromState]?.on[transition]
    ? statesObj[fromState]?.on[transition]
    : null;
};

/**
 * This is a helper function that's attached to exported 'getProcess' as 'getState'
 * Get state based on lastTransition of given transaction entity.
 *
 * How to use this function:
 *   // import { getProcess } from '../../transactions/transaction';
 *   const process = getProcess(processName);
 *   const state = process.getState(tx);
 *   const isInquiry = state === process.states.INQUIRY
 *
 * @param {Object} process imported from a separate file
 * @returns {function} Returns a function to check the current state of transaction entity against
 * given process.
 */
const getProcessState = process => tx => {
  return getStateAfterTransition(process)(txLastTransition(tx));
};

/**
 * If process has been renamed, but the graph itself is the same,
 * this function allows referencing the updated name of the process.
 * ProcessName is used in some translation keys and stateData functions.
 *
 * Note: If the process graph has changed, you must create a separate process graph for it.
 *
 * @param {String} processName
 */
const resolveLatestProcessName = processName => {
  switch (processName) {
    case 'flex-product-default-process':
    case 'default-buying-products':
    case PURCHASE_PROCESS_NAME:
      return PURCHASE_PROCESS_NAME;
    case 'flex-default-process':
    case 'flex-hourly-default-process':
    case 'flex-booking-default-process':
    case BOOKING_PROCESS_NAME:
      return BOOKING_PROCESS_NAME;
    case INQUIRY_PROCESS_NAME:
      return INQUIRY_PROCESS_NAME;
    default:
      return processName;
  }
};

/**
 * Get process based on process name
 * @param {String} processName
 */
const getProcess = processName => {
  const latestProcessName = resolveLatestProcessName(processName);
  const processInfo = PROCESSES.find(process => process.name === latestProcessName);
  if (processInfo) {
    return {
      ...processInfo.process,
      getState: getProcessState(processInfo.process),
    };
  } else {
    const error = new Error(`Unknown transaction process name: ${processName}`);
    throw error;
  }
};

module.exports = {
  resolveLatestProcessName,
  getProcess,
};
