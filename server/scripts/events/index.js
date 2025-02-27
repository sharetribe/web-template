const notifyPortfolioListingUpdated = require('./notifyPortfolioListingUpdated');
const notifyProductListingCreated = require('./notifyProductListingCreated');
const notifyProfileListingUpdated = require('./notifyProfileListingUpdated');
const notifyUserCreated = require('./notifyUserCreated');
const notifyUserUpdated = require('./notifyUserUpdated');

async function loadEventScripts() {
  console.warn("\nLoading event's scripts..");
  /**
   * [TODO:]
   *  - Re-enable once the storage-manager is up and working
   */
  const dev = process.env.REACT_APP_ENV === 'development';
  if (dev) {
    notifyProductListingCreated();
  } else {
    notifyPortfolioListingUpdated();
    notifyProfileListingUpdated();
    notifyUserCreated();
    notifyUserUpdated();
  }
  console.warn("Loading event's scripts DONE\n");
}

module.exports = {
  loadEventScripts: loadEventScripts,
};
