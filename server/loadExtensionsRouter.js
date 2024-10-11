const glob = require('glob');
const path = require('path');

const extensionsFolder = path.join(__dirname, 'extensions');

const getExtensionPath = extension => {
  return path.join(extensionsFolder, extension);
};

const getBaseRoute = extension => {
  return `/${extension.replace('/api/index.js', '')}`;
};

const configExtensionRoutes = router => {
  const extensions = glob.sync('*/api/index.js', {
    cwd: extensionsFolder,
  });

  extensions.forEach(extension => {
    const baseRoute = getBaseRoute(extension);
    const extensionPath = getExtensionPath(extension);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    router.use(baseRoute, require(extensionPath));
  });
};

module.exports = configExtensionRoutes;
