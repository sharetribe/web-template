const { RetrieveAndGenerateCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const { getAWSAIClient } = require('../../aws/aws-ai-client');
const { getISdk, getSdk } = require('../../api-util/sdk');
const integrationSdk = getISdk();

const generateInstructorMatches = async (req, res) => {

  const sdk = getSdk(req, res);

  const currentLoggedInUserContext = await sdk.currentUser.show();

  const moreContextAboutMe = JSON.stringify({
    bio: currentLoggedInUserContext.data.data.attributes.profile.bio,
    ...currentLoggedInUserContext.data.data.attributes.profile.publicData
  });

  const systemPromptTemplate = "Please provide results in JSON format in the form '{'instructorId': 'specificInstructorId', 'instructorName': 'specificInstructorName', 'instructorChoiceReasoning': 'specificInstructorChoiceReasoning'}', " +
    'where the specificInstructorName and specificInstructorChoiceReasoning values are the imputed text values.' +
    'Limit the specificInstructorChoiceReasoning value to 300 characters. Separate each recommendation by comma. I should be able to parse the assistant response with JSON.parse().';

  const studentInputTemplate = `I am a flight student. Here's my profile: ${moreContextAboutMe}. I am looking for at most three instructor recommendations. If not empty, please also consider the following, assuming it's related to aviation: ${req.body.additionalUserInput}`;

  const fullTemplate = `
          Human:${studentInputTemplate}\n

          System:${systemPromptTemplate}\n

          Base your results on these documents:\n
          $search_results$\n
          Assistant:
          `;

  const input = {
    input: {
      text: fullTemplate,
    }, retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE', knowledgeBaseConfiguration: {
        // Replace with your actual knowledge base ID
        knowledgeBaseId: 'LIHCVCVP4J', // Model ARN for Claude v2 in us-east-1
        modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-v2',

        // Minimal retrieval config; tweak as needed
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 3,       // How many results to retrieve
          },
        },
      },
    }, // sessionConfiguration is typically required
    sessionConfiguration: {
      kmsKeyArn: 'arn:aws:kms:us-east-1:440744214831:key/fd95c61b-9a17-49d5-a245-e9d3a71d7645',
    },
  };

  try {
    const awsAiClient = await getAWSAIClient();

    const command = new RetrieveAndGenerateCommand(input);

    // Call the Claude model
    const response = await awsAiClient.send(command);

    let curatedResponse = "[]";

    try {
      curatedResponse = await imputeProfileImageUrls(parseResponse(response.output.text));
    } catch (err) {
      console.log(`User used following query that could not generate a useful AI response: ${req.body.additionalUserInput}`)
    }

    // Return the raw response or parse further as needed
    return res.status(200).json(curatedResponse);
  } catch (error) {
    console.error('Error calling Claude:', error);
    return res.status(500).json({ error: error.message });
  }
};

const imputeProfileImageUrls = async (curatedResponseObjectArray) => {
  try {
    const results = await Promise.allSettled(
      curatedResponseObjectArray.map((curatedResponseObject) =>
        integrationSdk.users.show({ id: curatedResponseObject.instructorId })
      )
    );

    const appendedPayload = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          ...curatedResponseObjectArray[index],
          profileImageURL: result.value.data.data.attributes.profile.metadata.profileImageUrl,
        };
      } else {
        console.warn(`Failed to fetch user for ID: ${curatedResponseObjectArray[index].instructorId}`);
        return { ...curatedResponseObjectArray[index], profileImageURL: null };
      }
    });

    return JSON.stringify(appendedPayload);
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

const parseResponse = (text) => {
  text = text.replace(/[\r\n]+/gm, "").replace(/}/g, '},').replace(/,$/, '');
  try {
    // First, try parsing as an array
    return JSON.parse(`[${text}]`)
  } catch {
    // If it fails, assume it's a single object and wrap it in an array
    try {
      return [JSON.parse(text)];
    } catch (error) {
      console.error("Failed to parse JSON as object or array:", error);
      throw error;
    }
  }
};

module.exports = {
  generateInstructorMatches,
};
