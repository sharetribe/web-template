const Stripe = require('stripe');
const sharetribeSdk = require('sharetribe-flex-sdk');
const { transactionLineItems } = require('../api-util/lineItems');
const { isIntentionToMakeOffer } = require('../api-util/negotiation');
const { calculateTotalForCustomer } = require('../api-util/lineItemHelpers');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

const { Money } = sharetribeSdk.types;

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const BOOKING_TRANSITIONS = [
  'transition/request-payment',
  'transition/request-payment-after-inquiry',
];

const listingPromise = (sdk, id) => sdk.listings.show({ id });

const getFullOrderData = (orderData, bodyParams, currency) => {
  const { offerInSubunits } = orderData || {};
  const transitionName = bodyParams.transition;

  return isIntentionToMakeOffer(offerInSubunits, transitionName)
    ? {
        ...orderData,
        ...bodyParams.params,
        currency,
        offer: new Money(offerInSubunits, currency),
      }
    : { ...orderData, ...bodyParams.params };
};

const getMetadata = (orderData, transition) => {
  const { actor, offerInSubunits } = orderData || {};
  const hasActor = ['provider', 'customer'].includes(actor);
  const by = hasActor ? actor : null;

  return isIntentionToMakeOffer(offerInSubunits, transition)
    ? {
        metadata: {
          offers: [
            {
              offerInSubunits,
              by,
              transition,
            },
          ],
        },
      }
    : {};
};


module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body || {};
  const transitionName = bodyParams.transition;
  const isBookingTransition = BOOKING_TRANSITIONS.includes(transitionName);
  const sdk = getSdk(req, res);
  let lineItems = null;
  let metadataMaybe = {};

  Promise.all([listingPromise(sdk, bodyParams?.params?.listingId), fetchCommission(sdk)])
    .then(([showListingResponse, fetchAssetsResponse]) => {
      const listing = showListingResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const currency = listing.attributes.price?.currency || orderData.currency;
      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      lineItems = transactionLineItems(
        listing,
        getFullOrderData(orderData, bodyParams, currency),
        providerCommission,
        customerCommission
      );
      metadataMaybe = getMetadata(orderData, transitionName);

      // For actual (non-speculative) booking initiation, create a Stripe PaymentIntent
      if (!isSpeculative && isBookingTransition) {
        const customerTotal = calculateTotalForCustomer(lineItems);
        const amountInSubunits = customerTotal.amount;
        const currency = customerTotal.currency?.toLowerCase() || listing.attributes.price?.currency?.toLowerCase() || 'usd';

        return stripe.paymentIntents
          .create({
            amount: amountInSubunits,
            currency,
            capture_method: 'manual',
            metadata: {
              listingId: bodyParams?.params?.listingId?.uuid || '',
            },
          })
          .then(paymentIntent => ({ paymentIntent, lineItems }));
      }

      return Promise.resolve({ paymentIntent: null, lineItems });
    })
    .then(({ paymentIntent }) => getTrustedSdk(req).then(trustedSdk => ({ trustedSdk, paymentIntent })))
    .then(({ trustedSdk, paymentIntent }) => {
      const { params } = bodyParams;

      // If we created a PaymentIntent, inject it into protectedData in the
      // exact shape the Sharetribe Web Template frontend expects
      const stripePaymentIntentsMaybe =
        paymentIntent
          ? {
              stripePaymentIntents: {
                default: {
                  stripePaymentIntentId: paymentIntent.id,
                  stripePaymentIntentClientSecret: paymentIntent.client_secret,
                },
              },
            }
          : {};

      const body = {
        ...bodyParams,
        params: {
          ...params,
          lineItems,
          ...metadataMaybe,
          protectedData: {
            ...(params.protectedData || {}),
            ...stripePaymentIntentsMaybe,
          },
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.initiateSpeculative(body, queryParams);
      }
      return trustedSdk.transactions.initiate(body, queryParams);
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
      handleError(res, e);
    });
};
