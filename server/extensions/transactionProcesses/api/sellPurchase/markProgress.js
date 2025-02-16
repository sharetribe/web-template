const { getTrustedSdk, integrationSdk, serialize } = require('../../../common/sdk');
const {
  SELL_PURCHASE_PROCESS_NAME,
  transitions,
  markProgressLastTransitions,
  markProgressPossibleNextTransitions,
} = require('./transactions/transactionProcessSellPurchase');

const markProgress = async (req, res) => {
  const { params, query, body, currentUser = {} } = req;
  const { txId } = body;
  const {
    id: { uuid: userId },
  } = currentUser;

  if (!txId) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'Unrecognized user' });
  }

  try {
    const trustedSdk = await getTrustedSdk(req);

    const transactionResponse = await trustedSdk.transactions.show({
      id: txId,
      include: ['provider', 'customer'],
    });

    const {
      attributes: { metadata: txMetadata = {}, processName, lastTransition },
      relationships: { provider, customer } = {},
    } = transactionResponse?.data?.data;

    const providerId = provider?.data?.id.uuid;
    const customerId = customer?.data?.id.uuid;

    // Possible invalid values
    if (processName !== SELL_PURCHASE_PROCESS_NAME) {
      throw new Error('Invalid transaction process');
    }
    if (!markProgressLastTransitions.includes(lastTransition)) {
      throw new Error('Invalid transaction state');
    }
    if (!providerId || !customerId) {
      throw new Error('Invalid transaction data');
    }
    if (userId !== providerId && userId !== customerId) {
      throw new Error('User is not in transaction');
    }

    if (userId === providerId) {
      const { sellerMarkMachinePlaced } = txMetadata;

      if (sellerMarkMachinePlaced) {
        return res
          .status(400)
          .json({ error: 'Seller have already marked introduced buyer to manager' });
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
    }

    if (userId === customerId) {
      const { buyerMarkMetManager } = txMetadata;

      const buyerUpdateProgressPromise = buyerMarkMetManager
        ? trustedSdk.transactions.transition(
            {
              id: txId,
              transition: markProgressPossibleNextTransitions[lastTransition],
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
    }

    return res.status(400).json({ error: 'User is not in transaction' });
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
  }
};

module.exports = markProgress;
