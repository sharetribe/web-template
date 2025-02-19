const express = require('express');
const authenticatedUser = require('../../../common/middlewares/authenticatedUser');
const updateProgress = require('./purchase-progress/update');

const router = express.Router();

router.use(authenticatedUser());

router.post('/progress', updateProgress);

module.exports = router;
