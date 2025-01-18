const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
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
        { email: 'corsini.ludovico@gmail.com', name: 'Club Joy Team' },
    ];
    sendSmtpEmail.subject = 'Richiesta Di Evento';
    sendSmtpEmail.htmlContent = `
    <html>
        <body>
          <p><strong>Richiesta Evento Privato</strong></p>
          <p><strong>Title:</strong> ${req.body.newEvent.title}</p>
          <p><strong>Start:</strong> ${req.body.newEvent.start.toLocaleString()}</p>
          <p><strong>End:</strong> ${req.body.newEvent.end.toLocaleString()}</p>
          <p><strong>Provider:</strong> ${req.body.newEvent.provider}</p>
          <p><strong>Listing ID:</strong> ${req.body.newEvent.listingId}</p>
          <p><strong>Seats:</strong> ${req.body.newEvent.seats}</p>
          <p><strong>Names:</strong> ${req.body.newEvent.protectedData.names.join(', ')}</p>
        </body>
      </html>
    `,
  
    await brevoClient.sendTransacEmail(sendSmtpEmail);

    res.json({ message: 'Email sent successfully'});
  } catch (err) {
    res.status(500)
  }
};
