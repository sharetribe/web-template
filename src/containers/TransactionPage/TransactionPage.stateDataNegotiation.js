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
    onMakeOfferFromRequest,
    onOpenRequestChangesModal,
    onOpenMakeCounterOfferModal,
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

  // These overwrite the default transition messages on the ActivityFeed component.
  // The defaults are tied to the process state.
  const transitionMessages = [
    {
      transition: transitions.PROVIDER_ACCEPT_COUNTER_OFFER,
      translationId:
        'TransactionPage.ActivityFeed.default-negotiation.transition.provider-accept-counter-offer',
    },
    {
      transition: transitions.CUSTOMER_WITHDRAW_COUNTER_OFFER,
      translationId:
        'TransactionPage.ActivityFeed.default-negotiation.transition.customer-withdraw-counter-offer',
    },
    {
      transition: transitions.PROVIDER_REJECT_COUNTER_OFFER,
      translationId:
        'TransactionPage.ActivityFeed.default-negotiation.transition.provider-reject-counter-offer',
    },
  ];
  const sharedStateData = {
    processName,
    processState,
    transitionMessages,
  };

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, PROVIDER], () => {
      const transitionNames = Array.isArray(nextTransitions)
        ? nextTransitions.map(t => t.attributes.name)
        : [];
      const makeOfferAfterInquiry = transitions.MAKE_OFFER_AFTER_INQUIRY;
      const hasCorrectNextTransition = transitionNames.includes(makeOfferAfterInquiry);
      const showOrderPanel = !isCustomerBanned && hasCorrectNextTransition;
      return { ...sharedStateData, showOrderPanel, showDetailCardHeadings: true };
    })
    .cond([states.INQUIRY, CUSTOMER], () => {
      return { ...sharedStateData, showDetailCardHeadings: true };
    })
    .cond([states.QUOTE_REQUESTED, PROVIDER], () => {
      const overwritesForMakeOfferFromRequest = {
        onAction: () => {
          return onMakeOfferFromRequest();
        },
      };
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(
          transitions.MAKE_OFFER_FROM_REQUEST,
          PROVIDER,
          overwritesForMakeOfferFromRequest
        ),
        secondaryButtonProps: actionButtonProps(transitions.REJECT_REQUEST, PROVIDER),
      };
    })
    .cond([states.QUOTE_REQUESTED, CUSTOMER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(transitions.WITHDRAW_REQUEST, CUSTOMER),
      };
    })
    .cond([states.OFFER_PENDING, CUSTOMER], () => {
      // When customer clicks on the accept button, we just redirect them to the checkout page.
      // The actual transition is handled there together with the payment
      const overwritesForAcceptOffer = {
        onAction: () => {
          const initialValuesForCheckout = {};
          onCheckoutRedirect(initialValuesForCheckout);
        },
      };

      const overwritesForMakeCounterOffer = {
        onAction: onOpenMakeCounterOfferModal,
        // conditions to disable the button
        conditions: [
          {
            type: 'maxTransitions',
            action: 'disable',
            max: 50,
            disabledReason: {
              translationKey: `TransactionPage.${processName}.${CUSTOMER}.${states.OFFER_PENDING}.disabled.maxRequests`,
            },
          },
        ],
      };

      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(
          transitions.REQUEST_PAYMENT_TO_ACCEPT_OFFER,
          CUSTOMER,
          overwritesForAcceptOffer
        ),
        secondaryButtonProps: actionButtonProps(transitions.CUSTOMER_REJECT_OFFER, CUSTOMER),
        tertiaryButtonProps: actionButtonProps(
          transitions.CUSTOMER_MAKE_COUNTER_OFFER,
          CUSTOMER,
          overwritesForMakeCounterOffer
        ),
      };
    })
    .cond([states.OFFER_PENDING, PROVIDER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(transitions.PROVIDER_WITHDRAW_OFFER, PROVIDER),
      };
    })
    .cond([states.CUSTOMER_OFFER_PENDING, CUSTOMER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(
          transitions.CUSTOMER_WITHDRAW_COUNTER_OFFER,
          CUSTOMER,
          {
            orderData: {
              actor: CUSTOMER,
            },
          }
        ),
      };
    })
    .cond([states.CUSTOMER_OFFER_PENDING, PROVIDER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.PROVIDER_ACCEPT_COUNTER_OFFER, PROVIDER),
        secondaryButtonProps: actionButtonProps(
          transitions.PROVIDER_REJECT_COUNTER_OFFER,
          PROVIDER,
          {
            orderData: {
              actor: PROVIDER,
            },
          }
        ),
        tertiaryButtonProps: actionButtonProps(transitions.PROVIDER_MAKE_COUNTER_OFFER, PROVIDER, {
          onAction: onOpenMakeCounterOfferModal,
        }),
      };
    })
    .cond([states.OFFER_REJECTED, _], () => {
      return { ...sharedStateData, showDetailCardHeadings: true, showBreakDown: false };
    })
    .cond([states.OFFER_ACCEPTED, CUSTOMER], () => {
      return { ...sharedStateData, showDetailCardHeadings: true, showExtraInfo: true };
    })
    .cond([states.OFFER_ACCEPTED, PROVIDER], () => {
      return {
        ...sharedStateData,
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
        ...sharedStateData,
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
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        // showActionButtons: true,
      };
    })
    .cond([states.CHANGES_REQUESTED, CUSTOMER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
      };
    })
    .cond([states.CHANGES_REQUESTED, PROVIDER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.DELIVER_CHANGES, PROVIDER),
      };
    })
    .cond([states.COMPLETED, _], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showReviewAsFirstLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED, _], () => {
      return { ...sharedStateData, showDetailCardHeadings: true, showReviews: true };
    })
    .default(() => {
      // Default values for other states
      return { ...sharedStateData, showDetailCardHeadings: true };
    })
    .resolve();
};
