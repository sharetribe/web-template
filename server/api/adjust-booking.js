const { asyncHandler } = require('../api-util/asyncHandler');
const { getISdk } = require('../api-util/sdk');
const { transactionLineItems } = require('../api-util/lineItems');

// Use Sharetribe process transitions for adjustment
module.exports = asyncHandler(async (req, res) => {
    try {
        const { transactionId, newHours, newPrice } = req.body;
        const isdk = getISdk();

        // Fetch the transaction
        const transactionResult = await isdk.transactions.show({ id: transactionId, include: ['booking', 'provider', 'customer', 'listing'] });
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

        // Build new line items for the adjustment (assume hourly booking)
        const orderData = {
            bookingStart: booking.attributes.start,
            bookingEnd: booking.attributes.end,
            // For hourly, quantity is hours; for other types, adjust accordingly
            quantity: newHours,
            // If you want to override price, you may need to adjust price logic in transactionLineItems
        };
        // For now, pass commissions as null (or fetch from listing if needed)
        const lineItems = await transactionLineItems(listing, orderData, null, null);
        // Override the unitPrice and lineTotal for the main line item to match newPrice
        if (lineItems.length > 0) {
            lineItems[0].unitPrice.amount = Math.round(newPrice * 100); // newPrice is in major units
            lineItems[0].lineTotal = { _sdkType: 'Money', amount: Math.round(newPrice * 100), currency: lineItems[0].unitPrice.currency };
            lineItems[0].quantity = newHours;
        }

        // Call the transition with adjustment metadata and new line items
        const transitionResult = await isdk.transactions.transition({
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
            adjustment: transitionResult.data.attributes.metadata.adjustment,
            transaction: transitionResult.data,
        });
    } catch (err) {
        console.error('[AdjustBooking] Unexpected error:', err);
        if (err.response && err.response.data) {
            console.error('[AdjustBooking] Flex error response:', JSON.stringify(err.response.data, null, 2));
        } else if (err.data) {
            console.error('[AdjustBooking] Flex error data:', JSON.stringify(err.data, null, 2));
        }
        return res.status(500).json({ success: false, error: err.message, stack: err.stack, flex: err.response?.data || err.data });
    }
}); 