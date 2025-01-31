const notifyProfileListingUpdated = require('./notifyProfileListingUpdated');
const notifyUserCreated = require('./notifyUserCreated');
const notifyUserUpdated = require('./notifyUserUpdated');
const notifyProductListingCreated = require('./notifyProductListingCreated');

async function loadEventScripts() {
  console.warn("\nLoading event's scripts..");
  notifyProfileListingUpdated();
  notifyUserCreated();
  notifyUserUpdated();
  notifyProductListingCreated();
  console.warn("Loading event's scripts DONE\n");
}

module.exports = {
  loadEventScripts: loadEventScripts,
};
