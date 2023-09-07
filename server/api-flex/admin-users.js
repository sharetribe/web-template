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

    // console.log(CLIENT_ID);
    // console.log(CLIENT_SECRET);
    
    // Query first 5 listings
    integrationSdk.users
    .query()
    .then(response => {
        // Print listing titles
        // response.data.data.forEach(users => {
        //     console.log(`Listing: ${users.attributes.email}`)
        //     console.log(`user id: ${users.id.uuid}`)
        // });
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
  