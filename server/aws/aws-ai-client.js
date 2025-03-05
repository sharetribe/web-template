const { BedrockAgentRuntimeClient } = require('@aws-sdk/client-bedrock-agent-runtime');

let client;

const startupAWSAIClient = async () => {
  try {
    if (!client) {
      client = new BedrockAgentRuntimeClient({
        credentials: {
          accessKeyId: process.env.AWS_AI_ACCESS_KEY,
          secretAccessKey: process.env.AWS_AI_SECRET_ACCESS_KEY,
        },
        region: 'us-east-1',
      });
    }
    console.log('AWS Client Initialized');
  } catch (error) {
    console.error('Could not initialize AWS AI Client for the following reason', error);
    throw error;
  }
};

const getAWSAIClient = async () => {
  if (!client) {
    console.error('AWS AI Client not initialized. Attempting to restartClient.');
    await startupAWSAIClient();
  }
  return client;
};


module.exports = { startupAWSAIClient, getAWSAIClient };
