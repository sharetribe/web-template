const { getSdk, getTrustedSdk, handleError } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { currentPassword } = req.body;

  const sdk = getSdk(req, res);

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

  const ongoingBookingsWithStripeRelatedStates = () =>
    sdk.transactions.query({
      processNames: 'default-booking',
      states: stripeRelatedStatesForBookings.join(','),
    });
  const ongoingPurchasesWithStripeRelatedStates = () =>
    sdk.transactions.query({
      processNames: 'default-purchase',
      states: stripeRelatedStatesForPurchases.join(','),
    });
  const ongoingNegotiationsWithStripeRelatedStates = () =>
    sdk.transactions.query({
      processNames: 'default-negotiation',
      states: stripeRelatedStatesForNegotiation.join(','),
    });

  Promise.all([
    ongoingBookingsWithStripeRelatedStates(),
    ongoingPurchasesWithStripeRelatedStates(),
    ongoingNegotiationsWithStripeRelatedStates(),
  ])
    .then(responses => {
      console.log('Promise.all complete');
      if (hasOngoingTransactionsWithStripeRelatedStates(responses)) {
        console.log('hasOngoingTransactionsWithStripeRelatedStates - true');
        throw new Error('Account has ongoing transactions with Stripe states');
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

const hasOngoingTransactionsWithStripeRelatedStates = transactions => {
  return transactions.length > 0;
};
