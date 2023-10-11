const log = require('../log');
const sdkUtils = require('../api-util/sdk');

const rootUrl = process.env.REACT_APP_MARKETPLACE_ROOT_URL;

// NOTE: This assumes that branding asset is created.
//       If it's not, then the webmanifest returns dummy data.

// Generate icons with correct syntax for web app manifest
const generateIcons = variants => {
  const variantArray = Object.values(variants);
  return variantArray.map(variant => {
    const { url, width, height } = variant;
    return {
      src: url,
      // This should be square - as it is set to square in assetc schema
      sizes: `${width}x${height}`,
      // The image type is hard-coded - even though, Imgix default setup might return something else.
      type: 'image/png',
    };
  });
};

// Middleware to generate web app manifest for /site.webmanifest call
// https://developer.mozilla.org/en-US/docs/Web/Manifest
module.exports = (req, res) => {
  const sdk = sdkUtils.getSdk(req, res);

  // Note: marketplace.show endpoint is only called to fetch the name of the marketplace.
  // In your custom app, you might just hard-code this and remove the extra XHR call.
  const marketplacePromise = () => sdk.marketplace.show({ 'fields.marketplace': ['name'] });

  Promise.all([marketplacePromise(), sdkUtils.fetchBranding(sdk)])
    .then(response => {
      const [marketplaceResponse, brandingResponse] = response;

      // Get name
      const marketplace = marketplaceResponse.data.data;
      const marketplaceName = marketplace?.attributes?.name;

      // Collect data and included from the branding asset
      const brandingAssets = brandingResponse.data.data;
      const data = brandingAssets?.[0]?.attributes?.data;
      const included = brandingResponse.data?.included || {};

      // Marketplace color is used as theme_color
      const marketplaceColor = data?.marketplaceColors?.mainColor;
      const startURL = rootUrl ? `${rootUrl.replace(/\/$/, '')}/` : '/';

      // App icons
      // Note: icons can be checked from design/branding.json asset (appIcon property),
      // but in your custom app, you might just hard-code this and remove the extra XHR call.
      const appIconId = data?.appIcon?._ref?.id;
      const appIcon = included.find(entity => entity.id === appIconId);
      const appIconVariants = appIcon?.attributes?.variants || {};
      const icons = generateIcons(appIconVariants);

      // Response as JSON data
      const jsonData = {
        name: marketplaceName, // This could be hard-coded, since it changes rarely
        short_name: marketplaceName, // This could be hard-coded, since it changes rarely
        start_url: startURL,
        display: 'standalone',
        theme_color: marketplaceColor, // This could be hard-coded, since it changes rarely
        background_color: '#ffffff',
        icons,
      };

      // Format as JSON string (with indentation of 2 spaces)
      const json = JSON.stringify(jsonData, null, 2);

      // Set the content type for web app manifest
      res.setHeader('Content-Type', 'application/manifest+json');
      res.send(json);
    })
    .catch(e => {
      // Log error
      const is404 = e.status === 404;
      if (is404) {
        console.log('webmanifest-render-failed-no-asset-found');
      } else {
        log.error(e, 'webmanifest-render-failed');
      }

      // Return some generic data as app manifest
      const defaultJsonData = {
        name: 'Marketplace',
        short_name: 'Marketplace',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [],
      };

      // Format as JSON string (with indentation of 2 spaces)
      const json = JSON.stringify(defaultJsonData, null, 2);

      // Set the content type for web app manifest
      res.setHeader('Content-Type', 'application/manifest+json');
      res.send(json);
    });
};
