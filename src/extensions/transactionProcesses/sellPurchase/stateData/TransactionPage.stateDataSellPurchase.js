import moment from 'moment';
import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../../../transactions/transaction';
import {
  autocompletePlaceSelected,
  autocompleteSearchRequired,
  emailFormatValid,
  required,
} from '../../../../util/validators';
import {
  FIELD_LOCATION,
  FIELD_TEXT,
  MARK_MACHINE_PLACE_TRANSITION_NAME,
  MARK_MET_MANAGER_TRANSITION_NAME,
} from '../../common/constants';
import {
  getDisputeReasonField,
  getRefundReasonField,
} from '../../common/helpers/getActionModalFormField';
import { getSellPurchaseProgressStep } from '../../common/helpers/getSellPurchaseProgressStep';
import { states, transitions } from '../transactions/transactionProcessSellPurchase';

const getCustomerUpdateProgressPrimaryButtonProps = ({
  buyerMarkMetManager,
  availableTransition,
  currentState,
  txInfo = {},
}) => {
  const transitionName = buyerMarkMetManager
    ? availableTransition
    : MARK_MET_MANAGER_TRANSITION_NAME;
  const modalStatementPrefix = buyerMarkMetManager ? '' : `.${MARK_MET_MANAGER_TRANSITION_NAME}`;

  return {
    isConfirmNeeded: true,
    showConfirmStatement: true,
    showReminderStatement: true,
    actionButtonTranslationId: `TransactionPage.sell-purchase.customer.${transitionName}.actionButton`,
    actionButtonTranslationErrorId: `TransactionPage.sell-purchase.customer.${transitionName}.actionError`,
    confirmStatementTranslationId: `TransactionPage.PrimaryConfirmActionModal.sell-purchase.${currentState}.customer${modalStatementPrefix}.confirmStatement`,
    reminderStatementTranslationId: `TransactionPage.PrimaryConfirmActionModal.sell-purchase.${currentState}.customer${modalStatementPrefix}.reminderStatement`,
    txInfo,
    toastTitleTranslationId: `TransactionPage.sell-purchase.customer.${transitionName}.toastTitle`,
    toastContentTranslationId: `TransactionPage.sell-purchase.customer.${transitionName}.toastContent`,
  };
};

const getProviderUpdateProgressPrimaryButtonProps = (txInfo = {}) => ({
  isConfirmNeeded: true,
  showConfirmStatement: true,
  showReminderStatement: true,
  actionButtonTranslationId: `TransactionPage.sell-purchase.provider.${MARK_MACHINE_PLACE_TRANSITION_NAME}.actionButton`,
  actionButtonTranslationErrorId: `TransactionPage.sell-purchase.provider.${MARK_MACHINE_PLACE_TRANSITION_NAME}.actionError`,
  txInfo,
  toastTitleTranslationId: `TransactionPage.sell-purchase.provider.${MARK_MACHINE_PLACE_TRANSITION_NAME}.toastTitle`,
  toastContentTranslationId: `TransactionPage.sell-purchase.provider.${MARK_MACHINE_PLACE_TRANSITION_NAME}.toastContent`,
});

const getLastCustomTransition = ({
  sellerMarkMachinePlaced,
  buyerMarkMetManager,
  processState,
}) => {
  if (
    ![states.PURCHASED, states.STRIPE_INTENT_CAPTURED, states.REFUND_DISABLED].includes(
      processState
    )
  ) {
    return {};
  }

  if (!sellerMarkMachinePlaced && !buyerMarkMetManager) {
    return {
      lastCustomTransition: 'a' || transitions.SELLER_CONFIRM_PURCHASE,
    };
  }

  if (!sellerMarkMachinePlaced) {
    return {
      lastCustomTransition: MARK_MET_MANAGER_TRANSITION_NAME,
    };
  }

  if (!buyerMarkMetManager) {
    return {
      lastCustomTransition: MARK_MACHINE_PLACE_TRANSITION_NAME,
    };
  }

  return {
    lastCustomTransition: moment(sellerMarkMachinePlaced).isAfter(buyerMarkMetManager)
      ? MARK_MACHINE_PLACE_TRANSITION_NAME
      : MARK_MET_MANAGER_TRANSITION_NAME,
  };
};

/**
 * Get state data against product process for TransactionPage's UI.
 * I.e. info about showing action buttons, current state etc.
 *
 * @param {*} txInfo detials about transaction
 * @param {*} processInfo  details about process
 */
