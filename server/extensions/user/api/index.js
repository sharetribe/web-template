const express = require('express');
const router = express.Router();
const updateProfile = require('./profile');

router.post('/profile', updateProfile);

module.exports = router;
