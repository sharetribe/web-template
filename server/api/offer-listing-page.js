const { getSdk, handleError } = require('../api-util/sdk');

module.exports = async (req, res) => {
  const { filter } = req.body;
  try {
    const sdk = getSdk(req, res);

    const response = await sdk.listings.query({
      ...req.body,
      include: ['author', 'author.profileImage',, 'images'],
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
     'fields.image': [
      'variants.square-small',
      'variants.square-small2x',
    ],
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
      }
      if (data && Array.isArray(data) && data.length > 0) {
        let newArray = [];
        for (var i = 0; i < data.length; i++) {
          const authorId = data[i].relationships.author.data.id.uuid;
          const listingId = data[i].id.uuid;
          await sdk.reviews.query({
            listingId: listingId
          }).then(async res => {
            let newObject = data[i];
            if (res) {
              if (res?.data?.data && data.length > 0) {
                newObject.reviews = res.data.data.filter(review => review?.attributes?.state == "public");
              }
            }
            newArray.push(newObject);
          });
        }

        newData.data = {
          data: newArray,
          included: included, meta: meta
        }

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
