import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../transactions/transaction';

/**
 * Get state data against product process for TransactionPage's UI.
 * I.e. info about showing action buttons, current state etc.
 *
 * @param {*} txInfo detials about transaction
 * @param {*} processInfo  details about process
 */
export const getStateDataForPurchaseProcess = (txInfo, processInfo) => {
  const { transactionRole } = txInfo;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  const { processName, processState, states, leaveReviewProps } = processInfo;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.PURCHASED, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
      };
    })
    .cond([states.COMPLETED, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })

    .cond([states.PURCHASED, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
      };
    })
    .cond([states.COMPLETED, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
      };
    })

    .cond([states.REVIEWED, _], () => {
      return { processName, processState, showDetailCardHeadings: true, showReviews: true };
    })
    .default(() => {
      // Default values for other states
      return { processName, processState, showDetailCardHeadings: true };
    })
    .resolve();
};
