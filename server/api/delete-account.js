const { getSdk, getTrustedSdk, handleError, serialize } = require('../api-util/sdk');

const stripeRelatedStatesForBookings = [
  'state/pending-payment',
  'state/preauthorized',
  'state/accepted',
  'state/delivered',
];
const stripeRelatedStatesForPurchases = [
  'state/pending-payment',
  'state/purchased',
  'state/delivered',
  'state/disputed',
  'state/received',
];
const stripeRelatedStatesForNegotiation = [
  'state/pending-payment',
  'state/offer-accepted',
  'state/delivered',
  'state/changes-requested',
  'state/completed',
];

const HAS_INCOMPLETE_TRANSACTIONS =
  'User has transactions on states that include incomplete payment processing';

module.exports = (req, res) => {
  const { currentPassword } = req.body;

  const sdk = getSdk(req, res);

  // Booking states that contain Stripe payment processing
  const ongoingBookingsWithIncompletePaymentProcessing = () =>
    sdk.transactions.query({
      processNames: 'default-booking',
      states: stripeRelatedStatesForBookings.join(','),
    });

  // Purchase states that contain Stripe payment processing
  const ongoingPurchasesWithIncompletePaymentProcessing = () =>
    sdk.transactions.query({
      processNames: 'default-purchase',
      states: stripeRelatedStatesForPurchases.join(','),
    });

  // Negotiation states that contain Stripe payment processing
  const ongoingNegotiationsWithIncompletePaymentProcessing = () =>
    sdk.transactions.query({
      processNames: 'default-negotiation',
      states: stripeRelatedStatesForNegotiation.join(','),
    });

  // Check for any states that may contain incomplete Stripe actions
  Promise.all([
    ongoingBookingsWithIncompletePaymentProcessing(),
    ongoingPurchasesWithIncompletePaymentProcessing(),
    ongoingNegotiationsWithIncompletePaymentProcessing(),
  ])
    .then(responses => {
      if (hasOngoingTransactionsWithIncompletePaymentProcessing(responses)) {
        throw new Error(HAS_INCOMPLETE_TRANSACTIONS);
      }
      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      return trustedSdk.currentUser.delete({ currentPassword, deleteFromStripe: true });
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => {
      const options = e.message === HAS_INCOMPLETE_TRANSACTIONS ? { skipErrorLogging: true } : {};
      handleError(res, e, options);
    });
};

/// Returns true if any array in responses is not empty
const hasOngoingTransactionsWithIncompletePaymentProcessing = responses => {
  // Response format returns transaction array inside response.data.data
  const combinedTransactions = responses.flatMap(response => response?.data?.data);
  return combinedTransactions.length > 0;
};
