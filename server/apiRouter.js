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
const { verifySlackRequestMiddleware, slackInteractivity } = require('./api/slack');
const transitionPrivileged = require('./api/transition-privileged');
const createUserWithIdp = require('./api/auth/createUserWithIdp');
const { authenticateAuth0, authenticateAuth0Callback } = require('./api/auth/auth0');

const router = express.Router();

// ================ API router Slack integration manager: ================ //
router.post(
  '/slack/interactivity',
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true }),
  verifySlackRequestMiddleware,
  slackInteractivity
);

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

// Create user with identity provider (e.g. Facebook or Google)
// This endpoint is called to create a new user after user has confirmed
// they want to continue with the data fetched from IdP (e.g. name and email)
router.post('/auth/create-user-with-idp', createUserWithIdp);

/**
 * Auth0 authentication endpoints
 */

// This endpoint is called when user wants to initiate authenticaiton with Auth0
router.get('/auth/auth0/login', authenticateAuth0);

// This is the route for callback URL the user is redirected after authenticating
// with Auth0. In this route a custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/auth0/custom-callback', authenticateAuth0Callback);

module.exports = router;
