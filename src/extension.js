/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

export const getAllExtensionReducers = async () => {
  // Dynamically require all modules matching the pattern
  const context = require.context('./extensions/', true, /reducers\.js$/);

  // Iterate over each matched module
  return context.keys().reduce((extensionReducers, key) => {
    const module = context(key);
    return {
      ...extensionReducers,
      ...module,
    };
  }, {});
};

export const getAllExtensionTranslationFile = () => {
  // Dynamically require all modules matching the pattern
  const context = require.context('./extensions/', true, /translations\/en\.json$/);

  // Iterate over each matched module
  return context.keys().reduce((extensionTranslations, key) => {
    const module = context(key);
    return {
      ...extensionTranslations,
      ...module,
    };
  }, {});
};
