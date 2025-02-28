import { bool, func, oneOf, shape, string } from 'prop-types';
import {
  BOOKING_PROCESS_NAME,
  INQUIRY_PROCESS_NAME,
  PURCHASE_PROCESS_NAME,
  resolveLatestProcessName,
} from '../../transactions/transaction';
import { SELL_PURCHASE_PROCESS_NAME } from '../../extensions/transactionProcesses/sellPurchase/transactions/transactionProcessSellPurchase.js';
import { getStateDataForBookingProcess } from './TransactionPage.stateDataBooking.js';
import { getStateDataForInquiryProcess } from './TransactionPage.stateDataInquiry.js';
import { getStateDataForPurchaseProcess } from './TransactionPage.stateDataPurchase.js';
import { getStateDataForSellPurchaseProcess } from '../../extensions/transactionProcesses/sellPurchase/stateData/TransactionPage.stateDataSellPurchase.js';

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
    buttonTextValues = {},
    ...rest
  } = params;
  const transitionKey = getTransitionKey(transitionName);

  const actionButtonTrId =
    actionButtonTranslationId ||
    `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.actionButton`;
  const actionButtonTrErrorId =
    actionButtonTranslationErrorId ||
    `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.actionError`;

  return onlyForRole === 'both' || onlyForRole === transactionRole
    ? {
        inProgress,
        error: transitionError,
        onAction,
        buttonText: intl.formatMessage({ id: actionButtonTrId }, buttonTextValues),
        errorText: intl.formatMessage({ id: actionButtonTrErrorId }),
        ...rest,
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
    transitionErrorName,
    onTransition,
    onUpdateProgressSellPurchase,
    onInitiateDisputeSellPurchase,
    sendReviewInProgress,
    sendReviewError,
    onOpenReviewModal,
    config,
  } = params;
  const isCustomer = transactionRole === 'customer';
  const processName = resolveLatestProcessName(transaction?.attributes?.processName);

  const getActionButtonProps = (
    transitionName,
    forRole,
    { onAction, requestOptions, ...extra } = {}
  ) =>
    getActionButtonPropsMaybe(
      {
        processName,
        transitionName,
        transactionRole,
        intl,
        inProgress: transitionInProgress === transitionName,
        transitionError: transitionErrorName === transitionName ? transitionError : null,
        onAction:
          onAction ||
          ((params = {}) =>
            onTransition(transaction?.id, transitionName, params, { ...requestOptions, config })),
        ...extra,
      },
      forRole
    );

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

  const getUpdateSellPurchaseProgressProps = (transitionName, forRole, extra = {}) =>
    getActionButtonProps(transitionName, forRole, {
      ...extra,
      onAction: () => onUpdateProgressSellPurchase(transaction?.id, transitionName),
    });
  const getIntiateDisputeSellPurchaseProps = (transitionName, forRole, extra = {}) =>
    getActionButtonProps(transitionName, forRole, {
      ...extra,
      onAction: ({ disputeReason } = {}) =>
        onInitiateDisputeSellPurchase(transaction?.id, transitionName, disputeReason),
    });

  const sellPurchaseActionButtonsPropsMaybe =
    processName === SELL_PURCHASE_PROCESS_NAME
      ? {
          updateSellPurchaseProgressProps: getUpdateSellPurchaseProgressProps,
          initiateDisputeSellPurchase: getIntiateDisputeSellPurchaseProps,
        }
      : {};

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
      ...sellPurchaseActionButtonsPropsMaybe,
    };
  };

  switch (processName) {
    case PURCHASE_PROCESS_NAME:
      return getStateDataForPurchaseProcess(params, processInfo());
    case BOOKING_PROCESS_NAME:
      return getStateDataForBookingProcess(params, processInfo());
    case INQUIRY_PROCESS_NAME:
      return getStateDataForInquiryProcess(params, processInfo());
    case SELL_PURCHASE_PROCESS_NAME:
      return getStateDataForSellPurchaseProcess(params, processInfo());
    default:
      return {};
  }
};
