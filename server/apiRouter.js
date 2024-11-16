/**
 * This file contains server side endpoints that can be used to perform backend
 * tasks that can not be handled in the browser.
 *
 * The endpoints should not clash with the application routes. Therefore, the
 * endpoints are prefixed in the main server where this file is used.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { deserialize } = require('./api-util/sdk');
const SibApiV3Sdk = require('@getbrevo/brevo');
const initiateLoginAs = require('./api/initiate-login-as');
const loginAs = require('./api/login-as');
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');
const moment = require('moment');
const createUserWithIdp = require('./api/auth/createUserWithIdp');
const invoice = require('./api/brevo/invoice')
const gift = require('./api/brevo/gift');
const notifications = require('./api/slack/notifications.js');
const notifyInvoice = require('./api/brevo/notifyinvoice');
const inquiryEvent = require('./api/brevo/event');
const newsLetter = require('./api/brevo/newsletter');
const coupon = require('./api/stripe/coupon');
const refund = require('./api/stripe/refund');
const updateTransaction = require('./api/update-transaction');
const { authenticateFacebook, authenticateFacebookCallback } = require('./api/auth/facebook');
const { authenticateGoogle, authenticateGoogleCallback } = require('./api/auth/google');

const router = express.Router();

// ================ API router middleware: ================ //

// Parse Transit body first to a string
router.use(
  bodyParser.text({
    type: 'application/transit+json',
  })
);

// Deserialize Transit body string to JS data
router.use((req, res, next) => {
  if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
    try {
      req.body = deserialize(req.body);
    } catch (e) {
      console.error('Failed to parse request body as Transit:');
      console.error(e);
      res.status(400).send('Invalid Transit in request body.');
      return;
    }
  }
  next();
});

// ================ API router endpoints: ================ //

router.get('/initiate-login-as', initiateLoginAs);
router.get('/login-as', loginAs);
router.post('/transaction-line-items', transactionLineItems);
router.post('/initiate-privileged', initiatePrivileged);
router.post('/transition-privileged', transitionPrivileged);
router.post('/stripe/coupon', coupon);
router.post('/update-transaction', updateTransaction);
router.post('/brevo/notifyinvoice', notifyInvoice);
router.post('/brevo/gift', gift);
router.post('/brevo/newsletter', newsLetter);
router.post('/brevo/event', inquiryEvent);
router.post('/brevo/invoice', invoice);
router.post('/stripe/refund', refund);
router.post('/slack/notifications', notifications);
// Create user with identity provider (e.g. Facebook or Google)
// This endpoint is called to create a new user after user has confirmed
// they want to continue with the data fetched from IdP (e.g. name and email)
router.post('/auth/create-user-with-idp', createUserWithIdp);

// Facebook authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Facebook
router.get('/auth/facebook', authenticateFacebook);

// This is the route for callback URL the user is redirected after authenticating
// with Facebook. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/facebook/callback', authenticateFacebookCallback);

// Google authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Google
router.get('/auth/google', authenticateGoogle);

// This is the route for callback URL the user is redirected after authenticating
// with Google. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/google/callback', authenticateGoogleCallback);

router.post('/send-email', async (req, res) => {
  const { name, email, subject, message } = req.body;
  const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
  const apiKey = brevoClient.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  let sendSmtpEmail = new b.SendSmtpEmail();

  if (subject === 'business') {
    sendSmtpEmail.subject = message;
    sendSmtpEmail.sender = { name: 'Club Joy App', email: 'hello@clubjoy.it' };
    sendSmtpEmail.to = [{ email: 'hello@clubjoy.it', name: 'Club Joy Team' }];
    sendSmtpEmail.htmlContent = `<html><body><p>Registrazione Nuovo Business: ${name}</p><p>Email: ${email}</p></body></html>`;
  } else {
    sendSmtpEmail.subject = message;
    sendSmtpEmail.sender = { name: 'Club Joy App', email: 'noreply@example.com' };
    sendSmtpEmail.to = [{ email: 'hello@clubjoy.it', name: 'Club Joy Team' }];
    sendSmtpEmail.htmlContent = `<html><body><p>Registrazione Nuovo Customer: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p></body></html>`;
  }

  try {
    const data = await brevoClient.sendTransacEmail(sendSmtpEmail);
    res.json({ message: 'Email sent successfully', data });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
