const { denormalisedResponseEntities } = require('../../common/data/data');
const { queryAllListings } = require('../../common/listings');
const { getExchangeRate } = require('../../common/caching');
const { DEFAULT_CURRENCY } = require('../../common/config/constants/currency.constants');
const { integrationSdk } = require('../../common/sdk');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

const generatePriceRelatedProps = ({
  exchangeRate,
  price,
  oldCurrency,
  currency,
  exchangePrice,
}) => {
  if (!price) {
    return null;
  }

  if (oldCurrency === DEFAULT_CURRENCY) {
    const dailyExchangeRate = exchangeRate[currency];
    if (!dailyExchangeRate) {
      return null;
    }
    const exchangeAmount = price.amount * dailyExchangeRate;

    return {
      publicData: {
        exchangePrice: {
          [currency]: {
            amount: exchangeAmount,
            currency,
          },
        },
        listingCurrency: currency,
      },
    };
  }
  if (currency === DEFAULT_CURRENCY) {
    const foreignPrice = exchangePrice?.[oldCurrency];
    const dailyExchangeRate = exchangeRate[oldCurrency];

    if (!foreignPrice || !dailyExchangeRate) {
      return null;
    }
    const exchangeAmount = foreignPrice.amount / dailyExchangeRate;

    return {
      price: new Money(exchangeAmount, currency),
      publicData: {
        listingCurrency: currency,
      },
    };
  }
  //Currently not handle changes from another currency
};

const updateListingPrices = async (listings, currency, oldCurrency) => {
  const exchangeRate = await getExchangeRate();

  return Promise.all(
    listings.map(listing => {
      const {
        price,
        publicData: { exchangePrice },
      } = listing.attributes || {};

      const updateParams = generatePriceRelatedProps({
        exchangeRate,
        price,
        oldCurrency,
        currency,
        exchangePrice,
      });

      if (!updateParams) {
        console.log('ListingData missing. No price or exchange rate', listing.id.uuid);
        return Promise.resolve({});
      }

      return integrationSdk.listings.update({
        id: listing.id.uuid,
        ...updateParams,
      });
    })
  );
};

const updateUserListings = async (userResponse, data) => {
  try {
    const currentUser = denormalisedResponseEntities(userResponse)[0];
    const oldCurrentUser = denormalisedResponseEntities(data)[0];
    const { userCurrency } = currentUser.attributes.profile.publicData || {};
    const { userCurrency: oldUserCurrency } = oldCurrentUser.attributes.profile.publicData || {};

    if (oldUserCurrency === userCurrency) {
      return;
    }

    const listings = await queryAllListings({
      authorId: currentUser.id.uuid,
    });

    if (!listings.length) {
      return;
    }

    return updateListingPrices(listings, userCurrency, oldUserCurrency);
  } catch (error) {
    console.error('Update user listings error', error);
    throw error;
  }
};

module.exports = { updateUserListings };
