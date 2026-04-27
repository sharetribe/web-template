This directory contains the configuration for building and testing the web application.

NOTE: Be careful when modifying these. Modifications might lead to behavior that are difficult to
debug. So, you need to know what you are doing.

## Background

This setup originates from a fork of
[Create React App](https://github.com/facebook/create-react-app) (CRA). The fork,
sharetribe-scripts, included the following changes:

- Server-side rendering
- Code-splitting
- Custom CSS setup

We have also added a custom Webpack config, `sharetribeWebpackConfig.js`, which is used to apply
Sharetribe-specific changes to the original CRA-based Webpack config. This structure allowed us to
keep sharetribe/web-template specific changes in one place, and avoid having to modify the original
CRA config. We might revisit the decision to keep this structure in the future as this ejected
version won't get updates anymore (and CRA is deprecated).

If you are looking to make customizations, we recommend that you duplicate
`config/sharetribeWebpackConfig.js` into a new file e.g. `config/myWebpackConfig.js`, and make your
customizations there instead of changing `config/sharetribeWebpackConfig.js` or
`config/webpack.config.js` directly. This will help with future upstream updates, and it may make
reverting issues easier.

## Usage

The configuration is used by the following scripts:

- scripts/build.js
- scripts/build-server.js
- scripts/start.js
- scripts/test.js

## Extra notes

The private
[postcss-apply](https://github.com/sharetribe/create-react-app/tree/master/packages/react-scripts/postcss/postcss-apply)
plugin was not included anymore. It was fallback setup for a deprecation on a past version of the
sharetribe-scripts.

We have included inlined and updated versions of the original files from Create React App. These are
located in the following directories (the corresponding README.md files are linked for more
context):

- [babel-preset-react-app](https://github.com/sharetribe/web-template/blob/main/config/babel-preset-react-app/README.md)
- [eslint-config-react-app](https://github.com/sharetribe/web-template/blob/main/config/eslint-config-react-app/README.md)
- [react-dev-utils](https://github.com/sharetribe/web-template/blob/main/config/react-dev-utils/README.md)

Currently, Sharetribe Web Template does not use eslint. You could expand the rough config described
in the README.md to your own needs.

CRA also contains support for other features that are not used in this project. E.g. TypeScript.
Most of these are included in some form. (Note: if you want to use Tailwind, you need to figure out
the best way to do that.
[It was not included.](https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js#L161-L173))
