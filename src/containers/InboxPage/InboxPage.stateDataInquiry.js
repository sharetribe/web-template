import { CONDITIONAL_RESOLVER_WILDCARD, ConditionalResolver } from '../../transactions/transaction';

// Get UI data mapped to specific transaction state & role
export const getStateDataForInquiryProcess = (txInfo, processInfo) => {
  const { transactionRole } = txInfo;
  const { processName, processState, states } = processInfo;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.FREE_INQUIRY, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .default(() => {
      // Default values for other states
      return { processName, processState };
    })
    .resolve();
};
