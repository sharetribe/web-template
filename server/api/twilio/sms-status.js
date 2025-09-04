// server/api/twilio/sms-status.js
const express = require('express');
const { maskPhone } = require('../../api-util/phone');

module.exports = async (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode, To } = req.body || {};
  
  console.log('[SMS][DLR]', { 
    sid: MessageSid, 
    status: MessageStatus, 
    error: ErrorCode, 
    to: To // Show actual phone number for debugging
  });
  
  res.sendStatus(204);
};
