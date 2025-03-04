const { getTrustedSdk, serialize } = require('../../../../common/sdk');
const {
  SELL_PURCHASE_PROCESS_NAME,
  transitions,
} = require('../../../transactions/transactionProcessSellPurchase');
const { denormalisedResponseEntities } = require('../../../../common/data/data');
const sendDisputeEmail = require('../../../common/utils/sendDisputeEmail');

const initiateDispute = async (req, res) => {
  const { body, currentUser = {} } = req;
  const { txId, disputeReason } = body;
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
      provider,
      customer,
    } = denormalisedResponseEntities(transactionResponse)[0];

    const {
      id: { uuid: providerId },
      attributes: {
        profile: { displayName: providerName },
      },
    } = provider || {};
    const {
      id: { uuid: customerId },
      attributes: {
        profile: { displayName: customerName },
      },
    } = customer || {};

    // Possible invalid values
    if (
      processName !== SELL_PURCHASE_PROCESS_NAME ||
      !providerId ||
      !customerId ||
      (userId !== providerId && userId !== customerId) ||
      lastTransition !== transitions.EXPIRE_PAYMENT_HOLD_PERIOD
    ) {
      throw new Error('Invalid transaction details');
    }

    const isProvider = userId === providerId;
    const transitionParams = isProvider
      ? {
          transition: transitions.SELLER_ISSUE_REFUND,
          params: {
            protectedData: {
              providerDisputeReason: disputeReason,
            },
          },
        }
      : {
          transition: transitions.BUYER_ISSUE_REFUND,
          params: {
            protectedData: {
              customerDisputeReason: disputeReason,
            },
          },
        };

    const response = await trustedSdk.transactions.transition(
      {
        id: txId,
        ...transitionParams,
      },
      { expand: true }
    );

    await sendDisputeEmail({ txId: txId.uuid, providerName, customerName, isProvider });

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
  } catch (error) {
    return res.status(500).json({
      name: 'internal-error',
      message: error.message || error,
    });
  }
};

module.exports = initiateDispute;
