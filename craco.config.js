const { InjectManifest } = require('workbox-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  reactScriptsVersion: 'sharetribe-scripts',
  webpack: {
    plugins: [
      new InjectManifest({
        swSrc: './src/sw.js',
        swDest: 'sw.js',
      }),
    ],
  },
  babel: {
    plugins: [
      // Enable React Refresh only in the development environment
      isDevelopment && require.resolve('react-refresh/babel'),
    ].filter(Boolean), // Filter out `false` values
  },
};
