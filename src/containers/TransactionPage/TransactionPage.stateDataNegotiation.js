import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../transactions/transaction';

/**
 * Get state data against booking process for TransactionPage's UI.
 * I.e. info about showing action buttons, current state etc.
 *
 * @param {*} txInfo detials about transaction
 * @param {*} processInfo  details about process
 */
export const getStateDataForNegotiationProcess = (txInfo, processInfo) => {
  const {
    transaction,
    transactionRole,
    nextTransitions,
    onCheckoutRedirect,
    onOpenRequestChangesModal,
  } = txInfo;
  const isProviderBanned = transaction?.provider?.attributes?.banned;
  const isCustomerBanned = transaction?.provider?.attributes?.banned;
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

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, PROVIDER], () => {
      const transitionNames = Array.isArray(nextTransitions)
        ? nextTransitions.map(t => t.attributes.name)
        : [];
      const makeOfferAfterInquiry = transitions.MAKE_OFFER_AFTER_INQUIRY;
      const hasCorrectNextTransition = transitionNames.includes(makeOfferAfterInquiry);
      const showOrderPanel = !isCustomerBanned && hasCorrectNextTransition;
      return { processName, processState, showOrderPanel };
    })
    .cond([states.INQUIRY, CUSTOMER], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.OFFER_PENDING, CUSTOMER], () => {
      // When customer clicks on the accept button, we just redirect them to the checkout page.
      // The actual transition is handled there together with the payment
      const overwrites = {
        onAction: () => {
          const initialValuesForCheckout = {};
          onCheckoutRedirect(initialValuesForCheckout);
        },
      };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(
          transitions.REQUEST_PAYMENT_TO_ACCEPT_OFFER,
          CUSTOMER,
          overwrites
        ),
        secondaryButtonProps: actionButtonProps(transitions.CUSTOMER_REJECT_OFFER, CUSTOMER),
        transitionMessages: [
          {
            transition: transitions.PROVIDER_ACCEPT_COUNTER_OFFER,
            translationId:
              'TransactionPage.ActivityFeed.default-negotiation.transition.customer-make-counter-offer',
          },
        ],
      };
    })
    .cond([states.OFFER_PENDING, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(transitions.PROVIDER_WITHDRAW_OFFER, PROVIDER),
        transitionMessages: [
          {
            transition: transitions.PROVIDER_ACCEPT_COUNTER_OFFER,
            translationId:
              'TransactionPage.ActivityFeed.default-negotiation.transition.customer-make-counter-offer',
          },
        ],
      };
    })
    .cond([states.OFFER_REJECTED, _], () => {
      return { processName, processState, showDetailCardHeadings: true, showBreakDown: false };
    })
    .cond([states.OFFER_ACCEPTED, CUSTOMER], () => {
      return { processName, processState, showDetailCardHeadings: true, showExtraInfo: true };
    })
    .cond([states.OFFER_ACCEPTED, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.DELIVER, PROVIDER),
      };
    })
    .cond([states.DELIVERED, CUSTOMER], () => {
      // TODO How to hide an action button after certain time has passed or N transitions have been made?
      const changeRequestButtonExtra = {
        onAction: onOpenRequestChangesModal,
        // conditions to disable the button
        conditions: [
          {
            type: 'durationSinceTransition',
            action: 'disable',
            sinceTransition: transitions.CONFIRM_PAYMENT, // transaction.attributes.transitions array contains createdAt
            days: 70, // Note: for now, only days are supported
            disabledReason: {
              translationKey: `TransactionPage.${processName}.${CUSTOMER}.${states.DELIVERED}.disabled.outdated`,
            },
          },
          {
            type: 'maxTransitions',
            action: 'disable',
            max: 90,
            disabledReason: {
              translationKey: `TransactionPage.${processName}.${CUSTOMER}.${states.DELIVERED}.disabled.maxRequests`,
            },
          },
        ],
      };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.ACCEPT_DELIVERABLE, CUSTOMER),
        secondaryButtonProps: actionButtonProps(
          transitions.REQUEST_CHANGES,
          CUSTOMER,
          changeRequestButtonExtra
        ),
      };
    })
    .cond([states.DELIVERED, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        // showActionButtons: true,
      };
    })
    .cond([states.CHANGES_REQUESTED, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
      };
    })
    .cond([states.CHANGES_REQUESTED, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.DELIVER_CHANGES, PROVIDER),
      };
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
