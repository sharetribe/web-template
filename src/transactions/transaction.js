import * as log from '../util/log';
import * as purchaseProcess from './transactionProcessPurchase';
import * as bookingProcess from './transactionProcessBooking';
import * as inquiryProcess from './transactionProcessInquiry';

// Supported unit types
// Note: These are passed to translations/microcopy in certain cases.
//       Therefore, they can't contain wordbreaks like '-' or space ' '
export const ITEM = 'item';
export const DAY = 'day';
export const NIGHT = 'night';
export const HOUR = 'hour';
export const INQUIRY = 'inquiry';

// Then names of supported processes
export const PURCHASE_PROCESS_NAME = 'default-purchase';
export const BOOKING_PROCESS_NAME = 'default-booking';
export const INQUIRY_PROCESS_NAME = 'default-inquiry';

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
  {
    name: BOOKING_PROCESS_NAME,
    alias: `${BOOKING_PROCESS_NAME}/release-1`,
    process: bookingProcess,
    unitTypes: [DAY, NIGHT, HOUR],
  },
  {
    name: INQUIRY_PROCESS_NAME,
    alias: `${INQUIRY_PROCESS_NAME}/release-1`,
    process: inquiryProcess,
    unitTypes: [INQUIRY],
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
 * Pick transition names that lead to target state from given entries.
 *
 * First parameter, "transitionEntries", should look like this:
 * [
 *   [transitionForward1, stateY],
 *   [transitionForward2, stateY],
 *   [transitionForward3, stateZ],
 * ]
 *
 * @param {Array} transitionEntries
 * @param {String} targetState
 * @param {Array} initialTransitions
 */
const pickTransitionsToTargetState = (transitionEntries, targetState, initialTransitions) => {
  return transitionEntries.reduce((pickedTransitions, transitionEntry) => {
    const [transition, nextState] = transitionEntry;
    return nextState === targetState ? [...pickedTransitions, transition] : pickedTransitions;
  }, initialTransitions);
};

/**
 * Get all the transitions that lead to specified state.
 *
 * Process uses following syntax to describe the graph:
 * states: {
 *   stateX: {
 *     on: {
 *       transitionForward1: stateY,
 *       transitionForward2: stateY,
 *       transitionForward3: stateZ,
 *     },
 *   },
 *   stateY: {},
 *   stateZ: {
 *     on: {
 *       transitionForward4: stateY,
 *     },
 *   },
 * },
 *
 * Finding all the transitions to 'stateY' should pick transitions: 1, 2, 4
 *
 * @param {Object} process
 * @param {String} targetState
 */
const getTransitionsToState = (process, targetState) => {
  const states = Object.values(statesObjectFromGraph(process.graph));

  return states.reduce((collectedTransitions, inspectedState) => {
    const transitionEntriesForward = Object.entries(inspectedState.on || {});
    return pickTransitionsToTargetState(
      transitionEntriesForward,
      targetState,
      collectedTransitions
    );
  }, []);
};

/**
 * Transitions that lead to given states.
 *
 * @param {Object} process against which transitions and states are checked.
 * @returns {function} Returns a function to get the transitions that lead to given states.
 */
const getTransitionsToStates = process => stateNames => {
  return stateNames.reduce((pickedTransitions, stateName) => {
    return [...pickedTransitions, ...getTransitionsToState(process, stateName)];
  }, []);
};

/**
 * Helper functions to figure out if transaction has passed a given state.
 * This is based on transitions history given by transaction object.
 *
 * @param {Object} process against which passed states are checked.
 */
const hasPassedState = process => (stateName, tx) => {
  const txTransitions = tx => tx?.attributes?.transitions || [];
  const hasPassedTransition = (transitionName, tx) =>
    !!txTransitions(tx).find(t => t.transition === transitionName);

  return (
    getTransitionsToState(process, stateName).filter(t => hasPassedTransition(t, tx)).length > 0
  );
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
export const resolveLatestProcessName = processName => {
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
export const getProcess = processName => {
  const latestProcessName = resolveLatestProcessName(processName);
  const processInfo = PROCESSES.find(process => process.name === latestProcessName);
  if (processInfo) {
    return {
      ...processInfo.process,
      getState: getProcessState(processInfo.process),
      getStateAfterTransition: getStateAfterTransition(processInfo.process),
      getTransitionsToStates: getTransitionsToStates(processInfo.process),
      hasPassedState: hasPassedState(processInfo.process),
    };
  } else {
    const error = new Error(`Unknown transaction process name: ${processName}`);
    log.error(error, 'unknown-transaction-process', { processName });
    throw error;
  }
};

/**
 * Get the info about supported processes: name, alias, unitTypes
 */
export const getSupportedProcessesInfo = () =>
  PROCESSES.map(p => {
    const { process, ...rest } = p;
    return rest;
  });

/**
 * Get all the transitions for every supported process
 */
export const getAllTransitionsForEveryProcess = () => {
  return PROCESSES.reduce((accTransitions, processInfo) => {
    return [...accTransitions, ...Object.values(processInfo.process.transitions)];
  }, []);
};

/**
 * Check if the process is purchase process
 *
 * @param {String} processName
 */
export const isPurchaseProcess = processName => {
  const latestProcessName = resolveLatestProcessName(processName);
  const processInfo = PROCESSES.find(process => process.name === latestProcessName);
  return [PURCHASE_PROCESS_NAME].includes(processInfo?.name);
};

/**
 * Check if the process/alias points to a booking process
 *
 * @param {String} processAlias
 */
export const isPurchaseProcessAlias = processAlias => {
  const processName = processAlias ? processAlias.split('/')[0] : null;
  return processAlias ? isPurchaseProcess(processName) : false;
};

/**
 * Check if the process is booking process
 *
 * @param {String} processName
 */
export const isBookingProcess = processName => {
  const latestProcessName = resolveLatestProcessName(processName);
  const processInfo = PROCESSES.find(process => process.name === latestProcessName);
  return [BOOKING_PROCESS_NAME].includes(processInfo?.name);
};

/**
 * Check if the process/alias points to a booking process
 *
 * @param {String} processAlias
 */
export const isBookingProcessAlias = processAlias => {
  const processName = processAlias ? processAlias.split('/')[0] : null;
  return processAlias ? isBookingProcess(processName) : false;
};

/**
 * Check from unit type if full days should be used.
 * E.g. unit type is day or night
 * This is mainly used for availability management.
 *
 * @param {String} unitType
 */
export const isFullDay = unitType => {
  return [DAY, NIGHT].includes(unitType);
};

/**
 * Get transitions that need provider's attention for every supported process
 */
export const getTransitionsNeedingProviderAttention = () => {
  return PROCESSES.reduce((accTransitions, processInfo) => {
    const statesNeedingProviderAttention = Object.values(
      processInfo.process.statesNeedingProviderAttention
    );
    const process = processInfo.process;
    const processTransitions = statesNeedingProviderAttention.reduce(
      (pickedTransitions, stateName) => {
        return [...pickedTransitions, ...getTransitionsToState(process, stateName)];
      },
      []
    );
    // Return only unique transitions names
    // TODO: this setup is subject to problems if one process has important transition named
    // similarly as unimportant transition in another process.
    return [...new Set([...accTransitions, ...processTransitions])];
  }, []);
};

/**
 * Actors
 *
 * There are 4 different actors that might initiate transitions:
 */

// Roles of actors that perform transaction transitions
export const TX_TRANSITION_ACTOR_CUSTOMER = 'customer';
export const TX_TRANSITION_ACTOR_PROVIDER = 'provider';
export const TX_TRANSITION_ACTOR_SYSTEM = 'system';
export const TX_TRANSITION_ACTOR_OPERATOR = 'operator';

export const TX_TRANSITION_ACTORS = [
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  TX_TRANSITION_ACTOR_SYSTEM,
  TX_TRANSITION_ACTOR_OPERATOR,
];

/**
 * Get the role of the current user on given transaction entity.
 *
 * @param {UUID} currentUserId UUID of the currentUser entity
 * @param {Object} transaction Transaction entity from Marketplace API
 */
export const getUserTxRole = (currentUserId, transaction) => {
  const customer = transaction?.customer;
  if (currentUserId && currentUserId.uuid && transaction?.id && customer.id) {
    // user can be either customer or provider
    return currentUserId.uuid === customer.id.uuid
      ? TX_TRANSITION_ACTOR_CUSTOMER
      : TX_TRANSITION_ACTOR_PROVIDER;
  } else {
    throw new Error(`Parameters for "userIsCustomer" function were wrong.
      currentUserId: ${currentUserId}, transaction: ${transaction}`);
  }
};

/**
 * Wildcard string for ConditionalResolver's conditions.
 */
export const CONDITIONAL_RESOLVER_WILDCARD = '*';

/**
 * This class helps to resolve correct UI data for each combination of conditional data [state & role]
 *
 * Usage:
 *  const stateData = new ConditionalResolver([currentState, currentRole])
 *    .cond(['inquiry', 'customer'], () => {
 *      return { showInfoX: true, isSomethingOn: true };
 *    })
 *    .cond(['purchase', _], () => {
 *      return { showInfoX: false, isSomethingOn: true };
 *    })
 *    .default(() => {
 *      return { showDetailCardHeadings: true };
 *    })
 *    .resolve();
 */
export class ConditionalResolver {
  constructor(data) {
    this.data = data;
    this.resolver = null;
    this.defaultResolver = null;
  }
  cond(conditions, resolver) {
    if (conditions?.length === this.data.length && this.resolver == null) {
      const isDefined = item => typeof item !== 'undefined';
      const isWildcard = item => item === CONDITIONAL_RESOLVER_WILDCARD;
      const isMatch = conditions.reduce(
        (isPartialMatch, item, i) =>
          isPartialMatch && isDefined(item) && (isWildcard(item) || item === this.data[i]),
        true
      );
      this.resolver = isMatch ? resolver : null;
    }
    return this;
  }
  default(defaultResolver) {
    this.defaultResolver = defaultResolver;
    return this;
  }
  resolve() {
    // This resolves the output against current conditions.
    // Therefore, call for resolve() must be the last call in method chain.
    return this.resolver ? this.resolver() : this.defaultResolver ? this.defaultResolver() : null;
  }
}
