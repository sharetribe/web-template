const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY; // Ensure this is correctly set in your .env file
const supabase = createClient(supabaseUrl, supabaseKey);

const SibApiV3Sdk = require('@getbrevo/brevo');
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();


let apiKey = brevoClient.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

module.exports = async (req, res) => {
  const transactionId = req.body.transactionId;
  const customerId = req.body.customerObj.cid;
  let bookingRecord;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('bookingid', req.body.customerObj.bookingid);

    if (error) {
      console.error('Error fetching booking:', error);
      return res.status(500).json({ error: 'Error fetching booking' });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    bookingRecord = data[0];
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({ error: 'Error fetching booking' });
  }

  const formattedDate = (dateString => {
    const date = new Date(dateString);
    date.setUTCDate(date.getUTCDate() - 5);
    return date.toLocaleDateString('it-IT', { timeZone: 'UTC' }).replace(/\//g, '-');
  })(bookingRecord.startdate);

  try {
    const paymentIntentsResponse = await axios.get('https://api.stripe.com/v1/payment_intents', {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
      params: {
        limit: 100,
      },
    });

    const paymentIntents = paymentIntentsResponse.data.data;
    const foundPaymentIntent = paymentIntents.find(
      paymentIntent =>
        paymentIntent.metadata &&
        paymentIntent.metadata['sharetribe-transaction-id'] === transactionId &&
        paymentIntent.metadata['sharetribe-customer-id'] === customerId
    );
    console.log('Found payment intent:', foundPaymentIntent);

    if (foundPaymentIntent) {
      try {
        const refundResponse = await axios.post('https://api.stripe.com/v1/refunds', null, {
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          },
          params: {
            payment_intent: foundPaymentIntent.id,
          },
        });
        const refund = refundResponse.data;
        console.log('Created refund:', refund);

        res.status(200).json({
          message: 'Payment Intent found and refund created',
          paymentIntent: foundPaymentIntent,
          refund: refund,
        });

        // Send emails after sending the initial response
        try {
          sendSmtpEmail.sender = { name: 'Club Joy Team', email: 'hello@clubjoy.it' };
          sendSmtpEmail.to = [{ email: `${bookingRecord.email}`, name: `${bookingRecord.name}` }]; //bookingRecord.providerEmail
          sendSmtpEmail.templateId = 25;
          sendSmtpEmail.params = {
            providername: bookingRecord.providername,
            username: bookingRecord.username,
            startDate: formattedDate,
            reason: req.body.selectedOptionText,
            amount: refund.amount,
          };
          const emailResponse = await brevoClient.sendTransacEmail(sendSmtpEmail);
          console.log('Email sent successfully to provider', emailResponse);

          try {
            sendSmtpEmail.sender = { name: 'Club Joy Team', email: 'hello@clubjoy.it' };
            sendSmtpEmail.to = [
              { email: `${bookingRecord.providerEmail}`, name: `${bookingRecord.providername}` },
            ]; 
            sendSmtpEmail.templateId = 26;
            sendSmtpEmail.params = {
              providername: bookingRecord.providername,
              username: bookingRecord.username,
              startDate: formattedDate,
              reason: req.body.selectedOptionText,
              amount: refund.amount / 100,
            };
            const emailResponse = await brevoClient.sendTransacEmail(sendSmtpEmail);
            console.log('Email sent successfully to customer', emailResponse);
          } catch (emailError) {
            console.error('Failed to send customer email', emailError);
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      } catch (refundError) {
        console.error('Error creating refund:', refundError.response?.data?.error);
  
        const errorCode = refundError.response?.data?.error?.code;
        const errorMessage = refundError.response?.data?.error?.message || 'Unknown refund error';
      
        if (errorCode === 'charge_already_refunded') {
          return res.status(400).json({
            message: 'Refund already exists for this payment intent',
            details: errorMessage,  // Pass specific message to frontend
          });
        } else {
          return res.status(500).json({
            message: 'Error processing refund',
            details: errorMessage,
          });
        }
      }
    } else {
      res.status(404).json({
        message: 'Payment Intent not found',
      });
    }
  } catch (error) {
    console.error('Error finding payment intent:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
