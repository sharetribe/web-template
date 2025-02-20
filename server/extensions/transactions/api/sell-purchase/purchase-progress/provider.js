const { integrationSdk, serialize } = require('../../../../common/sdk');

const updateProgress = async ({ res, txId, txMetadata }) => {
  const { sellerMarkMachinePlaced } = txMetadata;

  if (sellerMarkMachinePlaced) {
    return res.status(400).json({
      name: 'invalid-transaction-state',
      message: 'Invalid transaction state',
    });
  }

  const response = await integrationSdk.transactions.updateMetadata(
    {
      id: txId,
      metadata: {
        sellerMarkMachinePlaced: new Date().toISOString(),
      },
    },
    { expand: true }
  );

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
