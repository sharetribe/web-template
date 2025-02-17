const notifyPortfolioListingCreated = require('./notifyPortfolioListingCreated');
const notifyProductListingCreated = require('./notifyProductListingCreated');
const notifyProfileListingUpdated = require('./notifyProfileListingUpdated');
const notifyUserCreated = require('./notifyUserCreated');
const notifyUserUpdated = require('./notifyUserUpdated');

async function loadEventScripts() {
  console.warn("\nLoading event's scripts..");
  notifyPortfolioListingCreated();
  notifyProductListingCreated();
  notifyProfileListingUpdated();
  notifyUserCreated();
  notifyUserUpdated();
  console.warn("Loading event's scripts DONE\n");
}

module.exports = {
  loadEventScripts: loadEventScripts,
};
