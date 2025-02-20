import {
  states,
  transitions,
} from '../../sellPurchase/transactions/transactionProcessSellPurchase';
import {
  SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_MEET_MANAGER,
  SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PENDING_PAYMENT,
  SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PLACE_MACHINE,
  SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_REVIEW,
} from '../constants';

// These states map 1:1 to the steps
// Notice: There are other states need to handle more complex
const customerStateToStep = {
  [states.INITIAL]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PENDING_PAYMENT,
  [states.INQUIRY]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PENDING_PAYMENT,
  [states.PENDING_PAYMENT]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PENDING_PAYMENT,
  [states.PURCHASE_CONFIRMED_BY_BUYER]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PENDING_PAYMENT,
  [states.PAYMENT_EXPIRED]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PENDING_PAYMENT,
  [states.PURCHASE_EXPIRED]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PENDING_PAYMENT,
  [states.COMPLETED]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_REVIEW,
  [states.REVIEWED_BY_PROVIDER]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_REVIEW,
  [states.REVIEWED]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_REVIEW,
  [states.REVIEWED_BY_CUSTOMER]: SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_REVIEW,
};

const getCustomerProgressStep = ({ processState, transaction }) => {
  if (customerStateToStep[processState]) {
    return customerStateToStep[processState];
  }
  const { metadata: { buyerMarkMetManager } = {}, lastTransition } = transaction.attributes;

  switch (processState) {
    case states.REFUND_BEFORE_CAPTURE:
      return [
        transitions.BUYER_REFUND_BEFORE_SELLER_CONFIRMED,
        transitions.SELLER_REFUND_BEFORE_SELLER_CONFIRMED,
      ].includes(lastTransition)
        ? SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PENDING_PAYMENT
        : SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_MEET_MANAGER;

    case states.PURCHASED:
    case states.STRIPE_INTENT_CAPTURED:
    case states.REFUND_DISABLED:
    case states.SELLER_HANDLE_DISPUTED:
    case states.OPERATOR_HANDLE_DISPUTED:
    case states.CANCELED:
      return buyerMarkMetManager
        ? SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_PLACE_MACHINE
        : SELL_PURCHASE_PROGRESS_BAR_STEP_CUSTOMER_MEET_MANAGER;
    default:
      return null;
  }
};

export const getSellPurchaseProgressStep = ({ isCustomer, ...rest }) => {
  return isCustomer ? getCustomerProgressStep(rest) : null;
};
