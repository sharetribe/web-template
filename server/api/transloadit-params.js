const Transloadit = require('transloadit');
const moment = require('moment');
const { serialize } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { userId } = req.body;

  const authKey = process.env.TRANSLOADIT_AUTH_KEY;
  const transloadit = new Transloadit({
    authKey,
    authSecret: process.env.TRANSLOADIT_AUTH_SECRET,
  });

  const expires = moment
    .utc()
    .add(1, 'hour')
    .format('YYYY/MM/DD HH:mm:ss Z');

  const params = {
    auth: {
      key: authKey,
      expires,
    },
    template_id: process.env.TRANSLOADIT_UPLOAD_LISTING_ASSETS_TEMPLATE_ID,
    fields: {
      userId,
    },
  };

  const signature = transloadit.calcSignature(params);
  res
    .status(200)
    .send(signature)
    .end();
};
