#!/usr/bin/env node

/**
 * Test script to verify Flex transition exists and can be called
 */

const { getTrustedSdk } = require('./api-util/sdk');

async function testFlexTransition() {
  console.log('🧪 Testing Flex transition: transition/store-shipping-urls');
  
  try {
    const sdk = await getTrustedSdk();
    
    // Test transaction ID (you'll need to replace this with a real one)
    const testTransactionId = process.argv[2] || '68a3c0a3-0e4a-4cfd-b130-35d9345bcdde';
    
    console.log(`📋 Testing with transaction: ${testTransactionId}`);
    
    // First, try to show the transaction to see its current state
    console.log('🔍 Fetching transaction details...');
    const txResponse = await sdk.transactions.show({ 
      id: testTransactionId,
      include: []
    });
    
    const tx = txResponse?.data?.data;
    if (!tx) {
      console.error('❌ Transaction not found');
      return;
    }
    
    console.log('✅ Transaction found:', {
      id: tx.id,
      state: tx.attributes.state,
      protectedDataKeys: Object.keys(tx.attributes.protectedData || {})
    });
    
    // Check if the transition is available
    console.log('🔍 Checking available transitions...');
    const transitionsResponse = await sdk.transactions.query({
      id: testTransactionId,
      include: ['transitions']
    });
    
    const transitions = transitionsResponse?.data?.data?.[0]?.attributes?.transitions || [];
    console.log('📋 Available transitions:', transitions.map(t => t.name));
    
    const hasStoreShippingUrls = transitions.some(t => t.name === 'transition/store-shipping-urls');
    console.log(`🎯 transition/store-shipping-urls available: ${hasStoreShippingUrls ? 'YES' : 'NO'}`);
    
    if (!hasStoreShippingUrls) {
      console.error('❌ transition/store-shipping-urls is not available');
      console.log('💡 This means the Flex process needs to be redeployed');
      return;
    }
    
    // Try to call the transition with minimal data
    console.log('🚀 Attempting to call transition/store-shipping-urls...');
    
    const testData = {
      testTimestamp: new Date().toISOString(),
      testValue: 'test'
    };
    
    const transitionResponse = await sdk.transactions.transition({
      id: testTransactionId,
      transition: 'transition/store-shipping-urls',
      params: {
        protectedData: testData
      }
    });
    
    console.log('✅ Transition successful!');
    console.log('📋 Response:', transitionResponse.data);
    
    // Verify the data was saved
    console.log('🔍 Verifying data was saved...');
    const verifyResponse = await sdk.transactions.show({ 
      id: testTransactionId,
      include: []
    });
    
    const updatedTx = verifyResponse?.data?.data;
    const savedData = updatedTx?.attributes?.protectedData || {};
    
    console.log('💾 Saved data:', {
      testTimestamp: savedData.testTimestamp,
      testValue: savedData.testValue,
      allKeys: Object.keys(savedData)
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📋 Response details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    console.error('🔍 Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  testFlexTransition().catch(console.error);
}

module.exports = { testFlexTransition };