export const getStateDataForSellPurchaseProcess = (txInfo, processInfo) => {
  const { transaction, transactionRole, nextTransitions } = txInfo;

  const { sellerMarkMachinePlaced, buyerMarkMetManager } = transaction?.attributes?.metadata || {};
  const isProviderBanned = transaction?.provider?.attributes?.banned;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  const { categoryLevel1: rawCategoryLevel1 } = transaction.listing.attributes.publicData;
  const categoryLevel1 = rawCategoryLevel1?.replaceAll('-', '_');

  const {
    isCustomer,
    processName,
    processState,
    actionButtonProps,
    leaveReviewProps,
    updateSellPurchaseProgressProps,
    initiateDisputeSellPurchase,
  } = processInfo;

  const progressStep = getSellPurchaseProgressStep({ isCustomer, processState, transaction });
  const lastCustomTransitionMaybe = getLastCustomTransition({
    sellerMarkMachinePlaced,
    buyerMarkMetManager,
    processState,
  });

  const defaultStateData = {
    processName,
    processState,
    showDetailCardHeadings: true,
    progressStep,
    nextStepTranslationId: `TransactionPage.sell-purchase.${transactionRole}.${processState}.nextStep`,
    ...lastCustomTransitionMaybe,
  };

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, CUSTOMER], () => {
      const transitionNames = Array.isArray(nextTransitions)
        ? nextTransitions.map(t => t.attributes.name)
        : [];
      const requestAfterInquiry = transitions.REQUEST_PAYMENT_AFTER_INQUIRY;
      const hasCorrectNextTransition = transitionNames.includes(requestAfterInquiry);
      const showOrderPanel = !isProviderBanned && hasCorrectNextTransition;
      return {
        ...defaultStateData,
        showDetailCardHeadings: false,
        showOrderPanel,
      };
    })
    .cond([states.INQUIRY, PROVIDER], () => {
      return defaultStateData;
    })
    .cond([states.PURCHASE_CONFIRMED_BY_BUYER, CUSTOMER], () => {
      return {
        ...defaultStateData,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(
          transitions.BUYER_REFUND_BEFORE_SELLER_CONFIRMED,
          CUSTOMER,
          {
            isConfirmNeeded: true,
            showConfirmStatement: true,
            showReminderStatement: true,
            confirmStatementTranslationId: `TransactionPage.PrimaryConfirmActionModal.sell-purchase.${states.PURCHASE_CONFIRMED_BY_BUYER}.customer.confirmStatement`,
            reminderStatementTranslationId: `TransactionPage.PrimaryConfirmActionModal.sell-purchase.${states.PURCHASE_CONFIRMED_BY_BUYER}.customer.reminderStatement`,
          }
        ),
      };
    })
    .cond([states.PURCHASE_CONFIRMED_BY_BUYER, PROVIDER], () => {
      const getFieldTextConfig = (name, validators = []) => ({
        type: FIELD_TEXT,
        labelTranslationId: `TransactionPage.sell-purchase.${name}.label`,
        name: `protectedData.${name}`,
        validators: [
          {
            validatorFn: required,
            messageTranslationId: `TransactionPage.sell-purchase.${name}.requiredMessage`,
          },
          ...validators,
        ],
      });

      return {
        ...defaultStateData,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.SELLER_CONFIRM_PURCHASE, PROVIDER, {
          isConfirmNeeded: true,
          showReminderStatement: true,
          formConfigs: [
            getFieldTextConfig('managerBusinessName'),
            getFieldTextConfig('managerName'),
            getFieldTextConfig('managerPhoneNumber'),
            getFieldTextConfig('managerEmail', [
              {
                validatorFn: emailFormatValid,
                messageTranslationId:
                  'TransactionPage.sell-purchase.managerEmail.emailInvalidMesage',
              },
            ]),
            {
              type: FIELD_LOCATION,
              labelTranslationId: 'TransactionPage.sell-purchase.managerAddress.label',
              name: 'protectedData.managerAddress',
              validators: [
                {
                  validatorFn: autocompleteSearchRequired,
                  messageTranslationId:
                    'TransactionPage.sell-purchase.managerAddress.requiredMessage',
                },
                {
                  validatorFn: autocompletePlaceSelected,
                  messageTranslationId:
                    'TransactionPage.sell-purchase.managerAddress.placeInvalidMessage',
                },
              ],
            },
          ],
          confirmModalTitleTranslationId:
            'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchase-confirmed-by-buyer.provider.modalTitle',
        }),
        secondaryButtonProps: actionButtonProps(
          transitions.SELLER_REFUND_BEFORE_SELLER_CONFIRMED,
          PROVIDER,
          {
            isConfirmNeeded: true,
            formConfigs: [getRefundReasonField({ role: PROVIDER })],
          }
        ),
      };
    })
    .cond([states.PAYMENT_EXPIRED, _], () => {
      return { ...defaultStateData, isCanceled: true };
    })
    .cond([states.REFUND_BEFORE_CAPTURE, _], () => {
      return { ...defaultStateData, isCanceled: true };
    })
    .cond([states.PURCHASED, CUSTOMER], () => {
      const primaryButtonProps = getCustomerUpdateProgressPrimaryButtonProps({
        buyerMarkMetManager,
        availableTransition: 'transition-buyer-mark-complete-before-capture-intent',
        currentState: states.PURCHASED,
        txInfo: {
          categoryLevel1,
        },
      });

      const processStatePostfix = buyerMarkMetManager ? '' : `.${MARK_MET_MANAGER_TRANSITION_NAME}`;

      return {
        ...defaultStateData,
        showRefundAvailabileNotice: true,
        showActionButtons: true,
        primaryButtonProps: updateSellPurchaseProgressProps(
          MARK_MET_MANAGER_TRANSITION_NAME,
          CUSTOMER,
          primaryButtonProps
        ),
        secondaryButtonProps: actionButtonProps(
          transitions.BUYER_REFUND_BEFORE_CAPTURE_INTENT,
          CUSTOMER,
          {
            isConfirmNeeded: true,
            showReminderStatement: true,
            confirmModalTitleTranslationId:
              'TransactionPage.SecondaryConfirmActionModal.sell-purchase.purchased.customer.modalTitle',
            confirmButtonTranslationId:
              'TransactionPage.SecondaryConfirmActionModal.sell-purchase.purchased.customer.confirmButton',
            formConfigs: [getRefundReasonField({ role: CUSTOMER })],
          }
        ),
        nextStepTranslationId: `TransactionPage.sell-purchase.${transactionRole}.${processState}${processStatePostfix}.nextStep`,
      };
    })
    .cond([states.PURCHASED, PROVIDER], () => {
      const primaryButtonMaybe = sellerMarkMachinePlaced
        ? {}
        : {
            primaryButtonProps: updateSellPurchaseProgressProps(
              MARK_MACHINE_PLACE_TRANSITION_NAME,
              PROVIDER,
              getProviderUpdateProgressPrimaryButtonProps({ categoryLevel1 })
            ),
          };
      const processStatePostfix = sellerMarkMachinePlaced
        ? ''
        : `.${MARK_MACHINE_PLACE_TRANSITION_NAME}`;

      return {
        ...defaultStateData,
        showRefundAvailabileNotice: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(
          transitions.SELLER_REFUND_BEFORE_CAPTURE_INTENT,
          PROVIDER,
          {
            isConfirmNeeded: true,
            showReminderStatement: true,
            formConfigs: [getRefundReasonField({ role: PROVIDER })],
          }
        ),
        nextStepTranslationId: `TransactionPage.sell-purchase.${transactionRole}.${processState}${processStatePostfix}.nextStep`,
        ...primaryButtonMaybe,
      };
    })
    .cond([states.PURCHASE_EXPIRED, _], () => {
      return { ...defaultStateData, isCanceled: true };
    })
    .cond([states.STRIPE_INTENT_CAPTURED, CUSTOMER], () => {
      const primaryButtonProps = getCustomerUpdateProgressPrimaryButtonProps({
        buyerMarkMetManager,
        availableTransition: 'transition-buyer-mark-complete',
        currentState: states.STRIPE_INTENT_CAPTURED,
        txInfo: {
          categoryLevel1,
        },
      });

      const processStatePostfix = buyerMarkMetManager ? '' : `.${MARK_MET_MANAGER_TRANSITION_NAME}`;
      return {
        ...defaultStateData,
        showRefundAvailabileNotice: true,
        showActionButtons: true,
        primaryButtonProps: updateSellPurchaseProgressProps(
          MARK_MET_MANAGER_TRANSITION_NAME,
          CUSTOMER,
          primaryButtonProps
        ),
        secondaryButtonProps: initiateDisputeSellPurchase(
          transitions.BUYER_ISSUE_REFUND,
          CUSTOMER,
          {
            isConfirmNeeded: true,
            showReminderStatement: true,
            confirmModalTitleTranslationId:
              'TransactionPage.SecondaryConfirmActionModal.sell-purchase.stripe-intent-captured.customer.modalTitle',
            confirmButtonTranslationId:
              'TransactionPage.SecondaryConfirmActionModal.sell-purchase.stripe-intent-captured.customer.confirmButton',
            formConfigs: [getRefundReasonField({ name: 'disputeReason' })],
          }
        ),
        nextStepTranslationId: `TransactionPage.sell-purchase.${transactionRole}.${processState}${processStatePostfix}.nextStep`,
      };
    })
    .cond([states.STRIPE_INTENT_CAPTURED, PROVIDER], () => {
      const primaryButtonMaybe = sellerMarkMachinePlaced
        ? {}
        : {
            primaryButtonProps: updateSellPurchaseProgressProps(
              MARK_MACHINE_PLACE_TRANSITION_NAME,
              PROVIDER,
              getProviderUpdateProgressPrimaryButtonProps({ categoryLevel1 })
            ),
          };
      const processStatePostfix = sellerMarkMachinePlaced
        ? ''
        : `.${MARK_MACHINE_PLACE_TRANSITION_NAME}`;

      return {
        ...defaultStateData,
        showRefundAvailabileNotice: true,
        showActionButtons: true,
        secondaryButtonProps: initiateDisputeSellPurchase(
          transitions.SELLER_ISSUE_REFUND,
          PROVIDER,
          {
            isConfirmNeeded: true,
            showReminderStatement: true,
            formConfigs: [getRefundReasonField({ name: 'disputeReason' })],
          }
        ),
        nextStepTranslationId: `TransactionPage.sell-purchase.${transactionRole}.${processState}${processStatePostfix}.nextStep`,
        ...primaryButtonMaybe,
      };
    })
    .cond([states.REFUND_DISABLED, CUSTOMER], () => {
      const primaryButtonProps = getCustomerUpdateProgressPrimaryButtonProps({
        buyerMarkMetManager,
        availableTransition: 'transition-buyer-mark-complete-refund-disabled',
        currentState: states.REFUND_DISABLED,
        txInfo: {
          categoryLevel1,
        },
      });
      const processStatePostfix = buyerMarkMetManager ? '' : `.${MARK_MET_MANAGER_TRANSITION_NAME}`;

      return {
        ...defaultStateData,
        showRefundAvailabileNotice: true,
        showActionButtons: true,
        primaryButtonProps: updateSellPurchaseProgressProps(
          MARK_MET_MANAGER_TRANSITION_NAME,
          CUSTOMER,
          primaryButtonProps
        ),
        nextStepTranslationId: `TransactionPage.sell-purchase.${transactionRole}.${processState}${processStatePostfix}.nextStep`,
      };
    })
    .cond([states.REFUND_DISABLED, PROVIDER], () => {
      const primaryButtonMaybe = sellerMarkMachinePlaced
        ? {}
        : {
            primaryButtonProps: updateSellPurchaseProgressProps(
              MARK_MACHINE_PLACE_TRANSITION_NAME,
              PROVIDER,
              getProviderUpdateProgressPrimaryButtonProps({ categoryLevel1 })
            ),
          };
      const processStatePostfix = sellerMarkMachinePlaced
        ? ''
        : `.${MARK_MACHINE_PLACE_TRANSITION_NAME}`;

      return {
        ...defaultStateData,
        showRefundAvailabileNotice: true,
        showActionButtons: true,
        ...primaryButtonMaybe,
        nextStepTranslationId: `TransactionPage.sell-purchase.${transactionRole}.${processState}${processStatePostfix}.nextStep`,
      };
    })
    .cond([states.SELLER_HANDLE_DISPUTED, CUSTOMER], () => {
      return { ...defaultStateData, showRefundAvailabileNotice: true };
    })
    .cond([states.SELLER_HANDLE_DISPUTED, PROVIDER], () => {
      return {
        ...defaultStateData,
        showRefundAvailabileNotice: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.SELLER_APPROVE_REFUND, PROVIDER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
        }),
        secondaryButtonProps: actionButtonProps(transitions.SELLER_DISPUTE, PROVIDER, {
          isConfirmNeeded: true,
          confirmModalTitleTranslationId:
            'TransactionPage.SecondaryConfirmActionModal.sell-purchase.seller-handle-disputed.provider.modalTitle',
          confirmButtonTranslationId:
            'TransactionPage.SecondaryConfirmActionModal.sell-purchase.seller-handle-disputed.provider.confirmButton',
          formConfigs: [getDisputeReasonField()],
        }),
      };
    })
    .cond([states.OPERATOR_HANDLE_DISPUTED, _], () => {
      return {
        ...defaultStateData,
        showRefundAvailabileNotice: true,
      };
    })
    .cond([states.CANCELED, _], () => {
      return { ...defaultStateData, isCanceled: true };
    })
    .cond([states.COMPLETED, _], () => {
      return {
        ...defaultStateData,
        showReviewAsFirstLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => {
      return {
        ...defaultStateData,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_PROVIDER, PROVIDER], () => {
      return {
        ...defaultStateData,
        isCompleted: true,
      };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return {
        ...defaultStateData,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, CUSTOMER], () => {
      return {
        ...defaultStateData,
        isCompleted: true,
      };
    })
    .cond([states.REVIEWED, _], () => {
      return {
        ...defaultStateData,
        showReviews: true,
        isCompleted: true,
      };
    })
    .default(() => {
      // Default values for other states
      return defaultStateData;
    })
    .resolve();
};
