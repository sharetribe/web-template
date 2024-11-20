const { InjectManifest } = require('workbox-webpack-plugin');

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
}
