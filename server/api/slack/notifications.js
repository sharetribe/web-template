// server/slackNotifications.js
const axios = require('axios');

// Ensure your Slack webhook URL is stored securely in environment variables
const SLACK_WEBHOOK_URL = process.env.REACT_APP_SLACK_WEBHOOK_URL;

module.exports = async (req, res) => {
  try {
    let slackMessage;
    const { firstName, lastName, name, email, website, role, isNewsletter, isProvider } = req.body;
    
    if(isProvider){
    slackMessage = {
        text: `New Business request: \nCompany Name:${name}\nEmail: ${email}\n`,
    };
    }else{
    slackMessage = {
      text: `New signup: \nFirstName:${firstName} \nLastName:${lastName}\nEmail: ${email}\nRole: ${role}\nSubscribed to Newsletter: ${isNewsletter ? 'Yes' : 'No'}`,
    };
    }

    const response = await axios.post(SLACK_WEBHOOK_URL, slackMessage);

    if (response.status === 200) {
      console.log('Notification sent to Slack successfully.');
      res.status(200).json({ message: 'Notification sent to Slack successfully.' });
    } else {
      console.error('Error from Slack API:', response.statusText);
      res.status(response.status).json({ error: 'Failed to send notification to Slack' });
    }
  } catch (error) {
    console.error('Error sending notification to Slack:', error.message);
    res.status(500).json({ error: 'Failed to send notification to Slack' });
  }
};

