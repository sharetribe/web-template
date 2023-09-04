const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const CLIENT_ID = 'bd8cb379-527f-4f9d-9b6a-144ba26f88d4';
const CLIENT_SECRET = '871d86250e9783c51bd5f28f3341991579c6c20b';


module.exports = (req, res) => {
    console.log(' --------------------------------');
    console.log(req.body);
    // Create new SDK instance
    const integrationSdk = sharetribeIntegrationSdk.createInstance({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
    });

    console.log(CLIENT_ID);
    console.log(CLIENT_SECRET);
    
    // Query first 5 listings
    integrationSdk.listings
    .query()
    .then(response => {
        // Print listing titles
        response.data.data.forEach(users => {
            console.log(`Listing: ${users.attributes.email}`)
            console.log(`user id: ${users.id.uuid}`)
        });
        let data = response.data.data;
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
  