const initiateIntegrationSdk = require('../api-util/initiateIntegrationSdk');

module.exports = async (req, res) => {
  try {
    const integrationSdk = await initiateIntegrationSdk();
    const user = await integrationSdk.users.show(req.body);

    if (user.status === 200) {
      res
        .status(200)
        .set('Content-Type', 'application/json')
        .json(user)
        .end();
    }
  } catch (e) {
    console.error(e);
  }
};
