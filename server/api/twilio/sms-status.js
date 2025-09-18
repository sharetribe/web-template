// server/api/twilio/sms-status.js
const express = require('express');
const twilio = require('twilio');
const { maskPhone } = require('../../api-util/phone');

// Twilio signature verification using Twilio's built-in validator
function verifyTwilioSignature(req, authToken) {
  const twilioSignature = req.get('X-Twilio-Signature');
  if (!twilioSignature || !authToken) return false;
  const proto = req.get('x-forwarded-proto') || req.protocol;        // respect proxy
  const host  = req.get('x-forwarded-host') || req.get('host');      // respect proxy
  const url   = `${proto}://${host}${req.originalUrl}`;              // keep exact query
  return twilio.validateRequest(authToken, twilioSignature, url, req.body);
}

module.exports = async (req, res) => {
  // Verify Twilio signature
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken && !verifyTwilioSignature(req, authToken)) {
    const xfProto = req.get('x-forwarded-proto');
    const xfHost  = req.get('x-forwarded-host');
    console.log('🚫 Invalid Twilio signature - rejecting request');
    console.log('[twilio] xfp/xfh:', xfProto, xfHost, 'raw host:', req.get('host'));
    console.log('[twilio] originalUrl:', req.originalUrl);
    return res.status(403).json({ error: 'Invalid signature' });
  }
  
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
