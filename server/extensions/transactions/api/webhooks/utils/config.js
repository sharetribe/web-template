const handleStripeWebhook = (req, res, buf) => {
  const url = req.originalUrl;
  if (url.startsWith('/api/transactions/webhook')) {
    req.rawBody = buf;
  }
};

module.exports = {
  handleStripeWebhook,
};
