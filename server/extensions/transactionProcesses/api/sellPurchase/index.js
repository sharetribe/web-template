const express = require('express');
const authenticatedUser = require('../../../common/middlewares/authenticatedUser');
const markProgress = require('./markProgress');

const router = express.Router();

router.use(authenticatedUser());

router.patch('/markProgress', markProgress);

module.exports = router;
