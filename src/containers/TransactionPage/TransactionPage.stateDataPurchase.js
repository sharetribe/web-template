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
  const { transaction, transactionRole, nextTransitions } = txInfo;
  const isProviderBanned = transaction?.provider?.attributes?.banned;
  const isShippable = transaction?.attributes?.protectedData?.deliveryMethod === 'shipping';
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  const {
    processName,
    processState,
    states,
    transitions,
    isCustomer,
    actionButtonProps,
    leaveReviewProps,
  } = processInfo;
  const {
    categoryLevel1: rawCategoryLevel1,
    listingType: rawListingType,
  } = transaction.listing.attributes.publicData;
  const categoryLevel1 = rawCategoryLevel1?.replaceAll('-', '_');
  const listingType = rawListingType?.replaceAll('-', '_');
  const translationValues = {
    categoryLevel1,
    listingType,
  };

  const defaultStateData = {
    processName,
    processState,
    showDetailCardHeadings: true,
    nextStepTranslationId: `TransactionPage.${processName}.${transactionRole}.${processState}.nextStep`,
  };

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, CUSTOMER], () => {
      const transitionNames = Array.isArray(nextTransitions)
        ? nextTransitions.map(t => t.attributes.name)
        : [];
      const requestAfterInquiry = transitions.REQUEST_PAYMENT_AFTER_INQUIRY;
      const hasCorrectNextTransition = transitionNames.includes(requestAfterInquiry);
      const showOrderPanel = !isProviderBanned && hasCorrectNextTransition;
      return { ...defaultStateData, showDetailCardHeadings: false, showOrderPanel };
    })
    .cond([states.INQUIRY, PROVIDER], () => {
      return defaultStateData;
    })
    .cond([states.PURCHASED, CUSTOMER], () => {
      return {
        ...defaultStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        primaryButtonProps: actionButtonProps(transitions.MARK_RECEIVED_FROM_PURCHASED, CUSTOMER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          confirmStatementTranslationValues: translationValues,
          showReminderStatement: true,
          txInfo: translationValues,
        }),
      };
    })
    .cond([states.PURCHASED, PROVIDER], () => {
      const actionButtonTranslationId = isShippable
        ? `TransactionPage.${processName}.${PROVIDER}.transition-mark-delivered.actionButtonShipped`
        : `TransactionPage.${processName}.${PROVIDER}.transition-mark-delivered.actionButton`;

      return {
        ...defaultStateData,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.MARK_DELIVERED, PROVIDER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          confirmStatementTranslationValues: translationValues,
          showReminderStatement: true,
          actionButtonTranslationId,
          txInfo: translationValues,
        }),
      };
    })
    .cond([states.DELIVERED, CUSTOMER], () => {
      return {
        ...defaultStateData,
        showDispute: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.MARK_RECEIVED, CUSTOMER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          confirmStatementTranslationValues: translationValues,
          showReminderStatement: true,
          txInfo: translationValues,
        }),
      };
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
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return {
        ...defaultStateData,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED, _], () => {
      return { ...defaultStateData, showReviews: true };
    })
    .default(() => {
      // Default values for other states
      return defaultStateData;
    })
    .resolve();
};
