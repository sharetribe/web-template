import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  ConditionalResolver,
  CONDITIONAL_RESOLVER_WILDCARD,
} from '../../../../transactions/transaction';
import { states } from '../transactions/transactionProcessSellPurchase';

// Get UI data mapped to specific transaction state & role
export const getStateDataForSellPurchaseProcess = (txInfo, processInfo) => {
  const { transactionRole } = txInfo;
  const { processName, processState } = processInfo;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.PENDING_PAYMENT, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.PURCHASE_CONFIRMED_BY_BUYER, PROVIDER], () => {
      return { processName, processState, actionNeeded: true, isSaleNotification: true };
    })
    .cond([states.PAYMENT_EXPIRED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.REFUND_BEFORE_CAPTURE, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.PURCHASED, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.PURCHASE_EXPIRED, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.COMPLETED, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.STRIPE_INTENT_CAPTURED, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.REFUND_DISABLED, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.SELLER_HANDLE_DISPUTED, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.OPERATOR_HANDLE_DISPUTED, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.CANCELED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return { processName, processState, actionNeeded: true };
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
