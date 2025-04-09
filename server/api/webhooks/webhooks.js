const { getISdk, getSdk } = require('../../api-util/sdk');
const integrationSdk = getISdk();
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
const stripe = require('stripe')(STRIPE_API_KEY);
// If you are testing your webhook locally with the Stripe CLI you
// can find the endpoint's secret by running `stripe listen`
// Otherwise, find your endpoint's secret in your webhook settings in the Developer Dashboard
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;


async function updateUserMetadata(userId, isSubscribed) {
    try {
        let metadata = {
            isSubscribed: isSubscribed,  // Set true for subscribed users
        };
        
        // Add provider_commission_percentage of 3% if user is subscribed
        if (isSubscribed) {
            metadata.provider_commission_percentage = 3;
        } else {
            // When unsubscribing, we need to explicitly remove the provider_commission_percentage
            // by setting it to null, which will remove it from the metadata
            metadata.provider_commission_percentage = null;
        }
        
        await integrationSdk.users.updateProfile({
            id: userId,
            metadata: metadata
        });
        console.log("User metadata updated successfully!");
    } catch (error) {
        console.error("Error updating user metadata:", error);
    }
}

async function findUserByEmail(email) {
    try {
        // Search for user by email in Sharetribe
        const response = await integrationSdk.users.show({
            email: email
        });
        return response.data.data;
    } catch (error) {
        console.error("Error finding user by email:", error);
        return null;
    }
}

const subscriptionCreated = async (req, res) => {

    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.log('`Webhook Error:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'customer.subscription.created':
            const customerSubscription = event.data.object;
            console.log('Customer subscription created!');
            
            try {
                // Fetch customer details from Stripe
                const customer = await stripe.customers.retrieve(customerSubscription.customer);
                // console.log('customer', customer);
                
                // customer.email = 'guy.pavlov@rel-ai-able.com';
                // Find Sharetribe user by email
                const user = await findUserByEmail(customer.email);
                // console.log('user', user);
                
                // if (user) {
                //     // Update user metadata to mark as subscribed
                //     await updateUserMetadata(user.id.uuid, true);
                //     console.log(`Updated subscription status for user: ${customer.email}`);
                // } else {
                //     console.log(`No Sharetribe user found for email: ${customer.email}`);
                // }
            } catch (error) {
                console.error('Error processing subscription:', error);
            }
            break;
        case 'customer.subscription.deleted':
            const customerSubscriptionDeleted = event.data.object;
            console.log('Customer subscription deleted!');
            
            try {
                // Fetch customer details from Stripe
                const customer = await stripe.customers.retrieve(customerSubscriptionDeleted.customer);
                
                // Find Sharetribe user by email
                const user = await findUserByEmail(customer.email);
                
                if (user) {
                    // Update user metadata to mark as unsubscribed
                    await updateUserMetadata(user.id.uuid, false);
                    console.log(`Updated subscription status for user: ${customer.email}`);
                } else {
                    console.log(`No Sharetribe user found for email: ${customer.email}`);
                }
            } catch (error) {
                console.error('Error processing subscription deletion:', error);
            }
            break;
        case 'customer.subscription.updated':
            try {
                // Fetch customer details from Stripe
                const customer = await stripe.customers.retrieve(event.data.object.customer);
                
                // Find Sharetribe user by email
                const user = await findUserByEmail(customer.email);
                
                if (user && event.data.object.status === 'active') {
                    // Update user metadata to mark as subscribed if status is active
                    await updateUserMetadata(user.id.uuid, true);
                    console.log(`Updated subscription status for user: ${customer.email}`);
                } else {
                    console.log(`No Sharetribe user found for email: ${customer.email} or subscription not active`);
                }
            } catch (error) {
                console.error('Error processing subscription update:', error);
            }
            const customerSubscriptionUpdated = event.data.object;
            console.log('Customer subscription updated!');
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.sendStatus(200);
};

module.exports = {
    subscriptionCreated,
};