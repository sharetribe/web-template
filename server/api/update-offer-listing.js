const initiateIntegrationSdk = require('../api-util/initiateIntegrationSdk');
// const { getSdk, handleError } = require('../api-util/sdk');

module.exports = async (req, res) => {

  try {
    const integrationSdk = await initiateIntegrationSdk();
    const updateListing = await integrationSdk.listings.update(req.body, {
      expand: true,
    });
    
    if (updateListing.status === 200) {
      res
        .status(200)
        .set('Content-Type', 'application/json')
        .json({
          updated: true,
        })
        .end();
    } else {
      res
        .status(200)
        .set('Content-Type', 'application/json')
        .json({
          updated: false,
        })
        .end();
    }
  } catch (e) {
    console.error(e);
  }
};
