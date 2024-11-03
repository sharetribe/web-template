const axios = require('axios');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

module.exports = (req, res) => {
  //const { code } = req.body;

  axios
    .get(`https://api.stripe.com/v1/invoices`, {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    })
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(error => {
      res.status(400).json({ message: '' });
    });
};
