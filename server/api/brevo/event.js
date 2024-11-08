const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const brevo = require('@getbrevo/brevo');

module.exports = async (req, res) => {

  const brevoClient = new brevo.TransactionalEmailsApi();
  brevoClient.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;


  const sendSmtpEmail = new brevo.SendSmtpEmail({
    subject: 'Richiesta Di Evento',
    sender: { name: 'Club Joy App', email: 'no-reply@clubjoy.it' },
    to: [{ email: 'hello@clubjoy.it', name: 'Club Joy Team' }],
    htmlContent: `<html><body>
      <p>Richiesta Evento Privato da: ${req.body.name}</p><br/>
      <p>Email: ${req.body.email}</p><br/>
      <p>Company: ${req.body.company}</p><br/>
      <p>Tipo Di evento: ${req.body.eventType}</p><br/>
      </body></html>`
  });

  try {

    const data = await brevoClient.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', data);
    res.json({ message: 'Email sent successfully', data });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error });
  }
};
