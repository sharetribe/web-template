const { getSdk, handleError } = require('../api-util/sdk');
const initiateIntegrationSdk = require('../api-util/initiateIntegrationSdk');

module.exports = async (req, res) => {
  const { filter } = req.body;
  try {
    const sdk = getSdk(req, res);

    const response = await sdk.listings.query({
      ...req.body,
      include: ['author', 'author.profileImage', , 'images'],
      'fields.listing': [
        'title',
        'geolocation',
        'price',
        'deleted',
        'state',
        'publicData.listingType',
        'publicData.transactionProcessAlias',
        'publicData.unitType',
        'publicData.pickupEnabled',
        'publicData.shippingEnabled',
        'publicData.isOffer',
        'publicData.linkedListing',
        'description',
      ],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
      'imageVariant.listing-card': 'w:400;h:300;fit:crop',
      'imageVariant.listing-card-2x': 'w:800;h:600;fit:crop',
      minStock: 1,
      stockMode: 'match-undefined',
    });

    if (response.status === 200) {
      const { data, included, meta } = response?.data || {};
      let newData = {
        status: response.status,
        statusText: response.statusText,
      };
      if (data && Array.isArray(data) && data.length > 0) {
        let newArray = [];
        for (var i = 0; i < data.length; i++) {
          const authorId = data[i].relationships.author.data.id.uuid;

          const integrationSdk = await initiateIntegrationSdk();

          const listingId = data[i].id.uuid;
          await sdk.reviews
            .query({
              listingId: listingId,
            })
            .then(async res => {
              let newObject = data[i];
              if (res) {
                if (res?.data?.data && data.length > 0) {
                  newObject.reviews = res.data.data.filter(
                    review => review?.attributes?.state == 'public'
                  );
                }
              }
              const userData = await integrationSdk.users.show({
                id: authorId,
                include: ['stripeAccount'],
              });

              const { relationships, attributes } = userData.data.data;
              const { stripeConnected, profile } = attributes;
              if (relationships.stripeAccount.data)
                newObject.stripeAccount = relationships.stripeAccount.data;
              if (stripeConnected) newObject.stripeConnected = stripeConnected;
              if (profile.publicData.top_user_badge)
                newObject.top_user_badge = profile.publicData.top_user_badge;
              if (profile.publicData.certifications)
                newObject.certifications = profile.publicData.certifications;
              newArray.push(newObject);
            });
        }

        newData.data = {
          data: newArray,
          included: included,
          meta: meta,
        };

        res
          .status(200)
          .set('Content-Type', 'application/json')
          .json({
            data: newData,
          })
          .end();
      } else {
        res
          .status(200)
          .set('Content-Type', 'application/json')
          .json({
            data: response,
          })
          .end();
      }
    }
  } catch (e) {
    handleError(res, e);
  }
};
