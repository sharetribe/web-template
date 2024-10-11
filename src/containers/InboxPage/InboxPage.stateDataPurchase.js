import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../transactions/transaction';

// Get UI data mapped to specific transaction state & role
export const getStateDataForPurchaseProcess = (txInfo, processInfo) => {
  const { transactionRole } = txInfo;
  const { processName, processState, states } = processInfo;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, _], () => ({ processName, processState, actionNeeded: true }))
    .cond([states.PENDING_PAYMENT, CUSTOMER], () => ({
      processName,
      processState,
      actionNeeded: true,
    }))
    .cond([states.PENDING_PAYMENT, PROVIDER], () => ({
      processName,
      processState,
      actionNeeded: true,
    }))
    .cond([states.CANCELED, _], () => ({ processName, processState, isFinal: true }))
    .cond([states.PURCHASED, PROVIDER], () => ({
      processName,
      processState,
      actionNeeded: true,
      isSaleNotification: true,
    }))
    .cond([states.DELIVERED, CUSTOMER], () => ({ processName, processState, actionNeeded: true }))
    .cond([states.DISPUTED, _], () => ({ processName, processState, actionNeeded: true }))
    .cond([states.COMPLETED, _], () => ({ processName, processState, actionNeeded: true }))
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => ({
      processName,
      processState,
      actionNeeded: true,
    }))
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => ({
      processName,
      processState,
      actionNeeded: true,
    }))
    .cond([states.REVIEWED, _], () => ({ processName, processState, isFinal: true }))
    .default(() =>
      // Default values for other states
      ({ processName, processState }),
    )
    .resolve();
};
