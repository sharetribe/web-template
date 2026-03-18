const express = require('express');
const middleware = require('../../middleware');
const setupRoom = require('./setup-room');
const updateRoomStatus = require('./update-room-status');

const videoConferenceRouter = express.Router();

videoConferenceRouter.post('/setup-room', middleware.auth, setupRoom);
videoConferenceRouter.post('/update-room-status', middleware.auth, updateRoomStatus);

module.exports = videoConferenceRouter;
