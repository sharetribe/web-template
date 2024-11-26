const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

module.exports = async (req, res) => {
  try {
    const integrationSdk = sharetribeIntegrationSdk.createInstance({
      clientId: process.env.SHARETRIBE_INTEGRATION_CLIENT_ID,
      clientSecret: process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET,
    });

    if (!req.body.transactionId) {
      return res.status(400).json({ error: 'Missing required transactionId in request body' });
    }

    const { transactionId, pageData, total, cardAmount, cardType, isPending, voucherFee } = req.body;
    console.log('REQ BODY', req.body);

    // Retrieve current transaction metadata
    const transaction = await integrationSdk.transactions.show({ id: transactionId });
    const currentMetadata = transaction?.data?.attributes?.protectedData || {};

    if (isPending) {
      // Handle pageData-based update
      const resolvedVoucherFee = pageData?.orderData?.voucherFee || voucherFee || {};
      const bookingTotal = total || 0;

      console.log('Updating transaction with pageData:', { transactionId, resolvedVoucherFee, bookingTotal });

      const updatedMetadata = {
        ...currentMetadata,
        status: 'pending',
        giftCardAmount: resolvedVoucherFee.amount_off || `${resolvedVoucherFee.percent_off}%`,
        giftCardCode: resolvedVoucherFee.code || '',
        giftCardType: resolvedVoucherFee.codeType || '',
        bookingTotal,
      };

      await integrationSdk.transactions
        .updateMetadata({
          id: transactionId,
          metadata: updatedMetadata,
        })
        .then(() => {
          res.status(200).json({ message: 'Transaction updated successfully (pageData).' });
        })
        .catch((err) => {
          console.error('Error updating transaction with pageData:', err);
          res.status(500).json({ error: 'Error updating transaction with pageData' });
        });
    } else if (isPending === false) {
      console.log('Updating transaction with card details:', { transactionId, cardAmount, cardType });

      if (cardType === 'giftCard') {
        const updatedMetadata = {
          ...currentMetadata,
          status: 'completed',
          giftCardAmount: cardAmount,
          giftCardType: cardType,
        };

        await integrationSdk.transactions
          .updateMetadata({
            id: transactionId,
            metadata: updatedMetadata,
          })
          .then(() => {
            res.status(200).json({ message: 'Transaction updated successfully (giftCard).' });
          })
          .catch((err) => {
            console.error('Error updating transaction with giftCard details:', err);
            res.status(500).json({ error: 'Error updating transaction with giftCard details' });
          });
      } else if (cardType === 'welfareCard') {
        const updatedMetadata = {
          ...currentMetadata,
          status: 'completed',
        };

        await integrationSdk.transactions
          .updateMetadata({
            id: transactionId,
            metadata: updatedMetadata,
          })
          .then(() => {
            res.status(200).json({ message: 'Transaction updated successfully (welfareCard).' });
          })
          .catch((err) => {
            console.error('Error updating transaction with welfareCard details:', err);
            res.status(500).json({ error: 'Error updating transaction with welfareCard details' });
          });
      } else {
        console.error('Unsupported card type:', cardType);
        return res.status(400).json({ error: `Unsupported card type: ${cardType}` });
      }
    } else {
      console.error('Invalid payload format:', req.body);
      res.status(400).json({ error: 'Invalid payload format. Missing required fields.' });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error occurred' });
  }
};