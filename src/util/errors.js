/**
 * ================ API error handling utilities ================
 *
 * This module exports helpers that can be used to check if API
 * response errors are some specific error cases.
 *
 * NOTE: most of the functions are tied to an endpoint, and should not
 * be used to check error responses from any other endpoint. Check the
 * name and the docstring of the function to ensure correct usage.
 */

import {
  ERROR_CODE_FORBIDDEN,
  ERROR_CODE_NOT_FOUND,
  ERROR_CODE_TRANSACTION_LISTING_NOT_FOUND,
  ERROR_CODE_TRANSACTION_INVALID_TRANSITION,
  ERROR_CODE_TRANSACTION_ALREADY_REVIEWED_BY_CUSTOMER,
  ERROR_CODE_TRANSACTION_ALREADY_REVIEWED_BY_PROVIDER,
  ERROR_CODE_PAYMENT_FAILED,
  ERROR_CODE_CHARGE_ZERO_PAYIN,
  ERROR_CODE_EMAIL_TAKEN,
  ERROR_CODE_EMAIL_NOT_FOUND,
  ERROR_CODE_TOO_MANY_VERIFICATION_REQUESTS,
  ERROR_CODE_UPLOAD_OVER_LIMIT,
  ERROR_CODE_MISSING_STRIPE_ACCOUNT,
  ERROR_CODE_TRANSACTION_BOOKING_TIME_NOT_AVAILABLE,
  ERROR_CODE_TRANSACTION_LISTING_INSUFFICIENT_STOCK,
  ERROR_CODE_STOCK_OLD_TOTAL_MISMATCH,
  ERROR_CODE_PERMISSION_DENIED_POST_LISTINGS,
  ERROR_CODE_PERMISSION_DENIED_PENDING_APPROVAL,
  ERROR_CODE_USER_PENDING_APPROVAL,
  ERROR_CODE_PERMISSION_DENIED_INITIATE_TRANSACTIONS,
  ERROR_CODE_PERMISSION_DENIED_READ,
} from './types';
// NOTE: This file imports types.js, which may lead to circular dependency

const errorAPIErrors = error => {
  return error && error.apiErrors ? error.apiErrors : [];
};

const hasErrorWithCode = (error, code) => {
  return errorAPIErrors(error).some(apiError => {
    return apiError.code === code;
  });
};

/**
 * return apiErrors from error response
 */
const responseAPIErrors = error => {
  return error && error.data && error.data.errors ? error.data.errors : [];
};

/**
 * 403 Forbidden
 */
export const isForbiddenError = error => hasErrorWithCode(error, ERROR_CODE_FORBIDDEN);

/**
 * 404 Not Found
 */
export const isNotFoundError = error => hasErrorWithCode(error, ERROR_CODE_NOT_FOUND);

/**
 * 429 Too Many Requests error
 */
export const isTooManyRequestsError = error => error && error.status === 429;

/**
 * Check if the given API error (from `sdk.currentuser.create()`) is
 * due to the email address already being in use.
 */
export const isSignupEmailTakenError = error => hasErrorWithCode(error, ERROR_CODE_EMAIL_TAKEN);

/**
 * Check if the given API error (from `sdk.currentuser.changeEmail()`) is
 * due to the email address already being in use.
 */
export const isChangeEmailTakenError = error => hasErrorWithCode(error, ERROR_CODE_EMAIL_TAKEN);

/**
 * Check if the given API error (from
 * `sdk.currentUser.sendVerificationEmail()`) is due to too many
 * active email verification requests.
 *
 * There qre only a specific amount of active verification requests
 * allowed, and the user has to wait for them to expire to be able to
 * request sending new verification emails.
 */
export const isTooManyEmailVerificationRequestsError = error =>
  hasErrorWithCode(error, ERROR_CODE_TOO_MANY_VERIFICATION_REQUESTS);

/**
 * Check if the given API error (from
 * `sdk.images.upload()`) is due to the image being over
 * the size limit.
 */
export const isUploadImageOverLimitError = error =>
  hasErrorWithCode(error, ERROR_CODE_UPLOAD_OVER_LIMIT);

/**
 * Check if the given API error (from
 * `sdk.stock.compareAndSet()`) is due to the oldTotal being wrong.
 */
export const isOldTotalMismatchStockError = error =>
  hasErrorWithCode(error, ERROR_CODE_STOCK_OLD_TOTAL_MISMATCH);

/**
 * Check if the given API error (from `sdk.passwordReset.request()`)
 * is due to no user having the given email address.
 */
