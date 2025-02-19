const express = require('express');
const authenticatedUser = require('../../../common/middlewares/authenticatedUser');
const updateProgress = require('./purchase-progress/update');
const initiateDispute = require('./dispute/intiate');

const router = express.Router();

router.use(authenticatedUser());

router.post('/progress', updateProgress);
router.post('/dispute', initiateDispute);

module.exports = router;
