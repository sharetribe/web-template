const { asyncHandler } = require('../api-util/asyncHandler');
const { getISdk } = require('../api-util/sdk');

module.exports = asyncHandler(async (req, res) => {
  try {
    const { transactionId, metadata } = req.body;
    
    if (!transactionId || !metadata) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: transactionId and metadata' 
      });
    }

    // Use integration SDK for metadata updates
    const isdk = getISdk();

    console.log('[UpdateTransactionMetadata] Updating metadata for transaction:', transactionId);
    console.log('[UpdateTransactionMetadata] New metadata:', metadata);

    // Update the transaction metadata using integration SDK
    const result = await isdk.transactions.updateMetadata({
      id: transactionId,
      metadata: metadata
    });

    if (result.status !== 200) {
      console.error('[UpdateTransactionMetadata] Failed to update metadata:', result.data);
      return res.status(result.status).json({ 
        success: false, 
        error: result.data 
      });
    }

    console.log('[UpdateTransactionMetadata] Successfully updated metadata');
    
    return res.status(200).json({
      success: true,
      transaction: result.data
    });

  } catch (err) {
    console.error('[UpdateTransactionMetadata] Unexpected error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message, 
      stack: err.stack 
    });
  }
}); 