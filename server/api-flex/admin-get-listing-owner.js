const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
// const CLIENT_ID = 'bd8cb379-527f-4f9d-9b6a-144ba26f88d4';
// const CLIENT_SECRET = '871d86250e9783c51bd5f28f3341991579c6c20b';

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_FLEX_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_FLEX_CLIENT_SECRET;


module.exports = (req, res) => {
    // console.log(' --------------------------------+++++++++++++++++++');
    // console.log(req.body);
    // Create new SDK instance
    const integrationSdk = sharetribeIntegrationSdk.createInstance({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
    });

    // console.log(CLIENT_ID);
    // console.log(CLIENT_SECRET);
    
    // '6480d082-682c-4f5a-bbee-502cda7cf0f0'
    const params = {
        id: req.body.uuid,
        include: ['author'],
    }
    
    // var listingId = new UUID("c6ff7190-bdf7-47a0-8a2b-e3136e74334f");
    // integrationSdk.listings.show(params).then(res => {
    //     // res.data contains the response data
    //     console.log(res.data);
    // });

    // Query first 5 listings
    integrationSdk.listings.show(params)
    .then(response => {
        // Print listing titles
        
        // console.log(' +++++++++++++++++++');

        let data = response.data.data;

        // console.log(data);
        const creatorId = data.relationships.author.data.id;

        // console.log(data.relationships.author.data.id);

        integrationSdk.users
        .show({id: creatorId})
        .then(response => {
            // console.log('response = =======');
            // Print listing titles
            let data = response.data.data;
            // console.log(data.attributes.profile.metadata);
            
            res.send(
                data
            )
        })
        .catch(response => {
            // An error occurred
            console.log(response.data);
            console.log(`Request failed with status: ${res.status} ${res.statusText}`);
        });
       
    })
    .catch(response => {
        // An error occurred
        console.log(response.data);
        console.log(`Request failed with status: ${res.status} ${res.statusText}`);
    });

};
  