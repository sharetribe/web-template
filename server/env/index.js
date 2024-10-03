/**
   Implements .env file loading that mimicks the way create-react-app
   does it. We want this to get consistent configuration handling
   between client and node server.
*/

const fs = require('fs');

const { loadSecrets } = require('./secretManager');

const NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) {
  throw new Error('The NODE_ENV environment variable is required but was not specified.');
}

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
var dotenvFiles = [
  `.env.${NODE_ENV}.local`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== 'test' && `.env.local`,
  `.env.${NODE_ENV}`,
  '.env',
].filter(Boolean);

const configureEnv = async () => {
  console.warn('\nLoading environment variables..');

  console.warn('\n\n\n...............................');
  console.warn('\n[ServerApp] - processEnv |REACT_APP_MARKETPLACE_ROOT_URL:', process.env.REACT_APP_MARKETPLACE_ROOT_URL);
  console.warn('\n[ServerApp] - processEnv | REACT_APP_MARKETPLACE_NAME:', process.env.REACT_APP_MARKETPLACE_NAME);

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

  console.warn('\n......');
  console.warn('\n[ServerApp] - secrets | REACT_APP_MARKETPLACE_ROOT_URL:', secrets.REACT_APP_MARKETPLACE_ROOT_URL);
  console.warn('\n[ServerApp] - secrets | REACT_APP_MARKETPLACE_NAME:', secrets.REACT_APP_MARKETPLACE_NAME);
  console.warn('\n[ServerApp] - processEnv |REACT_APP_MARKETPLACE_ROOT_URL:', process.env.REACT_APP_MARKETPLACE_ROOT_URL);
  console.warn('\n[ServerApp] - processEnv | REACT_APP_MARKETPLACE_NAME:', process.env.REACT_APP_MARKETPLACE_NAME);
  console.warn('\n...............................\n\n\n');

  process.env = { ...secrets, ...process.env };

  console.warn('Loading environment variables DONE\n');
};

module.exports = {
  configureEnv: configureEnv,
};