export const isPasswordRecoveryEmailNotFoundError = error =>
  hasErrorWithCode(error, ERROR_CODE_EMAIL_NOT_FOUND);

/**
 * Check if the given API error (from `sdk.transaction.initiate()` or
 * `sdk.transaction.initiateSpeculative()`) is due to the listing
 * being closed or deleted.
 */
export const isTransactionInitiateListingNotFoundError = error =>
  hasErrorWithCode(error, ERROR_CODE_TRANSACTION_LISTING_NOT_FOUND);

/**
 * Check if the given API error (from `sdk.transaction.initiate()` or
 * `sdk.transaction.initiateSpeculative()`) is due to missign Stripe
 * connection from the listing author.
 */
export const isTransactionInitiateMissingStripeAccountError = error =>
  hasErrorWithCode(error, ERROR_CODE_MISSING_STRIPE_ACCOUNT);

/**
 * Check if the given API error (from `sdk.transaction.initiate()` or
 * `sdk.transaction.initiateSpeculative()`) is due to selected booking
 * time already being booked.
 */
export const isTransactionInitiateBookingTimeNotAvailableError = error =>
  hasErrorWithCode(error, ERROR_CODE_TRANSACTION_BOOKING_TIME_NOT_AVAILABLE);

/**
 * Check if the given API error (from `sdk.transaction.initiate()` or
 * `sdk.transaction.initiateSpeculative()`) is due to insufficient stock.
 */
export const isTransactionInitiateListingInsufficientStockError = error =>
  hasErrorWithCode(error, ERROR_CODE_TRANSACTION_LISTING_INSUFFICIENT_STOCK);

/**
 * Check if the given API error (from `sdk.transaction.initiate()` or
 * `sdk.transaction.initiateSpeculative()`) is due to payment being zero.
 */
export const isTransactionZeroPaymentError = error =>
  hasErrorWithCode(error, ERROR_CODE_CHARGE_ZERO_PAYIN);

/**
 * Check if the given API error (from `sdk.transaction.initiate()`) is
 * due to the transaction total amount being too low for Stripe.
 */
export const isTransactionInitiateAmountTooLowError = error => {
  const isZeroPayment = isTransactionZeroPaymentError(error);

  const tooLowAmount = errorAPIErrors(error).some(apiError => {
    const isPaymentFailedError =
      apiError.status === 402 && apiError.code === ERROR_CODE_PAYMENT_FAILED;
    let isAmountTooLow = false;

    try {
      // TODO: This is a temporary solution until a proper error code
      // for this specific error is received in the response.
      const msg = apiError.meta.stripeMessage;
      isAmountTooLow =
        msg.startsWith('Amount must be at least') ||
        msg.startsWith('Amount must convert to at least');
    } catch (e) {
      // Ignore
    }

    return isPaymentFailedError && isAmountTooLow;
  });

  return isZeroPayment || tooLowAmount;
};

/**
 * Check if the given API error (from `sdk.transaction.initiate()`) is
 * due to the transaction charge creation disabled by Stripe.
 */
export const isTransactionChargeDisabledError = error => {
  const chargeCreationDisabled = errorAPIErrors(error).some(apiError => {
    const isPaymentFailedError =
      apiError.status === 402 && apiError.code === ERROR_CODE_PAYMENT_FAILED;

    let isChargeCreationDisabled = false;
    try {
      const msg = apiError.meta.stripeMessage;
      isChargeCreationDisabled =
        msg.startsWith('Your account cannot currently make charges.') ||
        msg.match(/verification.disabled_reason/);
    } catch (e) {
      // Ignore
    }

    return isPaymentFailedError && isChargeCreationDisabled;
  });

  return chargeCreationDisabled;
};

/**
 * Check if the given API error (from `sdk.transaction.initiate()`) is
 * due to other error in Stripe.
 */
export const transactionInitiateOrderStripeErrors = error => {
  if (error) {
    return errorAPIErrors(error).reduce((messages, apiError) => {
      const isPaymentFailedError =
        apiError.status === 402 && apiError.code === ERROR_CODE_PAYMENT_FAILED;
      const hasStripeError = apiError && apiError.meta && apiError.meta.stripeMessage;
      const stripeMessageMaybe =
        isPaymentFailedError && hasStripeError ? [apiError.meta.stripeMessage] : [];
      return [...messages, ...stripeMessageMaybe];
    }, []);
  }
  return null;
};

/**
 * Check if the given API error (from `sdk.transactions.transition(id, transition, params)`)
 * is due to invalid transition attempt.
 */
