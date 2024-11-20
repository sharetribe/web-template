/**
   Implements .env file loading that mimicks the way create-react-app
   does it. We want this to get consistent configuration handling
   between client and node server.
*/

const fs = require('fs');

const { loadSecrets } = require('./secretManager');

const NODE_ENV = process.env.NODE_ENV;
const ENV_FILE = process.env.ENV_FILE || NODE_ENV || 'production';

if (!NODE_ENV) {
  throw new Error('The NODE_ENV environment variable is required but was not specified.');
}






const APP_ENV = process.env.APP_ENV
const REACT_APP_ENV = process.env.REACT_APP_ENV
const CONFIG_SECRET_NAME = process.env.CONFIG_SECRET_NAME

const REACT_APP_MARKETPLACE_ROOT_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL
const REACT_APP_SHARETRIBE_SDK_CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID
const WEBAPP_URL = process.env.WEBAPP_URL

console.warn('\n\n\n*******************************');
console.warn('\n[configureEnv] - ENV_FILE:', ENV_FILE);
console.warn('\n[configureEnv] - NODE_ENV:', NODE_ENV);
console.warn('\n[configureEnv] - APP_ENV:', APP_ENV);
console.warn('\n[configureEnv] - REACT_APP_ENV:', REACT_APP_ENV);
console.warn('\n[configureEnv] - CONFIG_SECRET_NAME:', CONFIG_SECRET_NAME);
console.warn('\n------\n');
console.warn('\n[configureEnv] - REACT_APP_MARKETPLACE_ROOT_URL:', REACT_APP_MARKETPLACE_ROOT_URL);
console.warn('\n[configureEnv] - REACT_APP_SHARETRIBE_SDK_CLIENT_ID:', REACT_APP_SHARETRIBE_SDK_CLIENT_ID);
console.warn('\n[configureEnv] - WEBAPP_URL:', WEBAPP_URL);
console.warn('\n*******************************\n\n\n');







// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
var dotenvFiles = [
  `.env.${ENV_FILE}.local`,
  // Only include `.env.local` for `development` environment
  ENV_FILE === 'development' && `.env.local`,
  `.env.${ENV_FILE}`,
  '.env',
].filter(Boolean);

const configureEnv = async () => {
  console.warn('\nLoading environment variables..');
  // Load environment variables from .env* files. Suppress warnings using silent
  // if this file is missing. dotenv will never modify any environment variables
  // that have already been set.
  // https://github.com/motdotla/dotenv
  dotenvFiles.forEach(dotenvFile => {
    if (fs.existsSync(dotenvFile)) {
      console.log('Loading env from file:' + dotenvFile);
      require('dotenv-expand')(
        require('dotenv').config({
          path: dotenvFile,
        })
      );
    }
  });
  const secrets = await loadSecrets();
  require('dotenv-expand')({ parsed: secrets });
  console.warn('Loading environment variables DONE\n');
};

module.exports = {
  configureEnv: configureEnv,
};
