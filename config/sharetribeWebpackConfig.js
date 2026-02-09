'use strict';

const path = require('path');
const cloneDeep = require('lodash/cloneDeep');
const LoadablePlugin = require('@loadable/webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const paths = require('./paths');

// PostCSS plugins:
// - postcss-import is our addition
// - postcss-preset-env: we use nesting and custom-media-queries.
// - postcss-custom-properties: preserve is turned off due to load it adds to web inspector
//   in dev environment.
const postcssOptionsPlugins = [
  'postcss-import',
  'postcss-flexbugs-fixes',
  [
    'postcss-preset-env',
    {
      autoprefixer: {
        flexbox: 'no-2009',
      },
      features: {
        "custom-properties": false, //  stage 3, but browser support is good.
        'nesting-rules': true, // stage 1
        'custom-media-queries': true, // stage 2
      },
      stage: 3,
    },
  ],
  // Sharetribe custom: we don't use postcss-normalize atm.
  // // Adds PostCSS Normalize as the reset css with default options,
  // // so that it honors browserslist config in package.json
  // // which in turn let's users customize the target behavior as per their needs.
  // 'postcss-normalize',
];

// Check that webpack.config has known structure.
const checkConfigStructure = config => {
  // First validate the structure of the config to ensure that we mutate
  // the config with the correct assumptions.
  const hasRules = config?.module?.rules?.length > 0;
  const foundRuleWithOneOfArray =
    hasRules &&
    config.module.rules.find(rule => rule.oneOf?.length === 10);

  const hasCssLoader =
    foundRuleWithOneOfArray &&
    foundRuleWithOneOfArray.oneOf[5].test &&
    foundRuleWithOneOfArray.oneOf[5].test.test('file.css');
  const hasPlugins = !!config.plugins;
  const hasOutput = !!config.output;
  const hasOptimization = !!config.optimization;

  const configStructureKnown = hasRules
        && foundRuleWithOneOfArray
        && hasCssLoader
        && hasPlugins
        && hasOutput
        && hasOptimization;

  if (!configStructureKnown) {
    throw new Error(
      'create-react-app config structure changed, please check webpack.config.js and update to use the changed config'
    );
  }

  return configStructureKnown;
};

const applySharetribeConfigs = (config, options) => {
  const { target, isEnvProduction } = options;
  const isTargetNode = target === 'node';
  checkConfigStructure(config);

  // Add LoadablePlugin to the optimization plugins
  const newConfig = cloneDeep(config);
  newConfig.plugins = [new LoadablePlugin(), ...config.plugins];

  if (isTargetNode) {
    // Set name and target to node as this is running in the server
    newConfig.name = 'node';
    newConfig.target = 'node';
    // This is a needed addition as defined by
    // https://github.com/liady/webpack-node-externals
    newConfig.externalsPresets = { node: true };

    // Add custom externals as server doesn't need to bundle everything
    newConfig.externals = [
      '@loadable/component',
      nodeExternals(), // Ignore all modules in node_modules folder
    ];

    // Use a 'node' subdirectory for the server build
    newConfig.output.path = isEnvProduction
      ? path.join(paths.appBuild, 'node')
      : undefined;

    // Set build output specifically for node
    newConfig.output.libraryTarget = 'commonjs2';
    newConfig.output.filename = '[name].[contenthash:8].js';
    newConfig.output.chunkFilename = '[name].[contenthash:8].chunk.js';

    // Disable runtimeChunk as it seems to break the server build
    // NOTE: after CRA v5, runtime chunk seems to be excluded anyway.
    newConfig.optimization.runtimeChunk = undefined;
  }

  return newConfig;
};

module.exports = {
  postcssOptionsPlugins,
  applySharetribeConfigs,
};
