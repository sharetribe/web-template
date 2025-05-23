const notifyPortfolioListingUpdated = require('./notifyPortfolioListingUpdated');
const notifyProductListingCreated = require('./notifyProductListingCreated');
const notifyProductListingRejected = require('./notifyProductListingRejected');
const notifyProfileListingUpdated = require('./notifyProfileListingUpdated');
const notifyUserCreated = require('./notifyUserCreated');
const notifyUserUpdated = require('./notifyUserUpdated');

async function loadEventScripts() {
  console.warn("\nLoading event's scripts..");
  notifyPortfolioListingUpdated();
  notifyProductListingCreated();
  notifyProductListingRejected();
  notifyProfileListingUpdated();
  notifyUserCreated();
  notifyUserUpdated();
  console.warn("Loading event's scripts DONE\n");
}

module.exports = {
  loadEventScripts: loadEventScripts,
};
