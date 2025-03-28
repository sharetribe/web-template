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
    .cond([states.PENDING_PAYMENT, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.PAYMENT_EXPIRED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.COMPLETED, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.COMPLETED, PROVIDER], () => {
      return { processName, processState, isSaleNotification: true };
    })
    .cond([states.REVIEWED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .default(() => {
      // Default values for other states
      return { processName, processState };
    })
    .resolve();
};
