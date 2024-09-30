const { integrationSdkInit } = require('../api-util/scriptManager');

const SCRIPT_NAME = 'showMarketplace';

function script() {
  console.log(`Loading event script: ${SCRIPT_NAME}`);
  try {
    const integrationSdk = integrationSdkInit();

    // We query the marketplace resource. The `show` function returns a
    // Promise that resolves with a response object.
    integrationSdk.marketplace.show().then(res => {
      const marketplace = res.data.data;
      console.log(`Name: ${marketplace.attributes.name}`);
    });
  } catch (err) {
    console.error(`SCRIPT ERROR | ${SCRIPT_NAME}: `, err);
  }
}

module.exports = script;
