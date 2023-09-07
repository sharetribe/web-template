const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_FLEX_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_FLEX_CLIENT_SECRET;


exports.comissionVariable = (listingId) => {
//   console.log(' --------------------------------+++++++++++++++++++');
//   console.log(listingId);
  // console.log(listingId.uuid);
//   console.log('641ccb52-c86e-44ca-bf44-84f9e9d1e7a4');
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
        //   console.log('response = =======');
          // Print listing titles
          let data = response.data.data;
        //   console.log(data.attributes.profile.metadata);
          
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