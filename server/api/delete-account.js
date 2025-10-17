const { getSdk, getTrustedSdk, handleError } = require('../api-util/sdk');

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
    .then(response => {
      // respond to the /api/delete-account call
    })
    .catch(e => {
      console.log('delete-account catch');
      handleError(res, e);
    });
};

const hasOngoingTransactionsWithIncompletePaymentProcessing = responses => {
  return responses.some(map => {
    const queryResults = map?.data?.data;
    return Array.isArray(queryResults) && queryResults.length > 0;
  });
};
