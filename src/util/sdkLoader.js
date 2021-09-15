import * as importedSdk from 'sharetribe-flex-sdk';

let exportSdk;

const isServer = () => typeof window === 'undefined';

if (isServer()) {
  // Use eval to skip webpack from bundling SDK in Node
  // eslint-disable-next-line no-eval
  exportSdk = eval('require')('sharetribe-flex-sdk');
} else {
  exportSdk = importedSdk;
}

const { createInstance, types, transit, util } = exportSdk;

// create image variant from variant name, desired width and aspectRatio
const createImageVariantConfig = (name, width, aspectRatio) => {
  const height = aspectRatio * width;
  if (width > 3072 || height > 3072) {
    throw new Error(`Dimensions of custom image variant (${name}) are too high (w:${width}, h:${height}).
    Reduce them to max 3072px. https://www.sharetribe.com/api-reference/marketplace.html#custom-image-variants`);
  }

  return {
    [`imageVariant.${name}`]: util.objectQueryString({
      w: width,
      h: aspectRatio * width,
      fit: 'crop',
    }),
  };
};

export { createInstance, types, transit, util, createImageVariantConfig };
