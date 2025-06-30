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

const initiateLoginAs = require('./api/initiate-login-as');
const loginAs = require('./api/login-as');
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');
const vouchers = require('./api/vouchers');
const createUserWithIdp = require('./api/auth/createUserWithIdp');

const isAuthenticated = require('./middlewares/auth.middleware');
const { authenticateFacebook, authenticateFacebookCallback } = require('./api/auth/facebook');
const { authenticateGoogle, authenticateGoogleCallback } = require('./api/auth/google');

const email = require('./api/email');
const { rescheduleRequest, acceptRescheduleRequest } = require('./api/reschedule');
const {
  generateAuthUrl,
  saveAuthToken,
  // calendarNotifications,
  revokeGoogleAuthToken,
  fetchGoogleEventsRealtime,
  deleteGoogleEventByID,
  createGoogleMeetingHandler,
  rescheduleEvent,
  cancelEvent,
} = require('./api/google/google.calendar');
const { generateInstructorMatches } = require('./api/ai/ai-gateway');
const { subscriptionCreated } = require('./api/webhooks/webhooks');
const adjustBooking = require('./api/adjust-booking');
const updateTransactionMetadata = require('./api/update-transaction-metadata');

const router = express.Router();

// ================ API router middleware: ================ //

// Modify the bodyParser middleware to exclude the Stripe webhook path
router.use((req, res, next) => {
  if (req.path === '/webhooks/subscription-stripe') {
    bodyParser.raw({ type: 'application/json' })(req, res, next);
  } else {
    bodyParser.json()(req, res, next);
  }
});

// Parse Transit body first to a string (exclude Stripe webhook path)
router.use((req, res, next) => {
  if (req.path !== '/webhooks/subscription-stripe') {
    bodyParser.text({
      type: 'application/transit+json',
    })(req, res, next);
  } else {
    next();
  }
});

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

// Google Calendar
router.get('/google/generate-auth-url', isAuthenticated, generateAuthUrl);
router.get('/google/save-auth-token', isAuthenticated, saveAuthToken);
router.get('/google/revoke-token', isAuthenticated, revokeGoogleAuthToken);
// router.post('/google/calendar/notifications', calendarNotifications);

router.post('/google/delete-google-event-by-id', isAuthenticated, deleteGoogleEventByID);
router.post('/google/fetch-events-from-google-calendar', isAuthenticated, fetchGoogleEventsRealtime);
router.post('/google/create-google-meeting', isAuthenticated, createGoogleMeetingHandler);
router.post('/google/reschedule-event', isAuthenticated, rescheduleEvent);
router.post('/google/cancel-event', isAuthenticated, cancelEvent);

router.post('/reschedule/request', isAuthenticated, rescheduleRequest);
router.post('/reschedule/accept', isAuthenticated, acceptRescheduleRequest);

router.post('/vouchers/customers', vouchers.customers.createOrGet);
router.post('/vouchers/redeem', vouchers.vouchers.redeem);

router.post('/chat/incoming', email.incoming);

// AI-powered instructor matches for a given user based off base user profile, and additional context provided by the end user.
router.post('/ai/instructor-matches', isAuthenticated, generateInstructorMatches); // make isAuthenticated once backend stubbed

router.post('/webhooks/subscription-stripe', subscriptionCreated);
router.post('/adjust-booking', adjustBooking);
router.post('/update-transaction-metadata', updateTransactionMetadata);

module.exports = router;
