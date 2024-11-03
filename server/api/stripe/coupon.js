const axios = require('axios');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

module.exports = (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Coupon code is required.' });

  axios
    .get(`https://api.stripe.com/v1/coupons/${code}`, {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    })
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(error => {
      res.status(400).json({ message: 'Coupon code is not valid.' });
    });
};
