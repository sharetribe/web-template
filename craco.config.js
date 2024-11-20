const { InjectManifest } = require('workbox-webpack-plugin');
const expand = require('dotenv-expand')
const dotenv = require('dotenv');
const fs = require('fs');

const { loadSecrets } = require('./server/env/secretManager');

async function loadCustomEnv() {
  const ENV_FILE = process.env.ENV_FILE || process.env.NODE_ENV || 'production';
  const isCloudBuild = process.env.CLOUD_BUILD === 'true';
  const isDev = ENV_FILE === 'development';
  const dotenvFiles = [
    `.env.${ENV_FILE}.local`,
    // Only include `.env.local` for local `development` environment
    ENV_FILE === 'development' && `.env.local`,
    `.env.${ENV_FILE}`,
    '.env',
  ].filter(Boolean);

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








  /**
   * [TODO:]
   *  - En el local tengo lo del localhost que me lo va a romper todo... no deberia cargarlo sino en development
   */




  if (isCloudBuild) {
    console.log('isCloudBuild - Loading env WEBAPP_CONFIG');
    const WEBAPP_CONFIG = process.env.WEBAPP_CONFIG;
    const secrets = WEBAPP_CONFIG ? dotenv.parse(WEBAPP_CONFIG) : {};




    // console.warn('\n------\n');
    // console.warn('\n[loadCustomEnv] - WEBAPP_CONFIG:', WEBAPP_CONFIG);
    // console.warn('\n------\n');
    // console.warn('\n[loadCustomEnv] - secrets:', secrets);






    expand({ parsed: secrets });
  } else {
    const secrets = await loadSecrets();
    expand({ parsed: secrets });
  }
  console.warn('Loading environment variables DONE\n');












  const NODE_ENV = process.env.NODE_ENV
  const APP_ENV = process.env.APP_ENV
  const REACT_APP_ENV = process.env.REACT_APP_ENV
  const CONFIG_SECRET_NAME = process.env.CONFIG_SECRET_NAME

  console.warn('\n------\n');
  console.warn('\n[loadCustomEnv] - NODE_ENV:', NODE_ENV);
  console.warn('\n[loadCustomEnv] - ENV_FILE:', ENV_FILE);
  console.warn('\n[loadCustomEnv] - APP_ENV:', APP_ENV);
  console.warn('\n[loadCustomEnv] - REACT_APP_ENV:', REACT_APP_ENV);
  console.warn('\n[loadCustomEnv] - CONFIG_SECRET_NAME:', CONFIG_SECRET_NAME);




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
