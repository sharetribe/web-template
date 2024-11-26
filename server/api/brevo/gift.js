const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY; // Ensure this is correctly set in your .env file
const supabase = createClient(supabaseUrl, supabaseKey);

const brevo = require('@getbrevo/brevo');
let brevoClient = new brevo.TransactionalEmailsApi();

let apiKey = brevoClient.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

let sendSmtpEmail = new brevo.SendSmtpEmail();

module.exports = async (req, res) => {
  try {

    sendSmtpEmail.sender = { name: 'Club Joy Team', email: 'hello@clubjoy.it' };
    sendSmtpEmail.to = [
      { email: `${req.body.email}`, name: `${req.body.giftee}` },
    ];
    sendSmtpEmail.templateId = 52;
    sendSmtpEmail.params = {
      giftee: req.body.giftee,
      gifter: req.body.sender,
      code: req.body.giftCardCode,
      amount: req.body.amount,
    };
    const emailResponse52 = await brevoClient.sendTransacEmail(sendSmtpEmail);
    console.log('Template 52 email sent successfully:', emailResponse52);

 
    const { data, error } = await supabase
      .from('giftcard')
      .update({ recipient: req.body.email, gifted: true })
      .eq('code', req.body.giftCardCode)
      .select();

    if (error) {
      console.error('Error updating gift card record:', error);
      return res.status(500).json({ error: 'Failed to update gift card record', supabaseError: error });
    }

    console.log('Gift card record updated successfully:', data);

  
    sendSmtpEmail.sender = { name: 'Club Joy Team', email: 'hello@clubjoy.it' };
    sendSmtpEmail.to = [
      { email: `${req.body.emailer}`, name: `${req.body.sender}` },
    ];
    sendSmtpEmail.templateId = 51;
    sendSmtpEmail.params = {
      giftee: req.body.giftee,
      gifter: req.body.sender,
      code: req.body.giftCardCode,
      amount: req.body.amount,
    };
    const emailResponse51 = await brevoClient.sendTransacEmail(sendSmtpEmail);
    console.log('Template 51 email sent successfully:', emailResponse51);

    return res.status(200).json({
      message: 'Emails sent and gift card updated successfully',
      emailResponse52,
      emailResponse51,
      updatedRecord: data,
    });
  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).json({ error: 'An error occurred', details: error });
  }
};