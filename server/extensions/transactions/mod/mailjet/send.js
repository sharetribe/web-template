const { mailjetApi } = require("./instance");

const sendEmail = async ({ senderEmail, senderName, recipients, subject, html }) => {
  return await mailjetApi.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: senderEmail,
          Name: senderName,
        },
        To: recipients,
        Subject: subject,
        HTMLPart: html,
      },
    ],
  });
};

module.exports = sendEmail;
