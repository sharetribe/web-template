import { bool, func, oneOf, shape, string } from 'prop-types';
import {
  BOOKING_PROCESS_NAME,
  INQUIRY_PROCESS_NAME,
  PURCHASE_PROCESS_NAME,
  NEGOTIATION_PROCESS_NAME,
  resolveLatestProcessName,
} from '../../transactions/transaction';
import { getStateDataForBookingProcess } from './TransactionPage.stateDataBooking.js';
import { getStateDataForInquiryProcess } from './TransactionPage.stateDataInquiry.js';
import { getStateDataForPurchaseProcess } from './TransactionPage.stateDataPurchase.js';
import { getStateDataForNegotiationProcess } from './TransactionPage.stateDataNegotiation.js';

const errorShape = shape({
  type: oneOf(['error']).isRequired,
  name: string.isRequired,
  message: string,
});

const actionButtonsShape = shape({
  inProgress: bool,
  error: errorShape,
  onAction: func.isRequired,
  buttonText: string,
  errorText: string,
});

export const stateDataShape = shape({
  processName: string.isRequired,
  processState: string.isRequired,
  primaryButtonProps: actionButtonsShape,
  secondaryButtonProps: actionButtonsShape,
  tertiaryButtonProps: actionButtonsShape,
  showActionButtons: bool,
  showDetailCardHeadings: bool,
  showDispute: bool,
  showOrderPanel: bool,
  showReviewAsFirstLink: bool,
  showReviewAsSecondLink: bool,
  showReviews: bool,
});

// Transitions are following process.edn format: "transition/my-transtion-name"
// This extracts the 'my-transtion-name' string if namespace exists
const getTransitionKey = transitionName => {
  const [nameSpace, transitionKey] = transitionName.split('/');
  return transitionKey || transitionName;
};

// Action button prop for the TransactionPanel
const getActionButtonPropsMaybe = (params, onlyForRole = 'both') => {
  const {
    processName,
    transitionName,
    inProgress,
    transitionError,
    onAction,
    transactionRole,
    actionButtonTranslationId,
    actionButtonTranslationErrorId,
    intl,
    ...extraParams
  } = params;
  const transitionKey = getTransitionKey(transitionName);

  const actionButtonTrId =
    actionButtonTranslationId ||
    `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.actionButton`;

  const isPastNegotiationOffersInvalidError =
    transitionError?.statusText === 'Past negotiation offers are invalid';
  const actionButtonTrErrorId = isPastNegotiationOffersInvalidError
    ? `TransactionPage.${processName}.actionError.pastNegotiationOffersInvalid`
    : actionButtonTranslationErrorId ||
      `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.actionError`;

  return onlyForRole === 'both' || onlyForRole === transactionRole
    ? {
        inProgress,
        error: transitionError,
        onAction,
        buttonText: intl.formatMessage({ id: actionButtonTrId }),
        errorText: intl.formatMessage({ id: actionButtonTrErrorId }),
        ...extraParams,
      }
    : {};
};

export const getStateData = (params, process) => {
  const {
    transaction,
    transactionRole,
    intl,
    transitionInProgress,
    transitionError,
    onTransition,
    sendReviewInProgress,
    sendReviewError,
    onOpenReviewModal,
    //onOpenRequestChangesModal,
    //onOpenMakeCounterOfferModal,
    //onCheckoutRedirect,
    //onMakeOfferFromRequest,
  } = params;
  const isCustomer = transactionRole === 'customer';
  const processName = resolveLatestProcessName(transaction?.attributes?.processName);

  const getActionButtonProps = (transitionName, forRole, extra = {}) => {
    const { orderData, ...rest } = extra;
    const params = orderData ? { orderData } : {};
    return getActionButtonPropsMaybe(
      {
        processName,
        transitionName,
        transactionRole,
        intl,
        inProgress: transitionInProgress === transitionName,
        transitionError,
        onAction: () => onTransition(transaction?.id, transitionName, params),
        ...rest,
      },
      forRole
    );
  };

  const getLeaveReviewProps = getActionButtonPropsMaybe({
    processName,
    transitionName: 'leaveReview',
    transactionRole,
    intl,
    inProgress: sendReviewInProgress,
    transitionError: sendReviewError,
    onAction: onOpenReviewModal,
    actionButtonTranslationId: 'TransactionPage.leaveReview.actionButton',
    actionButtonTranslationErrorId: 'TransactionPage.leaveReview.actionError',
  });

  const processInfo = () => {
    const { getState, states, transitions } = process;
    const processState = getState(transaction);
    return {
      processName,
      processState,
      states,
      transitions,
      isCustomer,
      actionButtonProps: getActionButtonProps,
      leaveReviewProps: getLeaveReviewProps,
    };
  };

  if (processName === PURCHASE_PROCESS_NAME) {
    return getStateDataForPurchaseProcess(params, processInfo());
  } else if (processName === BOOKING_PROCESS_NAME) {
    return getStateDataForBookingProcess(params, processInfo());
  } else if (processName === INQUIRY_PROCESS_NAME) {
    return getStateDataForInquiryProcess(params, processInfo());
  } else if (processName === NEGOTIATION_PROCESS_NAME) {
    return getStateDataForNegotiationProcess(params, processInfo());
  } else {
    return {};
  }
};
