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

    const userId = req.body.userId;
    const commission = +req.body.values.commission;

    console.log('userId');
    console.log(userId);
    console.log('typeof req.body.values');
    console.log(typeof req.body.values);
    console.log(req.body.values);
    console.log(req.body.values.commission);
    console.log('commission');
    console.log(commission);
    console.log(CLIENT_ID);
    console.log(CLIENT_SECRET);
    
    // Query all users
    integrationSdk.users.updateProfile({
        id: userId,
        metadata: {
            commission
        }
    })
    .then(response => {
        console.log('response = =======');
        // Print listing titles
        let data = response.data.data;
        // console.log(data);

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
  