// server/api/twilio/sms-status.js
const express = require('express');
const { maskPhone } = require('../../api-util/phone');

module.exports = async (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode, To } = req.body || {};
  
  // Enhanced delivery receipt logging
  const status = MessageStatus || 'unknown';
  const error = ErrorCode || '';
  const phone = To || 'unknown';
  
  console.log(`[DLR] ${phone} ${MessageSid} -> ${status} ${error}`);
  
  // Log specific error conditions
  if (status === 'delivered') {
    console.log(`✅ [DLR] Message delivered successfully to ${phone}`);
  } else if (status === 'undelivered' || status === 'failed') {
    if (error === '30007') {
      console.log(`🚫 [DLR] Carrier filtered message to ${phone} (content issue)`);
    } else if (error === '21610') {
      console.log(`🚫 [DLR] Recipient opted out: ${phone} must text START to resume`);
    } else {
      console.log(`❌ [DLR] Message failed to ${phone}: ${status} (${error})`);
    }
  }
  
  res.sendStatus(204);
};
