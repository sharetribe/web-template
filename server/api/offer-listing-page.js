const { getSdk, handleError } = require('../api-util/sdk');

module.exports = async (req, res) => {
  const { filter } = req.body;
  try {
    const sdk = getSdk(req, res);

    const response = await sdk.listings.query({
      ...req.body,
      include: ['author', 'images'],
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
        'variants.scaled-small',
        'variants.scaled-medium',
        'variants.listing-card',
        'variants.listing-card-2x',
      ],
      'imageVariant.listing-card': 'w:400;h:300;fit:crop',
      'imageVariant.listing-card-2x': 'w:800;h:600;fit:crop',
      minStock: 1,
      stockMode: 'match-undefined',
    });

    if (response.status === 200) {
      console.log(response.data.data);
      // await sdk.reviews.query({
      //   subjectId: new UUID("c6ff7190-bdf7-47a0-8a2b-e3136e74334f'")
      // }).then(res => {
      //   // res.data contains the response data
      // });
      res
        .status(200)
        .set('Content-Type', 'application/json')
        .json({
          data: response,
        })
        .end();
    }
  } catch (e) {
    handleError(res, e);
  }
};
