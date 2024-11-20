const { InjectManifest } = require('workbox-webpack-plugin');
const expand = require('dotenv-expand')
const dotenv = require('dotenv');
const fs = require('fs');

const { loadSecrets } = require('./server/env/secretManager');

async function loadCustomEnv() {
  const ENV_FILE = process.env.ENV_FILE || process.env.NODE_ENV || 'production';
  const isDev = ENV_FILE === 'development';
  const dotenvFiles = [
    `.env.${ENV_FILE}.local`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    ENV_FILE !== 'test' && `.env.local`,
    `.env.${ENV_FILE}`,
    '.env',
  ].filter(Boolean);







  /**
   * [TODO:]
   *  - En el local tengo lo del localhost que me lo va a romper todo... no deberia cargarlo sino en development
   */







  console.warn('\nLoading environment variables..');
  // Load environment variables from .env* files. Suppress warnings using silent
  // if this file is missing. dotenv will never modify any environment variables
  // that have already been set.
  // https://github.com/motdotla/dotenv
  dotenvFiles.forEach(dotenvFile => {
    if (fs.existsSync(dotenvFile)) {
      console.log('Loading env from file:' + dotenvFile);
      expand(
        dotenv.config({
          path: dotenvFile,
          debug: isDev,
        })
      );
    }
  });





  const NODE_ENV = process.env.NODE_ENV
  const CONFIG_SECRET_NAME = process.env.CONFIG_SECRET_NAME

  console.warn('\n------\n');
  console.warn('\n[loadCustomEnv] - NODE_ENV:', NODE_ENV);
  console.warn('\n[loadCustomEnv] - ENV_FILE:', ENV_FILE);
  console.warn('\n[loadCustomEnv] - CONFIG_SECRET_NAME:', CONFIG_SECRET_NAME);




  const WEBAPP_CONFIG = process.env.WEBAPP_CONFIG;
  console.warn('\n------\n');
  console.warn('\n[loadCustomEnv] - WEBAPP_CONFIG:', WEBAPP_CONFIG);




  const parsedSecrets = WEBAPP_CONFIG ? dotenv.parse(WEBAPP_CONFIG) : {};
  console.warn('\n------\n');
  console.warn('\n[loadCustomEnv] - parsedSecrets:', parsedSecrets);







  const secrets = await loadSecrets();
  expand({ parsed: secrets });
  console.warn('Loading environment variables DONE\n');








  const REACT_APP_MARKETPLACE_ROOT_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL
  const REACT_APP_SHARETRIBE_SDK_CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID
  const WEBAPP_URL = process.env.WEBAPP_URL
  console.warn('\n------\n');
  console.warn('\n[loadCustomEnv] - REACT_APP_MARKETPLACE_ROOT_URL:', REACT_APP_MARKETPLACE_ROOT_URL);
  console.warn('\n[loadCustomEnv] - REACT_APP_SHARETRIBE_SDK_CLIENT_ID:', REACT_APP_SHARETRIBE_SDK_CLIENT_ID);
  console.warn('\n[loadCustomEnv] - WEBAPP_URL:', WEBAPP_URL);
  console.warn('\n-------------------------------\n\n\n');









}

module.exports = (async () => {
  await loadCustomEnv();

  return {
    reactScriptsVersion: 'sharetribe-scripts',
    webpack: {
      plugins: [
        new InjectManifest({
          swSrc: './src/sw.js',
          swDest: 'sw.js',
        }),
      ],
    },
  };
})();
