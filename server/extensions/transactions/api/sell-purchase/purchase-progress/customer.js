const { serialize, integrationSdk } = require('../../../../common/sdk');
const {
  markProgressPossibleNextTransitions,
} = require('../transactions/transactionProcessSellPurchase');

const updateProgress = async ({ res, trustedSdk, txId, txMetadata, lastTransition }) => {
  const { buyerMarkMetManager } = txMetadata;

  const buyerUpdateProgressPromise = buyerMarkMetManager
    ? trustedSdk.transactions.transition(
        {
          id: txId,
          transition: markProgressPossibleNextTransitions[lastTransition],
          params: {},
        },
        { expand: true }
      )
    : integrationSdk.transactions.updateMetadata(
        {
          id: txId,
          metadata: {
            buyerMarkMetManager: new Date().toISOString(),
          },
        },
        { expand: true }
      );

  const response = await buyerUpdateProgressPromise;

  const { status, statusText, data } = response;
  return res
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
};

module.exports = updateProgress;
