const { integrationSdk } = require('../../../../common/sdk');
const { stripeInstance } = require('../../../utils/getStripeInstance');
const {
  SELL_PURCHASE_PROCESS_NAME,
  transitions,
} = require('../../sell-purchase/transactions/transactionProcessSellPurchase');

const handleExpireIntent = async chargeObject => {
  const { ['payment_intent']: paymentIntentId } = chargeObject;

  const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);
  const { 'sharetribe-transaction-id': txId } = paymentIntent.metadata;

  if (!txId) {
    throw new Error('Invalid transaction ID');
  }

  const transactionResponse = await integrationSdk.transactions.show({
    id: txId,
  });

  const { processName, lastTransition } = transactionResponse.data.data?.attributes;

  if (processName !== SELL_PURCHASE_PROCESS_NAME) {
    throw new Error('Invalid transaction process');
  }
  if (lastTransition !== transitions.SELLER_CONFIRM_PURCHASE) {
    throw new Error('Invalid transaction state');
  }

  await integrationSdk.transactions.transition({
    id: txId,
    transition: transitions.OPERATOR_CANCEL_TRANSITION_AFTER_EXPIRE_INTENT,
  });
};

module.exports = handleExpireIntent;
