const brevo = require('@getbrevo/brevo');

module.exports = async (req, res) => {
  const { email, firstName, lastName, isNewsLetter, isSignup } = req.body;
  let apiInstance = new brevo.ContactsApi();
  apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;
  let createContact = new brevo.CreateContact();
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

  
  try {
    const data = await apiInstance.createContact(createContact);
    res.status(200).send(data);
  } catch (error) {
    if (error.statusCode === 400 && error.body && error.body.message) {
      console.error('Error creating contact:', error.body.message);
      res.status(400).send({
        code: 'CONTACT_ALREADY_EXISTS',
        message: 'Unable to create contact, email is already associated with another Contact',
        details: error.body.message
      });
    } else {
      console.error('An unexpected error occurred:', error);
      res.status(error.statusCode || 500).send({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while creating the contact.',
        details: error.body || error
      });
    }
  }
};
