const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

module.exports = async (req, res) => {

  try {

    const integrationSdk = sharetribeIntegrationSdk.createInstance({
        clientId: process.env.SHARETRIBE_INTEGRATION_CLIENT_ID,
        clientSecret: process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET,
    });

    // Validate the required fields from the request body
    if (!req.body.transactionId || !req.body.pageData) {
      return res.status(400).json({ error: 'Missing required transactionId or pageData in request body' });
    }

    const pageData = req.body.pageData;

    // Ensure voucherFee and other fields are properly handled
    const voucherFee = pageData.orderData?.voucherFee || {};
    const total = pageData.orderData?.total || 0;
    // Update metadata in the transaction
    await integrationSdk.transactions
      .updateMetadata({
        id: req.body.transactionId,
        metadata: {
          status: 'pending',
          giftCardAmount: voucherFee.amount_off || `${voucherFee.percent_off}%`,
          giftCardCode: voucherFee.code || '',
          giftCardType: voucherFee.codeType || '',
          bookingTotal: req.body.total,
        },
      })
      .then(() => {
        res.status(200).json({ message: 'Transaction updated successfully' });
      })
      .catch((err) => {
        console.error('Error updating transaction:', err);
        res.status(500).json({ error: 'Error updating transaction' });
      });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error occurred' });
  }
};
