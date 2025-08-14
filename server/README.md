# Server Documentation

## Shippo Webhook Setup

### Overview
The Shippo webhook endpoint automatically sends SMS notifications to borrowers when their borrowed items are delivered. This eliminates the need for manual delivery confirmations and improves the user experience.

### Webhook Endpoint
- **URL:** `POST /api/webhooks/shippo`
- **Purpose:** Handle Shippo tracking status updates and send delivery SMS notifications

### Configuration

#### 1. Shippo Dashboard Setup
1. Log into your [Shippo Dashboard](https://goshippo.com/dashboard)
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Set the webhook URL to: `https://<your-extend-host>/api/webhooks/shippo`
5. Select the **track_updated** event type
6. Save the webhook configuration

#### 2. Environment Variables
Ensure these environment variables are set:
```bash
# Twilio Configuration (required for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Shippo Configuration (required for label creation)
SHIPPO_API_TOKEN=your_shippo_api_token

# Optional: Webhook signature verification (TODO: implement)
SHIPPO_WEBHOOK_SECRET=your_webhook_secret
```

### How It Works

#### 1. Label Creation
When a lender accepts a borrow request:
- Shippo creates outbound and return shipping labels
- Tracking information is saved to `transaction.protectedData`:
  - `outboundTrackingNumber`, `outboundCarrier`, `outboundLabelId`
  - `returnTrackingNumber`, `returnCarrier`, `returnLabelId`
- Metadata is passed to Shippo for webhook correlation

#### 2. Webhook Processing
When Shippo sends a tracking update:
- Webhook receives POST request with tracking status
- If status is `DELIVERED`, the system:
  - Finds the transaction (by metadata.transactionId or tracking number)
  - Checks if SMS already sent (idempotency via `deliveredSmsSent` flag)
  - Extracts borrower phone number
  - Sends delivery SMS notification
  - Updates transaction to mark SMS as sent

#### 3. SMS Message
The exact message sent to borrowers:
```
Your Sherbrt borrow was delivered! Don't forget to take pics and tag @shoponsherbrt while you're slaying in your borrowed fit! 📸✨
```

### Testing

#### Phase 0: Preflight Check
- ✅ Confirm Twilio environment variables are set
- ✅ Verify borrower profile has valid phone number in E.164 format
- ✅ Ensure server is running and accessible

#### Phase 1: Simulate Webhook (Local Testing)
```bash
curl -X POST https://<your-extend-host>/api/webhooks/shippo \
  -H "Content-Type: application/json" \
  -d '{
    "event": "track_updated",
    "data": {
      "tracking_number": "YOUR_TEST_TRACKING_NUMBER",
      "carrier": "usps",
      "tracking_status": { "status": "DELIVERED" },
      "metadata": { "transactionId": "YOUR_TEST_TX_UUID" }
    }
  }'
```

#### Phase 2: Real Transaction Flow
1. Create test listing and place borrow request
2. Have lender accept (creates Shippo labels)
3. Verify `protectedData.outboundTrackingNumber` is set
4. Set up Shippo webhook in dashboard
5. Wait for carrier delivery or simulate with curl

#### Phase 3: Safety & Idempotency
- Re-send same delivered payload: verify no duplicate SMS
- Test with missing phone: confirm proper error handling
- Test non-DELIVERED status: verify webhook is ignored

### Troubleshooting

#### Common Issues
1. **SMS not sending**: Check Twilio credentials and phone number format
2. **Transaction not found**: Verify tracking number is saved in protectedData
3. **Webhook not receiving**: Check Shippo dashboard webhook configuration
4. **Duplicate SMS**: Verify `deliveredSmsSent` flag is working

#### Logs to Monitor
- `🚀 Shippo webhook received!` - Webhook endpoint hit
- `✅ Transaction found via [strategy]` - Transaction lookup success
- `📤 Sending delivery SMS to [phone]` - SMS attempt
- `✅ SMS sent successfully` - SMS delivery confirmation
- `💾 Updated transaction protectedData` - Database update success

### Security Considerations
- **TODO**: Implement webhook signature verification using `SHIPPO_WEBHOOK_SECRET`
- **Current**: Webhook is accessible to anyone with the URL
- **Recommendation**: Use secret path or IP allowlist for production

### Future Enhancements
- [ ] Webhook signature verification
- [ ] Support for other tracking statuses (in_transit, out_for_delivery)
- [ ] Retry logic for failed SMS delivery
- [ ] Analytics and reporting on delivery notifications
- [ ] Support for multiple phone numbers per transaction

