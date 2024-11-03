const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = 'https://tivsrbykzsmbrkmqqwwd.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY; // Ensure this is correctly set in your .env file
const supabase = createClient(supabaseUrl, supabaseKey);
const sdkUtils = require('../../api-util/sdk');

const SibApiV3Sdk = require('@getbrevo/brevo');
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();


let apiKey = brevoClient.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();



module.exports = async (req, res) => {
  try {
    console.log(req.body);
    // Query Supabase to find the record by bookingid
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

    const bookingRecord = data[0];
    console.log('Booking record:', bookingRecord);
    const formattedDate = (dateString =>
      new Date(dateString).toLocaleDateString('it-IT', { timeZone: 'UTC' }).replace(/\//g, '-'))(
      bookingRecord.startdate
    );
    if (bookingRecord) {
      sendSmtpEmail.sender = { name: 'Club Joy Team', email: 'hello@clubjoy.it' };
      sendSmtpEmail.to = [
        { email: `${bookingRecord.providerEmail}`, name: `${bookingRecord.providername}` },
      ];
      sendSmtpEmail.templateId = 28;
      sendSmtpEmail.params = {
        providername: bookingRecord.providername,
        username: bookingRecord.name,
        startDate: formattedDate,
      };

      try {
        const emailResponse = await brevoClient.sendTransacEmail(sendSmtpEmail);
        try {
          sendSmtpEmail.sender = { name: 'Club Joy Team', email: 'hello@clubjoy.it' };
          sendSmtpEmail.to = [{ email: `${bookingRecord.email}`, name: `${bookingRecord.name}` }];
          sendSmtpEmail.templateId = 29;
          sendSmtpEmail.params = {
            providerName: bookingRecord.providername,
            username: bookingRecord.name,
            startDate: formattedDate,
          };
          const emailResponse = await brevoClient.sendTransacEmail(sendSmtpEmail);
          res.json({ message: 'Email sent successfully to customer', data: emailResponse });
        } catch {
          console.error('Failed to send customer email', emailError);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        res.status(500).json({ error: 'Failed to send provider email', emailError });
      }
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


