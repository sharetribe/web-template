import * as log from './log';
import { ensureTransaction } from './data';
import * as productProcess from './transactionProcessProduct';
import * as bookingProcess from './transactionProcessBooking';

/**
 * A process should export:
 * - graph
 * - states
 * - transitions
 * - isRelevantPastTransition(transition)
 * - isPrivileged(transition)
 * - isCustomerReview(transition)
 * - isProviderReview(transition)
 * - statesNeedingCustomerAttention
 */
const PROCESSES = [
  {
    name: 'flex-product-default-process',
    process: productProcess,
  },
  {
    name: 'flex-hourly-default-process',
    process: bookingProcess,
  },
  {
    // TODO: ideally, this should be 'flex-daily-default-process'
    name: 'flex-default-process',
    process: bookingProcess,
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
 *   // import { getProcess } from '../../util/transaction';
 *   const process = getProcess(processName);
 *   const state = process.getState(tx);
 *   const isEnquiry = state === process.states.ENQUIRY
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
 * Get process based on process name
 * @param {String} processName
 */
export const getProcess = processName => {
  const processInfo = PROCESSES.find(process => process.name === processName);
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
 * Get all the transitions for every supported process
 */
export const getAllTransitionsForEveryProcess = () => {
  return PROCESSES.reduce((accTransitions, processInfo) => {
    return [...accTransitions, ...Object.values(processInfo.process.transitions)];
  }, []);
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
 * @param {Object} transaction Transaction entity from Flex API
 */
export const getUserTxRole = (currentUserId, transaction) => {
  const tx = ensureTransaction(transaction);
  const customer = tx.customer;
  if (currentUserId && currentUserId.uuid && tx.id && customer.id) {
    // user can be either customer or provider
    return currentUserId.uuid === customer.id.uuid
      ? TX_TRANSITION_ACTOR_CUSTOMER
      : TX_TRANSITION_ACTOR_PROVIDER;
  } else {
    throw new Error(`Parameters for "userIsCustomer" function were wrong.
      currentUserId: ${currentUserId}, transaction: ${transaction}`);
  }
};