export const isTransactionsTransitionInvalidTransition = error =>
  error &&
  error.status === 409 &&
  hasErrorWithCode(error, ERROR_CODE_TRANSACTION_INVALID_TRANSITION);

/**
 * Check if the given API error (from `sdk.transactions.transition(id, transition, params)`)
 * is due to already sent review.
 */
export const isTransactionsTransitionAlreadyReviewed = error =>
  error &&
  error.status === 409 &&
  (hasErrorWithCode(error, ERROR_CODE_TRANSACTION_ALREADY_REVIEWED_BY_CUSTOMER) ||
    hasErrorWithCode(error, ERROR_CODE_TRANSACTION_ALREADY_REVIEWED_BY_PROVIDER));

/**
 * Check if the given API error (from `sdk.currentUser.changeEmail(params)`)
 * is due to giving wrong password.
 */
export const isChangeEmailWrongPassword = error => error && error.status === 403;

/**
 * Check if the given API error (from `sdk.currentUser.changePassword(params)`)
 * is due to giving wrong password.
 */
export const isChangePasswordWrongPassword = error => error && error.status === 403;

/**
 * Check if the given API error (from `sdk.listings.open(params)` or `sdk.listings.publish(params)`)
 * is due to denied permission to post listings.
 */
export const isErrorNoPermissionToPostListings = error =>
  error &&
  error.status === 403 &&
  hasErrorWithCode(error, ERROR_CODE_PERMISSION_DENIED_POST_LISTINGS);

/**
 * Check if the given API error (from `sdk.transactions.initiate(params)`
 * is due to denied permission for users in pending-approval state.
 */
export const isErrorNoPermissionForUserPendingApproval = error =>
  error &&
  error.status === 403 &&
  hasErrorWithCode(error, ERROR_CODE_PERMISSION_DENIED_PENDING_APPROVAL);

/**
 * Check if the given API error (from `sdk.listings.query(params)`
 * is due to denied permission for users in pending-approval state.
 */
export const isErrorUserPendingApproval = error =>
  error && error.status === 403 && hasErrorWithCode(error, ERROR_CODE_USER_PENDING_APPROVAL);

/**
 * Check if the given API error (from `sdk.transactions.initiate(params)`
 * is due to denied permission to initiate transactions.
 */
export const isErrorNoPermissionForInitiateTransactions = error =>
  error &&
  error.status === 403 &&
  hasErrorWithCode(error, ERROR_CODE_PERMISSION_DENIED_INITIATE_TRANSACTIONS);

/**
 * Check if the given API error (from `sdk.transactions.initiate(params)`
 * is due to denied permission to view marketplace data.
 */
export const isErrorNoViewingPermission = error => {
  return (
    error && error.status === 403 && hasErrorWithCode(error, ERROR_CODE_PERMISSION_DENIED_READ)
  );
};

/**
 * Check if the given API error (from
 * 'sdk.stripeAccount.create(payoutDetails)') is due to
 * invalid postal code in the given country.
 */
export const isStripeInvalidPostalCode = error => {
  const msgRe = /^Invalid [A-Z]{2} postal code$/;
  return errorAPIErrors(error).some(apiError => {
    // Stripe doesn't seem to give an error code for this specific
    // case, so we have to recognize it from the message.
    const msg = apiError.meta && apiError.meta.stripeMessage ? apiError.meta.stripeMessage : '';
    return msgRe.test(msg);
  });
};

export const isStripeError = error => {
  return errorAPIErrors(error).some(apiError => {
    // Stripe doesn't seem to give an error code for this specific
    // case, so we have to recognize it from the message.
    return !!(apiError.meta && apiError.meta.stripeMessage);
  });
};

/**
 * Check if the given transition error is
 * due to no quantity information in the transition params.
 */
export const isTransitionQuantityInfoMissingError = error =>
  error?.status === 400 &&
  error?.statusText.startsWith('Error: transition should contain quantity information');

/**
 * Check if the minimum provider commission is larger than the
 * minimum price set for the listing
 */
export const isProviderCommissionBiggerThanMinPrice = error =>
  error?.status === 400 &&
  error?.statusText.startsWith(
    'Minimum commission amount is greater than the amount of money paid in'
  );

export const storableError = err => {
  const error = err || {};
  const { name, message, status, statusText } = error;
  // Status, statusText, and data.errors are (possibly) added to the error object by SDK
  const apiErrors = responseAPIErrors(error);

  // Returned object is the same as prop type check in util/types -> error
  return {
    type: 'error',
    name,
    message,
    status,
    statusText,
    apiErrors,
  };
};
