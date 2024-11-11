const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
  reactScriptsVersion: 'sharetribe-scripts',
  webpack: {
    configure: {
      module: {
        rules: [
          {
            test: /\.m?js$/,
            resolve: {
              fullySpecified: false,
            },
          },
        ],
      },
    },
    plugins: [
      new InjectManifest({
        swSrc: './src/sw.js',
        swDest: 'sw.js',
      }),
    ],
  },
};
