//const SibApiV3Sdk = require('@getbrevo/brevo');
const sdkUtils = require('../../api-util/sdk');

const SibApiV3Sdk = require('@getbrevo/brevo');
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();


let apiKey = brevoClient.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

module.exports = async (req, res) => {
  {

    const { email, listId, firstName, lastName, isNewsLetter, isSignup } = req.body;

    let apiInstance = new SibApiV3Sdk.ContactsApi();
    let createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email;

    if (isNewsLetter && isSignup) {
      createContact.listIds = [4, 7];
    } else if (isNewsLetter && !isSignup) {
      createContact.listIds = [4];
    } else if (!isNewsLetter && isSignup) {
      createContact.listIds = [7];
    }

    createContact.attributes = {
      FIRSTNAME: firstName,
      LASTNAME: lastName,
    };

    console.log('createContact:', createContact);
    apiInstance.createContact(createContact).then(
      function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
      },
      function(error) {
        console.error(error);
      }
    );
  }
};
