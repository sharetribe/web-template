const { getTrustedSdk } = require('../../../../common/sdk');
const {
  SELL_PURCHASE_PROCESS_NAME,
  updateProgressLastTransitions,
} = require('../transactions/transactionProcessSellPurchase');
const updateProgressProvider = require('./provider');
const updateProgressCustomer = require('./customer');

const updateProgress = async (req, res) => {
  const { body, currentUser = {} } = req;
  const { txId } = body;
  const {
    id: { uuid: userId },
  } = currentUser;

  if (!txId || !userId) {
    return res.status(400).json({
      name: 'invalid-params',
      message: 'Invalid params',
    });
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
    if (
      processName !== SELL_PURCHASE_PROCESS_NAME ||
      !providerId ||
      !customerId ||
      (userId !== providerId && userId !== customerId) ||
      !updateProgressLastTransitions.includes(lastTransition)
    ) {
      throw new Error('Invalid transaction details');
    }

    if (userId === providerId) {
      return await updateProgressProvider({ res, txId, txMetadata });
    }

    if (userId === customerId) {
      return await updateProgressCustomer({ res, trustedSdk, txId, txMetadata, lastTransition });
    }

    return res.status(400).json({
      name: 'invalid-params',
      message: 'Invalid params',
    });
  } catch (error) {
    return res.status(500).json({
      name: 'internal-error',
      message: error.message || error,
    });
  }
};

module.exports = updateProgress;
