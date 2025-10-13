const { getSdk, getTrustedSdk, handleError } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { currentPassword } = req.body;

  getTrustedSdk(req)
    .then(trustedSdk => {
      trustedSdk.currentUser
        .delete({ currentPassword })
        .then(resp => {
          res.status(resp.status).send(resp);
        })
        .catch(e => handleError(res, e));
    })
    .catch(e => handleError(res, e));
};
