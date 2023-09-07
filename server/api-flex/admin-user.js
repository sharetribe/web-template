const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_FLEX_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_FLEX_CLIENT_SECRET;


module.exports = (req, res) => {
    // console.log(' --------------------------------');
    // console.log(req.body);
    // Create new SDK instance
    const integrationSdk = sharetribeIntegrationSdk.createInstance({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
    });

    const userId = req.body.id;

    // Query all users
    integrationSdk.users
    .show({id: userId})
    .then(response => {
        // console.log('response = =======');
        // Print listing titles
        let data = response.data.data;
        console.log(data);

        res.send(
              data
          )
    })
    .catch(response => {
        // An error occurred
        console.log(response.data);
        console.log(`Request failed with status: ${res.status} ${res.statusText}`);
    });

};
  