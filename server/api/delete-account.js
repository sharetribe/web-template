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

module.exports = (req, res) => {
  const { currentPassword } = req.body;

  const sdk = getSdk(req, res);

  const ongoingBookingsWithIncompletePaymentProcessing = () =>
    sdk.transactions.query({
      processNames: 'default-booking',
      states: stripeRelatedStatesForBookings.join(','),
    });
  const ongoingPurchasesWithIncompletePaymentProcessing = () =>
    sdk.transactions.query({
      processNames: 'default-purchase',
      states: stripeRelatedStatesForPurchases.join(','),
    });
  const ongoingNegotiationsWithIncompletePaymentProcessing = () =>
    sdk.transactions.query({
      processNames: 'default-negotiation',
      states: stripeRelatedStatesForNegotiation.join(','),
    });

  Promise.all([
    ongoingBookingsWithIncompletePaymentProcessing(),
    ongoingPurchasesWithIncompletePaymentProcessing(),
    ongoingNegotiationsWithIncompletePaymentProcessing(),
  ])
    .then(responses => {
      console.log('Promise.all complete');
      if (hasOngoingTransactionsWithIncompletePaymentProcessing(responses)) {
        console.log('hasOngoingTransactionsWithStripeRelatedStates - true');
        throw new Error(
          'User has transactions on states that include incomplete payment processing'
        );
      }
      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      return trustedSdk.currentUser.delete({ currentPassword });
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
      console.log('delete-account catch');
      handleError(res, e);
    });
};

const hasOngoingTransactionsWithIncompletePaymentProcessing = responses => {
  // Response format returns transaction array inside response.data.data
  const combinedTransactions = responses.flatMap(response => response?.data?.data);
  return combinedTransactions.length > 0;
};
