const { loadEventScripts } = require('./events');

async function loadScripts() {
  console.warn('\nLoading scripts..');
  const shouldIgnoreScripts = process.env.MARKETPLACE_IGNORE_SCRIPTS;
  if (shouldIgnoreScripts) {
    console.log('--- Scripts are disabled. Check ENV variable "MARKETPLACE_IGNORE_SCRIPTS"');
  } else {
    loadEventScripts();
    // Jus tests that everything is hooked correctly
    // const analytics = require('./analytics');
    // const showMarketplace = require('./showMarketplace');
    // await analytics();
    // showMarketplace();
  }
  console.warn('Loading scripts DONE\n');
}

module.exports = {
  loadScripts: loadScripts,
};
