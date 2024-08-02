const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { parse } = require('dotenv');

const client = new SecretManagerServiceClient();

async function loadSecrets() {
  try {
    console.warn('Loading env from Google Cloud Secret manager');
    const [version] = await client.accessSecretVersion({ name: process.env.CONFIG_SECRET_NAME });
    const payload = version?.payload?.data?.toString();
    const env = payload ? parse(payload) : {};
    return env;
  } catch (err) {
    console.error(
      'Error loading secrets - did you set a valid CONFIG_SECRET_NAME environment variable for the Google Cloud Secret manager?',
      err,
    );
    process.exit(1);
  }
  return false;
}

module.exports = {
  loadSecrets: loadSecrets,
};
