import { createSlug } from '../../util/urlHelpers' // [SKYFARER]
import { acceptRescheduleRequest } from '../../util/api'; // [SKYFARER]

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
export const getStateDataForBookingProcess = (txInfo, processInfo, intl) => {
  const { transaction, transactionRole, nextTransitions } = txInfo;
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
    .cond([states.PREAUTHORIZED, CUSTOMER], () => {
      return { processName, processState, showDetailCardHeadings: true, showExtraInfo: true };
    })
    .cond([states.PREAUTHORIZED, PROVIDER], () => {
      const primary = isCustomerBanned ? null : actionButtonProps(transitions.ACCEPT, PROVIDER);
      const secondary = isCustomerBanned ? null : actionButtonProps(transitions.DECLINE, PROVIDER);
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.ACCEPTED, CUSTOMER], () => {
      const rescheduleRequest = transaction.attributes.metadata.rescheduleRequest;

      const primary = !rescheduleRequest ? {
        buttonText: intl.formatMessage({ id: 'TransactionPage.default-booking.customer.transition-customer-reschedule.actionButton' }),
        errorText: intl.formatMessage({ id: 'TransactionPage.default-booking.customer.transition-customer-reschedule.actionError' }),
        inProgress: false,
        onAction: () => {
          const slug = createSlug(transaction.listing.attributes.title)
          window.location.href = `/l/${slug}/${transaction.listing.id.uuid}?reschedule=${transaction.id.uuid}`
        }
      } : null

      // The customer can't cancel the booking, but leaving this in case that policy changes
      // const secondary = isCustomerBanned ? null : actionButtonProps(transitions.CUSTOMER_CANCEL, CUSTOMER);
      // secondary.modal = 'cancel'

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
        // secondaryButtonProps: secondary,
      };
    })
    .cond([states.ACCEPTED, PROVIDER], () => {
      const rescheduleRequest = transaction.attributes.metadata.rescheduleRequest;

      const primary = !rescheduleRequest ? {
        buttonText: intl.formatMessage({ id: 'TransactionPage.default-booking.provider.transition-provider-reschedule.actionButton' }),
        errorText: intl.formatMessage({ id: 'TransactionPage.default-booking.provider.transition-provider-reschedule.actionError' }),
        inProgress: false,
        onAction: () => {
          const slug = createSlug(transaction.listing.attributes.title)
          window.location.href = `/l/${slug}/${transaction.listing.id.uuid}?reschedule=${transaction.id.uuid}`
        }
      } : {
        buttonText: intl.formatMessage({ id: 'TransactionPage.default-booking.provider.reschedule-pending.actionButton' }),
        errorText: intl.formatMessage({ id: 'TransactionPage.default-booking.provider.reschedule-pending.actionError' }),
        inProgress: false,
        onAction: async () => {
          const result = await acceptRescheduleRequest({ txId: transaction.id.uuid });
          if (result.result.status !== 200) console.error('Error accepting reschedule request', result);
          window.location.reload();
        }
      }

      const secondary = isCustomerBanned ? null : actionButtonProps(transitions.PROVIDER_CANCEL, PROVIDER);
      secondary.modal = 'cancel'

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.DELIVERED, _], () => {
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
