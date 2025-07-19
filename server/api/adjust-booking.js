const { asyncHandler } = require('../api-util/asyncHandler');
const { getTrustedSdk } = require('../api-util/sdk');

// Stripe integration for refunds and additional charges
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
const stripe = require('stripe')(STRIPE_API_KEY);

// Helper function to get the original charge ID from transaction
const getOriginalChargeId = async (transaction) => {
    try {
        console.log('[AdjustBooking] getOriginalChargeId - transaction ID:', transaction?.id?.uuid);
        console.log('[AdjustBooking] getOriginalChargeId - transaction protected data:', transaction?.attributes?.protectedData);
        console.log('[AdjustBooking] getOriginalChargeId - transaction metadata:', transaction?.attributes?.metadata);

        // Second, look for payment intent information in metadata (persistent storage)
        const metadata = transaction.attributes?.metadata;
        if (metadata?.persistentPaymentIntent?.stripePaymentIntentId) {
            console.log('[AdjustBooking] getOriginalChargeId - found payment intent in metadata:', metadata.persistentPaymentIntent.stripePaymentIntentId);
            const paymentIntentId = metadata.persistentPaymentIntent.stripePaymentIntentId;

            // Retrieve the payment intent from Stripe to get the charge ID
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            console.log('[AdjustBooking] getOriginalChargeId - payment intent:', paymentIntent);
            if (paymentIntent?.latest_charge) {
                console.log('[AdjustBooking] getOriginalChargeId - found charge ID from metadata:', paymentIntent.latest_charge);
                return {
                    chargeId: paymentIntent.latest_charge,
                    paymentMethodId: paymentIntent.payment_method,
                    paymentIntentId: paymentIntentId
                };
            }
        }

        console.log('[AdjustBooking] getOriginalChargeId - no charge ID found');
        return null;
    } catch (error) {
        console.error('[AdjustBooking] Error getting original charge ID:', error);
        return null;
    }
};

// Helper function to process refund
const processRefund = async (chargeId, refundAmount, paymentIntentId) => {
    try {
        console.log(`[AdjustBooking] Processing refund: ${refundAmount} for charge: ${chargeId}`);

        // Validate refund amount
        if (refundAmount <= 0) {
            return { success: false, error: 'Invalid refund amount' };
        }

        const refund = await stripe.refunds.create({
            // charge: chargeId,
            payment_intent: paymentIntentId,
            amount: refundAmount,
            metadata: {
                reason: 'booking_adjustment',
                adjustment_type: 'refund',
                processed_at: new Date().toISOString()
            }
        });

        console.log('[AdjustBooking] Refund processed successfully:', refund.id);
        return {
            success: true,
            refundId: refund.id,
            refund,
            amount: refundAmount,
        };
    } catch (error) {
        console.error('[AdjustBooking] Refund failed:', error);
        return { success: false, error: error.message, stripeError: error };
    }
};

// Helper function to process additional charge
const processAdditionalCharge = async (customerId, paymentMethodId, chargeAmount, currency, transactionId) => {
    try {
        console.log(`[AdjustBooking] Processing additional charge: ${chargeAmount} ${currency} for customer: ${customerId}`);

        // Validate charge amount
        if (chargeAmount <= 0) {
            return { success: false, error: 'Invalid charge amount' };
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(chargeAmount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            customer: customerId,
            payment_method: paymentMethodId,
            confirm: true,
            off_session: true, // Since this is an adjustment, not user-initiated
            metadata: {
                transaction_id: transactionId,
                reason: 'booking_adjustment',
                adjustment_type: 'additional_charge',
                processed_at: new Date().toISOString()
            }
        });

        console.log('[AdjustBooking] Additional charge processed successfully:', paymentIntent.id);
        return {
            success: true,
            paymentIntentId: paymentIntent.id,
            paymentIntent,
            amount: chargeAmount,
            currency: currency
        };
    } catch (error) {
        console.error('[AdjustBooking] Additional charge failed:', error);
        return { success: false, error: error.message, stripeError: error };
    }
};

