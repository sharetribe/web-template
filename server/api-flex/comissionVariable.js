const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const CLIENT_ID = 'bd8cb379-527f-4f9d-9b6a-144ba26f88d4';
const CLIENT_SECRET = '871d86250e9783c51bd5f28f3341991579c6c20b';


exports.comissionVariable = (listingId) => {
  console.log(' --------------------------------+++++++++++++++++++');
  console.log(listingId);
  // console.log(listingId.uuid);
  console.log('641ccb52-c86e-44ca-bf44-84f9e9d1e7a4');
  // Create new SDK instance
  const integrationSdk = sharetribeIntegrationSdk.createInstance({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
  });

  const params = {
      id: listingId,
      include: ['author'],
  }

  // return false;

  integrationSdk.listings.show(params)
  .then(response => {
      let data = response.data.data;
      const creatorId = data.relationships.author.data.id;

      // console.log(data);

      integrationSdk.users
      .show({id: creatorId})
      .then(response => {
          console.log('response = =======');
          // Print listing titles
          let data = response.data.data;
          console.log(data.attributes.profile.metadata);
          
          return data;
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
      // console.log(`Request failed with status: ${res.status} ${res.statusText}`);
  });

  return ' 00000 0000 asfasfasfasa asa s s----------------------';
}