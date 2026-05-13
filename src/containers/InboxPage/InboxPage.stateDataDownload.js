import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../transactions/transaction';

// Get UI data mapped to specific transaction state & role
export const getStateDataForDownloadProcess = (txInfo, processInfo) => {
  const { transactionRole } = txInfo;
  const { processName, processState, states } = processInfo;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.PENDING_PAYMENT, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.PENDING_PAYMENT, PROVIDER], () => {
      return { processName, processState };
    })
    .cond([states.PAYMENT_EXPIRED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.PURCHASED, PROVIDER], () => {
      return { processName, processState };
    })
    .cond([states.REPORTED, _], () => {
      return { processName, processState };
    })
    .cond([states.CANCELED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.COMPLETED, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.REVIEWED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .default(() => {
      return { processName, processState };
    })
    .resolve();
};