// Use Sharetribe process transitions for adjustment
module.exports = asyncHandler(async (req, res) => {
    try {
        const { transactionId, newHours, newPrice } = req.body;

        // Validate input parameters
        if (!transactionId || !newHours || !newPrice) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters: transactionId, newHours, and newPrice are required' 
            });
        }

        // Validate hours limit (max 8 hours)
        if (newHours > 8) {
            return res.status(400).json({ 
                success: false, 
                error: 'Booking adjustment cannot exceed 8 hours. Please contact support for larger adjustments.' 
            });
        }

        if (newHours < 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Booking adjustment cannot be negative' 
            });
        }

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
        console.log('[AdjustBooking] Transaction protected data:', transaction.attributes?.protectedData);
        console.log('[AdjustBooking] Transaction metadata:', transaction.attributes?.metadata);
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
        const prevTotal = transaction?.attributes?.payinTotal.amount;
        const newTotal = newPrice * newHours;
        const diff = newTotal - prevTotal;
        console.log('[AdjustBooking] Previous total:', prevTotal);
        console.log('[AdjustBooking] New total:', newTotal);
        console.log('[AdjustBooking] Diff:', diff);

        if (diff == 0) {
            // No adjustment needed
            console.log('[AdjustBooking] No adjustment needed.');
            return res.status(200).json({ success: true, message: 'No adjustment needed', adjustment: null });
        }

        const transition = 'transition/provider-adjust-booking-charge';
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
        console.log('[AdjustBooking] Calculated total amount:', totalAmount);

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

        // After successful transition, handle Stripe payment processing
        let stripeResult = null;
        const currency = transaction.attributes.currency || 'USD';
        const absDiff = Math.abs(diff);

        if (diff < 0) {
            // Process refund
            const originalChargeId = await getOriginalChargeId(transaction);
            if (originalChargeId) {
                stripeResult = await processRefund(
                    originalChargeId.chargeId,
                    absDiff,
                    originalChargeId.paymentIntentId,
                );
            } else {
                console.warn('[AdjustBooking] Could not find original charge ID for refund');
                stripeResult = { success: false, error: 'Original charge ID not found' };
            }
        } else if (diff > 0) {
            // Process additional charge
            // Get payment method from persistent payment intent data
            const metadata = transaction.attributes?.metadata;
            const persistentPaymentIntent = metadata?.persistentPaymentIntent;

            if (persistentPaymentIntent?.paymentIntent?.payment_method) {
                const paymentMethodId = persistentPaymentIntent.paymentIntent.payment_method;
                console.log('[AdjustBooking] Using payment method from persistent payment intent:', paymentMethodId);

                // Get customer ID from the payment intent using Stripe SDK
                const paymentIntentId = persistentPaymentIntent.stripePaymentIntentId;
                console.log('[AdjustBooking] Retrieving payment intent from Stripe to get customer ID:', paymentIntentId);

                try {
                    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                    const customerId = paymentIntent.customer;

                    if (customerId) {
                        console.log('[AdjustBooking] Found customer ID from payment intent:', customerId);
                        stripeResult = await processAdditionalCharge(
                            customerId,
                            paymentMethodId,
                            absDiff / 100,
                            currency,
                            transactionId
                        );
                    } else {
                        console.warn('[AdjustBooking] No customer ID found in payment intent');
                        stripeResult = { success: false, error: 'Customer ID not found in payment intent' };
                    }
                } catch (error) {
                    console.error('[AdjustBooking] Error retrieving payment intent from Stripe:', error);
                    stripeResult = { success: false, error: 'Failed to retrieve payment intent from Stripe' };
                }
            } else {
                console.warn('[AdjustBooking] No payment method found in persistent payment intent data');
                console.log('[AdjustBooking] Persistent payment intent data:', persistentPaymentIntent);
                stripeResult = { success: false, error: 'Payment method not found in persistent data' };
            }
        }

        return res.status(200).json({
            success: true,
            transaction: transitionResult.data,
            stripeResult,
            adjustment: {
                diff,
                newHours,
                newPrice: newTotal,
                currency,
                transition: transition,
                stripeProcessed: stripeResult ? stripeResult.success : false
            }
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