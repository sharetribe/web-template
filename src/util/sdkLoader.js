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
  //const aspectRatio = aspectHeight / aspectWidth;
  return {
    [`imageVariant.${name}`]: util.objectQueryString({
      w: width,
      h: aspectRatio * width,
      fit: 'crop',
    }),
  };
};

export { createInstance, types, transit, util, createImageVariantConfig };
