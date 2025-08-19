# Flex Transition Fix for QR/Tracking Links

## **🔍 Problem Identified**

The QR/tracking links are returning 404 because:

1. **Flex Transition Missing**: `transition/store-shipping-urls` exists in the process file but may not be deployed
2. **URLs Not Saved**: The 409 error prevents Shippo URLs from being saved to `transaction.protectedData`
3. **Wrong Domain in SMS**: Staging SMS points to prod domain (`sherbrt.com`) instead of staging

## **✅ Fixes Implemented**

### **1. Environment Variable for QR Base URL**
```bash
# Staging
PUBLIC_QR_BASE_URL=https://web-template-1.onrender.com/api/qr

# Production  
PUBLIC_QR_BASE_URL=https://sherbrt.com/api/qr
```

**Code Change**: 
```javascript
const qrBaseUrl = process.env.PUBLIC_QR_BASE_URL || 'https://sherbrt.com/api/qr';
const shortUrl = `${qrBaseUrl}/${transactionId}`;
```

### **2. Enhanced Error Logging**
Better error details for transition failures:
```javascript
console.error('❌ [SHIPPO] Error details:', {
  status: persistError.response?.status,
  statusText: persistError.response?.statusText,
  data: persistError.response?.data,
  transactionId: transactionId,
  transition: 'transition/store-shipping-urls'
});
```

### **3. Test Script Created**
`server/test-flex-transition.js` to verify the transition exists and works.

## **🔧 Required Actions**

### **1. Verify Flex Process Deployment**
The `transition/store-shipping-urls` exists in `ext/transaction-processes/default-booking/process.edn`:

```clojure
{:name :transition/store-shipping-urls,
 :actor :actor.role/operator,
 :actions [{:name :action/update-protected-data}],
 :from :state/accepted,
 :to :state/accepted,
 :privileged? true}
```

**Action**: Redeploy the Flex process to ensure this transition is active.

### **2. Set Environment Variables**
```bash
# Staging
PUBLIC_QR_BASE_URL=https://web-template-1.onrender.com/api/qr
QR_DEBUG=true

# Production
PUBLIC_QR_BASE_URL=https://sherbrt.com/api/qr
QR_DEBUG=false
```

### **3. Test the Fix**
```bash
# Test Flex transition
cd server
node test-flex-transition.js 68a3c0a3-0e4a-4cfd-b130-35d9345bcdde

# Test QR route (staging)
curl -i https://web-template-1.onrender.com/api/qr/_debug/ping
curl -i https://web-template-1.onrender.com/api/qr/_debug/tx/68a3c0a3-0e4a-4cfd-b130-35d9345bcdde
curl -i https://web-template-1.onrender.com/api/qr/68a3c0a3-0e4a-4cfd-b130-35d9345bcdde
```

## **📋 Expected Results**

### **After Fix Applied:**
1. **Label Purchase**: URLs saved successfully to `protectedData`
2. **Lender SMS**: Contains correct staging URL (`web-template-1.onrender.com/api/qr/...`)
3. **QR Route**: Returns 302 redirect to Shippo QR code
4. **Debug Routes**: Accessible when `QR_DEBUG=true`

### **Current Status (Before Fix):**
1. **Label Purchase**: URLs only exist in session variables
2. **Lender SMS**: Contains wrong prod URL (`sherbrt.com/api/qr/...`)
3. **QR Route**: Returns 410 (no data available)
4. **Debug Routes**: Return 404 (not deployed)

## **🚨 Critical Issue**

The 409 error suggests the Flex transition is not properly deployed or accessible. This must be resolved before the QR links will work.

**Next Step**: Redeploy the Flex process and verify `transition/store-shipping-urls` is available.
