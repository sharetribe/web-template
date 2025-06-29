const { asyncHandler } = require('../api-util/asyncHandler');
const { getTrustedSdk } = require('../api-util/sdk');

// Use Sharetribe process transitions for adjustment
module.exports = asyncHandler(async (req, res) => {
    try {
        const { transactionId, newHours, newPrice } = req.body;
        
        // Use trusted SDK with user authentication context
        const sdk = await getTrustedSdk(req);

        // Fetch the transaction
        const transactionResult = await sdk.transactions.show({ id: transactionId, include: ['booking', 'provider', 'customer', 'listing'] });
        console.log('[AdjustBooking] transactionResult:', JSON.stringify(transactionResult, null, 2));
        if (transactionResult.status !== 200) {
            return res.status(transactionResult.status).json({ success: false, error: transactionResult.data });
        }
        if (!transactionResult.data) {
            console.error('[AdjustBooking] No data in transactionResult:', transactionResult);
            return res.status(500).json({ success: false, error: 'No transaction data returned from SDK' });
        }
        const transaction = transactionResult.data.data;
        const included = transactionResult.data.included || [];

        // Log current state and info
        console.log('[AdjustBooking] Transaction ID:', transactionId);
        // In Flex, state is inferred from lastTransition and process definition
        console.log('[AdjustBooking] Last transition:', transaction.attributes.lastTransition);
        console.log('[AdjustBooking] Process name:', transaction.attributes.processName);
        console.log('[AdjustBooking] Process version:', transaction.attributes.processVersion);
        // Log actor (provider/customer/operator) if available
        const providerId = transaction.relationships?.provider?.data?.id?.uuid;
        const customerId = transaction.relationships?.customer?.data?.id?.uuid;
        console.log('[AdjustBooking] Provider ID:', providerId);
        console.log('[AdjustBooking] Customer ID:', customerId);

        // Find the booking and listing entities in included
        const booking = included.find(e => e.type === 'booking');
        const listing = included.find(e => e.type === 'listing');
        if (!booking || !listing) {
            console.error('[AdjustBooking] Missing booking or listing in included:', included);
            return res.status(500).json({ success: false, error: 'Missing booking or listing entity' });
        }

        // Get previous price from booking (for diff calculation)
        const previousPrice = booking?.attributes?.price?.amount || null;
        const prevTotal = previousPrice ? Number(previousPrice) : 0;
        const newTotal = newPrice ? Number(newPrice) : 0;
        const diff = newTotal - prevTotal;

        // Choose transition
        let transition;
        if (diff > 0) {
            transition = 'transition/provider-adjust-booking-charge';
        } else if (diff < 0) {
            transition = 'transition/provider-adjust-booking-refund';
        } else {
            // No adjustment needed
            console.log('[AdjustBooking] No adjustment needed.');
            return res.status(200).json({ success: true, message: 'No adjustment needed', adjustment: null });
        }

        console.log('[AdjustBooking] Attempting transition:', transition);

        // Use existing transaction line items and update amounts
        const existingLineItems = transaction.attributes.lineItems || [];
        console.log('[AdjustBooking] Existing line items:', JSON.stringify(existingLineItems, null, 2));
        
        // Create new line items based on existing structure
        const lineItems = existingLineItems.map(item => {
            const newItem = { ...item };
            
            if (item.code === 'line-item/hour') {
                newItem.unitPrice = { ...item.unitPrice, amount: newPrice };
                // Calculate new line total based on unit price * new hours
                const newLineTotal = Math.round(newPrice * newHours);
                newItem.lineTotal = { ...item.lineTotal, amount: newLineTotal };
                newItem.quantity = newHours.toString();
            } else if (item.code === 'line-item/provider-commission') {
                // Update provider commission based on new total
                const newTotal = Math.round(newPrice * newHours);
                const commissionAmount = Math.round(newTotal * (item.percentage / 100));
                newItem.unitPrice = { ...item.unitPrice, amount: newTotal };
                newItem.lineTotal = { ...item.lineTotal, amount: commissionAmount };
            }
            
            return newItem;
        });
        
        console.log('[AdjustBooking] Modified line items:', JSON.stringify(lineItems, null, 2));
        
        // Calculate total to verify it matches
        const totalAmount = lineItems.reduce((sum, item) => {
            if (item.includeFor.includes('customer')) {
                return sum + item.lineTotal.amount;
            }
            return sum;
        }, 0);
        console.log('[AdjustBooking] Calculated total amount:', totalAmount, 'Expected:', Math.round(newPrice * 100));

        // Call the transition with adjustment metadata and new line items
        const transitionResult = await sdk.transactions.transition({
            id: transactionId,
            transition,
            params: {
                metadata: {
                    adjustment: {
                        newHours,
                        newPrice: newTotal,
                        diff,
                        adjustedAt: new Date().toISOString(),
                    },
                },
                lineItems,
            },
        });

        console.log('[AdjustBooking] Transition result status:', transitionResult.status);
        if (transitionResult.status !== 200) {
            console.error('[AdjustBooking] Transition failed:', transitionResult.data);
            return res.status(transitionResult.status).json({ success: false, error: transitionResult.data });
        }

        return res.status(200).json({
            success: true,
            transaction: transitionResult.data,
        });
    } catch (err) {
        // console.error('[AdjustBooking] Unexpected error:', err);
        if (err.response && err.response.data) {
            console.error('[AdjustBooking] Flex error response:', JSON.stringify(err.response.data, null, 2));
        } else if (err.data) {
            console.error('[AdjustBooking] Flex error data:', JSON.stringify(err.data, null, 2));
        }
        return res.status(500).json({ success: false, error: err.message, stack: err.stack, flex: err.response?.data || err.data });
    }
}); 