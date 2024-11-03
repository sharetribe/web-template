const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const SibApiV3Sdk = require('@getbrevo/brevo');
const sdkUtils = require('../../api-util/sdk');


module.exports = async (req, res) => {
  const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
  const apiKey = brevoClient.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = 'Richiesta Di Evento';
  sendSmtpEmail.sender = { name: 'Club Joy App', email: 'no-reply@clubjoy.it' };
  sendSmtpEmail.to = [{ email: 'hello@clubjoy.it', name: 'Club Joy Team' }];
  sendSmtpEmail.htmlContent = `<html><body>
    <p>Richiesta Evento Privato da: ${req.body.name}</p><br/>
    <p>Email: ${req.body.email}</p><br/>
    <p>Company: ${req.body.company}</p><br/>
    <p>Tipo Di evento: ${req.body.company}</p><br/>
    </body></html>`;

  try {
    const data = await brevoClient.sendTransacEmail(sendSmtpEmail);
    res.json({ message: 'Email sent successfully', data });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
