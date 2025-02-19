import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../../../transactions/transaction';
import { states, transitions } from '../transactions/transactionProcessSellPurchase';

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

  const {
    processName,
    processState,
    isCustomer,
    actionButtonProps,
    leaveReviewProps,
    markSellPurchaseProgressProps,
  } = processInfo;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, CUSTOMER], () => {
      const transitionNames = Array.isArray(nextTransitions)
        ? nextTransitions.map(t => t.attributes.name)
        : [];
      const requestAfterInquiry = transitions.REQUEST_PAYMENT_AFTER_INQUIRY;
      const hasCorrectNextTransition = transitionNames.includes(requestAfterInquiry);
      const showOrderPanel = !isProviderBanned && hasCorrectNextTransition;
      return { processName, processState, showOrderPanel };
    })
    .cond([states.INQUIRY, PROVIDER], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.PURCHASE_CONFIRMED_BY_BUYER, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(
          transitions.BUYER_REFUND_BEFORE_SELLER_CONFIRMED,
          CUSTOMER,
          {
            isConfirmNeeded: true,
          }
        ),
      };
    })
    .cond([states.PURCHASE_CONFIRMED_BY_BUYER, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.SELLER_CONFIRM_PURCHASE, PROVIDER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          showReminderStatement: true,
        }),
        secondaryButtonProps: actionButtonProps(
          transitions.SELLER_REFUND_BEFORE_SELLER_CONFIRMED,
          PROVIDER,
          {
            isConfirmNeeded: true,
          }
        ),
      };
    })
    .cond([states.PAYMENT_EXPIRED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.REFUND_BEFORE_CAPTURE, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.PURCHASED, CUSTOMER], () => {
      const primaryButtonProps = buyerMarkMetManager
        ? {
            actionButtonTranslationId:
              'TransactionPage.sell-purchase.customer.transition-buyer-mark-complete-before-capture-intent.actionButton',
            actionButtonTranslationErrorId:
              'TransactionPage.sell-purchase.customer.transition-buyer-mark-complete-before-capture-intent.actionError',
            confirmStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchased.customer.confirmStatement',
            reminderStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchased.customer.reminderStatement',
          }
        : {
            actionButtonTranslationId:
              'TransactionPage.sell-purchase.customer.markMetManager.actionButton',
            actionButtonTranslationErrorId:
              'TransactionPage.sell-purchase.customer.markMetManager.actionError',
            confirmStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchased.customer.markMetManager.confirmStatement',
            reminderStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchased.customer.markMetManager.reminderStatement',
          };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: markSellPurchaseProgressProps(CUSTOMER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          showReminderStatement: true,
          ...primaryButtonProps,
        }),
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
          }
        ),
      };
    })
    .cond([states.PURCHASED, PROVIDER], () => {
      const primaryButtonMaybe = sellerMarkMachinePlaced
        ? {}
        : {
            primaryButtonProps: markSellPurchaseProgressProps(PROVIDER, {
              isConfirmNeeded: true,
              showConfirmStatement: true,
              showReminderStatement: true,
              actionButtonTranslationId:
                'TransactionPage.sell-purchase.provider.markMachinePlaced.actionButton',
              actionButtonTranslationErrorId:
                'TransactionPage.sell-purchase.provider.markMachinePlaced.actionError',
            }),
          };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(
          transitions.SELLER_REFUND_BEFORE_CAPTURE_INTENT,
          PROVIDER,
          {
            isConfirmNeeded: true,
            showReminderStatement: true,
          }
        ),
        ...primaryButtonMaybe,
      };
    })
    .cond([states.PURCHASE_EXPIRED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.STRIPE_INTENT_CAPTURED, CUSTOMER], () => {
      const transitionName = buyerMarkMetManager
        ? 'transition-buyer-mark-complete-before-capture-intent'
        : 'markMetManager';
      const modalStatementPrefix = buyerMarkMetManager ? '' : '.markMetManager';

      const primaryButtonProps = {
        actionButtonTranslationId: `TransactionPage.sell-purchase.customer.${transitionName}.actionButton`,
        actionButtonTranslationErrorId: `TransactionPage.sell-purchase.customer.${transitionName}.actionError`,
        confirmStatementTranslationId: `TransactionPage.PrimaryConfirmActionModal.sell-purchase.stripe-intent-captured.customer${modalStatementPrefix}.confirmStatement`,
        reminderStatementTranslationId: `TransactionPage.PrimaryConfirmActionModal.sell-purchase.stripe-intent-captured.customer${modalStatementPrefix}.reminderStatement`,
      };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: markSellPurchaseProgressProps(CUSTOMER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          showReminderStatement: true,
          ...primaryButtonProps,
        }),
        secondaryButtonProps: actionButtonProps(transitions.BUYER_ISSUE_REFUND, CUSTOMER, {
          isConfirmNeeded: true,
          showReminderStatement: true,
          confirmModalTitleTranslationId:
            'TransactionPage.SecondaryConfirmActionModal.sell-purchase.stripe-intent-captured.customer.modalTitle',
          confirmButtonTranslationId:
            'TransactionPage.SecondaryConfirmActionModal.sell-purchase.stripe-intent-captured.customer.confirmButton',
        }),
      };
    })
    .cond([states.STRIPE_INTENT_CAPTURED, PROVIDER], () => {
      const primaryButtonMaybe = sellerMarkMachinePlaced
        ? {}
        : {
            primaryButtonProps: markSellPurchaseProgressProps(PROVIDER, {
              isConfirmNeeded: true,
              showConfirmStatement: true,
              showReminderStatement: true,
              actionButtonTranslationId:
                'TransactionPage.sell-purchase.provider.markMachinePlaced.actionButton',
              actionButtonTranslationErrorId:
                'TransactionPage.sell-purchase.provider.markMachinePlaced.actionError',
            }),
          };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(transitions.SELLER_ISSUE_REFUND, PROVIDER, {
          isConfirmNeeded: true,
          showReminderStatement: true,
        }),
        ...primaryButtonMaybe,
      };
    })
    .cond([states.REFUND_DISABLED, CUSTOMER], () => {
      const primaryButtonProps = buyerMarkMetManager
        ? {
            actionButtonTranslationId:
              'TransactionPage.sell-purchase.customer.transition-buyer-mark-complete-refund-disabled.actionButton',
            actionButtonTranslationErrorId:
              'TransactionPage.sell-purchase.customer.transition-buyer-mark-complete-refund-disabled.actionError',
            confirmStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.refund-disabled.customer.confirmStatement',
            reminderStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.refund-disabled.customer.reminderStatement',
          }
        : {
            actionButtonTranslationId:
              'TransactionPage.sell-purchase.customer.markMetManager.actionButton',
            actionButtonTranslationErrorId:
              'TransactionPage.sell-purchase.customer.markMetManager.actionError',
            confirmStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.refund-disabled.customer.markMetManager.confirmStatement',
            reminderStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.refund-disabled.customer.markMetManager.reminderStatement',
          };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: markSellPurchaseProgressProps(CUSTOMER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          showReminderStatement: true,
          ...primaryButtonProps,
        }),
      };
    })
    .cond([states.REFUND_DISABLED, PROVIDER], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.SELLER_HANDLE_DISPUTED, CUSTOMER], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.SELLER_HANDLE_DISPUTED, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
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
        }),
      };
    })
    .cond([states.OPERATOR_HANDLE_DISPUTED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.CANCELED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.COMPLETED, _], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsFirstLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
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
